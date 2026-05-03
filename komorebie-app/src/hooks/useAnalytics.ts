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

export const useAnalytics = (targetUserId?: string) => {
  const { user: authUser } = useAuth();
  
  // If targetUserId is explicitly null (not just undefined), it means we're in a loading state
  // and we shouldn't fallback to authUser.
  const userId = targetUserId !== undefined ? targetUserId : authUser?.id;
  
  const [data, setData] = useState<CachedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const lastFetchedUserId = useRef<string | null>(null);

  // Fetch data through the cache layer
  const fetchData = useCallback(async (force = false) => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }

    // If switching users, clear old data first to avoid showing wrong stats
    if (userId !== lastFetchedUserId.current) {
      setData(null);
      setLoading(true);
      lastFetchedUserId.current = userId;
    }

    try {
      const result = force
        ? await analyticsCache.invalidate(userId)
        : await analyticsCache.fetch(userId);

      if (mountedRef.current && result && lastFetchedUserId.current === userId) {
        setData(result);
      }
    } catch (err) {
      console.error('useAnalytics: fetch error', err);
    } finally {
      if (mountedRef.current && lastFetchedUserId.current === userId) {
        setLoading(false);
      }
    }
  }, [userId]);

  // Initial fetch + subscribe to cache invalidation
  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    // Subscribe to cache updates (e.g. from other components calling invalidate)
    const unsub = analyticsCache.subscribe(() => {
      if (userId) {
        const cached = analyticsCache.get(userId);
        if (cached) {
          setData(cached);
        }
      }
    });

    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, [fetchData, userId]);

  // Compute derived statistics
  const stats = useMemo(() => {
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
        weeklyData: [] as { date: string; day: string; focusSeconds: number; sessionsCount: number; tasksDone: number }[],
        weekSeconds: 0,
        weekHours: 0,
      };
    }
    return computeStats(data);
  }, [data]);

  // Build streak calendar map
  const streakDates = useMemo(() => {
    if (!data) return new Map();
    return buildStreakDates(data.streaks, data.tasks);
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
