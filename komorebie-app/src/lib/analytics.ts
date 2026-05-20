import { supabase } from './supabase';
import { toUTCDate } from './aggregation';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FocusSessionData {
  user_id: string;
  task_id?: string | null;
  duration_seconds: number;
  elapsed_seconds?: number;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
  tag?: string | null;
}

// ─── Session logging ──────────────────────────────────────────────────────────

/**
 * Log a completed focus session using the atomic complete_focus_session RPC.
 *
 * One database round-trip handles:
 *   - Session INSERT (with tag)
 *   - Streak UPSERT (atomic, no lost-update)
 *   - Mana UPDATE   (atomic, no lost-update)
 *   - active_timers deactivation
 *   - Duplicate detection (rate-limit guard)
 *
 * Previously required 3 separate client-side calls with race windows.
 */
export const logFocusSession = async (session: FocusSessionData) => {
  try {
    const elapsed = session.elapsed_seconds ?? session.duration_seconds;

    if (elapsed < 300) {
      console.warn('[Analytics] Session too short (<5 min), not logging.');
      return null;
    }

    const { data, error } = await supabase.rpc('complete_focus_session', {
      p_task_id:       session.task_id ?? null,
      p_duration_secs: session.duration_seconds,
      p_elapsed_secs:  elapsed,
      p_status:        session.status,
      p_started_at:    session.started_at,
      p_tag:           session.tag ?? null,
    });

    if (error) {
      console.error('[Analytics] complete_focus_session RPC error:', error.message);
      throw error;
    }

    if (!data?.success) {
      console.warn('[Analytics] Session rejected by server:', data?.error);
      return null;
    }

    console.log(
      `[Analytics] Session logged atomically. Elapsed: ${data.elapsed_seconds}s, ` +
      `Mana +${data.mana_earned}, Streak: ${data.current_streak}`
    );
    return data;
  } catch (err) {
    console.error('[Analytics] logFocusSession error:', err);
    return null;
  }
};

// ─── Deadline helpers ─────────────────────────────────────────────────────────

export interface DeadlineData {
  id?: string;
  user_id: string;
  title: string;
  deadline_date: string;
  description?: string;
  color?: string;
  is_completed?: boolean;
  calendar_event_id?: string | null;
}

export const createDeadline = async (deadline: DeadlineData) => {
  try {
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .insert([{
        user_id: deadline.user_id,
        title: `📌 ${deadline.title}`,
        notes: deadline.description || 'Deadline',
        date: deadline.deadline_date,
        start_time: '09:00',
        end_time: '10:00',
        color: deadline.color || 'amber'
      }])
      .select()
      .single();

    if (eventError) throw eventError;

    const { data, error } = await supabase
      .from('deadlines')
      .insert([{
        user_id: deadline.user_id,
        title: deadline.title,
        deadline_date: deadline.deadline_date,
        description: deadline.description,
        color: deadline.color || 'amber',
        calendar_event_id: eventData?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Analytics] createDeadline error:', err);
    return null;
  }
};

export const updateDeadline = async (id: string, updates: Partial<DeadlineData>) => {
  try {
    const { data, error } = await supabase
      .from('deadlines').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Analytics] updateDeadline error:', err);
    return null;
  }
};

export const deleteDeadline = async (id: string) => {
  try {
    const { data: deadline } = await supabase
      .from('deadlines').select('calendar_event_id').eq('id', id).single();
    if (deadline?.calendar_event_id) {
      await supabase.from('events').delete().eq('id', deadline.calendar_event_id);
    }
    const { error } = await supabase.from('deadlines').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Analytics] deleteDeadline error:', err);
    return false;
  }
};

export const fetchDeadlines = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('deadlines')
      .select('*')
      .eq('user_id', userId)
      .order('deadline_date', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[Analytics] fetchDeadlines error:', err);
    return [];
  }
};

// ─── Leaderboard helpers (social) ────────────────────────────────────────────

export const fetchTodayFocusForUsers = async (userIds: string[]) => {
  if (!userIds?.length) return {};
  const today = toUTCDate(new Date());
  try {
    const { data, error } = await supabase
      .from('streaks')
      .select('user_id, total_focus_seconds')
      .in('user_id', userIds)
      .eq('focus_date', today);
    if (error) throw error;
    return (data || []).reduce((acc: Record<string, number>, curr) => {
      acc[curr.user_id] = curr.total_focus_seconds;
      return acc;
    }, {});
  } catch (err) {
    console.error('[Analytics] fetchTodayFocusForUsers error:', err);
    return {};
  }
};

export const fetchWeeklyFocusForUsers = async (userIds: string[]) => {
  if (!userIds?.length) return {};
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  const lastWeekStr = d.toISOString().split('T')[0];
  try {
    const { data, error } = await supabase
      .from('streaks')
      .select('user_id, total_focus_seconds')
      .in('user_id', userIds)
      .gte('focus_date', lastWeekStr);
    if (error) throw error;
    return (data || []).reduce((acc: Record<string, number>, curr) => {
      acc[curr.user_id] = (acc[curr.user_id] || 0) + curr.total_focus_seconds;
      return acc;
    }, {});
  } catch (err) {
    console.error('[Analytics] fetchWeeklyFocusForUsers error:', err);
    return {};
  }
};

// ─── Tag analytics (legacy / external callers only) ──────────────────────────
// TagAnalyticsWidget now reads from DataSyncContext.tagData (pre-computed).
// This is only retained for callers that may still invoke it directly.

export interface TagAnalyticData {
  tag: string;
  total_seconds: number;
  session_count: number;
}

/** @deprecated Use useDataSync().tagData — no independent Supabase call needed. */
export const fetchTagAnalytics = async (
  userId: string,
  range: 'today' | 'all' = 'all'
): Promise<TagAnalyticData[]> => {
  try {
    let query = supabase
      .from('focus_sessions')
      .select('tag, elapsed_seconds, started_at, status')
      .eq('user_id', userId)
      .gte('elapsed_seconds', 300);

    if (range === 'today') {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      query = query.gte('started_at', todayStart.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    const agg: Record<string, { total_seconds: number; session_count: number }> = {};
    for (const s of (data || [])) {
      const tag = s.tag || 'Untagged';
      if (!agg[tag]) agg[tag] = { total_seconds: 0, session_count: 0 };
      agg[tag].total_seconds += s.elapsed_seconds ?? 0;
      agg[tag].session_count += 1;
    }

    return Object.entries(agg)
      .map(([tag, v]) => ({ tag, total_seconds: v.total_seconds, session_count: v.session_count }))
      .sort((a, b) => b.total_seconds - a.total_seconds);
  } catch (err) {
    console.error('[Analytics] fetchTagAnalytics error:', err);
    return [];
  }
};
