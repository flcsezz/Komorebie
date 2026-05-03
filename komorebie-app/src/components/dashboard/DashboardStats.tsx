import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Clock, CheckCircle2, BarChart3, Settings, X, Loader2 } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { useAnalytics } from '../../hooks/useAnalytics';
import { supabase } from '../../lib/supabase';

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.6, 
      ease: [0.16, 1, 0.3, 1] as any
    } 
  }
};

const DashboardStats: React.FC = () => {
  const { stats, profile, refresh } = useAnalytics();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [localGoalHours, setLocalGoalHours] = React.useState('4');
  const [isSaving, setIsSaving] = React.useState(false);

  const dailyGoalSeconds = profile?.daily_goal_seconds || 14400;
  const dailyGoalHours = Math.round((dailyGoalSeconds / 3600) * 10) / 10;

  React.useEffect(() => {
    if (profile?.daily_goal_seconds) {
      const hours = (profile.daily_goal_seconds / 3600).toString();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalGoalHours(hours);
    }
  }, [profile?.daily_goal_seconds]);

  const handleSaveGoal = async () => {
    let hours = parseFloat(localGoalHours);
    if (isNaN(hours)) return;
    
    // Enforce 0.5 - 20 range
    hours = Math.max(0.5, Math.min(20, hours));

    setIsSaving(true);
    const seconds = Math.round(hours * 3600);
    
    const { error } = await supabase
      .from('profiles')
      .update({ daily_goal_seconds: seconds })
      .eq('id', profile.id);

    if (error) {
      console.error('Error saving daily goal:', error);
    } else {
      await refresh();
      setIsSettingsOpen(false);
    }
    setIsSaving(false);
  };

  const todayFocusFormatted = (() => {
    const h = Math.floor(stats.todayFocusSeconds / 3600);
    const m = Math.floor((stats.todayFocusSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  })();

  // Scale bars: dynamic scaling relative to max value, with a minimum ceiling of 1 hour (3600s) like Digital Wellbeing
  const maxSecondsRaw = Math.max(...stats.weeklyData.map(d => d.focusSeconds), 0);
  const maxSeconds = Math.max(maxSecondsRaw, 3600);

  return (
    <motion.div variants={itemVariants} className="flex flex-col gap-4">
      {/* Analytics Card */}
      <motion.div variants={itemVariants} className="flex-1">
        <GlassCard variant="icy" animateCard={false} className="h-full p-4 flex flex-col relative group">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.2em] text-white/80 font-black">
              <BarChart3 className="w-4 h-4 text-sage-200" />
              Analytics
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-sage-200 transition-all cursor-pointer border border-white/5"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {/* Today's Focus */}
            <div className="flex flex-col gap-1 p-2.5 bg-white/[0.04] rounded-xl border border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sage-200" />
                <span className="text-[10px] text-white/60 uppercase tracking-wider font-bold">Focus</span>
              </div>
              <span className="text-xl font-display font-semibold text-white leading-none">{todayFocusFormatted}</span>
            </div>

            {/* Today's Sessions */}
            <div className="flex flex-col gap-1 p-2.5 bg-white/[0.04] rounded-xl border border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] text-white/60 uppercase tracking-wider font-bold">Sessions</span>
              </div>
              <span className="text-xl font-display font-semibold text-white leading-none">{stats.sessionsToday}</span>
            </div>

            {/* Tasks Done */}
            <div className="flex flex-col gap-1 p-2.5 bg-white/[0.04] rounded-xl border border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-white/60 uppercase tracking-wider font-bold">Tasks</span>
              </div>
              <span className="text-xl font-display font-semibold text-white leading-none">{stats.tasksDoneToday}</span>
            </div>
          </div>

          {/* Today's Focus Progress Bar */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider">Daily Goal · {dailyGoalHours}h</span>
              <span className="text-[11px] text-white/80 font-mono">{Math.min(Math.round((stats.todayFocusSeconds / dailyGoalSeconds) * 100), 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.todayFocusSeconds / dailyGoalSeconds) * 100, 100)}%` }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] as const }}
                className="h-full bg-sage-200/60 rounded-full shadow-[0_0_8px_rgba(183,201,176,0.3)]"
              />
            </div>
          </div>

          {/* Weekly Bar Graph — LARGE */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider">This Week</span>
              <span className="text-[11px] text-white/50 font-mono">{stats.weekHours}h total</span>
            </div>

            <div className="flex items-end gap-2 h-28">
              {stats.weeklyData.map((d, i) => {
                const isToday = i === stats.weeklyData.length - 1;
                const barHeight = maxSeconds > 0 ? Math.max((d.focusSeconds / maxSeconds) * 100, d.focusSeconds > 0 ? 8 : 3) : 3;
                const focusMin = Math.round(d.focusSeconds / 60);
                const sessionDots = d.sessionsCount;
                
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-0 h-full justify-end group/bar relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-slate-900 border border-white/20 text-[9px] text-white rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-xl backdrop-blur-md flex flex-col items-center gap-0.5">
                      <span className="font-bold">{focusMin}m</span>
                      <span className="text-white/50">{sessionDots} session{sessionDots !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Session count dots */}
                    {sessionDots > 0 && (
                      <div className="flex gap-px mb-1.5 h-2 items-end">
                        {Array.from({ length: Math.min(sessionDots, 5) }).map((_, si) => (
                          <div 
                            key={si} 
                            className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-sage-200/60' : 'bg-white/30'}`} 
                          />
                        ))}
                      </div>
                    )}

                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${barHeight}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isToday 
                          ? 'bg-sage-200/70 shadow-[0_0_12px_rgba(183,201,176,0.25)]' 
                          : d.focusSeconds > 0 
                            ? 'bg-white/30 hover:bg-white/50' 
                            : 'bg-white/10'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Day Labels */}
            <div className="flex items-center gap-2 mt-2">
              {stats.weeklyData.map((d, i) => {
                const isToday = i === stats.weeklyData.length - 1;
                return (
                  <div 
                    key={`label-${d.date}`} 
                    className={`flex-1 text-center text-[11px] font-bold tracking-wide ${
                      isToday ? 'text-sage-200' : 'text-white/40'
                    }`}
                  >
                    {d.day.charAt(0)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Summary Footer */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] text-white/60 font-medium">
                <Clock className="w-3.5 h-3.5 opacity-80" />
                <span>{stats.totalHours >= 1 ? `${stats.totalHours}h` : `${Math.floor(stats.totalSeconds / 60)}m`} all-time</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-white/60 font-medium">
                <Target className="w-3.5 h-3.5 opacity-80" />
                <span>{stats.totalSessions} sessions</span>
              </div>
            </div>
            <div className="text-[10px] text-sage-200/80 font-black uppercase tracking-[0.15em]">
              {stats.weekHours > 0 ? `${Math.round(stats.weekHours / 7 * 10) / 10}h/day avg` : '—'}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Companion Progress */}
      <motion.div variants={itemVariants}>
        <GlassCard variant="icy" animateCard={false} className="p-3 flex items-center gap-3 group cursor-pointer hover:border-white/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-slate-950/40 flex items-center justify-center border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-sage-200/10 animate-breath" />
            <span className="text-base relative z-10">🦊</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mb-0.5">Companion</span>
            <span className="text-[12px] text-white font-medium">Forest Fox · Lvl {Math.floor(stats.mana / 100) + 1}</span>
            <div className="w-20 h-1 bg-slate-950/40 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-sage-200/40 rounded-full" style={{ width: `${stats.mana % 100}%` }} />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Daily Goal Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-sm"
            >
              <GlassCard variant="icy" className="p-6 border border-white/20 shadow-2xl overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-sage-200/10 rounded-full blur-[40px] pointer-events-none" />
                
                <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-sage-200 font-black mb-1">Preferences</span>
                    <h3 className="text-xl font-display font-medium text-white">Daily Focus Goal</h3>
                  </div>
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/50 font-bold uppercase tracking-widest px-1">
                      Target Hours Per Day
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="20"
                        value={localGoalHours}
                        onChange={(e) => setLocalGoalHours(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-2xl font-display font-semibold text-white focus:outline-none focus:border-sage-200/50 focus:bg-white/10 transition-all"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 font-display font-medium text-lg">hrs</span>
                    </div>
                    <p className="text-[10px] text-white/30 px-1 leading-relaxed">
                      Setting a consistent daily goal helps build deep work muscle memory.
                    </p>
                  </div>

                  <button
                    onClick={handleSaveGoal}
                    disabled={isSaving}
                    className="w-full py-4 bg-sage-200 text-slate-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-sage-200/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Update Goal'
                    )}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DashboardStats;
