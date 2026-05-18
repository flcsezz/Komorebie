import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

export interface Env {
  komorebie_db: D1Database;
  HYPERDRIVE: Hyperdrive;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

// ─── Shared CORS + JSON response headers ──────────────────────────
const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
} as const;

function jsonResponse(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extra },
  });
}

// ─── Singleton Hyperdrive client (lazy) ───────────────────────────
let sqlClient: postgres.Sql<any> | null = null;

function getSqlClient(env: Env) {
  if (!sqlClient) {
    sqlClient = postgres(env.HYPERDRIVE.connectionString, {
      ssl: 'require',
      max: 5,          // Lower pool — Workers are short-lived
      idle_timeout: 20,
      connect_timeout: 5,
      prepare: false,   // Transaction pooler doesn't support prepared statements
    });
  }
  return sqlClient;
}

function getSupabaseClient(env: Env, authHeader?: string) {
  const options: any = {};
  if (authHeader) {
    options.global = { headers: { Authorization: authHeader } };
  }
  return createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, options);
}

// ─── D1 Cache TTLs ───────────────────────────────────────────────
const D1_ANALYTICS_TTL_MS = 5 * 60 * 1000;   // 5 min for own stats (edge cache hit)
const D1_OTHER_USER_TTL_MS = 15 * 60 * 1000;  // 15 min for other users' stats

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: JSON_HEADERS });
    }

    // API Routes
    if (url.pathname.startsWith('/api/')) {
      const requestStart = Date.now();
      try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401);

        // Verify user via Supabase
        const supabase = getSupabaseClient(env, authHeader);
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

        // Refresh last_seen_at in background via Supabase REST (fire-and-forget)
        ctx.waitUntil(
          Promise.resolve(
            supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)
          ).catch((err: any) => console.error('[Worker] last_seen_at update failed:', err))
        );

        // ─── Timer Sync ─────────────────────────────────────────
        if (url.pathname === '/api/timer/sync') {
          if (request.method === 'POST') {
            const body = await request.json() as any;
            
            if (body.is_active === undefined || body.started_at === undefined) {
              return jsonResponse({ error: 'Missing required fields: is_active, started_at' }, 400);
            }
            
            const now = new Date().toISOString();
            
            // 1. D1 edge cache (low-latency own-device sync)
            const d1Promise = env.komorebie_db.prepare(`
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
              body.duration_seconds ?? 0,
              body.session_duration ?? 0,
              body.is_pomodoro ? 1 : 0,
              body.pomodoro_state ?? 'focus',
              now
            ).run();

            // 2. Supabase (primary source for cross-user presence)
            const sbPromise = supabase.from('active_timers').upsert({
              user_id: user.id,
              is_active: !!body.is_active,
              started_at: body.started_at,
              duration_seconds: body.duration_seconds ?? 0,
              session_duration: body.session_duration ?? 0,
              is_pomodoro: !!body.is_pomodoro,
              pomodoro_state: body.pomodoro_state ?? 'focus',
              updated_at: now
            });

            const [, sbResult] = await Promise.all([d1Promise, sbPromise]);
            
            if (sbResult.error) {
              console.error('[Worker] Timer Supabase sync error:', sbResult.error);
            }

            return jsonResponse({ success: true, sb_sync: !sbResult.error, latency: Date.now() - requestStart });
          } 
          
          if (request.method === 'GET') {
            const timer = await env.komorebie_db.prepare(
              'SELECT * FROM active_timers WHERE user_id = ?'
            ).bind(user.id).first();

            return jsonResponse(timer || null, 200, {
              'Cache-Control': 'no-cache, no-store',
            });
          }
        }

        // ─── Analytics Stats Engine ─────────────────────────────
        if (url.pathname === '/api/analytics/stats') {
          const force = url.searchParams.get('force') === 'true';
          const queryUserId = url.searchParams.get('userId');
          const targetUserId = (queryUserId && queryUserId !== 'undefined' && queryUserId !== 'null') ? queryUserId : user.id;
          const isOwnProfile = targetUserId === user.id;
          
          // Check friendship for non-self queries
          let isFriend = false;
          if (!isOwnProfile && targetUserId) {
            try {
              const sql = getSqlClient(env);
              const friendship = await sql`
                SELECT status FROM friendships 
                WHERE ((requester_id = ${user.id}::uuid AND addressee_id = ${targetUserId}::uuid)
                OR (requester_id = ${targetUserId}::uuid AND addressee_id = ${user.id}::uuid))
                AND status = 'accepted'
                LIMIT 1
              `;
              isFriend = friendship.length > 0;
            } catch (friendErr) {
              const { data: friendData } = await supabase
                .from('friendships')
                .select('status')
                .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`)
                .eq('status', 'accepted')
                .limit(1);
              isFriend = (friendData && friendData.length > 0) || false;
            }
          }

          // Check D1 cache (unless forced)
          if (!force) {
            try {
              const cached = await env.komorebie_db.prepare(
                'SELECT payload, updated_at FROM data_cache WHERE user_id = ? AND data_type = ?'
              ).bind(targetUserId, 'analytics_stats').first() as any;

              if (cached) {
                const age = Date.now() - new Date(cached.updated_at).getTime();
                const ttl = isOwnProfile ? D1_ANALYTICS_TTL_MS : D1_OTHER_USER_TTL_MS;
                
                if (age < ttl) { 
                  const payload = JSON.parse(cached.payload);
                  if (!isOwnProfile && !isFriend) {
                    payload.deadlines = [];
                    payload.sessions = [];
                    payload.tasks = [];
                  }
                  return jsonResponse(payload, 200, {
                    'X-Cache': 'HIT',
                    'X-Cache-Age': String(Math.round(age / 1000)),
                    'Cache-Control': `private, max-age=${Math.round((ttl - age) / 1000)}`,
                  });
                }
              }
            } catch (cacheErr) {
              console.warn('[Worker] D1 cache read failed:', cacheErr);
            }
          }

          // Senior Level: Single-Trip Compute
          const stats = await computeAndStoreStats(targetUserId, env, null, ctx);
          
          if (!isOwnProfile && !isFriend) {
            stats.deadlines = [];
            stats.sessions = [];
            stats.tasks = [];
          }

          return jsonResponse(stats, 200, {
            'X-Cache': 'MISS',
            'X-Latency': String(Date.now() - requestStart),
            'Cache-Control': 'private, max-age=60',
          });
        }

        // ─── Unified Data Sync: Read all ────────────────────────
        if (url.pathname === '/api/data/all' && request.method === 'GET') {
          const { results } = await env.komorebie_db.prepare(
            'SELECT data_type, payload, updated_at FROM data_cache WHERE user_id = ?'
          ).bind(user.id).all();

          const parsedResults = results.map((row: any) => ({
            data_type: row.data_type,
            payload: JSON.parse(row.payload),
            updated_at: row.updated_at
          }));

          return jsonResponse(parsedResults, 200, {
            'Cache-Control': 'private, max-age=30',
          });
        }

        // ─── Unified Data Sync: Write ───────────────────────────
        if (url.pathname === '/api/data/update' && request.method === 'POST') {
          const body = await request.json() as any;
          if (!body.data_type || !body.payload) {
            return jsonResponse({ error: 'Bad Request' }, 400);
          }

          const ALLOWED_DATA_TYPES = [
            'tasks', 'habits', 'habit_logs', 'deadlines', 'user_preferences',
            'notes', 'flashcard_decks', 'flashcard_cards', 'flashcard_study_sessions'
          ];

          if (!ALLOWED_DATA_TYPES.includes(body.data_type)) {
            return jsonResponse({ error: `Unauthorized data type` }, 400);
          }

          const payloadStr = typeof body.payload === 'string' ? body.payload : JSON.stringify(body.payload);
          if (payloadStr.length > 1_048_576) {
            return jsonResponse({ error: 'Payload too large' }, 413);
          }

          const now = new Date().toISOString();
          await env.komorebie_db.prepare(`
            INSERT INTO data_cache (user_id, data_type, payload, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (user_id, data_type) DO UPDATE SET
              payload = excluded.payload,
              updated_at = excluded.updated_at
          `).bind(user.id, body.data_type, payloadStr, now).run();

          const parsedPayload = typeof body.payload === 'string' ? JSON.parse(body.payload) : body.payload;
          const { error: sbError } = await supabase.from(body.data_type).upsert(parsedPayload);
          
          return jsonResponse({
            success: true,
            warning: sbError ? sbError.message : undefined,
            latency: Date.now() - requestStart
          });
        }

        return jsonResponse({ error: 'Method Not Allowed' }, 405);
      } catch (err: any) {
        console.error(`[Worker] Unhandled error:`, err);
        return jsonResponse({ error: 'Internal Server Error' }, 500);
      }
    }

    return new Response('Not Found', { status: 404 });
  },

  // ─── Senior Level Cron: The Mega Sync ───────────────────────────
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const cronStart = Date.now();
    try {
      console.log('[Cron] Starting Mega Sync (Postgres JSON Aggregation)...');
      const supabase = getSupabaseClient(env);
      
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .or(`last_seen_at.gt.${cutoff},last_seen_at.is.null`)
        .limit(50);

      if (userError || !users || users.length === 0) return;

      const userIds = users.map(u => u.id);
      const sql = getSqlClient(env);
      
      // 1 TRIP to Postgres for ALL 50 users' data
      console.log(`[Cron] Fetching mega-payload for ${userIds.length} users via Hyperdrive...`);
      const results = await sql`SELECT * FROM get_mega_sync_data(${userIds}::uuid[])`;
      
      const now = new Date().toISOString();
      const d1Statements: D1PreparedStatement[] = [];

      for (const row of results) {
        const userId = row.user_id;
        const mega = row.mega_payload; // Nested JSON object from Postgres

        // 1. Prepare D1 writes for each data type
        const dataTypes = [
          'tasks', 'habits', 'habit_logs', 'deadlines', 
          'user_preferences', 'notes', 'flashcard_decks', 
          'flashcard_cards', 'flashcard_study_sessions'
        ];

        for (const type of dataTypes) {
          const payload = mega[type];
          if (payload !== undefined) {
            d1Statements.push(
              env.komorebie_db.prepare(`
                INSERT INTO data_cache (user_id, data_type, payload, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id, data_type) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at
              `).bind(userId, type, JSON.stringify(payload), now)
            );
          }
        }

        // 2. Compute analytics stats (in JS for logic parity)
        try {
          const stats = computeAnalyticsFromMega(mega);
          d1Statements.push(
            env.komorebie_db.prepare(`
              INSERT INTO data_cache (user_id, data_type, payload, updated_at)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(user_id, data_type) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at
            `).bind(userId, 'analytics_stats', JSON.stringify(stats), now)
          );
        } catch (e) {
          console.error(`[Cron] Stats computation failed for ${userId}:`, e);
        }
      }

      // 1 TRIP to D1 for ALL updates
      if (d1Statements.length > 0) {
        console.log(`[Cron] Executing ${d1Statements.length} D1 updates in one batch...`);
        await env.komorebie_db.batch(d1Statements);
      }

      console.log(`[Cron] Mega Sync complete in ${Date.now() - cronStart}ms`);
    } catch (err) {
      console.error('[Cron] Mega Sync failed:', err);
    }
  }
};

