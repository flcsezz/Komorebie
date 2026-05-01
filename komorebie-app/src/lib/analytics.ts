import { supabase } from './supabase';

export interface FocusSessionData {
  profile_id: string;
  task_id?: string | null;
  duration_seconds: number;
  elapsed_seconds?: number;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
}

export const logFocusSession = async (session: FocusSessionData) => {
  try {
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert([
        {
          profile_id: session.profile_id,
          task_id: session.task_id,
          duration_seconds: session.duration_seconds,
          elapsed_seconds: session.elapsed_seconds || session.duration_seconds,
          status: session.status,
          started_at: session.started_at,
          ended_at: new Date().toISOString(),
        }
      ])
      .select();

    if (error) throw error;

    // Update streaks if the session was completed
    if (session.status === 'completed') {
      await updateStreak(session.profile_id, session.elapsed_seconds || session.duration_seconds);
    }

    return data;
  } catch (error) {
    console.error('Error logging focus session:', error);
    return null;
  }
};

const updateStreak = async (profileId: string, seconds: number) => {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Attempt to get existing streak for today
    const { data: existing, error: fetchError } = await supabase
      .from('streaks')
      .select('*')
      .eq('profile_id', profileId)
      .eq('focus_date', today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows found"
      throw fetchError;
    }

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('streaks')
        .update({
          total_focus_seconds: (existing.total_focus_seconds || 0) + seconds,
          sessions_count: (existing.sessions_count || 0) + 1
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // Create new record for today
      const { error: insertError } = await supabase
        .from('streaks')
        .insert([
          {
            profile_id: profileId,
            focus_date: today,
            total_focus_seconds: seconds,
            sessions_count: 1
          }
        ]);

      if (insertError) throw insertError;
    }
    
    // Also update profile mana_points
    await updateProfileMana(profileId, Math.floor(seconds / 60));

  } catch (error) {
    console.error('Error updating streak:', error);
  }
};

const updateProfileMana = async (profileId: string, manaToAdd: number) => {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('mana_points')
      .eq('id', profileId)
      .single();
    
    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        mana_points: (profile.mana_points || 0) + manaToAdd,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating profile mana:', error);
  }
};
