import { supabase } from './supabase';

export interface FocusSessionData {
  user_id: string;
  task_id?: string | null;
  duration_seconds: number;
  elapsed_seconds?: number;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
}

const STREAK_THRESHOLD_SECONDS = 300; // 5 minutes minimum to qualify for streak

export const logFocusSession = async (session: FocusSessionData) => {
  try {
    const elapsed = session.elapsed_seconds || session.duration_seconds;
    const isQualified = elapsed >= STREAK_THRESHOLD_SECONDS;

    // Force status to abandoned if session is shorter than 5 minutes
    if (!isQualified) {
      session.status = 'abandoned';
    }

    const { data, error } = await supabase
      .from('focus_sessions')
      .insert([
        {
          user_id: session.user_id,
          task_id: session.task_id,
          duration_seconds: session.duration_seconds,
          elapsed_seconds: elapsed,
          status: session.status,
          started_at: session.started_at,
          ended_at: new Date().toISOString(),
        }
      ])
      .select();

    if (error) {
      console.error('[Analytics] Supabase insert error:', error.message, error.details, error.hint, error.code);
      throw error;
    }

    console.log('[Analytics] Session inserted successfully:', data);

    // ONLY update stats (streaks, mana, daily totals) if the session is qualified (>= 5 mins)
    if (isQualified) {
      await updateStreak(session.user_id, elapsed);
      // Award mana: 1 mana per completed minute
      await updateProfileMana(session.user_id, Math.floor(elapsed / 60));
    }

    return data;
  } catch (error) {
    console.error('[Analytics] Error logging focus session:', error);
    return null;
  }
};

const updateStreak = async (userId: string, seconds: number) => {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Attempt to get existing streak for today
    const { data: existing, error: fetchError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('focus_date', today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows found"
      throw fetchError;
    }

    if (existing) {
      // Update existing record - daily stats only grow if the session is qualified
      const { error: updateError } = await supabase
        .from('streaks')
        .update({
          total_focus_seconds: (existing.total_focus_seconds || 0) + seconds,
          sessions_count: (existing.sessions_count || 0) + 1,
          streak_qualified: true // Since this session is qualified (>= 5 mins)
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // Create new record for today
      const { error: insertError } = await supabase
        .from('streaks')
        .insert([
          {
            user_id: userId,
            focus_date: today,
            total_focus_seconds: seconds,
            sessions_count: 1,
            streak_qualified: true
          }
        ]);

      if (insertError) throw insertError;
    }
    
    // Recalculate current streak & best streak
    await recalculateStreak(userId);

  } catch (error) {
    console.error('Error updating streak:', error);
  }
};

/**
 * Recalculates current streak by walking backward from today
 * Only days with streak_qualified = true count
 */
export const recalculateStreak = async (userId: string) => {
  try {
    const { data: streakDays, error } = await supabase
      .from('streaks')
      .select('focus_date, streak_qualified')
      .eq('user_id', userId)
      .eq('streak_qualified', true)
      .order('focus_date', { ascending: false });

    if (error) throw error;

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (streakDays && streakDays.length > 0) {
      // Check if most recent qualified day is today or yesterday
      const latestDate = new Date(streakDays[0].focus_date + 'T00:00:00');
      const diffDays = Math.floor((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        // Count consecutive days backward
        const expectedDate = new Date(latestDate);
        
        for (const day of streakDays) {
          const dayDate = new Date(day.focus_date + 'T00:00:00');
          const diff = Math.floor((expectedDate.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diff === 0) {
            currentStreak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    // Get current best_streak
    const { data: profile } = await supabase
      .from('profiles')
      .select('best_streak')
      .eq('id', userId)
      .single();

    const bestStreak = Math.max(profile?.best_streak || 0, currentStreak);

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        current_streak: currentStreak,
        best_streak: bestStreak,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return { currentStreak, bestStreak };
  } catch (error) {
    console.error('Error recalculating streak:', error);
    return { currentStreak: 0, bestStreak: 0 };
  }
};

const updateProfileMana = async (userId: string, manaToAdd: number) => {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('mana_points')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        mana_points: (profile.mana_points || 0) + manaToAdd,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating profile mana:', error);
  }
};

// Deadline helpers
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
    // First create a calendar event for the deadline
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

    // Create the deadline with a link to the calendar event
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
  } catch (error) {
    console.error('Error creating deadline:', error);
    return null;
  }
};

export const updateDeadline = async (id: string, updates: Partial<DeadlineData>) => {
  try {
    const { data, error } = await supabase
      .from('deadlines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating deadline:', error);
    return null;
  }
};

export const deleteDeadline = async (id: string) => {
  try {
    // Get the deadline to find linked calendar event
    const { data: deadline } = await supabase
      .from('deadlines')
      .select('calendar_event_id')
      .eq('id', id)
      .single();

    // Delete linked calendar event if exists
    if (deadline?.calendar_event_id) {
      await supabase.from('events').delete().eq('id', deadline.calendar_event_id);
    }

    const { error } = await supabase.from('deadlines').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting deadline:', error);
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
  } catch (error) {
    console.error('Error fetching deadlines:', error);
    return [];
  }
};