/**
 * Optimized analytics computation from a pre-fetched mega payload.
 */
async function computeAndStoreStats(userId: string, env: Env, providedSql?: any, ctx?: ExecutionContext) {
  try {
    const sql = providedSql || getSqlClient(env);
    
    // Use the mega-sync function for single user too — extremely efficient
    const [row] = await sql`SELECT * FROM get_mega_sync_data(ARRAY[${userId}]::uuid[])`;
    if (!row) throw new Error('User not found');
    
    const stats = computeAnalyticsFromMega(row.mega_payload);
    
    const storagePromise = env.komorebie_db.prepare(`
      INSERT INTO data_cache (user_id, data_type, payload, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (user_id, data_type) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `).bind(userId, 'analytics_stats', JSON.stringify(stats), new Date().toISOString()).run()
      .catch((err: any) => console.error('[Worker] D1 cache write failed:', err));

    if (ctx) ctx.waitUntil(storagePromise);
    else await storagePromise;

    return stats;
  } catch (err) {
    console.error('[Worker] computeAndStoreStats error:', err);
    throw err;
  }
}

/**
 * Pure logic function to compute analytics from a raw JSON payload.
 * Keeps logic consistent between Cron and individual API hits.
 */
function computeAnalyticsFromMega(mega: any) {
  const profile = mega.profile || {};
  const sessions = mega.sessions || [];
  const streaks = mega.streaks || [];
  const tasks = mega.tasks || [];
  const deadlines = mega.deadlines || [];

  const validSessions = sessions.filter((s: any) => s.status === 'completed' || (s.elapsed_seconds || 0) >= 300);
  const totalSeconds = validSessions.reduce((acc: number, s: any) => acc + (s.elapsed_seconds || 0), 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
  const today = new Date().toISOString().split('T')[0];

  const toDateStr = (val: any) => {
    if (!val) return '';
    const s = val instanceof Date ? val.toISOString() : String(val);
    return s.split('T')[0];
  };

  const sessionsTodayList = validSessions.filter((s: any) => toDateStr(s.started_at) === today);
  const todayFocusSeconds = sessionsTodayList.reduce((acc: number, s: any) => acc + (s.elapsed_seconds || 0), 0);
  const sessionsToday = sessions.filter((s: any) => toDateStr(s.started_at) === today).length;
  const completedToday = sessions.filter((s: any) => s.status === 'completed' && toDateStr(s.started_at) === today).length;
  
  const tasksDone = tasks.filter((t: any) => t.is_completed).length;
  const tasksDoneToday = tasks.filter((t: any) => t.is_completed && t.completed_at && toDateStr(t.completed_at) === today).length;

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
      tasksDone: tasks.filter((t: any) => t.is_completed && t.completed_at && toDateStr(t.completed_at) === dStr).length
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
    }
  }

  return {
    totalSeconds,
    totalHours,
    totalSessions: validSessions.length,
    sessionsToday,
    completedToday,
    tasksDone,
    tasksDoneToday,
    currentStreak: Math.max(currentStreak, profile.current_streak || 0),
    bestStreak: Math.max(currentStreak, profile.best_streak || 0),
    mana: profile.mana_points || 0,
    todayFocusSeconds,
    weeklyData,
    weekSeconds,
    weekHours: Math.round((weekSeconds / 3600) * 10) / 10,
    profile,
    deadlines,
    streaks,
    sessions,
    tasks
  };
}
