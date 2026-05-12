import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getTierForSeconds, type TierConfig, type TierKey, ADMIN_OVERRIDE_KEY } from '../lib/leagues';

export type TimeRange = 'weekly' | 'monthly' | 'alltime';
export type LeagueFilter = 'global' | 'league';

export interface LeaderboardUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  current_streak: number;
  total_focus_seconds: number;
  rank: number;
  /** Weekly focus seconds — always fetched separately for tier computation */
  weekly_focus_seconds: number;
  tier: TierConfig;
}

export interface HallOfFameUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  total_focus_seconds: number;
  tier: TierConfig;
}

interface UseLeaderboardReturn {
  leaderboard: LeaderboardUser[];
  filteredLeaderboard: LeaderboardUser[];
  champions: HallOfFameUser[];
  loading: boolean;
  error: string | null;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  leagueFilter: LeagueFilter;
  setLeagueFilter: (filter: LeagueFilter) => void;
  currentUserEntry: LeaderboardUser | null;
  currentUserTier: TierConfig;
  currentUserWeeklySeconds: number;
  leagueUserCount: number;
  currentUserLeagueRank: number | null;
  retry: () => void;
}

const RPC_MAP: Record<TimeRange, string> = {
  weekly: 'get_leaderboard_weekly',
  monthly: 'get_leaderboard_monthly',
  alltime: 'get_leaderboard_all_time',
};

