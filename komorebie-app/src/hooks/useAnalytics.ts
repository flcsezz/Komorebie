import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  analyticsCache,
  computeStats,
  buildStreakDates,
  type CachedAnalytics,
} from '../lib/analyticsCache';

export interface DeadlineItem {
  id: string;
  user_id: string;
  title: string;
  deadline_date: string;
  description?: string;
  color?: string;
  is_completed: boolean;
  calendar_event_id?: string;
  created_at: string;
}

export const useAnalytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CachedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Fetch data through the cache layer
  const fetchData = useCallback(async (force = false) => {
    if (!user) return;

    setLoading(true);
    try {
      const result = force
        ? await analyticsCache.invalidate(user.id)
        : await analyticsCache.fetch(user.id);

      if (mountedRef.current && result) {
        setData(result);
      }
    } catch (err) {
      console.error('useAnalytics: fetch error', err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  // Initial fetch + subscribe to cache invalidation
  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    // Subscribe to cache updates (e.g. from other components calling invalidate)
    const unsub = analyticsCache.subscribe(() => {
      if (user) {
        const cached = analyticsCache.get(user.id);
        if (cached) {
          setData(cached);
        }
      }
    });

    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, [fetchData, user]);

  // Compute derived statistics
  const stats = useMemo(() => {
    if (!data) {
      return {
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
        weeklyData: [] as { date: string; day: string; focusSeconds: number; sessionsCount: number; tasksDone: number }[],
        weekHours: 0,
      };
    }
    return computeStats(data);
  }, [data]);

  // Build streak calendar map
  const streakDates = useMemo(() => {
    if (!data) return new Map();
    return buildStreakDates(data.streaks);
  }, [data]);

  // Deadlines (from cached data)
  const deadlines = useMemo<DeadlineItem[]>(() => {
    return (data?.deadlines || []) as DeadlineItem[];
  }, [data]);

  // Force refresh - invalidates cache and refetches
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return {
    profile: data?.profile || null,
    sessions: data?.sessions || [],
    streaks: data?.streaks || [],
    streakDates,
    deadlines,
    stats,
    loading,
    refresh,
  };
};
