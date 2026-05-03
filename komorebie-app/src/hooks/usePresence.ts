import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useFriends } from './useFriends';

export interface PresenceState {
  user_id: string;
  is_active: boolean;
  started_at: string | null;
  duration_seconds: number;
  pomodoro_state: string;
  is_pomodoro: boolean;
  updated_at: string;
  last_seen: number; // local timestamp
}

export const usePresence = () => {
  const { user } = useAuth();
  const { friends } = useFriends();
  const [presences, setPresences] = useState<Record<string, PresenceState>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || friends.length === 0) {
      setLoading(false);
      return;
    }

    const friendIds = friends.map(f => f.friend.id);

    // Initial fetch
    const fetchPresences = async () => {
      const { data, error } = await supabase
        .from('active_timers')
        .select('*')
        .in('user_id', friendIds);

      if (error) {
        console.error('Error fetching presences:', error);
        return;
      }

      const presenceMap: Record<string, PresenceState> = {};
      data?.forEach(row => {
        presenceMap[row.user_id] = {
          ...row,
          last_seen: Date.now()
        };
      });
      setPresences(presenceMap);
      setLoading(false);
    };

    fetchPresences();

    // Subscribe to changes
    const channel = supabase
      .channel('friend-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_timers',
          filter: `user_id=in.(${friendIds.join(',')})`
        },
        (payload) => {
          if (payload.new) {
            const newPresence = payload.new as any;
            setPresences(prev => ({
              ...prev,
              [newPresence.user_id]: {
                ...newPresence,
                last_seen: Date.now()
              }
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, friends]);

  // Helper to check if a user is "really" online (e.g. updated within last 2 minutes)
  const isOnline = (userId: string) => {
    const presence = presences[userId];
    if (!presence) return false;
    
    // If they are actively focusing, they are "online"
    if (presence.is_active) return true;

    // Otherwise check last update
    const lastUpdate = new Date(presence.updated_at).getTime();
    const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
    return lastUpdate > twoMinutesAgo;
  };

  return { presences, isOnline, loading };
};
