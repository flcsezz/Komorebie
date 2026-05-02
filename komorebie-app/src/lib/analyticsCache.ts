import { supabase } from './supabase';

// ─── Cache configuration ───────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const STALE_WHILE_REVALIDATE_MS = 30 * 1000; // Serve stale data for 30s while refetching

// ─── Types ─────────────────────────────────────────────────────────
export interface CachedAnalytics {
  profile: any;
  sessions: any[];
  streaks: any[];
  deadlines: any[];
  fetchedAt: number;
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
   * Fetch fresh analytics from Supabase with inflight deduplication.
   * If a request for the same user is already in progress, returns the same promise.
   */
  async fetch(userId: string, force = false): Promise<CachedAnalytics | null> {
    // Return cached if fresh and not forced
    if (!force) {
      const cached = this.get(userId);
      if (cached && !this.isStale(userId)) return cached;
    }

    // Deduplicate inflight requests
    const inflightKey = userId;
    if (this.inflightRequests.has(inflightKey)) {
      return this.inflightRequests.get(inflightKey)!;
    }

    const promise = this.fetchFromSupabase(userId);
    this.inflightRequests.set(inflightKey, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.inflightRequests.delete(inflightKey);
    }
  }

  private async fetchFromSupabase(userId: string): Promise<CachedAnalytics | null> {
    try {
      // Run all queries in parallel for speed
      const [profileRes, sessionsRes, streaksRes, deadlinesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        supabase
          .from('focus_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('started_at', { ascending: false })
          .limit(500), // Cap query size to prevent huge payloads
        supabase
          .from('streaks')
          .select('*')
          .eq('user_id', userId)
          .order('focus_date', { ascending: false })
          .limit(365), // Max 1 year of streak data
        supabase
          .from('deadlines')
          .select('*')
          .eq('user_id', userId)
          .order('deadline_date', { ascending: true }),
      ]);

      const entry: CachedAnalytics = {
        profile: profileRes.data,
        sessions: sessionsRes.data || [],
        streaks: streaksRes.data || [],
        deadlines: deadlinesRes.data || [],
        fetchedAt: Date.now(),
      };

      this.cache.set(userId, entry);
      this.notifyListeners();
      return entry;
    } catch (err) {
      console.error('AnalyticsCache: fetch failed', err);
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

  const completedSessions = sessions.filter((s: any) => s.status === 'completed');
  const totalSeconds = completedSessions.reduce((acc: number, s: any) => acc + (s.elapsed_seconds || 0), 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

  const today = new Date().toISOString().split('T')[0];

  const sessionsToday = sessions.filter((s: any) =>
    new Date(s.started_at).toISOString().split('T')[0] === today
  ).length;

  const completedToday = sessions.filter((s: any) =>
    s.status === 'completed' && new Date(s.started_at).toISOString().split('T')[0] === today
  ).length;

  const tasksDone = completedSessions.filter((s: any) => s.task_id).length;
  const tasksDoneToday = sessions.filter((s: any) =>
    s.status === 'completed' && s.task_id && new Date(s.started_at).toISOString().split('T')[0] === today
  ).length;

  // Today's focus time from streaks table
  const todayStreak = streaks.find((s: any) => s.focus_date === today);
  const todayFocusSeconds = todayStreak ? todayStreak.total_focus_seconds : 0;

  // Weekly data (last 7 days)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData: DailyStats[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const entry = streaks.find((s: any) => s.focus_date === dateStr);

    const daySessions = sessions.filter((s: any) =>
      s.status === 'completed' && new Date(s.started_at).toISOString().split('T')[0] === dateStr
    );

    weeklyData.push({
      date: dateStr,
      day: dayNames[date.getDay()],
      focusSeconds: entry ? entry.total_focus_seconds : 0,
      sessionsCount: entry ? entry.sessions_count : 0,
      tasksDone: daySessions.filter((s: any) => s.task_id).length,
    });
  }

  const weekSeconds = weeklyData.reduce((acc, d) => acc + d.focusSeconds, 0);
  const weekHours = Math.round((weekSeconds / 3600) * 10) / 10;

  const currentStreak = profile?.current_streak || 0;
  const bestStreak = profile?.best_streak || 0;

  return {
    totalHours,
    totalSessions: completedSessions.length,
    sessionsToday,
    completedToday,
    tasksDone,
    tasksDoneToday,
    currentStreak,
    bestStreak,
    mana: profile?.mana_points || 0,
    todayFocusSeconds,
    weeklyData,
    weekHours,
  };
}

/**
 * Build streak dates map for the calendar heatmap.
 */
export function buildStreakDates(streaks: any[]): Map<string, { qualified: boolean; seconds: number; sessions: number }> {
  const map = new Map<string, { qualified: boolean; seconds: number; sessions: number }>();
  streaks.forEach((s: any) => {
    map.set(s.focus_date, {
      qualified: s.streak_qualified || false,
      seconds: s.total_focus_seconds || 0,
      sessions: s.sessions_count || 0,
    });
  });
  return map;
}
