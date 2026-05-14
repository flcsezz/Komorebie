import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Tracks which leaderboard users are currently in a focus session.
 * Unlike `usePresence` (friends only), this hook works with arbitrary user IDs.
 * 
 * Queries the `active_timers` table and subscribes to realtime changes.
 */
export function useLeaderboardPresence(userIds: string[]) {
  const [focusingUsers, setFocusingUsers] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userIds.length) {
      setFocusingUsers(new Set());
      return;
    }

    // Deduplicate and limit to avoid huge queries
    const ids = [...new Set(userIds)].slice(0, 100);

    // Initial fetch
    const fetchPresences = async () => {
      try {
        const { data, error } = await supabase
          .from('active_timers')
          .select('user_id, is_active')
          .in('user_id', ids)
          .eq('is_active', true);

        if (error) {
          console.error('[LeaderboardPresence] Fetch error:', error);
          return;
        }

        const active = new Set<string>();
        (data || []).forEach(row => {
          if (row.is_active) active.add(row.user_id);
        });
        setFocusingUsers(active);
      } catch (err) {
        console.error('[LeaderboardPresence] Error:', err);
      }
    };

    fetchPresences();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('leaderboard-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_timers',
        },
        (payload) => {
          const row = (payload.new || payload.old) as any;
          if (!row?.user_id || !ids.includes(row.user_id)) return;

          if (payload.eventType === 'DELETE') {
            setFocusingUsers(prev => {
              const next = new Set(prev);
              next.delete(row.user_id);
              return next;
            });
          } else {
            setFocusingUsers(prev => {
              const next = new Set(prev);
              if (row.is_active) {
                next.add(row.user_id);
              } else {
                next.delete(row.user_id);
              }
              return next;
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const isFocusing = (userId: string) => focusingUsers.has(userId);

  return { focusingUsers, isFocusing };
}
