import postgres from 'postgres';

export interface Env {
  komorebie_db: D1Database;
  HYPERDRIVE: Hyperdrive;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
            
            // Upsert to D1
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

            return new Response(JSON.stringify({ success: true }), {
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
              if (age < 2 * 60 * 1000) { // 2 minute cache
                return new Response(cached.payload, {
                  headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
                });
              }
            }
          }

          // Fetch from Supabase via Hyperdrive
          const sql = postgres(env.HYPERDRIVE.connectionString);
          
          try {
            const [profile, sessions, streaks, deadlines, tasks] = await Promise.all([
              sql`SELECT * FROM profiles WHERE id = ${user.id} LIMIT 1`,
              sql`SELECT id, status, elapsed_seconds, started_at FROM focus_sessions WHERE user_id = ${user.id} ORDER BY started_at DESC LIMIT 500`,
              sql`SELECT focus_date, total_focus_seconds, sessions_count, streak_qualified FROM streaks WHERE user_id = ${user.id} ORDER BY focus_date DESC LIMIT 365`,
              sql`SELECT id, deadline_date, title FROM deadlines WHERE user_id = ${user.id} ORDER BY deadline_date ASC`,
              sql`SELECT id, is_completed, completed_at FROM tasks WHERE user_id = ${user.id} AND is_completed = true ORDER BY completed_at DESC`
            ]);

            // Ported computeStats logic
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
              deadlines: deadlines
            };

            const payload = JSON.stringify(stats);

            // Update D1 Cache
            await env.komorebie_db.prepare(`
              INSERT INTO data_cache (user_id, data_type, payload, updated_at)
              VALUES (?, ?, ?, ?)
              ON CONFLICT (user_id, data_type) DO UPDATE SET
                payload = excluded.payload,
                updated_at = excluded.updated_at
            `).bind(user.id, 'analytics_stats', payload, new Date().toISOString()).run();

            return new Response(payload, {
              headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
            });
          } catch (err: any) {
             console.error('Analytics Engine Error:', err);
             return new Response(JSON.stringify({ error: err.message }), { status: 500 });
          } finally {
            await sql.end();
          }
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
  }
};
