import { supabase } from './supabase';

/**
 * Helper to get YYYY-MM-DD in local time.
 */
export const toLocalISO = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ─── Cache configuration ───────────────────────────────────────────
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const STALE_WHILE_REVALIDATE_MS = 30 * 1000; // Serve stale data for 30s while refetching

// ─── Types ─────────────────────────────────────────────────────────
export interface CachedAnalytics {
  profile: any; 
  sessions: { id: string; status: string; elapsed_seconds?: number; started_at: string }[];
  streaks: { focus_date: string; total_focus_seconds: number; sessions_count: number; streak_qualified: boolean }[];
  deadlines: { id: string; deadline_date: string; title: string }[];
  tasks: { id: string; is_completed: boolean; completed_at: string | null }[];
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
      const [profileRes, sessionsRes, streaksRes, deadlinesRes, tasksRes] = await Promise.all([
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
          .limit(500),
        supabase
          .from('streaks')
          .select('*')
          .eq('user_id', userId)
          .order('focus_date', { ascending: false })
          .limit(365),
        supabase
          .from('deadlines')
          .select('*')
          .eq('user_id', userId)
          .order('deadline_date', { ascending: true }),
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('is_completed', true)
          .order('completed_at', { ascending: false }),
      ]);

      const entry: CachedAnalytics = {
        profile: profileRes.data,
        sessions: sessionsRes.data || [],
        streaks: streaksRes.data || [],
        deadlines: deadlinesRes.data || [],
        tasks: tasksRes.data || [],
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

  const validSessions = sessions.filter((s) => s.status === 'completed' || (s.elapsed_seconds || 0) >= 300);
  const totalSeconds = validSessions.reduce((acc: number, s) => acc + (s.elapsed_seconds || 0), 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

  const today = toLocalISO(new Date());

  // Today's focus time - prefer calculating from sessions for accuracy, 
  // but fallback to streaks table for historical consistency if needed.
  const sessionsTodayList = validSessions.filter((s) =>
    toLocalISO(new Date(s.started_at)) === today
  );
  const todayFocusSeconds = sessionsTodayList.reduce((acc: number, s) => acc + (s.elapsed_seconds || 0), 0);

  const sessionsToday = sessions.filter((s) =>
    toLocalISO(new Date(s.started_at)) === today
  ).length;

  const completedToday = sessions.filter((s) =>
    s.status === 'completed' && toLocalISO(new Date(s.started_at)) === today
  ).length;

  const tasksDone = data.tasks.length;
  const tasksDoneToday = data.tasks.filter((t) =>
    t.completed_at && toLocalISO(new Date(t.completed_at)) === today
  ).length;

  // Weekly data (last 7 days)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData: DailyStats[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = toLocalISO(date);
    const entry = streaks.find((s) => s.focus_date === dateStr);

    weeklyData.push({
      date: dateStr,
      day: dayNames[date.getDay()],
      focusSeconds: entry ? entry.total_focus_seconds : 0,
      sessionsCount: entry ? entry.sessions_count : 0,
      tasksDone: data.tasks.filter((t) => 
        t.completed_at && toLocalISO(new Date(t.completed_at)) === dateStr
      ).length,
    });
  }

  const weekSeconds = weeklyData.reduce((acc, d) => acc + d.focusSeconds, 0);
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
    if (qualifiedDates.has(todayStr) || qualifiedDates.has(yesterdayStr)) {
      const checkDate = qualifiedDates.has(todayStr) ? new Date() : yesterday;
      
      while (qualifiedDates.has(toLocalISO(checkDate))) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }
  }

  // Fallback to profile field if calculation is 0 but profile says otherwise (e.g. data older than 365 days)
  if (currentStreak === 0 && profile?.current_streak > 0) {
    currentStreak = profile.current_streak;
  }

  const bestStreak = Math.max(currentStreak, profile?.best_streak || 0);

  return {
    totalSeconds,
    totalHours,
    totalSessions: validSessions.length,
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
