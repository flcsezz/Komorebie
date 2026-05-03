import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Inbox, Search, Loader2, X
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import FriendCard from '../components/friends/FriendCard';
import FriendRequestCard from '../components/friends/FriendRequestCard';
import UserSearchCard from '../components/friends/UserSearchCard';
import { useFriends } from '../hooks/useFriends';
import { type FriendWithProfile, type FriendRequest } from '../lib/friends';

// ─── Tab Types ──────────────────────────────────────────────

type Tab = 'friends' | 'requests' | 'search';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'friends', label: 'My Friends', icon: Users },
  { id: 'requests', label: 'Requests', icon: Inbox },
  { id: 'search', label: 'Find Friends', icon: Search },
];

// Profile Drawer removed in favor of full page

// ─── Empty States ───────────────────────────────────────────

const EmptyState: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string; action?: React.ReactNode }> = ({
  icon: Icon, title, subtitle, action,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="flex flex-col items-center justify-center py-16 text-center"
  >
    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
      <Icon className="w-7 h-7 text-white/15" />
    </div>
    <h3 className="text-base font-display font-light text-white/50 mb-1.5">{title}</h3>
    <p className="text-[11px] text-white/20 max-w-xs leading-relaxed">{subtitle}</p>
    {action && <div className="mt-5">{action}</div>}
  </motion.div>
);

// ─── Main Page ──────────────────────────────────────────────

const FriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    friends, incomingRequests, outgoingRequests, requestCount,
    loading, searching, searchResults, focusTimes,
    handleSearch, sendRequest, acceptRequest, rejectRequest, cancelRequest, removeFriend,
  } = useFriends();

  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const onSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 350);
  }, [handleSearch]);

  // Relationship lookup sets for search results
  const friendIds = useMemo(() => new Set(friends.map(f => f.friend.id)), [friends]);
  const pendingIds = useMemo(() => {
    const ids = new Set<string>();
    outgoingRequests.forEach(r => ids.add(r.profile.id));
    incomingRequests.forEach(r => ids.add(r.profile.id));
    return ids;
  }, [outgoingRequests, incomingRequests]);

  const totalRequests = incomingRequests.length + outgoingRequests.length;

  return (
    <>
      <div className="min-h-full max-w-3xl mx-auto pt-4 pb-20 px-4">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-light tracking-tight text-white">Friends</h1>
              <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mt-1 font-bold">
                {friends.length} {friends.length === 1 ? 'friend' : 'friends'} in your sanctuary
              </p>
            </div>

            {/* Quick add button */}
            <button
              onClick={() => setActiveTab('search')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sage-200/10 border border-sage-200/20 text-sage-200 hover:bg-sage-200/20 transition-all text-[10px] uppercase tracking-widest font-bold cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <GlassCard variant="icy" className="p-1.5 inline-flex gap-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const hasNotification = tab.id === 'requests' && requestCount > 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] uppercase tracking-[0.15em] font-bold transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white border border-white/10'
                      : 'text-white/30 hover:text-white/60 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}

                  {/* Notification badge */}
                  {hasNotification && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-4 h-4 rounded-full bg-sage-200 text-slate-950 text-[8px] font-black flex items-center justify-center ml-0.5"
                    >
                      {requestCount}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </GlassCard>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <Loader2 className="w-6 h-6 text-sage-200/40 animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* ──── My Friends ──── */}
              {activeTab === 'friends' && (
                <>
                  {friends.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="Your sanctuary is quiet"
                      subtitle="Find friends to share the calm. Focus together, grow together."
                      action={
                        <button
                          onClick={() => setActiveTab('search')}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sage-200 text-slate-950 hover:bg-sage-300 transition-all font-bold text-xs cursor-pointer shadow-[0_0_20px_rgba(183,201,176,0.2)]"
                        >
                          <Search className="w-3.5 h-3.5" />
                          Find Friends
                        </button>
                      }
                    />
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <AnimatePresence>
                        {friends.map((f) => (
                          <FriendCard
                            key={f.friendship_id}
                            friendship={f}
                            todayFocusSeconds={focusTimes[f.friend.id] || 0}
                            onRemove={removeFriend}
                            onViewProfile={(f: FriendWithProfile) => navigate(`/app/friends/${f.friend.username}`)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}

              {/* ──── Requests ──── */}
              {activeTab === 'requests' && (
                <>
                  {totalRequests === 0 ? (
                    <EmptyState
                      icon={Inbox}
                      title="No pending requests"
                      subtitle="When someone sends you a friend request, it'll appear here."
                    />
                  ) : (
                    <div className="space-y-6">
                      {/* Incoming */}
                      {incomingRequests.length > 0 && (
                        <div>
                          <h3 className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-bold mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-sage-200" />
                            Incoming
                            <span className="text-sage-200/50">{incomingRequests.length}</span>
                          </h3>
                          <div className="space-y-2">
                            <AnimatePresence>
                              {incomingRequests.map((r: FriendRequest) => (
                                <FriendRequestCard
                                  key={r.id}
                                  request={r}
                                  onAccept={acceptRequest}
                                  onReject={rejectRequest}
                                />
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}

                      {/* Outgoing */}
                      {outgoingRequests.length > 0 && (
                        <div>
                          <h3 className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-bold mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40" />
                            Outgoing
                            <span className="text-amber-400/30">{outgoingRequests.length}</span>
                          </h3>
                          <div className="space-y-2">
                            <AnimatePresence>
                              {outgoingRequests.map((r: FriendRequest) => (
                                <FriendRequestCard
                                  key={r.id}
                                  request={r}
                                  onCancel={cancelRequest}
                                />
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ──── Find Friends ──── */}
              {activeTab === 'search' && (
                <div className="space-y-4">
                  {/* Search Input */}
                  <GlassCard variant="frosted" className="p-1.5">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-sm font-mono">@</div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search by username or display name..."
                        className="w-full bg-transparent pl-9 pr-10 py-3 text-sm text-white placeholder-white/15 focus:outline-none outline-none ring-0 font-display font-light tracking-wide"
                        autoFocus
                      />
                      {searching ? (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-200/40 animate-spin" />
                      ) : searchQuery && (
                        <button
                          onClick={() => { setSearchQuery(''); handleSearch(''); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </GlassCard>

                  {/* Safety note */}
                  <p className="text-[9px] text-white/10 uppercase tracking-widest text-center font-bold">
                    Type at least 2 characters to search • Max 20 results
                  </p>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
                        {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <AnimatePresence>
                          {searchResults.map((profile) => (
                            <UserSearchCard
                              key={profile.id}
                              profile={profile}
                              friendIds={friendIds}
                              pendingIds={pendingIds}
                              onSendRequest={sendRequest}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}

                  {/* No results state */}
                  {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                    <EmptyState
                      icon={Search}
                      title="No explorers found"
                      subtitle={`No users match "${searchQuery}". Try a different username.`}
                    />
                  )}

                  {/* Initial state */}
                  {searchQuery.length < 2 && !searching && (
                    <EmptyState
                      icon={Search}
                      title="Find your focus partners"
                      subtitle="Search by username or display name to connect with other explorers."
                    />
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </>
  );
};

export default FriendsPage;
