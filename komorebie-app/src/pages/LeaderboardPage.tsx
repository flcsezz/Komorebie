import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Clock, 
  Zap, 
  Medal,
  Crown,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import GlassCard from '../components/ui/GlassCard';
import PageTransition from '../components/ui/PageTransition';
import { useAuth } from '../context/AuthContext';
import ZenLoader from '../components/ui/ZenLoader';

interface LeaderboardUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  total_focus_seconds: number;
  current_streak: number;
  rank?: number;
}

const LeaderboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'7days' | 'alltime'>('7days');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'alltime') {
        // Simple query for all-time stats from profiles
        const { error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, current_streak')
          .order('mana_points', { ascending: false })
          .limit(50);

        if (error) throw error;

        // Note: For all-time we might want a different metric than mana_points if available, 
        // but current schema uses mana for progression.
        // Let's use mana_points as a proxy for total focus time if we don't have a direct total_focus_seconds in profiles.
        // Wait, looking at the schema, streaks table has total_focus_seconds.
        
        // Let's get total focus seconds per user
        const { data: totalStats, error: statsError } = await supabase
          .rpc('get_leaderboard_all_time');

        if (statsError) {
          // Fallback if RPC doesn't exist
          const { data: fallbackData } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, current_streak, mana_points')
            .order('mana_points', { ascending: false })
            .limit(50);
            
          setLeaderboard(fallbackData?.map((u, i) => ({
            ...u,
            total_focus_seconds: (u.mana_points as number) * 60, // Rough estimate
            rank: i + 1
          })) || []);
        } else {
          setLeaderboard(totalStats.map((u: any, i: number) => ({ ...u, rank: i + 1 })));
        }
      } else {
        // 7 Days leaderboard
        const { data: weeklyStats, error: weeklyError } = await supabase
          .rpc('get_leaderboard_7_days');

        if (weeklyError) {
          // Fallback manual calculation if RPC missing
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const { data: streaks } = await supabase
            .from('streaks')
            .select('user_id, total_focus_seconds')
            .gte('focus_date', sevenDaysAgo.toISOString().split('T')[0]);

          const aggregated: Record<string, number> = {};
          streaks?.forEach(s => {
            aggregated[s.user_id] = (aggregated[s.user_id] || 0) + s.total_focus_seconds;
          });

          const userIds = Object.keys(aggregated);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, current_streak')
            .in('id', userIds);

          const result = profiles?.map(p => ({
            ...p,
            total_focus_seconds: aggregated[p.id] || 0
          })).sort((a, b) => b.total_focus_seconds - a.total_focus_seconds).slice(0, 50);

          setLeaderboard(result?.map((u, i) => ({ ...u, rank: i + 1 })) || []);
        } else {
          setLeaderboard(weeklyStats.map((u: any, i: number) => ({ ...u, rank: i + 1 })));
        }
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchLeaderboard();
  }, [tab]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const filteredLeaderboard = leaderboard.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = leaderboard.slice(0, 3);
  const restOfUsers = filteredLeaderboard.slice(topThree.length);

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="space-y-1 text-center md:text-left">
            <h1 className="text-4xl font-display font-light tracking-tight text-white flex items-center gap-3 justify-center md:justify-start">
              <Trophy className="w-8 h-8 text-amber-300/80" />
              Leaderboard
            </h1>
            <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em]">
              The rhythm of the community
            </p>
          </div>

          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setTab('7days')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                tab === '7days' 
                  ? 'bg-sage-200 text-slate-950 shadow-lg shadow-sage-200/20' 
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTab('alltime')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                tab === 'alltime' 
                  ? 'bg-sage-200 text-slate-950 shadow-lg shadow-sage-200/20' 
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-[60vh] flex items-center justify-center">
            <ZenLoader />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Podium Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* 2nd Place */}
              <PodiumCard 
                user={topThree[1]} 
                rank={2} 
                delay={0.1} 
                formatTime={formatTime} 
                isCurrentUser={topThree[1]?.id === currentUser?.id}
              />
              
              {/* 1st Place */}
              <PodiumCard 
                user={topThree[0]} 
                rank={1} 
                delay={0} 
                formatTime={formatTime} 
                isCurrentUser={topThree[0]?.id === currentUser?.id}
              />
              
              {/* 3rd Place */}
              <PodiumCard 
                user={topThree[2]} 
                rank={3} 
                delay={0.2} 
                formatTime={formatTime} 
                isCurrentUser={topThree[2]?.id === currentUser?.id}
              />
            </div>

            {/* Search & Filter */}
            <div className="relative group max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-sage-200 transition-colors" />
              <input
                type="text"
                placeholder="Find a focused friend..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-sage-200/40 transition-all focus:bg-white/[0.08] backdrop-blur-sm"
              />
            </div>

            {/* List Section */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {restOfUsers.map((u, idx) => (
                  <motion.div
                    key={u.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <GlassCard 
                      variant="icy" 
                      className={`group hover:scale-[1.01] transition-all duration-300 p-4 flex items-center gap-4 ${
                        u.id === currentUser?.id ? 'border-sage-200/30 bg-sage-200/5' : ''
                      }`}
                    >
                      <div className="w-8 text-center text-xs font-bold text-white/20 group-hover:text-white/40 transition-colors">
                        {u.rank}
                      </div>
                      
                      <div className="relative">
                        <img 
                          src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} 
                          alt={u.username}
                          className="w-10 h-10 rounded-full border border-white/10 object-cover"
                        />
                        {u.id === currentUser?.id && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-sage-200 rounded-full border-2 border-slate-950" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-white truncate">
                            {u.display_name || u.username}
                          </h4>
                          {u.id === currentUser?.id && (
                            <span className="text-[9px] uppercase tracking-widest font-bold text-sage-200 bg-sage-200/10 px-1.5 py-0.5 rounded">You</span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">@{u.username}</p>
                      </div>

                      <div className="flex items-center gap-8 text-right">
                        <div className="hidden sm:flex flex-col items-end">
                          <div className="flex items-center gap-1.5 text-sage-200">
                            <Zap className="w-3 h-3" />
                            <span className="text-sm font-display">{u.current_streak}</span>
                          </div>
                          <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Streak</span>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5 text-white/80">
                            <Clock className="w-3 h-3 text-white/30" />
                            <span className="text-sm font-display font-medium">{formatTime(u.total_focus_seconds)}</span>
                          </div>
                          <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Focus</span>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>

              {restOfUsers.length === 0 && !loading && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                    <Filter className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-white/30 text-sm font-light">No focused souls found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

interface PodiumCardProps {
  user?: LeaderboardUser;
  rank: number;
  delay: number;
  formatTime: (s: number) => string;
  isCurrentUser: boolean;
}

const PodiumCard: React.FC<PodiumCardProps> = ({ user, rank, delay, formatTime, isCurrentUser }) => {
  if (!user) return <div className="hidden md:block h-full min-h-[200px]" />;

  const isFirst = rank === 1;
  const isSecond = rank === 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`relative ${isFirst ? 'order-2 md:-translate-y-6' : isSecond ? 'order-1' : 'order-3'}`}
    >
      <GlassCard 
        variant={isFirst ? 'frosted' : 'icy'} 
        className={`p-8 text-center relative overflow-hidden transition-all duration-500 hover:scale-[1.02] ${
          isFirst ? 'border-sage-200/40 ring-1 ring-sage-200/20 shadow-2xl shadow-sage-200/10' : ''
        } ${isCurrentUser ? 'border-sage-200/20' : ''}`}
      >
        {/* Glow effect for #1 */}
        {isFirst && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-sage-200/10 blur-[60px] pointer-events-none" />
        )}

        {/* Rank Badge */}
        <div className={`mx-auto mb-6 w-12 h-12 rounded-full flex items-center justify-center border-2 ${
          isFirst ? 'bg-amber-400/20 border-amber-400/40 text-amber-300' :
          isSecond ? 'bg-slate-300/20 border-slate-300/40 text-slate-200' :
          'bg-orange-400/20 border-orange-400/40 text-orange-300'
        }`}>
          {isFirst ? <Crown className="w-6 h-6" /> : <Medal className="w-6 h-6" />}
        </div>

        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <img 
            src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
            alt={user.username}
            className={`rounded-full border-2 object-cover ${
              isFirst ? 'w-24 h-24 border-sage-200' : 'w-20 h-20 border-white/20'
            }`}
          />
          {isCurrentUser && (
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-sage-200 rounded-full border-2 border-slate-950 shadow-lg" />
          )}
        </div>

        <div className="space-y-1 mb-6">
          <h3 className={`font-display font-medium truncate ${isFirst ? 'text-xl' : 'text-lg'}`}>
            {user.display_name || user.username}
          </h3>
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">@{user.username}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5 text-sage-200">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-lg font-display font-light">{user.current_streak}</span>
            </div>
            <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Streak</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5 text-white/90">
              <Clock className="w-3.5 h-3.5 text-white/30" />
              <span className="text-lg font-display font-light">{formatTime(user.total_focus_seconds)}</span>
            </div>
            <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Focus</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default LeaderboardPage;
