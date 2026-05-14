import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchHabits,
  fetchHabitLogs,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitLog,
  calculateStreak,
  type Habit,
  type HabitLog,
} from '../lib/habits';
import { format, subDays } from 'date-fns';

interface HabitWithStreak extends Habit {
  currentStreak: number;
  bestStreak: number;
}

export const useHabits = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() =>
    format(new Date(), 'yyyy-MM-dd')
  );

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Is the selected date editable? (today or yesterday only)
  const isEditable = selectedDate === todayStr || selectedDate === yesterdayStr;
  const isGracePeriod = selectedDate === yesterdayStr;

  // We fetch logs for a wider range so we can compute streaks
  const logsRangeRef = useRef({ start: '', end: '' });

  const refresh = useCallback(async (showLoader = true) => {
    if (!user) return;
    if (showLoader) setLoading(true);
    setError(null);

    try {
      // Fetch habits
      const habitsData = await fetchHabits(user.id);

      // Fetch logs for last 90 days (for streak calculation)
      const rangeEnd = todayStr;
      const rangeStart = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      logsRangeRef.current = { start: rangeStart, end: rangeEnd };

      const logsData = await fetchHabitLogs(user.id, rangeStart, rangeEnd);
      setLogs(logsData);

      // Attach streak info to each habit
      const habitsWithStreaks: HabitWithStreak[] = habitsData.map(h => {
        const streak = calculateStreak(h.id, logsData, todayStr);
        return { ...h, currentStreak: streak.current, bestStreak: streak.best };
      });

      setHabits(habitsWithStreaks);
    } catch (err: any) {
      console.error('useHabits refresh error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, todayStr]);

  useEffect(() => {
    refresh(true);
  }, [refresh]);

  // Check if a habit is completed for a specific date
  const isCompleted = useCallback(
    (habitId: string, date: string): boolean => {
      return logs.some(
        l => l.habit_id === habitId && l.log_date === date && l.is_completed
      );
    },
    [logs]
  );

  // Get completion count for a given date
  const getCompletionCount = useCallback(
    (date: string): { completed: number; total: number } => {
      const total = habits.length;
      const completed = habits.filter(h =>
        logs.some(l => l.habit_id === h.id && l.log_date === date && l.is_completed)
      ).length;
      return { completed, total };
    },
    [habits, logs]
  );

  // Toggle a habit for a specific date (optimistic update)
  const toggle = useCallback(
    async (habitId: string, date: string) => {
      if (!user) return;
      
      const isDateEditable = date === todayStr || date === yesterdayStr;
      if (!isDateEditable) return;

      const currentlyCompleted = isCompleted(habitId, date);
      const newState = !currentlyCompleted;

      // Optimistic update
      setLogs(prev => {
        const existing = prev.find(
          l => l.habit_id === habitId && l.log_date === date
        );
        if (existing) {
          return prev.map(l =>
            l.habit_id === habitId && l.log_date === date
              ? { ...l, is_completed: newState }
              : l
          );
        } else {
          // Create a temporary log entry
          return [
            ...prev,
            {
              id: `temp-${Date.now()}`,
              habit_id: habitId,
              user_id: user.id,
              log_date: date,
              is_completed: newState,
              is_frozen: false,
              updated_at: new Date().toISOString(),
            },
          ];
        }
      });

      try {
        await toggleHabitLog({
          habitId,
          userId: user.id,
          logDate: date,
          isCompleted: newState,
        });
        // Re-calculate streaks without showing loader
        refresh(false);
      } catch (err: any) {
        // Revert optimistic update
        setError(err.message);
        refresh(false);
      }
    },
    [user, todayStr, yesterdayStr, isCompleted, refresh]
  );

  const freezeLog = useCallback(async (habitId: string, date: string) => {
    if (!user) return;
    try {
      // Deduct 100 mana (let's say 100 mana per freeze)
      const { data, error: rpcError } = await import('../lib/supabase').then(m => m.supabase.rpc('spend_mana', { amount: 100 }));
      if (rpcError) throw rpcError;
      if (!data) throw new Error("Not enough mana!");

      // Optimistic update
      setLogs(prev => {
        const existing = prev.find(l => l.habit_id === habitId && l.log_date === date);
        if (existing) {
          return prev.map(l => l.habit_id === habitId && l.log_date === date ? { ...l, is_frozen: true } : l);
        } else {
          return [
            ...prev,
            { id: `temp-${Date.now()}`, habit_id: habitId, user_id: user.id, log_date: date, is_completed: false, is_frozen: true, updated_at: new Date().toISOString() }
          ];
        }
      });

      await toggleHabitLog({
        habitId,
        userId: user.id,
        logDate: date,
        isCompleted: false,
        isFrozen: true,
      });
      refresh(false);
    } catch (err: any) {
      setError(err.message);
      refresh(false);
    }
  }, [user, refresh]);

  // Create a new habit
  const addHabit = useCallback(
    async (params: { name: string; description?: string; icon?: string; color?: string; frequency_type?: 'daily'|'specific_days'|'x_per_week'; target_days?: number[]; target_per_week?: number }) => {
      if (!user) return null;
      try {
        const newHabit = await createHabit({ ...params, user_id: user.id });
        const withStreak: HabitWithStreak = { ...newHabit, currentStreak: 0, bestStreak: 0 };
        
        // Use a functional update to be safe
        setHabits(prev => {
          // Check if already added (e.g. by a refresh)
          if (prev.some(h => h.id === newHabit.id)) return prev;
          return [...prev, withStreak];
        });
        
        return newHabit;
      } catch (err: any) {
        console.error('useHabits addHabit error:', err);
        setError(err.message);
        return null;
      }
    },
    [user]
  );

  // Edit an existing habit
  const editHabit = useCallback(
    async (id: string, updates: { name?: string; description?: string; icon?: string; color?: string; frequency_type?: 'daily'|'specific_days'|'x_per_week'; target_days?: number[]; target_per_week?: number }) => {
      try {
        const updated = await updateHabit(id, updates);
        setHabits(prev => prev.map(h => (h.id === id ? { ...h, ...updated } : h)));
        return updated;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    []
  );

  // Remove a habit (cascade deletes logs)
  const removeHabit = useCallback(
    async (id: string) => {
      // Optimistic
      setHabits(prev => prev.filter(h => h.id !== id));
      setLogs(prev => prev.filter(l => l.habit_id !== id));
      try {
        await deleteHabit(id);
      } catch (err: any) {
        setError(err.message);
        refresh();
      }
    },
    [refresh]
  );

  const isFrozen = useCallback(
    (habitId: string, date: string): boolean => {
      return logs.some(
        l => l.habit_id === habitId && l.log_date === date && l.is_frozen
      );
    },
    [logs]
  );

  return {
    habits,
    logs,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    todayStr,
    yesterdayStr,
    isEditable,
    isGracePeriod,
    isCompleted,
    isFrozen,
    getCompletionCount,
    toggle,
    freezeLog,
    addHabit,
    editHabit,
    removeHabit,
    refresh,
  };
};
