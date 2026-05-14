import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

export interface Env {
  komorebie_db: D1Database;
  HYPERDRIVE: Hyperdrive;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

let sqlClient: postgres.Sql<any> | null = null;

function getSqlClient(env: Env) {
  if (!sqlClient) {
    console.log('[Worker] Initializing singleton Postgres client with Hyperdrive...');
    sqlClient = postgres(env.HYPERDRIVE.connectionString, {
      ssl: 'require',
      max: 10,
      idle_timeout: 30,
      connect_timeout: 5
    });
  }
  return sqlClient;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API Routes
    if (url.pathname.startsWith('/api/')) {
      try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return new Response('Unauthorized', { status: 401 });

        // Verify user via Supabase
        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } }
        });
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return new Response('Unauthorized', { status: 401 });

        // Timer Sync Endpoints
        if (url.pathname === '/api/timer/sync') {
          if (request.method === 'POST') {
            const body = await request.json() as any;
            
            // 1. Upsert to D1 (Edge Cache for low-latency own-device sync)
            await env.komorebie_db.prepare(`
              INSERT INTO active_timers (
                user_id, is_active, started_at, duration_seconds, 
                session_duration, is_pomodoro, pomodoro_state, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT (user_id) DO UPDATE SET
                is_active = excluded.is_active,
                started_at = excluded.started_at,
                duration_seconds = excluded.duration_seconds,
                session_duration = excluded.session_duration,
                is_pomodoro = excluded.is_pomodoro,
                pomodoro_state = excluded.pomodoro_state,
                updated_at = excluded.updated_at
            `).bind(
              user.id,
              body.is_active ? 1 : 0,
              body.started_at,
              body.duration_seconds,
              body.session_duration,
              body.is_pomodoro ? 1 : 0,
              body.pomodoro_state,
              new Date().toISOString()
            ).run();

            // 2. Dual-write to Supabase (Primary Source for Cross-User Presence)
            // We push to Supabase so that other users can see the "Focusing" status via Realtime subscriptions
            // Note: We perform this every heartbeat for now to ensure 'last_seen' / 'updated_at' stays fresh
            const { error: sbError } = await supabase.from('active_timers').upsert({
              user_id: user.id,
              is_active: !!body.is_active,
              started_at: body.started_at,
              duration_seconds: body.duration_seconds,
              session_duration: body.session_duration,
              is_pomodoro: !!body.is_pomodoro,
              pomodoro_state: body.pomodoro_state,
              updated_at: new Date().toISOString()
            });

            if (sbError) {
              console.error('[Worker] Timer Supabase sync error:', sbError);
            }

            return new Response(JSON.stringify({ success: true, sb_sync: !sbError }), {
              headers: { 'Content-Type': 'application/json' }
            });
          } 
          
          if (request.method === 'GET') {
            const timer = await env.komorebie_db.prepare(
              'SELECT * FROM active_timers WHERE user_id = ?'
            ).bind(user.id).first();

            return new Response(JSON.stringify(timer || null), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        // Analytics Stats Engine (BE-CF-03)
        if (url.pathname === '/api/analytics/stats') {
          const force = url.searchParams.get('force') === 'true';
          
          if (!force) {
            // Check D1 Cache first
            const cached = await env.komorebie_db.prepare(
              'SELECT payload, updated_at FROM data_cache WHERE user_id = ? AND data_type = ?'
            ).bind(user.id, 'analytics_stats').first() as any;

            if (cached) {
              const age = Date.now() - new Date(cached.updated_at).getTime();
              if (age < 10 * 60 * 1000) { // 10 minute cache (BE-CF-03-OPT)
                return new Response(cached.payload, {
                  headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
                });
              }
            }
          }

          // Compute and return
          console.log(`[Worker] Computing stats for user: ${user.id}`);
          const stats = await computeAndStoreStats(user.id, env, null, ctx);
          console.log(`[Worker] Stats computation complete for user: ${user.id}`);
          return new Response(JSON.stringify(stats), {
            headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
          });
        }

        // Unified Data Sync: Read all
        if (url.pathname === '/api/data/all') {
          if (request.method === 'GET') {
            const { results } = await env.komorebie_db.prepare(
              'SELECT data_type, payload, updated_at FROM data_cache WHERE user_id = ?'
            ).bind(user.id).all();

            const parsedResults = results.map((row: any) => ({
              data_type: row.data_type,
              payload: JSON.parse(row.payload),
              updated_at: row.updated_at
            }));

            return new Response(JSON.stringify(parsedResults), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        // Unified Data Sync: Update
        if (url.pathname === '/api/data/update') {
          if (request.method === 'POST') {
            const body = await request.json() as any;
            if (!body.data_type || !body.payload) {
              return new Response('Bad Request', { status: 400 });
            }

            // SEC-04: Whitelist allowed data types
            const ALLOWED_DATA_TYPES = [
              'tasks', 
              'habits', 
              'habit_logs', 
              'deadlines', 
              'user_preferences',
              'notes',
              'flashcard_decks',
              'flashcard_cards',
              'flashcard_study_sessions'
            ];

            if (!ALLOWED_DATA_TYPES.includes(body.data_type)) {
              return new Response(JSON.stringify({ error: `Unauthorized data type: ${body.data_type}` }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            const payloadStr = typeof body.payload === 'string' ? body.payload : JSON.stringify(body.payload);

            // 1. Dual-write: D1 First
            await env.komorebie_db.prepare(`
              INSERT INTO data_cache (user_id, data_type, payload, updated_at)
              VALUES (?, ?, ?, ?)
              ON CONFLICT (user_id, data_type) DO UPDATE SET
                payload = excluded.payload,
                updated_at = excluded.updated_at
            `).bind(
              user.id,
              body.data_type,
              payloadStr,
              new Date().toISOString()
            ).run();

            // 2. Then Supabase
            const parsedPayload = typeof body.payload === 'string' ? JSON.parse(body.payload) : body.payload;
            const { error: sbError } = await supabase.from(body.data_type).upsert(parsedPayload);
            
            if (sbError) {
              console.error('Supabase dual-write error:', sbError);
            }

            return new Response(JSON.stringify({ success: true, warning: sbError ? sbError.message : undefined }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        return new Response('Method Not Allowed', { status: 405 });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Fallthrough for other requests (static assets handled by wrangler assets)
    return new Response('Not Found', { status: 404 });
  },

  // Cron Background Sync (BE-CF-07)
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const sql = getSqlClient(env);
    
    try {
      // 1. Fetch active users (e.g. active in last 7 days)
      const users = await sql`
        SELECT id FROM profiles 
        WHERE last_seen_at > (now() - interval '7 days')
        OR id IN (SELECT user_id FROM focus_sessions WHERE started_at > (now() - interval '24 hours'))
      `;

      console.log(`[Cron] Starting background sync for ${users.length} active users`);

      // 2. Process in parallel with concurrency control if needed
      // For 7 users, direct parallel is fine.
      await Promise.all(users.map(async (u: any) => {
        try {
          console.log(`[Cron] Syncing data for user: ${u.id}`);
          
          // Refresh data buckets in D1
          const [tasks, habits, habitLogs, deadlines] = await Promise.all([
            sql`SELECT * FROM tasks WHERE user_id = ${u.id} ORDER BY created_at DESC`,
            sql`SELECT * FROM habits WHERE user_id = ${u.id} ORDER BY created_at ASC`,
            sql`SELECT * FROM habit_logs WHERE user_id = ${u.id} AND log_date > (now() - interval '90 days')`,
            sql`SELECT * FROM deadlines WHERE user_id = ${u.id} ORDER BY deadline_date ASC`
          ]);

          // Store in D1
          const syncTasks = env.komorebie_db.batch([
            env.komorebie_db.prepare('INSERT INTO data_cache (user_id, data_type, payload, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at')
              .bind(u.id, 'tasks', JSON.stringify(tasks), new Date().toISOString()),
            env.komorebie_db.prepare('INSERT INTO data_cache (user_id, data_type, payload, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at')
              .bind(u.id, 'habits', JSON.stringify(habits), new Date().toISOString()),
            env.komorebie_db.prepare('INSERT INTO data_cache (user_id, data_type, payload, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at')
              .bind(u.id, 'habit_logs', JSON.stringify(habitLogs), new Date().toISOString()),
            env.komorebie_db.prepare('INSERT INTO data_cache (user_id, data_type, payload, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at')
              .bind(u.id, 'deadlines', JSON.stringify(deadlines), new Date().toISOString())
          ]);

          await syncTasks;

          // Finally, re-compute analytics stats to warm the cache
          await computeAndStoreStats(u.id, env, sql);
          
          console.log(`[Cron] Successfully synced user: ${u.id}`);
        } catch (err) {
          console.error(`[Cron] Failed to sync user ${u.id}:`, err);
        }
      }));

    } catch (err) {
      console.error('[Cron] Background sync failed:', err);
    }
  }
};

/**
 * Reusable analytics engine logic
 */
async function computeAndStoreStats(userId: string, env: Env, providedSql?: any, ctx?: ExecutionContext) {
  const sql = providedSql || getSqlClient(env);
  try {
    console.log(`[Worker] Starting DB queries for user: ${userId}`);
    const start = Date.now();
    
    // Individual timeouts for queries to avoid global hang
    const [profile, sessions, streaks, deadlines, tasks] = await Promise.all([
      sql`SELECT * FROM profiles WHERE id = ${userId} LIMIT 1`.timeout(4000),
      sql`SELECT id, status, elapsed_seconds, started_at FROM focus_sessions WHERE user_id = ${userId} ORDER BY started_at DESC LIMIT 500`.timeout(4000),
      sql`SELECT focus_date, total_focus_seconds, sessions_count, streak_qualified FROM streaks WHERE user_id = ${userId} ORDER BY focus_date DESC LIMIT 365`.timeout(4000),
      sql`SELECT id, deadline_date, title FROM deadlines WHERE user_id = ${userId} ORDER BY deadline_date ASC`.timeout(4000),
      sql`SELECT id, is_completed, completed_at FROM tasks WHERE user_id = ${userId} AND is_completed = true ORDER BY completed_at DESC`.timeout(4000)
    ]);
    
    console.log(`[Worker] DB queries finished in ${Date.now() - start}ms. Sessions: ${sessions.length}`);

    const validSessions = sessions.filter((s: any) => s.status === 'completed' || (s.elapsed_seconds || 0) >= 300);
    const totalSeconds = validSessions.reduce((acc: number, s: any) => acc + (s.elapsed_seconds || 0), 0);
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
    const today = new Date().toISOString().split('T')[0];

    const sessionsTodayList = validSessions.filter((s: any) => s.started_at.startsWith(today));
    const todayFocusSeconds = sessionsTodayList.reduce((acc: number, s: any) => acc + (s.elapsed_seconds || 0), 0);
    const sessionsToday = sessions.filter((s: any) => s.started_at.startsWith(today)).length;
    const completedToday = sessions.filter((s: any) => s.status === 'completed' && s.started_at.startsWith(today)).length;
    
    const tasksDone = tasks.length;
    const tasksDoneToday = tasks.filter((t: any) => t.completed_at && t.completed_at.startsWith(today)).length;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const entry = streaks.find((s: any) => s.focus_date === dStr);
      weeklyData.push({
        date: dStr,
        day: dayNames[d.getDay()],
        focusSeconds: entry ? entry.total_focus_seconds : 0,
        sessionsCount: entry ? entry.sessions_count : 0,
        streakQualified: entry ? entry.streak_qualified : false,
        tasksDone: tasks.filter((t: any) => t.completed_at && t.completed_at.startsWith(dStr)).length
      });
    }

    const now = new Date();
    const day = now.getDay(); 
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const mondayStr = monday.toISOString().split('T')[0];
    const weekSeconds = streaks
      .filter((s: any) => s.focus_date >= mondayStr)
      .reduce((acc: number, s: any) => acc + (s.total_focus_seconds || 0), 0);

    const userProfile = profile[0] || {};
    let currentStreak = 0;
    const qualifiedDates = new Set(streaks.filter((s: any) => s.streak_qualified).map((s: any) => s.focus_date));
    if (qualifiedDates.size > 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const isAlive = qualifiedDates.has(today) || qualifiedDates.has(yesterdayStr);
      if (isAlive) {
        const checkDate = qualifiedDates.has(today) ? new Date() : yesterday;
        while (qualifiedDates.has(checkDate.toISOString().split('T')[0])) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
        currentStreak = Math.max(currentStreak, userProfile.current_streak || 0);
      }
    }

    const stats = {
      totalSeconds,
      totalHours,
      totalSessions: validSessions.length,
      sessionsToday,
      completedToday,
      tasksDone,
      tasksDoneToday,
      currentStreak,
      bestStreak: Math.max(currentStreak, userProfile.best_streak || 0),
      mana: userProfile.mana_points || 0,
      todayFocusSeconds,
      weeklyData,
      weekSeconds,
      weekHours: Math.round((weekSeconds / 3600) * 10) / 10,
      profile: userProfile,
      deadlines: deadlines,
      streaks: streaks
    };

    const payload = JSON.stringify(stats);

    // Use waitUntil if available to avoid blocking the response for cache storage (BE-CF-03-OPT)
    const storagePromise = env.komorebie_db.prepare(`
      INSERT INTO data_cache (user_id, data_type, payload, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (user_id, data_type) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `).bind(userId, 'analytics_stats', payload, new Date().toISOString()).run();

    if (ctx) {
      ctx.waitUntil(storagePromise);
      console.log(`[Worker] Stats storage queued in waitUntil for user: ${userId}`);
    } else {
      await storagePromise;
      console.log(`[Worker] Stats stored in D1 for user: ${userId}`);
    }

    return stats;
  } catch (err) {
    console.error('Error in computeAndStoreStats:', err);
    throw err;
  }
}
