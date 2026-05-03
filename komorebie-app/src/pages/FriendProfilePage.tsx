import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, Flame, Clock, Target, ChevronLeft, ChevronRight, 
  UserPlus, Check, Clock as PendingClock, Loader2, ArrowLeft,
  UserMinus
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuth } from '../context/AuthContext';
import { useBackground } from '../context/BackgroundContext';
import { getProfileByUsername, getFriendshipStatus, sendFriendRequest, removeFriend, type PublicProfile } from '../lib/friends';


const FriendProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { setBackground, resetBackground } = useBackground();
  
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendship, setFriendship] = useState<{ status: string; friendshipId?: string }>({ status: 'none' });
  const [actionLoading, setActionLoading] = useState(false);
  
  // Fetch profile stats
  const { stats, streakDates, loading: statsLoading, profile: cachedProfile } = useAnalytics(profile?.id);
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());

  const displayProfile = cachedProfile || profile;

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!username) return;
      setProfile(null); // Reset profile when username changes to avoid showing previous friend's data
      setLoading(true);
      try {
        const p = await getProfileByUsername(username);
        if (p && active) {
          setProfile(p);
          if (p.preferred_bg) {
            setBackground(p.preferred_bg);
          }
          if (currentUser) {
            const status = await getFriendshipStatus(currentUser.id, p.id);
            if (active) setFriendship(status);
          }
        }
      } catch (err) {
        console.error('Error loading friend profile:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
      resetBackground();
    };
  }, [username, setBackground, resetBackground, currentUser]);

  const handleAddFriend = async () => {
    if (!profile || !currentUser) return;
    setActionLoading(true);
    try {
      const res = await sendFriendRequest(profile.id);
      if (res.success) {
        setFriendship({ status: 'pending_outgoing' });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendship.friendshipId) return;
    if (!window.confirm(`Are you sure you want to remove ${displayProfile?.display_name || 'this friend'}?`)) return;
    
    setActionLoading(true);
    try {
      await removeFriend(friendship.friendshipId);
      setFriendship({ status: 'none' });
    } finally {
      setActionLoading(false);
    }
  };

  // Build heatmap data
  const heatmapData = useMemo(() => {
    const data: { date: string; seconds: number; qualified: boolean }[] = [];
    const start = new Date(heatmapYear, 0, 1);
    const end = new Date(heatmapYear, 11, 31);
    const today = new Date(); today.setHours(0,0,0,0);

    for (let d = new Date(start); d <= end && d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const entry = streakDates.get(dateStr);
      data.push({ date: dateStr, seconds: entry?.seconds || 0, qualified: entry?.qualified || false });
    }
    return data;
  }, [heatmapYear, streakDates]);

  const heatmapWeeks = useMemo(() => {
    if (heatmapData.length === 0) return [];
    const firstDay = new Date(heatmapData[0].date + 'T00:00:00').getDay();
    const weeks: (typeof heatmapData[0] | null)[][] = [];
    let currentWeek: (typeof heatmapData[0] | null)[] = Array(firstDay).fill(null);

    heatmapData.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
    });
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }
    return weeks;
  }, [heatmapData]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let lastMonth = -1;

    heatmapWeeks.forEach((week, wi) => {
      const validDay = week.find(d => d !== null);
      if (validDay) {
        const m = new Date(validDay.date + 'T00:00:00').getMonth();
        if (m !== lastMonth) { labels.push({ label: months[m], weekIndex: wi }); lastMonth = m; }
      }
    });
    return labels;
  }, [heatmapWeeks]);

  const getHeatColor = (seconds: number) => {
    if (seconds === 0) return 'bg-white/[0.04]';
    if (seconds < 900) return 'bg-sage-200/20';
    if (seconds < 3600) return 'bg-sage-200/40';
    if (seconds < 7200) return 'bg-sage-200/60';
    return 'bg-sage-200/80';
  };



  if (loading || (profile && statsLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-sage-200/40 animate-spin mb-4" />
        <p className="text-xs text-white/20 uppercase tracking-widest font-bold">Entering Sanctuary...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
          <ArrowLeft className="w-8 h-8 text-white/10" />
        </div>
        <h2 className="text-xl font-display font-light text-white mb-2">Explorer Not Found</h2>
        <p className="text-sm text-white/20 max-w-xs mb-8">This user has retreated to the shadows or the link is incorrect.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest cursor-pointer">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full max-w-4xl mx-auto pt-4 pb-20 px-4">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 text-white/30 hover:text-white transition-colors group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] uppercase tracking-widest font-bold">Return to Friends</span>
      </motion.button>

      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <GlassCard variant="frosted" className="p-8 relative overflow-hidden mb-8">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-sage-200/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-5">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-white/10 overflow-hidden flex items-center justify-center shadow-xl">
                {displayProfile?.avatar_url ? (
                  <img src={displayProfile.avatar_url} alt={displayProfile.display_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-display font-light text-white/40">
                    {(displayProfile?.display_name || displayProfile?.username || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-display font-light text-white mb-1">{displayProfile?.display_name || displayProfile?.username}</h1>
                <p className="text-xs text-white/30 mb-3">@{displayProfile?.username}</p>
                <div className="flex items-center gap-4 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-amber-400/60" />{displayProfile?.current_streak || 0} day streak</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-sage-200/60" />{stats.totalHours >= 1 ? `${stats.totalHours.toFixed(1)}h` : `${Math.floor(stats.totalSeconds / 60)}m`} focused</span>
                </div>
              </div>
            </div>

            {/* Relationship Action */}
            {currentUser && currentUser.id !== profile.id && (
              <div className="flex-shrink-0 flex items-center gap-2">
                {friendship.status === 'accepted' ? (
                  <>
                    <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sage-200/10 border border-sage-200/20 text-sage-200 text-[10px] uppercase tracking-widest font-bold">
                      <Check className="w-3.5 h-3.5" />
                      Friends
                    </div>
                    <button
                      onClick={handleRemoveFriend}
                      disabled={actionLoading}
                      className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-40"
                      title="Remove Friend"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                    </button>
                  </>
                ) : friendship.status.startsWith('pending') ? (
                  <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400/60 text-[10px] uppercase tracking-widest font-bold">
                    <PendingClock className="w-3.5 h-3.5" />
                    Pending
                  </div>
                ) : (
                  <button
                    onClick={handleAddFriend}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sage-200 text-slate-950 hover:bg-sage-300 transition-all text-[10px] uppercase tracking-widest font-bold cursor-pointer disabled:opacity-40 shadow-lg shadow-sage-200/10"
                  >
                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    Add Friend
                  </button>
                )}
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Stats Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Flame, label: 'Current Streak', value: `${displayProfile?.current_streak || 0}`, sub: 'days', color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
          { icon: Trophy, label: 'Best Streak', value: `${displayProfile?.best_streak || 0}`, sub: 'days', color: 'text-purple-300 bg-purple-500/10 border-purple-500/20' },
          { icon: Clock, label: 'All-time Focus', value: stats.totalHours >= 1 ? `${stats.totalHours.toFixed(1)}h` : `${Math.floor(stats.totalSeconds / 60)}m`, sub: 'total', color: 'text-sage-200 bg-sage-200/10 border-sage-200/20' },
          { icon: Target, label: 'All-time Sessions', value: `${stats.totalSessions}`, sub: 'total', color: 'text-blue-300 bg-blue-500/10 border-blue-500/20' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.05 }}>
            <GlassCard variant="icy" className="p-5 text-center group hover:border-white/20 transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 border ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-display font-light text-white mb-0.5">{stat.value}</div>
              <div className="text-[8px] uppercase tracking-[0.2em] text-white/25 font-bold">{stat.label}</div>
              <div className="text-[8px] text-white/15 uppercase tracking-widest mt-0.5">{stat.sub}</div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Yearly Heatmap Calendar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
        <GlassCard variant="frosted" className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display font-light text-white">Focus Activity</h3>
              <p className="text-[10px] text-white/25 uppercase tracking-widest mt-1 font-bold">{heatmapData.filter(d => d.seconds > 0).length} active days in {heatmapYear}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setHeatmapYear(y => y - 1)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-white/50 font-medium min-w-[3rem] text-center">{heatmapYear}</span>
              <button onClick={() => setHeatmapYear(y => Math.min(y + 1, new Date().getFullYear()))} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex gap-[3px] overflow-x-auto custom-scrollbar pb-2 mt-5">
            <div className="flex flex-col gap-[3px] flex-shrink-0 mr-1">
              <div className="h-4" /> {/* Month label spacer */}
              {['','Mon','','Wed','','Fri',''].map((d, i) => (
                <div key={i} className="h-[13px] text-[8px] text-white/20 font-bold flex items-center justify-end pr-1 w-6">{d}</div>
              ))}
            </div>
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {/* Month labels */}
                <div className="h-4 relative">
                  {monthLabels.find(ml => ml.weekIndex === wi) && (
                    <span className="absolute left-0 bottom-0 text-[8px] text-white/30 font-bold whitespace-nowrap">
                      {monthLabels.find(ml => ml.weekIndex === wi)?.label}
                    </span>
                  )}
                </div>
                {week.map((day, di) => (
                  <div key={di} className={`w-[13px] h-[13px] rounded-[2px] transition-colors ${day ? getHeatColor(day.seconds) : 'bg-transparent'} ${day ? 'hover:ring-1 hover:ring-white/20' : ''}`} title={day ? `${day.date}: ${Math.round(day.seconds / 60)}m` : ''} />
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 text-[9px] text-white/25 font-medium">
            <span>Less</span>
            {[0, 900, 3600, 7200, 14400].map((s) => (
              <div key={s} className={`w-[11px] h-[11px] rounded-[2px] ${getHeatColor(s)}`} />
            ))}
            <span>More</span>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default FriendProfilePage;
