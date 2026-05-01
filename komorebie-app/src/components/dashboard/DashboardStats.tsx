import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp } from 'lucide-react';
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

  // Scale bars: find max value for relative scaling
  const maxSeconds = Math.max(...stats.weeklyData.map(d => d.seconds), 1);

  return (
    <motion.div variants={itemVariants} className="flex flex-col gap-5">
      {/* Analytics Card */}
      <motion.div variants={itemVariants} className="flex-1">
        <GlassCard variant="icy" animateCard={false} className="h-full p-6 flex flex-col relative group">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
              <Target className="w-4 h-4" />
              Analytics
            </div>
            <TrendingUp className="w-4 h-4 text-sage-200/40" />
          </div>

          <div className="flex-1 flex flex-col justify-between">
            {/* Today's Focus */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[11px] text-white/40 font-medium uppercase tracking-wider">Today's Focus</span>
                <span className="text-3xl font-display font-light text-white">{todayFocusFormatted}</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stats.todayFocusSeconds / 14400) * 100, 100)}%` }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] as const }}
                  className="h-full bg-sage-200/40 rounded-full shadow-[0_0_10px_rgba(183,201,176,0.3)]"
                />
              </div>
            </div>
 
            {/* Weekly Bar Graph */}
            <div className="mt-6">
              <div className="flex items-end gap-1.5 h-20">
                {stats.weeklyData.map((d, i) => {
                  const isToday = i === stats.weeklyData.length - 1;
                  const barHeight = maxSeconds > 0 ? Math.max((d.seconds / maxSeconds) * 100, d.seconds > 0 ? 8 : 3) : 3;
                  const focusMin = Math.round(d.seconds / 60);
                  
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-0 h-full justify-end group/bar relative">
                      {/* Tooltip */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900/95 border border-white/10 text-[8px] text-white/70 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 backdrop-blur-sm">
                        {focusMin}m
                      </div>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeight}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                        className={`w-full rounded-t-md transition-colors duration-300 ${
                          isToday 
                            ? 'bg-sage-200/50 shadow-[0_0_8px_rgba(183,201,176,0.2)]' 
                            : d.seconds > 0 
                              ? 'bg-white/15 hover:bg-white/25' 
                              : 'bg-white/5'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
              
              {/* Day Labels - Fixed visibility */}
              <div className="flex items-center gap-1.5 mt-2">
                {stats.weeklyData.map((d, i) => {
                  const isToday = i === stats.weeklyData.length - 1;
                  return (
                    <div 
                      key={`label-${d.date}`} 
                      className={`flex-1 text-center text-[10px] font-semibold tracking-wide ${
                        isToday ? 'text-sage-200/60' : 'text-white/30'
                      }`}
                    >
                      {d.day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Companion Progress */}
      <motion.div variants={itemVariants}>
        <GlassCard variant="icy" animateCard={false} className="p-4 flex items-center gap-4 group cursor-pointer hover:border-white/20 transition-all">
          <div className="w-12 h-12 rounded-xl bg-slate-950/40 flex items-center justify-center border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-sage-200/10 animate-breath" />
            <span className="text-lg relative z-10">🦊</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold mb-0.5">Companion</span>
            <span className="text-xs text-white/70 font-medium">Forest Fox · Lvl 4</span>
            <div className="w-24 h-1 bg-slate-950/40 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-sage-200/40 rounded-full" style={{ width: '65%' }} />
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default DashboardStats;
