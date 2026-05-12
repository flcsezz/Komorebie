import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Filter, RefreshCw, ChevronDown } from 'lucide-react';
import PageTransition from '../components/ui/PageTransition';
import ZenLoader from '../components/ui/ZenLoader';
import { useAuth } from '../context/AuthContext';
import { useLeaderboard, type TimeRange, type LeagueFilter } from '../hooks/useLeaderboard';
import { useLeaderboardPresence } from '../hooks/useLeaderboardPresence';
import { useDataSync } from '../context/DataSyncContext';
import LeagueHeader from '../components/leaderboard/LeagueHeader';
import HallOfFame from '../components/leaderboard/HallOfFame';
import PodiumCard from '../components/leaderboard/PodiumCard';
import LeaderboardRow from '../components/leaderboard/LeaderboardRow';

const TIME_RANGE_OPTIONS: { key: TimeRange; label: string }[] = [
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'alltime', label: 'All Time' },
];

const LEAGUE_FILTER_OPTIONS: { key: LeagueFilter; label: string }[] = [
  { key: 'global', label: 'Global' },
  { key: 'league', label: 'Your League' },
];

const INITIAL_VISIBLE_COUNT = 20;

const LeaderboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const {
    tier: syncTier,
    stats: syncStats,
    rankings: syncRankings,
  } = useDataSync();

  const {
    filteredLeaderboard,
    champions,
    loading,
    error,
    timeRange,
    setTimeRange,
    leagueFilter,
    setLeagueFilter,
    currentUserTier: lbTier,
    currentUserWeeklySeconds: lbWeeklySeconds,
    leagueUserCount,
    currentUserLeagueRank,
    retry,
  } = useLeaderboard();

  // Use synchronized data for the header if available (weekly), fallback to LB hook for other ranges
  const displayTier = timeRange === 'weekly' ? syncTier : lbTier;
  const displayWeeklySeconds = timeRange === 'weekly' ? syncStats.weekSeconds : lbWeeklySeconds;
  
  // For rank, DataSync only has weekly. If we are on weekly, use syncRankings.
  const displayRank = (timeRange === 'weekly') 
    ? (leagueFilter === 'global' ? syncRankings.globalRank : syncRankings.leagueRank) || currentUserLeagueRank
    : currentUserLeagueRank;

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // Get all visible user IDs for presence tracking
  const visibleUserIds = useMemo(
    () => filteredLeaderboard.map(u => u.id),
    [filteredLeaderboard]
  );
  const { isFocusing } = useLeaderboardPresence(visibleUserIds);

  const topThree = filteredLeaderboard.slice(0, 3);
  const restOfUsers = filteredLeaderboard.slice(3);
  const visibleRestOfUsers = restOfUsers.slice(0, visibleCount - 3);

  const hasMore = restOfUsers.length > visibleRestOfUsers.length;

  const handleShowMore = () => {
    setVisibleCount(prev => Math.min(prev + 20, 100));
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="space-y-1 text-center md:text-left">
            <h1 className="text-4xl font-display font-light tracking-tight text-white flex items-center gap-3 justify-center md:justify-start">
              <Trophy className="w-8 h-8 text-amber-300/80" />
              Leaderboard
            </h1>
            <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em]">
              The rhythm of the community
            </p>
          </div>

          {/* Time Range Tabs */}
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
            {TIME_RANGE_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => {
                  setTimeRange(opt.key);
                  setVisibleCount(INITIAL_VISIBLE_COUNT);
                }}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                  timeRange === opt.key
                    ? 'bg-sage-200 text-slate-950 shadow-lg shadow-sage-200/20'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* League Header Banner */}
        {currentUser && (
          <div className="mb-6">
            <LeagueHeader
              tier={displayTier}
              weeklySeconds={displayWeeklySeconds}
              leagueUserCount={leagueUserCount}
              leagueRank={displayRank}
            />
          </div>
        )}

        {/* League Filter Toggle */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex bg-white/[0.03] p-0.5 rounded-xl border border-white/[0.06]">
            {LEAGUE_FILTER_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => {
                  setLeagueFilter(opt.key);
                  setVisibleCount(INITIAL_VISIBLE_COUNT);
                }}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                  leagueFilter === opt.key
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {error && (
            <button
              onClick={retry}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400/60 hover:text-amber-400 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>

        {loading ? (
          <div className="h-[60vh] flex items-center justify-center">
            <ZenLoader />
          </div>
        ) : (
          <div className="space-y-10">
            {/* Podium */}
            {topThree.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <PodiumCard
                  user={topThree[1]}
                  rank={2}
                  delay={0.1}
                  isCurrentUser={topThree[1]?.id === currentUser?.id}
                  isFocusing={topThree[1] ? isFocusing(topThree[1].id) : false}
                />
                <PodiumCard
                  user={topThree[0]}
                  rank={1}
                  delay={0}
                  isCurrentUser={topThree[0]?.id === currentUser?.id}
                  isFocusing={topThree[0] ? isFocusing(topThree[0].id) : false}
                />
                <PodiumCard
                  user={topThree[2]}
                  rank={3}
                  delay={0.2}
                  isCurrentUser={topThree[2]?.id === currentUser?.id}
                  isFocusing={topThree[2] ? isFocusing(topThree[2].id) : false}
                />
              </div>
            )}

            {/* List */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {visibleRestOfUsers.map((u, idx) => (
                  <LeaderboardRow
                    key={u.id}
                    user={u}
                    index={idx}
                    isCurrentUser={u.id === currentUser?.id}
                    isFocusing={isFocusing(u.id)}
                  />
                ))}
              </AnimatePresence>

              {hasMore && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-6 pb-2 text-center"
                >
                  <button
                    onClick={handleShowMore}
                    className="group px-8 py-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-sage-200/30 transition-all flex items-center gap-2 mx-auto text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-sage-200"
                  >
                    Show More Focused Souls
                    <ChevronDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                  </button>
                </motion.div>
              )}

              {filteredLeaderboard.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                    <Filter className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-white/30 text-sm font-light">
                    {leagueFilter === 'league'
                      ? `No focusers in ${displayTier.icon} ${displayTier.name} league yet.`
                      : 'No focused souls found.'}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Hall of Fame (Moved to bottom) */}
            {timeRange === 'weekly' && champions.length > 0 && (
              <HallOfFame champions={champions} />
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default LeaderboardPage;