export function useLeaderboard(): UseLeaderboardReturn {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [weeklyDataMap, setWeeklyDataMap] = useState<Record<string, number>>({});
  const [champions, setChampions] = useState<HallOfFameUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>('global');


  // Fetch weekly data for tier computation (always needed regardless of tab)
  const fetchWeeklyData = useCallback(async (): Promise<Record<string, number>> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_leaderboard_weekly');
      if (rpcError) throw rpcError;

      const map: Record<string, number> = {};
      (data || []).forEach((u: any) => {
        map[u.id] = Number(u.total_focus_seconds) || 0;
      });
      return map;
    } catch {
      // Fallback: query streaks directly for current week
      const weekStart = new Date();
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);

      const { data: streaks } = await supabase
        .from('streaks')
        .select('user_id, total_focus_seconds')
        .gte('focus_date', weekStart.toISOString().split('T')[0]);

      const map: Record<string, number> = {};
      (streaks || []).forEach((s: any) => {
        map[s.user_id] = (map[s.user_id] || 0) + (Number(s.total_focus_seconds) || 0);
      });
      return map;
    }
  }, []);

  // Fetch champions
  const fetchChampions = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_previous_week_champions');
      if (rpcError) throw rpcError;

      return (data || []).map((u: any) => ({
        ...u,
        total_focus_seconds: Number(u.total_focus_seconds) || 0,
        tier: getTierForSeconds(Number(u.total_focus_seconds) || 0),
      }));
    } catch {
      return [];
    }
  }, []);

  // Main fetch
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch the selected time range data and weekly data in parallel
      const [rangeResult, weeklyMap, championsData] = await Promise.all([
        supabase.rpc(RPC_MAP[timeRange]),
        timeRange !== 'weekly' ? fetchWeeklyData() : Promise.resolve(null),
        fetchChampions(),
      ]);

      if (rangeResult.error) throw rangeResult.error;

      const rangeData = rangeResult.data || [];

      // If we're on the weekly tab, use the range data for both
      let finalWeeklyMap: Record<string, number>;
      if (timeRange === 'weekly') {
        finalWeeklyMap = {};
        rangeData.forEach((u: any) => {
          finalWeeklyMap[u.id] = Number(u.total_focus_seconds) || 0;
        });
      } else {
        finalWeeklyMap = weeklyMap || {};
      }

      setWeeklyDataMap(finalWeeklyMap);

      const overrideKey = typeof window !== 'undefined' ? localStorage.getItem(ADMIN_OVERRIDE_KEY) as TierKey : null;

      const users: LeaderboardUser[] = rangeData.map((u: any, i: number) => {
        const weeklySeconds = finalWeeklyMap[u.id] || 0;
        const isMe = user?.id === u.id;
        return {
          id: u.id,
          username: u.username || 'anonymous',
          display_name: u.display_name || u.username || 'Anonymous',
          avatar_url: u.avatar_url || '',
          current_streak: u.current_streak || 0,
          total_focus_seconds: Number(u.total_focus_seconds) || 0,
          rank: i + 1,
          weekly_focus_seconds: weeklySeconds,
          tier: getTierForSeconds(weeklySeconds, isMe ? overrideKey : null),
        };
      });

      setLeaderboard(users);
      setChampions(championsData);
    } catch (err: any) {
      console.error('[Leaderboard] Fetch error:', err);
      setError(err.message || 'Failed to load leaderboard');

      // Fallback: try loading from profiles + streaks directly
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, current_streak, mana_points')
          .not('username', 'is', null)
          .order('mana_points', { ascending: false })
          .limit(50);

        if (profiles) {
          const wMap = await fetchWeeklyData();
          setWeeklyDataMap(wMap);

          const users: LeaderboardUser[] = profiles.map((u: any, i: number) => {
            const weeklySeconds = wMap[u.id] || 0;
            return {
              ...u,
              total_focus_seconds: (u.mana_points || 0) * 60,
              rank: i + 1,
              weekly_focus_seconds: weeklySeconds,
              tier: getTierForSeconds(weeklySeconds),
            };
          });
          setLeaderboard(users);
          setError(null);
        }
      } catch (fallbackErr) {
        console.error('[Leaderboard] Fallback also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, [timeRange, user?.id, fetchWeeklyData, fetchChampions]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Current user's tier (always from weekly data)
  const currentUserWeeklySeconds = useMemo(() => {
    if (!user) return 0;
    return weeklyDataMap[user.id] || 0;
  }, [user, weeklyDataMap]);

  const currentUserTier = useMemo(() => {
    const overrideKey = typeof window !== 'undefined' ? localStorage.getItem(ADMIN_OVERRIDE_KEY) as TierKey : null;
    return getTierForSeconds(currentUserWeeklySeconds, overrideKey);
  }, [currentUserWeeklySeconds]);

  // Current user's entry in the leaderboard
  const currentUserEntry = useMemo(() => {
    if (!user) return null;
    return leaderboard.find(u => u.id === user.id) || null;
  }, [user, leaderboard]);

  // Filtered leaderboard (league filter)
  const filteredLeaderboard = useMemo(() => {
    let result = leaderboard;

    // League filter
    if (leagueFilter === 'league') {
      result = result.filter(u => u.tier.key === currentUserTier.key);
    }

    // Re-rank after filtering
    return result.map((u, i) => ({ ...u, rank: i + 1 }));
  }, [leaderboard, leagueFilter, currentUserTier]);

  // League-specific stats
  const leagueUserCount = useMemo(() => {
    return leaderboard.filter(u => u.tier.key === currentUserTier.key).length;
  }, [leaderboard, currentUserTier]);

  const currentUserLeagueRank = useMemo(() => {
    if (!user) return null;
    const leagueUsers = leaderboard
      .filter(u => u.tier.key === currentUserTier.key)
      .sort((a, b) => b.total_focus_seconds - a.total_focus_seconds);
    const idx = leagueUsers.findIndex(u => u.id === user.id);
    return idx >= 0 ? idx + 1 : null;
  }, [user, leaderboard, currentUserTier]);

  return {
    leaderboard,
    filteredLeaderboard,
    champions,
    loading,
    error,
    timeRange,
    setTimeRange,
    leagueFilter,
    setLeagueFilter,
    currentUserEntry,
    currentUserTier,
    currentUserWeeklySeconds,
    leagueUserCount,
    currentUserLeagueRank,
    retry: fetchLeaderboard,
  };
}
