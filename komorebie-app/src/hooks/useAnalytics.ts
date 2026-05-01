import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const useAnalytics = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
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
        .eq('profile_id', user.id)
        .order('started_at', { ascending: false });

      // Fetch streaks
      const { data: streaksData } = await supabase
        .from('streaks')
        .select('*')
        .eq('profile_id', user.id)
        .order('focus_date', { ascending: false });

      if (profileData) setProfile(profileData);
      if (sessionsData) setSessions(sessionsData);
      if (streaksData) setStreaks(streaksData);
    } catch (err) {
      console.error("Error fetching analytics hook:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const stats = useMemo(() => {
    const totalSeconds = sessions.reduce((acc, s) => acc + (s.elapsed_seconds || 0), 0);
    const totalHours = Math.round(totalSeconds / 3600);
    
    const today = new Date().toISOString().split('T')[0];
    const sessionsToday = sessions.filter(s => 
      new Date(s.started_at).toISOString().split('T')[0] === today
    ).length;

    const tasksDone = sessions.filter(s => s.status === 'completed' && s.task_id).length;

    // Calculate week hours
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const weekSeconds = sessions
      .filter(s => new Date(s.started_at) > lastWeek)
      .reduce((acc, s) => acc + (s.elapsed_seconds || 0), 0);
    const weekHours = Math.round(weekSeconds / 3600);

    // Basic streak calc
    let currentStreak = 0;
    if (streaks.length > 0) {
      // Check if latest is today or yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (streaks[0].focus_date === today || streaks[0].focus_date === yesterdayStr) {
        currentStreak = streaks.length; // Simplified
      }
    }

    return {
      totalHours,
      weekHours,
      totalSessions: sessions.length,
      sessionsToday,
      tasksDone,
      currentStreak,
      mana: profile?.mana_points || 0
    };
  }, [sessions, streaks, profile]);

  return {
    profile,
    sessions,
    streaks,
    stats,
    loading,
    refresh: fetchData
  };
};
