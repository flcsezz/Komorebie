import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Clock, CheckCircle2, BarChart3 } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { useAnalytics } from '../../hooks/useAnalytics';

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
  const { stats } = useAnalytics();

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
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </div>
            <TrendingUp className="w-3.5 h-3.5 text-sage-200/40" />
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {/* Today's Focus */}
            <div className="flex flex-col gap-0.5 p-2 bg-white/[0.03] rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-sage-200/40" />
                <span className="text-[6px] text-white/25 uppercase tracking-wider font-bold">Focus</span>
              </div>
              <span className="text-lg font-display font-semibold text-white leading-none">{todayFocusFormatted}</span>
            </div>

            {/* Today's Sessions */}
            <div className="flex flex-col gap-0.5 p-2 bg-white/[0.03] rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-1">
                <Target className="w-2.5 h-2.5 text-blue-400/40" />
                <span className="text-[6px] text-white/25 uppercase tracking-wider font-bold">Sessions</span>
              </div>
              <span className="text-lg font-display font-semibold text-white leading-none">{stats.sessionsToday}</span>
            </div>

            {/* Tasks Done */}
            <div className="flex flex-col gap-0.5 p-2 bg-white/[0.03] rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400/40" />
                <span className="text-[6px] text-white/25 uppercase tracking-wider font-bold">Tasks</span>
              </div>
              <span className="text-lg font-display font-semibold text-white leading-none">{stats.tasksDoneToday}</span>
            </div>
          </div>

          {/* Today's Focus Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[7px] text-white/25 font-bold uppercase tracking-wider">Daily Goal · 4h</span>
              <span className="text-[7px] text-white/30 font-mono">{Math.min(Math.round((stats.todayFocusSeconds / 14400) * 100), 100)}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.todayFocusSeconds / 14400) * 100, 100)}%` }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] as const }}
                className="h-full bg-sage-200/40 rounded-full shadow-[0_0_8px_rgba(183,201,176,0.25)]"
              />
            </div>
          </div>

          {/* Weekly Bar Graph — LARGE */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[7px] text-white/25 font-bold uppercase tracking-wider">This Week</span>
              <span className="text-[7px] text-white/20 font-mono">{stats.weekHours}h total</span>
            </div>

            <div className="flex items-end gap-1.5 h-28">
              {stats.weeklyData.map((d, i) => {
                const isToday = i === stats.weeklyData.length - 1;
                const barHeight = maxSeconds > 0 ? Math.max((d.focusSeconds / maxSeconds) * 100, d.focusSeconds > 0 ? 8 : 3) : 3;
                const focusMin = Math.round(d.focusSeconds / 60);
                const sessionDots = d.sessionsCount;
                
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-0 h-full justify-end group/bar relative">
                    {/* Tooltip */}
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-slate-900/95 border border-white/10 text-[7px] text-white/70 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 backdrop-blur-sm flex flex-col items-center gap-0.5">
                      <span className="font-semibold text-white/90">{focusMin}m</span>
                      <span className="text-white/40">{sessionDots} session{sessionDots !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Session count dots (above bars for sessions count) */}
                    {sessionDots > 0 && (
                      <div className="flex gap-px mb-1 h-2 items-end">
                        {Array.from({ length: Math.min(sessionDots, 5) }).map((_, si) => (
                          <div 
                            key={si} 
                            className={`w-1 h-1 rounded-full ${isToday ? 'bg-sage-200/40' : 'bg-white/15'}`} 
                          />
                        ))}
                        {sessionDots > 5 && (
                          <span className="text-[5px] text-white/20 ml-px">+</span>
                        )}
                      </div>
                    )}

                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${barHeight}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                      className={`w-full rounded-t-md transition-colors duration-300 ${
                        isToday 
                          ? 'bg-sage-200/50 shadow-[0_0_8px_rgba(183,201,176,0.2)]' 
                          : d.focusSeconds > 0 
                            ? 'bg-white/15 hover:bg-white/25' 
                            : 'bg-white/5'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Day Labels */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {stats.weeklyData.map((d, i) => {
                const isToday = i === stats.weeklyData.length - 1;
                return (
                  <div 
                    key={`label-${d.date}`} 
                    className={`flex-1 text-center text-[8px] font-semibold tracking-wide ${
                      isToday ? 'text-sage-200/60' : 'text-white/25'
                    }`}
                  >
                    {d.day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Summary Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[7px] text-white/20">
                <Clock className="w-2 h-2" />
                <span>{stats.totalHours >= 1 ? `${stats.totalHours}h` : `${Math.floor(stats.totalSeconds / 60)}m`} all-time</span>
              </div>
              <div className="flex items-center gap-1 text-[7px] text-white/20">
                <Target className="w-2 h-2" />
                <span>{stats.totalSessions} sessions</span>
              </div>
            </div>
            <div className="text-[7px] text-sage-200/30 font-bold uppercase tracking-wider">
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
            <span className="text-[8px] uppercase tracking-[0.2em] text-white/30 font-bold mb-0.5">Companion</span>
            <span className="text-[11px] text-white/70 font-medium">Forest Fox · Lvl {Math.floor(stats.mana / 100) + 1}</span>
            <div className="w-20 h-1 bg-slate-950/40 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-sage-200/40 rounded-full" style={{ width: `${stats.mana % 100}%` }} />
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default DashboardStats;
