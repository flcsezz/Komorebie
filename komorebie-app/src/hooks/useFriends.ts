import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getFriends,
  getIncomingRequests,
  getOutgoingRequests,
  getRequestCount,
  searchUsers,
  sendFriendRequest,
  acceptRequest as acceptReq,
  rejectRequest as rejectReq,
  cancelRequest as cancelReq,
  removeFriend as removeFr,
  type PublicProfile,
  type FriendWithProfile,
  type FriendRequest,
} from '../lib/friends';
import { fetchTodayFocusForUsers } from '../lib/analytics';

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [focusTimes, setFocusTimes] = useState<Record<string, number>>({});
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [friendsData, incoming, outgoing, count] = await Promise.all([
        getFriends(user.id),
        getIncomingRequests(user.id),
        getOutgoingRequests(user.id),
        getRequestCount(user.id),
      ]);
        if (mountedRef.current) {
          setFriends(friendsData);
          setIncomingRequests(incoming);
          setOutgoingRequests(outgoing);
          setRequestCount(count);
          
          // Fetch focus times for friends
          const friendIds = friendsData.map(f => f.friend.id);
          if (friendIds.length > 0) {
            const times = await fetchTodayFocusForUsers(friendIds);
            setFocusTimes(prev => ({ ...prev, ...times }));
          }
        }
    } catch (err) {
      console.error('useFriends fetchAll error:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    const init = async () => { await fetchAll(); };
    init();
    return () => { mountedRef.current = false; };
  }, [fetchAll]);

  const handleSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchUsers(query);
      if (mountedRef.current) {
        setSearchResults(results);
        // Fetch focus times for results
        const resultIds = results.map(r => r.id);
        if (resultIds.length > 0) {
          const times = await fetchTodayFocusForUsers(resultIds);
          setFocusTimes(prev => ({ ...prev, ...times }));
        }
      }
    } finally {
      if (mountedRef.current) setSearching(false);
    }
  }, []);

  const sendRequest = useCallback(async (addresseeId: string) => {
    const result = await sendFriendRequest(addresseeId);
    if (result.success) await fetchAll();
    return result;
  }, [fetchAll]);

  const acceptRequest = useCallback(async (id: string) => {
    await acceptReq(id);
    await fetchAll();
  }, [fetchAll]);

  const rejectRequest = useCallback(async (id: string) => {
    await rejectReq(id);
    await fetchAll();
  }, [fetchAll]);

  const cancelRequest = useCallback(async (id: string) => {
    await cancelReq(id);
    await fetchAll();
  }, [fetchAll]);

  const removeFriend = useCallback(async (id: string) => {
    await removeFr(id);
    await fetchAll();
  }, [fetchAll]);

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    requestCount,
    loading,
    searching,
    searchResults,
    focusTimes,
    handleSearch,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriend,
    refresh: fetchAll,
  };
}
