import { supabase } from './supabase';
import { edgeUpdate, edgeFetchAll } from './edge';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;       // Lucide icon name
  color: string;      // Tailwind-friendly color key
  created_at: string;
  frequency_type: 'daily' | 'specific_days' | 'x_per_week';
  target_days: number[] | null; // 0=Sun, 1=Mon, etc.
  target_per_week: number | null;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;   // YYYY-MM-DD
  is_completed: boolean;
  is_frozen: boolean;
  updated_at: string;
}

// ─── Habit CRUD ─────────────────────────────────────────────────────────────

export async function fetchHabits(userId: string): Promise<Habit[]> {
  try {
    const edgeData = await edgeFetchAll() as any[];
    const row = edgeData.find((d: any) => d.data_type === 'habits');
    if (row && row.payload) return row.payload;
  } catch (err) {
    console.error('fetchHabits edge error:', err);
  }

  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createHabit(habit: {
  user_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  frequency_type?: 'daily' | 'specific_days' | 'x_per_week';
  target_days?: number[];
  target_per_week?: number;
}): Promise<Habit> {
  const payload = {
    id: crypto.randomUUID(),
    user_id: habit.user_id,
    name: habit.name,
    description: habit.description || null,
    icon: habit.icon || 'circle-check',
    color: habit.color || 'sage',
    frequency_type: habit.frequency_type || 'daily',
    target_days: habit.target_days || null,
    target_per_week: habit.target_per_week || null,
    created_at: new Date().toISOString()
  };

  await edgeUpdate('habits', payload);
  return payload as Habit;
}

export async function updateHabit(id: string, updates: Partial<Pick<Habit, 'name' | 'description' | 'icon' | 'color'>>): Promise<Habit> {
  const payload = { id, ...updates };
  await edgeUpdate('habits', payload);
  return payload as Habit;
}

export async function deleteHabit(id: string): Promise<void> {
  // habit_logs should be cascade-deleted via FK constraint
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── Habit Logs ─────────────────────────────────────────────────────────────

export async function fetchHabitLogs(userId: string, startDate: string, endDate: string): Promise<HabitLog[]> {
  try {
    const edgeData = await edgeFetchAll() as any[];
    const row = edgeData.find((d: any) => d.data_type === 'habit_logs');
    if (row && row.payload) {
      return row.payload.filter((l: any) => l.log_date >= startDate && l.log_date <= endDate);
    }
  } catch (err) {
    console.error('fetchHabitLogs edge error:', err);
  }

  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', startDate)
    .lte('log_date', endDate);

  if (error) throw error;
  return data || [];
}

export async function toggleHabitLog(params: {
  habitId: string;
  userId: string;
  logDate: string;
  isCompleted: boolean;
  isFrozen?: boolean;
}): Promise<HabitLog> {
  const payload = {
    habit_id: params.habitId,
    user_id: params.userId,
    log_date: params.logDate,
    is_completed: params.isCompleted,
    is_frozen: params.isFrozen || false,
    updated_at: new Date().toISOString(),
  };

  await edgeUpdate('habit_logs', payload);
  return payload as HabitLog;
}

// ─── Streak Calculation (client-side) ───────────────────────────────────────

export function calculateStreak(
  habitId: string,
  logs: HabitLog[],
  todayStr: string
): { current: number; best: number } {
  // Get completed or frozen dates for this habit, sorted descending
  const completedDates = logs
    .filter(l => l.habit_id === habitId && (l.is_completed || l.is_frozen))
    .map(l => l.log_date)
    .sort((a, b) => b.localeCompare(a)); // descending

  if (completedDates.length === 0) return { current: 0, best: 0 };

  // Calculate current streak (must include today or yesterday to be "current")
  let current = 0;
  const today = new Date(todayStr + 'T00:00:00');
  const checkDate = new Date(today);

  // If today isn't completed, start from yesterday (grace period)
  if (!completedDates.includes(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (completedDates.includes(dateStr)) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate best streak
  let best = 0;
  let tempStreak = 1;
  const sortedAsc = [...completedDates].sort();
  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = new Date(sortedAsc[i - 1] + 'T00:00:00');
    const curr = new Date(sortedAsc[i] + 'T00:00:00');
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      tempStreak++;
    } else {
      best = Math.max(best, tempStreak);
      tempStreak = 1;
    }
  }
  best = Math.max(best, tempStreak, current);

  return { current, best };
}
