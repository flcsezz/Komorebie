import { supabase } from './supabase';

/**
 * Convert a Date to a YYYY-MM-DD string in UTC.
 *
 * All date comparisons in this app use UTC to stay consistent with:
 *   - The Cloudflare Worker (toISOString().split('T')[0])
 *   - Supabase CURRENT_DATE (UTC-based)
 *   - focus_sessions.started_at (stored as UTC timestamptz)
 *
 * Previously this used local time, which caused sessions to appear on the
 * wrong day for users in UTC± timezones (e.g. UTC+5:30 after 18:30 local).
 */
export const toLocalISO = (date: Date): string => {
  if (!date || isNaN(date.getTime())) return '1970-01-01';
  return date.toISOString().split('T')[0];
};

// ─── Cache configuration ───────────────────────────────────────────
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const STALE_WHILE_REVALIDATE_MS = 30 * 1000; // Serve stale data for 30s while refetching

// ─── Types ─────────────────────────────────────────────────────────
export interface CachedAnalytics {
  profile: any; 
  sessions: { id: string; status: string; elapsed_seconds?: number; started_at: string; tag?: string | null }[];
  streaks: { focus_date: string; total_focus_seconds: number; sessions_count: number; streak_qualified: boolean }[];
  deadlines: { id: string; deadline_date: string; title: string }[];
  tasks: { id: string; is_completed: boolean; completed_at: string | null }[];
  fetchedAt: number;
  // Pre-computed fields from worker
  totalSeconds?: number;
  totalSessions?: number;
  tasksDone?: number;
  todayFocusSeconds?: number;
  sessionsToday?: number;
  completedToday?: number;
  tasksDoneToday?: number;
}

export interface DailyStats {
  date: string;
  day: string;
  focusSeconds: number;
  sessionsCount: number;
  tasksDone: number;
}

type CacheListener = () => void;

// ─── Singleton cache store ─────────────────────────────────────────
class AnalyticsCacheStore {
  private cache: Map<string, CachedAnalytics> = new Map();
  private inflightRequests: Map<string, Promise<CachedAnalytics | null>> = new Map();
  private listeners: Set<CacheListener> = new Set();

  /**
   * Subscribe to cache invalidation events.
   * Returns an unsubscribe function.
   */
  subscribe(listener: CacheListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all subscribers that the cache has been updated.
   */
  private notifyListeners() {
    this.listeners.forEach(fn => {
      try { fn(); } catch (e) { console.error('Cache listener error:', e); }
    });
  }

  /**
   * Get cached data for a user. Returns null if stale beyond TTL.
   */
  get(userId: string): CachedAnalytics | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;
    
    const age = Date.now() - entry.fetchedAt;
    if (age > CACHE_TTL_MS) {
      // Expired — but still return for stale-while-revalidate
      if (age <= CACHE_TTL_MS + STALE_WHILE_REVALIDATE_MS) {
        return entry; // stale but usable
      }
      this.cache.delete(userId);
      return null;
    }
    return entry;
  }

  /**
   * Check if the cache is stale (expired but within revalidation window).
   */
  isStale(userId: string): boolean {
    const entry = this.cache.get(userId);
    if (!entry) return true;
    return Date.now() - entry.fetchedAt > CACHE_TTL_MS;
  }

  /**
   * Externally set cached data (used by DataSyncContext after fetching).
   */
  set(userId: string, data: CachedAnalytics) {
    this.cache.set(userId, data);
    this.notifyListeners();
  }

  /**
   * Fetch fresh analytics — tries edge worker first, then Supabase direct.
   * Used by hooks that need analytics for specific users (e.g., friend profiles).
   */
  async fetch(userId: string, force = false): Promise<CachedAnalytics | null> {
    // Return cached if fresh and not forced
    if (!force) {
      const cached = this.get(userId);
      if (cached && !this.isStale(userId)) return cached;
    }

    // Deduplicate inflight requests (keyed by userId+force to avoid serving non-forced response for a forced request)
    const cacheKey = `${userId}:${force}`;
    if (this.inflightRequests.has(cacheKey)) {
      return this.inflightRequests.get(cacheKey)!;
    }

    const promise = this.fetchFresh(userId, force);
    this.inflightRequests.set(cacheKey, promise);

    try {
      return await promise;
    } finally {
      this.inflightRequests.delete(cacheKey);
    }
  }

