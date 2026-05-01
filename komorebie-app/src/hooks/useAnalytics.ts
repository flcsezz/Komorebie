import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { fetchDeadlines } from '../lib/analytics';

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
  const [sessions, setSessions] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Fetch sessions
      const { data: sessionsData } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      // Fetch streaks (all time for heatmap)
      const { data: streaksData } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .order('focus_date', { ascending: false });

      // Fetch deadlines
      const deadlinesData = await fetchDeadlines(user.id);

      if (profileData) setProfile(profileData);
      if (sessionsData) setSessions(sessionsData);
      if (streaksData) setStreaks(streaksData);
      if (deadlinesData) setDeadlines(deadlinesData);
    } catch (err) {
      console.error("Error fetching analytics hook:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const totalSeconds = sessions
      .filter(s => s.status === 'completed')
      .reduce((acc, s) => acc + (s.elapsed_seconds || 0), 0);
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10; // 1 decimal
    const totalMinutes = Math.floor(totalSeconds / 60);
    
    const today = new Date().toISOString().split('T')[0];
    const sessionsToday = sessions.filter(s => 
      new Date(s.started_at).toISOString().split('T')[0] === today
    ).length;

    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const tasksDone = sessions.filter(s => s.status === 'completed' && s.task_id).length;

    // Today's focus time from streaks
    const todayStreak = streaks.find(s => s.focus_date === today);
    const todayFocusSeconds = todayStreak ? todayStreak.total_focus_seconds : 0;

    // Calculate weekly data (last 7 days)
    const weeklyData: { date: string; day: string; seconds: number }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const entry = streaks.find((s: any) => s.focus_date === dateStr);
      weeklyData.push({
        date: dateStr,
        day: dayNames[date.getDay()],
        seconds: entry ? entry.total_focus_seconds : 0
      });
    }

    const weekSeconds = weeklyData.reduce((acc, d) => acc + d.seconds, 0);
    const weekHours = Math.round((weekSeconds / 3600) * 10) / 10;

    // Streak calculation from profile (already calculated server-side)
    const currentStreak = profile?.current_streak || 0;
    const bestStreak = profile?.best_streak || 0;

    return {
      totalHours,
      totalMinutes,
      weekHours,
      totalSessions: completedSessions,
      sessionsToday,
      tasksDone,
      currentStreak,
      bestStreak,
      mana: profile?.mana_points || 0,
      todayFocusSeconds,
      weeklyData,
    };
  }, [sessions, streaks, profile]);

  // Get streak-qualified dates for the heatmap
  const streakDates = useMemo(() => {
    const map = new Map<string, { qualified: boolean; seconds: number; sessions: number }>();
    streaks.forEach((s: any) => {
      map.set(s.focus_date, {
        qualified: s.streak_qualified || false,
        seconds: s.total_focus_seconds || 0,
        sessions: s.sessions_count || 0,
      });
    });
    return map;
  }, [streaks]);

  return {
    profile,
    sessions,
    streaks,
    streakDates,
    deadlines,
    stats,
    loading,
    refresh: fetchData
  };
};
