/**
 * analyticsCache.ts — Client-side analytics cache layer.
 *
 * Responsibilities:
 *   - Cache analytics payloads from the edge worker (2-min TTL)
 *   - Fallback to direct Supabase reads if the worker is unavailable
 *   - Notify subscribers when data changes
 *
 * All aggregation logic lives in aggregation.ts.
 * This file ONLY manages caching and data fetching.
 */
import { supabase } from './supabase';
import type { RawAnalyticsPayload } from './aggregation';

// Re-export everything consumers need from aggregation
export {
  toUTCDate,
  todayUTC,
  buildStreakDates,
  computeStats,
  computeTagStats,
  isValidSession,
  VALID_SESSION_MIN_SECONDS,
  type ComputedStats,
  type DailyStats,
  type RawAnalyticsPayload,
  type StreakDateMap,
  type TagAnalyticItem,
} from './aggregation';

// ── Legacy alias (remove callers gradually) ──────────────────────────────────
/** @deprecated Use toUTCDate from aggregation.ts */
export { toUTCDate as toLocalISO } from './aggregation';

// ── Cache config ─────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 2 * 60 * 1000;            // 2 minutes fresh
const STALE_REVALIDATE_MS = 30 * 1000;          // Serve stale for 30s while refreshing

// ── CachedAnalytics — shape stored in the cache ──────────────────────────────
export type CachedAnalytics = RawAnalyticsPayload & {
  fetchedAt: number;
};

type CacheListener = () => void;

// ── Singleton AnalyticsCacheStore ─────────────────────────────────────────────
class AnalyticsCacheStore {
  private cache = new Map<string, CachedAnalytics>();
  private inflight = new Map<string, Promise<CachedAnalytics | null>>();
  private listeners = new Set<CacheListener>();

  subscribe(fn: CacheListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach(fn => {
      try { fn(); } catch (e) { console.error('[AnalyticsCache] listener error:', e); }
    });
  }

  get(userId: string): CachedAnalytics | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;
    const age = Date.now() - entry.fetchedAt;
    if (age > CACHE_TTL_MS + STALE_REVALIDATE_MS) {
      this.cache.delete(userId);
      return null;
    }
    return entry;
  }

  isStale(userId: string): boolean {
    const entry = this.cache.get(userId);
    if (!entry) return true;
    return Date.now() - entry.fetchedAt > CACHE_TTL_MS;
  }

  set(userId: string, data: CachedAnalytics) {
    this.cache.set(userId, data);
    this.notify();
  }

  async fetch(userId: string, force = false): Promise<CachedAnalytics | null> {
    if (!force) {
      const cached = this.get(userId);
      if (cached && !this.isStale(userId)) return cached;
    }

    const key = `${userId}:${force}`;
    if (this.inflight.has(key)) return this.inflight.get(key)!;

    const p = this.fetchFresh(userId, force);
    this.inflight.set(key, p);
    try {
      return await p;
    } finally {
      this.inflight.delete(key);
    }
  }

  async invalidate(userId: string): Promise<CachedAnalytics | null> {
    this.cache.delete(userId);
    return this.fetch(userId, true);
  }

  clear() {
    this.cache.clear();
    this.notify();
  }

  private async fetchFresh(userId: string, force = false): Promise<CachedAnalytics | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    // ── Try edge worker first (3s timeout) ────────────────────────────────
    try {
      const ctl = new AbortController();
      const tid = setTimeout(() => ctl.abort(), 3000);
      const res = await fetch(
        `/api/analytics/stats?userId=${userId}${force ? '&force=true' : ''}`,
        { headers: { Authorization: `Bearer ${session.access_token}` }, signal: ctl.signal }
      );
      clearTimeout(tid);

      if (res.ok) {
        const raw = await res.json() as Record<string, unknown>;
        const entry: CachedAnalytics = {
          profile:   (raw.profile  as CachedAnalytics['profile'])  ?? {},
          sessions:  (raw.sessions as CachedAnalytics['sessions']) ?? [],
          streaks:   (raw.streaks  as CachedAnalytics['streaks'])  ?? [],
          deadlines: (raw.deadlines as CachedAnalytics['deadlines']) ?? [],
          tasks:     (raw.tasks    as CachedAnalytics['tasks'])    ?? [],
          // Edge pre-computed fields — skip client re-computation when present
          totalSeconds:    raw.totalSeconds     as number | undefined,
          totalSessions:   raw.totalSessions    as number | undefined,
          todayFocusSeconds: raw.todayFocusSeconds as number | undefined,
          sessionsToday:   raw.sessionsToday    as number | undefined,
          completedToday:  raw.completedToday   as number | undefined,
          tasksDone:       raw.tasksDone        as number | undefined,
          tasksDoneToday:  raw.tasksDoneToday   as number | undefined,
          fetchedAt: Date.now(),
        };
        this.cache.set(userId, entry);
        this.notify();
        return entry;
      }
    } catch {
      console.warn('[AnalyticsCache] Edge worker unavailable, falling back to Supabase.');
    }

    return this.fetchDirect(userId);
  }

  private async fetchDirect(userId: string): Promise<CachedAnalytics | null> {
    try {
      const [
        { data: profile },
        { data: sessions },
        { data: streaks },
        { data: deadlines },
        { data: tasks },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('focus_sessions')
          .select('id, status, elapsed_seconds, started_at, tag')
          .eq('user_id', userId).order('started_at', { ascending: false }).limit(500),
        supabase.from('streaks')
          .select('focus_date, total_focus_seconds, sessions_count, streak_qualified')
          .eq('user_id', userId).order('focus_date', { ascending: false }).limit(365),
        supabase.from('deadlines')
          .select('id, deadline_date, title').eq('user_id', userId).order('deadline_date'),
        supabase.from('tasks')
          .select('id, is_completed, completed_at')
          .eq('user_id', userId).eq('is_completed', true).order('completed_at', { ascending: false }),
      ]);

      const entry: CachedAnalytics = {
        profile:   profile  ?? {},
        sessions:  (sessions  ?? []) as CachedAnalytics['sessions'],
        streaks:   (streaks   ?? []) as CachedAnalytics['streaks'],
        deadlines: (deadlines ?? []) as CachedAnalytics['deadlines'],
        tasks:     (tasks     ?? []) as CachedAnalytics['tasks'],
        fetchedAt: Date.now(),
      };

      this.cache.set(userId, entry);
      this.notify();
      return entry;
    } catch (err) {
      console.error('[AnalyticsCache] Supabase direct fetch failed:', err);
      return null;
    }
  }
}

export const analyticsCache = new AnalyticsCacheStore();