  /**
   * Try edge worker first with timeout, then fall back to direct Supabase.
   */
  private async fetchFresh(userId: string, force = false): Promise<CachedAnalytics | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    // Try edge worker with 3s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`/api/analytics/stats?userId=${userId}${force ? '&force=true' : ''}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json() as any;
        const entry: CachedAnalytics = {
          profile: data.profile || {},
          sessions: data.sessions || [],
          streaks: data.streaks || [],
          deadlines: data.deadlines || [],
          tasks: data.tasks || [],
          totalSeconds: data.totalSeconds,
          totalSessions: data.totalSessions,
          tasksDone: data.tasksDone,
          todayFocusSeconds: data.todayFocusSeconds,
          sessionsToday: data.sessionsToday,
          completedToday: data.completedToday,
          tasksDoneToday: data.tasksDoneToday,
          fetchedAt: Date.now(),
        };
        this.cache.set(userId, entry);
        this.notifyListeners();
        return entry;
      }
    } catch (err) {
      console.warn('AnalyticsCache: Edge worker fetch failed, trying Supabase direct');
    }

    // Fallback: Direct Supabase queries
    return this.fetchDirectFromSupabase(userId);
  }

  /**
   * Direct Supabase fallback — no worker involved.
   */
  private async fetchDirectFromSupabase(userId: string): Promise<CachedAnalytics | null> {
    try {
      const [
        { data: profile },
        { data: sessions },
        { data: streaks },
        { data: deadlines },
        { data: tasks }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('focus_sessions')
          .select('id, status, elapsed_seconds, started_at, tag')
          .eq('user_id', userId)
          .order('started_at', { ascending: false })
          .limit(500),
        supabase.from('streaks')
          .select('focus_date, total_focus_seconds, sessions_count, streak_qualified')
          .eq('user_id', userId)
          .order('focus_date', { ascending: false })
          .limit(365),
        supabase.from('deadlines')
          .select('id, deadline_date, title')
          .eq('user_id', userId)
          .order('deadline_date', { ascending: true }),
        supabase.from('tasks')
          .select('id, is_completed, completed_at')
          .eq('user_id', userId)
          .eq('is_completed', true)
          .order('completed_at', { ascending: false })
      ]);

      const entry: CachedAnalytics = {
        profile: profile || {},
        sessions: sessions || [],
        streaks: streaks || [],
        deadlines: deadlines || [],
        tasks: tasks || [],
        fetchedAt: Date.now(),
      };

      this.cache.set(userId, entry);
      this.notifyListeners();
      return entry;
    } catch (err) {
      console.error('AnalyticsCache: Direct Supabase fetch failed:', err);
      return null;
    }
  }

  /**
   * Invalidate the cache for a user and immediately refetch.
   * Used after recording a session to ensure fresh data.
   */
  async invalidate(userId: string): Promise<CachedAnalytics | null> {
    this.cache.delete(userId);
    return this.fetch(userId, true);
  }

  /**
   * Clear all cached data. 
   */
  clear() {
    this.cache.clear();
    this.notifyListeners();
  }
}

// Export singleton
export const analyticsCache = new AnalyticsCacheStore();

