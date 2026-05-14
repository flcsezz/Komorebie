import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getTierForSeconds, type TierConfig } from '../lib/leagues';

export interface UserRankInfo {
  rank: number;
  timeRange: 'weekly' | 'monthly' | 'alltime';
  totalSeconds: number;
}

export interface UserRankingResult {
  topRankings: UserRankInfo[];
  weeklySeconds: number;
  tier: TierConfig;
  loading: boolean;
}

export function useUserRanking(userId?: string): UserRankingResult {
  const [topRankings, setTopRankings] = useState<UserRankInfo[]>([]);
  const [weeklySeconds, setWeeklySeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchRankings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const [weekly, monthly, alltime] = await Promise.all([
        supabase.rpc('get_leaderboard_weekly').limit(3),
        supabase.rpc('get_leaderboard_monthly').limit(3),
        supabase.rpc('get_leaderboard_all_time').limit(3),
      ]);

      const rankings: UserRankInfo[] = [];
      const check = (data: any[] | null, range: 'weekly' | 'monthly' | 'alltime') => {
        if (!data) return;
        const idx = data.findIndex(u => u.id === userId);
        if (idx >= 0) {
          rankings.push({
            rank: idx + 1,
            timeRange: range,
            totalSeconds: Number(data[idx].total_focus_seconds) || 0,
          });
        }
        // If weekly, also set the weeklySeconds for tier calculation
        if (range === 'weekly') {
          const userEntry = data.find(u => u.id === userId);
          if (userEntry) {
            setWeeklySeconds(Number(userEntry.total_focus_seconds) || 0);
          } else {
            // If not in top 3, we might need to fetch their weekly stats separately
            // But for now let's assume we'll get weeklySeconds from useAnalytics if needed
          }
        }
      };

      check(weekly.data, 'weekly');
      check(monthly.data, 'monthly');
      check(alltime.data, 'alltime');

      setTopRankings(rankings);
    } catch (err) {
      console.error('Error fetching user rankings:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return {
    topRankings,
    weeklySeconds, // Note: this might be 0 if not in top 3, we'll use useAnalytics fallback
    tier: getTierForSeconds(weeklySeconds),
    loading,
  };
}
