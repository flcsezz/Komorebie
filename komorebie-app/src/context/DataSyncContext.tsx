import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  loading: boolean;
  refresh: (force?: boolean) => Promise<void>;
}

const DataSyncContext = createContext<DataSyncContextType | undefined>(undefined);

export const DataSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState<CachedAnalytics | null>(null);
  const [rankings, setRankings] = useState<SyncRankings>({ globalRank: null, leagueRank: null, totalUsers: 0 });
  const [loading, setLoading] = useState(true);

  // Derived stats
  const stats = useMemo<SyncStats>(() => {
    if (!data) {
      return {
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
    }
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
    } catch (err) {
      console.error('DataSync: ranking fetch error', err);
    }
  }, []);

  const refresh = useCallback(async (force = false) => {
    if (!user?.id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (token) {
        // Try Edge Analytics Engine first (BE-CF-03)
        const res = await fetch(`/api/analytics/stats${force ? '?force=true' : ''}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const stats = await res.json() as any;
          // We still set data to keep other components happy, but stats are pre-computed
          // The current SyncStats interface matches the output of the edge engine.
          // Note: we might need to adjust CachedAnalytics if we want to keep exact compatibility.
          
          // For now, let's just use the stats directly if we can, or mock the CachedAnalytics.
          setData({
            profile: stats.profile,
            sessions: [], // We don't need raw sessions if stats are computed
            streaks: stats.weeklyData.map((d: any) => ({
              focus_date: d.date,
              total_focus_seconds: d.focusSeconds,
              sessions_count: d.sessionsCount,
              streak_qualified: d.streakQualified || false // Actual value instead of Approximation
            })),
            deadlines: stats.deadlines,
            tasks: [], // Tasks are also pre-computed in stats
            fetchedAt: Date.now()
          } as any);

          // We still need rankings, which aren't in the edge stats yet
          await fetchRankings(user.id, stats.totalSeconds);
          return;
        }
      }

      // Fallback to legacy browser computation
      const result = force 
        ? await analyticsCache.invalidate(user.id)
        : await analyticsCache.fetch(user.id);
      
      if (result) {
        setData(result);
        const computed = computeStats(result);
        await fetchRankings(user.id, computed.totalSeconds);
      }
    } catch (err) {
      console.error('DataSync: refresh error', err);
      // Final fallback
      const result = await analyticsCache.fetch(user.id);
      if (result) setData(result);
    } finally {
      setLoading(false);
    }
  }, [user, fetchRankings]);

  // Initial load
  useEffect(() => {
    refresh();

    // Subscribe to cache updates
    const unsub = analyticsCache.subscribe(() => {
      if (user?.id) {
        const cached = analyticsCache.get(user.id);
        if (cached) {
          setData(cached);
        }
      }
    });

    return () => unsub();
  }, [user?.id, refresh]);

  const value = {
    stats,
    tier,
    rankings,
    profile: data?.profile || null,
    streakDates,
    deadlines: data?.deadlines || [],
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