// ─── Helper: Compute derived stats from cached data ────────────────
export function computeStats(data: CachedAnalytics) {
  const { profile, sessions, streaks } = data;

  const validSessions = sessions.filter((s) => s.status === 'completed' || (s.elapsed_seconds || 0) >= 300);
  const totalSeconds = data.totalSeconds !== undefined ? data.totalSeconds : validSessions.reduce((acc: number, s) => acc + (s.elapsed_seconds || 0), 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
  const totalSessionsCount = data.totalSessions !== undefined ? data.totalSessions : validSessions.length;

  const today = toLocalISO(new Date());

  // Today's focus time - prefer calculating from sessions for accuracy, 
  // but fallback to streaks table for historical consistency if needed.
  const sessionsTodayList = validSessions.filter((s) =>
    toLocalISO(new Date(s.started_at)) === today
  );
  const todayFocusSeconds = data.todayFocusSeconds !== undefined ? data.todayFocusSeconds : sessionsTodayList.reduce((acc: number, s) => acc + (s.elapsed_seconds || 0), 0);

  const sessionsToday = data.sessionsToday !== undefined ? data.sessionsToday : sessions.filter((s) =>
    toLocalISO(new Date(s.started_at)) === today
  ).length;

  const completedToday = data.completedToday !== undefined ? data.completedToday : sessions.filter((s) =>
    s.status === 'completed' && toLocalISO(new Date(s.started_at)) === today
  ).length;

  const tasksDone = data.tasksDone !== undefined ? data.tasksDone : data.tasks.length;
  const tasksDoneToday = data.tasksDoneToday !== undefined ? data.tasksDoneToday : data.tasks.filter((t) =>
    t.completed_at && toLocalISO(new Date(t.completed_at)) === today
  ).length;

  // Weekly data for charts (last 7 days)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData: DailyStats[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = toLocalISO(d);
    const entry = streaks.find((s) => s.focus_date === dStr);

    weeklyData.push({
      date: dStr,
      day: dayNames[d.getDay()],
      focusSeconds: entry ? entry.total_focus_seconds : 0,
      sessionsCount: entry ? entry.sessions_count : 0,
      tasksDone: data.tasks.filter((t) => 
        t.completed_at && toLocalISO(new Date(t.completed_at)) === dStr
      ).length,
    });
  }

  // Calculate current week seconds (Monday to Sunday) to match leaderboard logic
  const now = new Date();
  const day = now.getDay(); 
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const mondayStr = toLocalISO(monday);

  const weekSeconds = streaks
    .filter(s => s.focus_date >= mondayStr)
    .reduce((acc, s) => acc + (s.total_focus_seconds || 0), 0);

  const weekHours = Math.round((weekSeconds / 3600) * 10) / 10;

  // Calculate current streak from focus history
  let currentStreak = 0;
  const qualifiedDates = new Set(streaks.filter((s) => s.streak_qualified).map((s) => s.focus_date));
  
  if (qualifiedDates.size > 0) {
    const todayStr = today;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalISO(yesterday);
    
    // Streak is active if either today or yesterday is qualified
    const isAlive = qualifiedDates.has(todayStr) || qualifiedDates.has(yesterdayStr);
    
    if (isAlive) {
      const checkDate = qualifiedDates.has(todayStr) ? new Date() : yesterday;
      
      while (qualifiedDates.has(toLocalISO(checkDate))) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      // Fallback to profile field if it's higher (e.g. data older than 365 days)
      // but only if the streak is actually alive.
      currentStreak = Math.max(currentStreak, profile?.current_streak || 0);
    }
  }

  const bestStreak = Math.max(currentStreak, profile?.best_streak || 0);

  return {
    totalSeconds,
    totalHours,
    totalSessions: totalSessionsCount,
    sessionsToday,
    completedToday,
    tasksDone,
    tasksDoneToday,
    currentStreak,
    bestStreak,
    mana: profile?.mana_points || 0,
    todayFocusSeconds,
    weeklyData,
    weekSeconds,
    weekHours,
  };
}

/**
 * Build streak dates map for the calendar heatmap.
 */
export function buildStreakDates(
  streaks: { focus_date: string; total_focus_seconds: number; sessions_count: number; streak_qualified: boolean }[], 
  tasks: { completed_at: string | null }[] = []
): Map<string, { qualified: boolean; seconds: number; sessions: number; tasksDone: number }> {
  const map = new Map<string, { qualified: boolean; seconds: number; sessions: number; tasksDone: number }>();
  
  // Initialize with streak data
  streaks.forEach((s) => {
    map.set(s.focus_date, {
      qualified: s.streak_qualified || false,
      seconds: s.total_focus_seconds || 0,
      sessions: s.sessions_count || 0,
      tasksDone: 0 // Will fill in next step
    });
  });

  // Add task completion data
  tasks.forEach((t) => {
    if (t.completed_at) {
      const dateStr = toLocalISO(new Date(t.completed_at));
      const entry = map.get(dateStr);
      if (entry) {
        entry.tasksDone += 1;
      } else {
        map.set(dateStr, {
          qualified: false,
          seconds: 0,
          sessions: 0,
          tasksDone: 1
        });
      }
    }
  });

  return map;
}
