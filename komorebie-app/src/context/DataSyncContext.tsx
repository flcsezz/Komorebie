import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { analyticsCache, computeStats, buildStreakDates, type CachedAnalytics, type DailyStats } from '../lib/analyticsCache';
import { getTierForSeconds, type TierConfig, type TierKey, ADMIN_OVERRIDE_KEY } from '../lib/leagues';
import { supabase } from '../lib/supabase';

/**
 * Unified statistics for the current user.
 */
export interface SyncStats {
  totalSeconds: number;
  totalHours: number;
  totalSessions: number;
  sessionsToday: number;
  completedToday: number;
  tasksDone: number;
  tasksDoneToday: number;
  currentStreak: number;
  bestStreak: number;
  mana: number;
  todayFocusSeconds: number;
  weeklyData: DailyStats[];
  weekSeconds: number;
  weekHours: number;
}

/**
 * Unified ranking information.
 */
export interface SyncRankings {
  globalRank: number | null;
  leagueRank: number | null;
  totalUsers: number;
}

interface DataSyncContextType {
  stats: SyncStats;
  tier: TierConfig;
  rankings: SyncRankings;
  profile: any;
  streakDates: Map<string, any>;
  deadlines: any[];
  tagColors: Record<string, string>;
  setTagColor: (tag: string, color: string) => Promise<void>;
  loading: boolean;
  refresh: (force?: boolean) => Promise<void>;
}

const DataSyncContext = createContext<DataSyncContextType | undefined>(undefined);

const EMPTY_STATS: SyncStats = {
  totalSeconds: 0,
  totalHours: 0,
  totalSessions: 0,
  sessionsToday: 0,
  completedToday: 0,
  tasksDone: 0,
  tasksDoneToday: 0,
  currentStreak: 0,
  bestStreak: 0,
  mana: 0,
  todayFocusSeconds: 0,
  weeklyData: [],
  weekSeconds: 0,
  weekHours: 0,
};

