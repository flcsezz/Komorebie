import { supabase } from './supabase';

// ─── Types ──────────────────────────────────────────────────

export interface PublicProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  current_streak: number;
  best_streak: number;
  preferred_bg: string | null;
}

export interface FriendWithProfile {
  friendship_id: string;
  friend: PublicProfile;
  since: string;
}

export interface FriendRequest {
  id: string;
  profile: PublicProfile;
  direction: 'incoming' | 'outgoing';
  created_at: string;
}

// ─── Profile Fields Selection ───────────────────────────────

const PROFILE_SELECT = 'id, username, display_name, avatar_url, current_streak, best_streak, preferred_bg';

// ─── Search ─────────────────────────────────────────────────

export async function searchUsers(query: string): Promise<PublicProfile[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const { data, error } = await supabase.rpc('search_profiles_by_username', {
    query: trimmed,
  });

  if (error) {
    console.error('searchUsers error:', error);
    return [];
  }

  return (data || []) as PublicProfile[];
}

// ─── Friend Requests ────────────────────────────────────────

export async function sendFriendRequest(addresseeId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Check for existing relationship (in either direction)
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'accepted') return { success: false, error: 'Already friends' };
    if (existing.status === 'pending') return { success: false, error: 'Request already pending' };
    if (existing.status === 'blocked') return { success: false, error: 'Unable to send request' };
  }

  const { error } = await supabase.from('friendships').insert({
    requester_id: user.id,
    addressee_id: addresseeId,
    status: 'pending',
  });

  if (error) {
    console.error('sendFriendRequest error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function cancelRequest(friendshipId: string): Promise<void> {
  await supabase.from('friendships').delete().eq('id', friendshipId);
}

export async function acceptRequest(friendshipId: string): Promise<void> {
  await supabase
    .from('friendships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', friendshipId);
}

export async function rejectRequest(friendshipId: string): Promise<void> {
  await supabase.from('friendships').delete().eq('id', friendshipId);
}

// ─── Friends List ───────────────────────────────────────────

export async function getFriends(userId: string): Promise<FriendWithProfile[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      requester_id,
      addressee_id,
      status,
      created_at,
      updated_at,
      requester:profiles!friendships_requester_id_fkey(${PROFILE_SELECT}),
      addressee:profiles!friendships_addressee_id_fkey(${PROFILE_SELECT})
    `)
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error) {
    console.error('getFriends error:', error);
    return [];
  }

  return (data || []).map((row) => {
    const r = row as unknown as { 
      id: string; 
      requester_id: string; 
      addressee_id: string; 
      updated_at: string; 
      created_at: string; 
      requester: PublicProfile; 
      addressee: PublicProfile; 
    };
    const isRequester = r.requester_id === userId;
    const friend = isRequester ? r.addressee : r.requester;
    return {
      friendship_id: r.id,
      friend: friend,
      since: r.updated_at || r.created_at,
    };
  });
}

// ─── Requests ───────────────────────────────────────────────

export async function getIncomingRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      created_at,
      requester:profiles!friendships_requester_id_fkey(${PROFILE_SELECT})
    `)
    .eq('addressee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getIncomingRequests error:', error);
    return [];
  }

  return (data || []).map((row) => {
    const r = row as unknown as { id: string; created_at: string; requester: PublicProfile };
    return {
      id: r.id,
      profile: r.requester,
      direction: 'incoming' as const,
      created_at: r.created_at,
    };
  });
}

export async function getOutgoingRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      created_at,
      addressee:profiles!friendships_addressee_id_fkey(${PROFILE_SELECT})
    `)
    .eq('requester_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getOutgoingRequests error:', error);
    return [];
  }

  return (data || []).map((row) => {
    const r = row as unknown as { id: string; created_at: string; addressee: PublicProfile };
    return {
      id: r.id,
      profile: r.addressee,
      direction: 'outgoing' as const,
      created_at: r.created_at,
    };
  });
}

// ─── Management ─────────────────────────────────────────────

export async function removeFriend(friendshipId: string): Promise<void> {
  await supabase.from('friendships').delete().eq('id', friendshipId);
}

export async function blockUser(friendshipId: string): Promise<void> {
  await supabase
    .from('friendships')
    .update({ status: 'blocked', updated_at: new Date().toISOString() })
    .eq('id', friendshipId);
}

// ─── Counts ─────────────────────────────────────────────────

export async function getRequestCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .eq('addressee_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.error('getRequestCount error:', error);
    return 0;
  }

  return count || 0;
}

// ─── Get Friendship Status With User ────────────────────────

export async function getFriendshipStatus(
  currentUserId: string,
  otherUserId: string
): Promise<{ status: 'none' | 'pending_outgoing' | 'pending_incoming' | 'accepted' | 'blocked'; friendshipId?: string }> {
  const { data, error } = await supabase
    .from('friendships')
    .select('id, status, requester_id')
    .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${currentUserId})`)
    .maybeSingle();

  if (error || !data) return { status: 'none' };

  if (data.status === 'accepted') return { status: 'accepted', friendshipId: data.id };
  if (data.status === 'blocked') return { status: 'blocked', friendshipId: data.id };

  return data.requester_id === currentUserId ? { status: 'pending_outgoing', friendshipId: data.id } : { status: 'pending_incoming', friendshipId: data.id };
}

export async function getProfileByUsername(username: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('getProfileByUsername error:', error);
    return null;
  }
  return data as PublicProfile | null;
}