export const DataSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState<CachedAnalytics | null>(null);
  const [rankings, setRankings] = useState<SyncRankings>({ globalRank: null, leagueRank: null, totalUsers: 0 });
  const [tagColors, setTagColors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const hasDataRef = useRef(false);

  // Load tag colors directly from Supabase
  const loadTagColors = useCallback(async (userId: string) => {
    try {
      const { data: tcData, error: tcErr } = await supabase
        .from('tag_colors')
        .select('tag, color')
        .eq('user_id', userId);
      
      if (tcErr) throw tcErr;
      
      const colors = (tcData || []).reduce((acc: Record<string, string>, curr) => {
        acc[curr.tag] = curr.color;
        return acc;
      }, {});
      setTagColors(colors);
    } catch (err) {
      console.error('DataSync: failed to fetch tag colors', err);
    }
  }, []);

  const setTagColor = useCallback(async (tag: string, color: string) => {
    if (!user?.id) return;

    // Optimistic update
    setTagColors(prev => ({
      ...prev,
      [tag]: color
    }));

    try {
      const { error } = await supabase
        .from('tag_colors')
        .upsert({
          user_id: user.id,
          tag,
          color,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,tag'
        });

      if (error) throw error;
    } catch (err) {
      console.error('DataSync: failed to save tag color', err);
      // Revert or reload from server to stay in sync
      loadTagColors(user.id);
    }
  }, [user?.id, loadTagColors]);
  
  // Keep ref in sync with state
  useEffect(() => { hasDataRef.current = !!data; }, [data]);

  // Derived stats — always computed from the single `data` source
  const stats = useMemo<SyncStats>(() => {
    if (!data) return EMPTY_STATS;
    return computeStats(data);
  }, [data]);

  // Derived tier
  const tier = useMemo(() => {
    const overrideKey = typeof window !== 'undefined' ? localStorage.getItem(ADMIN_OVERRIDE_KEY) as TierKey : null;
    return getTierForSeconds(stats.weekSeconds, overrideKey);
  }, [stats.weekSeconds]);

  // Derived streak dates
  const streakDates = useMemo(() => {
    if (!data) return new Map();
    return buildStreakDates(data.streaks, data.tasks);
  }, [data]);

  const fetchRankings = useCallback(async (userId: string, totalSeconds: number) => {
    try {
      const fetchPromise = (async () => {
        // 1. Get total users count for context
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        
        // 2. Get global rank (based on all-time mana/seconds)
        const { count: higherRanked } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('mana_points', Math.floor(totalSeconds / 60));

        const globalRank = (higherRanked || 0) + 1;

        // 3. League rank
        const { data: weeklyLB } = await supabase.rpc('get_leaderboard_weekly');
        const lb = weeklyLB as any[] || [];
        const myLBEntry = lb.find(u => u.id === userId);
        const weeklyRank = myLBEntry ? lb.indexOf(myLBEntry) + 1 : null;

        setRankings({
          globalRank,
          leagueRank: weeklyRank,
          totalUsers: count || 0,
        });
      })();

      await Promise.race([
        fetchPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Rankings timeout')), 3000))
      ]);
    } catch (err) {
      console.error('DataSync: ranking fetch error', err);
    }
  }, []);

  /**
   * Fetch analytics directly from Supabase (bypasses worker entirely).
   * This is the fallback when the edge worker is down or slow.
   */
  const fetchDirectFromSupabase = useCallback(async (userId: string): Promise<CachedAnalytics | null> => {
    try {
      console.log('DataSync: Fetching directly from Supabase...');
      const [
        { data: profile, error: pErr },
        { data: sessions },
        { data: streaks },
        { data: deadlines },
        { data: tasks }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('focus_sessions')
          .select('id, status, elapsed_seconds, started_at')
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

      // If profile fetch failed, we can't proceed
      if (pErr) {
        console.error('DataSync: Supabase profile fetch error:', pErr);
        return null;
      }

      const result: CachedAnalytics = {
        profile: profile || {},
        sessions: sessions || [],
        streaks: streaks || [],
        deadlines: deadlines || [],
        tasks: tasks || [],
        fetchedAt: Date.now()
      };

      // Cache in-memory for subsequent reads
      analyticsCache.set(userId, result);
      console.log('DataSync: Supabase direct fetch complete');
      return result;
    } catch (err) {
      console.error('DataSync: Direct Supabase fetch error:', err);
      return null;
    }
  }, []);

  const refresh = useCallback(async (force = false) => {
    if (!user?.id) {
      setData(null);
      setTagColors({});
      setLoading(false);
      return;
    }

    // Only show the loading indicator if we have no data yet
    if (!hasDataRef.current || force) {
      setLoading(true);
    }

    // Fire off tag colors fetch in parallel
    loadTagColors(user.id);

    try {
      // ─── Step 1: Check in-memory cache first ───────────────────────
      // When force=true, still use a very-recently-populated cache (< 10s old)
      // to avoid a redundant edge-worker call right after analyticsCache.invalidate().
      const _cached = analyticsCache.get(user.id);
      const _cacheAge = _cached ? Date.now() - _cached.fetchedAt : Infinity;
      if (_cached && (!force ? !analyticsCache.isStale(user.id) : _cacheAge < 10_000)) {
        console.log(`DataSync: Using ${force ? 'very-fresh' : 'cached'} in-memory data (${Math.round(_cacheAge / 1000)}s old)`);
        setData(_cached);
        setLoading(false);
        fetchRankings(user.id, _cached.totalSeconds || 0);
        return;
      }

      // ─── Step 2: Try edge worker (fast path) with 3s timeout ──────
      let edgeSuccess = false;
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        if (token) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const res = await fetch(`/api/analytics/stats${force ? '?force=true' : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const statsPayload = await res.json() as any;
            console.log('DataSync: Edge worker fetch succeeded', res.headers.get('X-Cache'));

            const result: CachedAnalytics = {
              profile: statsPayload.profile || {},
              sessions: statsPayload.sessions || [],
              streaks: statsPayload.streaks || [],
              deadlines: statsPayload.deadlines || [],
              tasks: statsPayload.tasks || [],
              totalSeconds: statsPayload.totalSeconds,
              totalSessions: statsPayload.totalSessions,
              tasksDone: statsPayload.tasksDone,
              fetchedAt: Date.now()
            };

            analyticsCache.set(user.id, result);
            setData(result);
            edgeSuccess = true;

            // Fire-and-forget rankings
            fetchRankings(user.id, statsPayload.totalSeconds || 0);
          }
        }
      } catch (edgeErr: any) {
        if (edgeErr?.name === 'AbortError') {
          console.warn('DataSync: Edge worker timed out (3s)');
        } else {
          console.warn('DataSync: Edge worker fetch failed:', edgeErr?.message);
        }
      }

      // ─── Step 3: Supabase direct fallback ─────────────────────────
      if (!edgeSuccess) {
        console.log('DataSync: Falling back to Supabase direct...');
        const result = await fetchDirectFromSupabase(user.id);
        if (result) {
          setData(result);
          fetchRankings(user.id, result.totalSeconds || 0);
        } else {
          // Emergency: at minimum set profile so the app doesn't break
          console.warn('DataSync: Both paths failed, setting empty data');
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          setData({
            profile: profileData || {},
            sessions: [],
            streaks: [],
            deadlines: [],
            tasks: [],
            fetchedAt: Date.now()
          } as CachedAnalytics);
        }
      }
    } catch (err) {
      console.error('DataSync: refresh error', err);
      // Absolute last resort — ensure we set SOMETHING to prevent infinite loading
      if (!hasDataRef.current) {
        setData({
          profile: {},
          sessions: [],
          streaks: [],
          deadlines: [],
          tasks: [],
          fetchedAt: Date.now()
        } as CachedAnalytics);
      }
    } finally {
      setLoading(false);
    }
  }, [user, fetchRankings, fetchDirectFromSupabase]);

  // Initial load + visibility-based refresh
  useEffect(() => {
    if (!user?.id) return;

    refresh();

    // Subscribe to in-memory cache updates (e.g., after session logging)
    const unsub = analyticsCache.subscribe(() => {
      if (user?.id) {
        const cached = analyticsCache.get(user.id);
        if (cached) {
          setData(cached);
        }
      }
    });

    // Background refresh when tab becomes visible again (debounced)
    let lastRefreshTime = Date.now();
    const MIN_REFRESH_GAP_MS = 5_000; // Don't refresh more than once per 5s

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        const timeSinceLastRefresh = Date.now() - lastRefreshTime;
        if (timeSinceLastRefresh > MIN_REFRESH_GAP_MS) {
          lastRefreshTime = Date.now();
          // Silent background refresh — don't set loading
          refresh(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsub();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const value = {
    stats,
    tier,
    rankings,
    profile: data?.profile || null,
    streakDates,
    deadlines: data?.deadlines || [],
    tagColors,
    setTagColor,
    loading,
    refresh,
  };

  return <DataSyncContext.Provider value={value}>{children}</DataSyncContext.Provider>;
};

export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (context === undefined) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};
