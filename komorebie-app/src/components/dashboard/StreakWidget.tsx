import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import { Flame, ChevronLeft, ChevronRight, Trophy, Zap } from 'lucide-react';

interface StreakWidgetProps {
  currentStreak: number;
  bestStreak: number;
  streakDates: Map<string, { qualified: boolean; seconds: number; sessions: number }>;
}

// Flame icon changes based on streak level
const getFlameColor = (streak: number) => {
  if (streak >= 30) return { color: 'text-violet-300', bg: 'bg-violet-500/15', border: 'border-violet-500/25', glow: 'rgba(139, 92, 246, 0.3)' };
  if (streak >= 14) return { color: 'text-rose-300', bg: 'bg-rose-500/15', border: 'border-rose-500/25', glow: 'rgba(244, 63, 94, 0.3)' };
  if (streak >= 7) return { color: 'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-500/25', glow: 'rgba(249, 115, 22, 0.3)' };
  if (streak >= 3) return { color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/25', glow: 'rgba(245, 158, 11, 0.3)' };
  return { color: 'text-amber-200/60', bg: 'bg-amber-500/10', border: 'border-amber-500/15', glow: 'rgba(245, 158, 11, 0.15)' };
};

const getFlameScale = (streak: number) => {
  if (streak >= 30) return 1.4;
  if (streak >= 14) return 1.25;
  if (streak >= 7) return 1.1;
  return 1;
};

const StreakWidget: React.FC<StreakWidgetProps> = ({ 
  currentStreak = 0, 
  bestStreak = 0,
  streakDates = new Map()
}) => {
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const flame = useMemo(() => getFlameColor(currentStreak), [currentStreak]);
  const flameScale = useMemo(() => getFlameScale(currentStreak), [currentStreak]);

  const monthName = new Date(viewMonth.year, viewMonth.month).toLocaleString('default', { month: 'long' });
  const yearStr = viewMonth.year !== new Date().getFullYear() ? ` ${viewMonth.year}` : '';

  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewMonth.year, viewMonth.month, 1).getDay(); // 0=Sun

  const prevMonth = () => {
    setViewMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setViewMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  // Build the day squares data for the month
  const daySquares = useMemo(() => {
    const squares: { day: number; dateStr: string; qualified: boolean; isToday: boolean; isFuture: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the current active streak's start date (walk backward from today)
    const streakStartDate = (() => {
      let date = new Date(today);
      let lastQualifiedDate = new Date(today);
      const todayStr = today.toISOString().split('T')[0];
      const todayEntry = streakDates.get(todayStr);
      
      // Check if today is qualified
      if (!todayEntry?.qualified) {
        // Check yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayEntry = streakDates.get(yesterdayStr);
        if (!yesterdayEntry?.qualified) return null; // No active streak
        lastQualifiedDate = new Date(yesterday);
      }
      
      date = new Date(lastQualifiedDate);
      while (true) {
        const dateStr = date.toISOString().split('T')[0];
        const entry = streakDates.get(dateStr);
        if (!entry?.qualified) break;
        date.setDate(date.getDate() - 1);
      }
      date.setDate(date.getDate() + 1); // Go back to the last qualified date
      return date;
    })();

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewMonth.year, viewMonth.month, d);
      const dateStr = date.toISOString().split('T')[0];
      const entry = streakDates.get(dateStr);
      const isToday = date.getTime() === today.getTime();
      const isFuture = date > today;
      
      // A day is "in active streak" if it's qualified AND between streakStartDate and today
      const inActiveStreak = entry?.qualified && streakStartDate && date >= streakStartDate && date <= today;
      
      squares.push({
        day: d,
        dateStr,
        qualified: inActiveStreak || false,
        isToday,
        isFuture,
      });
    }
    return squares;
  }, [viewMonth, daysInMonth, streakDates]);

  // Grey-out squares: days that HAD qualified streaks but are NOT part of the current streak
  const getSquareStyle = (sq: typeof daySquares[0]) => {
    if (sq.isFuture) return 'bg-white/[0.03] border-white/[0.03]';
    
    const entry = streakDates.get(sq.dateStr);
    
    if (sq.qualified) {
      // Active streak day - colorful
      if (currentStreak >= 30) return 'bg-violet-400/40 border-violet-400/30 shadow-[0_0_6px_rgba(139,92,246,0.2)]';
      if (currentStreak >= 14) return 'bg-rose-400/40 border-rose-400/30 shadow-[0_0_6px_rgba(244,63,94,0.2)]';
      if (currentStreak >= 7) return 'bg-orange-400/40 border-orange-400/30 shadow-[0_0_6px_rgba(249,115,22,0.2)]';
      return 'bg-amber-400/40 border-amber-400/30 shadow-[0_0_6px_rgba(245,158,11,0.15)]';
    }
    
    if (entry?.qualified) {
      // Was qualified but not in current streak (broken streak)
      return 'bg-white/[0.06] border-white/[0.06]';
    }
    
    if (entry && entry.seconds > 0) {
      // Had some study but didn't qualify
      return 'bg-white/[0.04] border-white/[0.04]';
    }
    
    return 'bg-white/[0.03] border-white/[0.03]';
  };

  return (
    <GlassCard className="p-4 relative overflow-hidden group">
      {/* Animated Background Glow */}
      <motion.div 
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-[50px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${flame.glow}, transparent 70%)` }}
      />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div 
              animate={{ scale: [1, flameScale, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className={`w-7 h-7 rounded-lg ${flame.bg} border ${flame.border} flex items-center justify-center`}
            >
              <Flame className={`w-3.5 h-3.5 ${flame.color}`} />
            </motion.div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">
              Streak
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[8px] text-white/20 font-medium">
              <Trophy className="w-2.5 h-2.5" />
              <span>{bestStreak}</span>
            </div>
          </div>
        </div>

        {/* Streak Number */}
        <div className="flex items-end gap-2 mb-4">
          <motion.span 
            key={currentStreak}
            initial={{ opacity: 0, scale: 0.5, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl font-display font-light text-white leading-none"
          >
            {currentStreak}
          </motion.span>
          <div className="mb-0.5">
            <div className={`text-[8px] uppercase tracking-widest ${flame.color} font-bold opacity-80`}>Day Streak</div>
          </div>
        </div>

        {/* Monthly Calendar Grid */}
        <div className="mb-2">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={prevMonth}
              className="p-1 rounded-md hover:bg-white/5 text-white/20 hover:text-white/40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <AnimatePresence mode="wait">
              <motion.span 
                key={`${viewMonth.year}-${viewMonth.month}`}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 2 }}
                className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold"
              >
                {monthName}{yearStr}
              </motion.span>
            </AnimatePresence>
            <button 
              onClick={nextMonth}
              className="p-1 rounded-md hover:bg-white/5 text-white/20 hover:text-white/40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} className="text-[5px] text-center text-white/15 font-bold uppercase">{d}</div>
            ))}
          </div>

          {/* Day Squares */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for alignment */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {daySquares.map((sq) => (
              <motion.div
                key={sq.dateStr}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: sq.day * 0.005, duration: 0.2 }}
                className={`aspect-square rounded-[2px] border transition-all duration-300 relative group/day ${getSquareStyle(sq)} ${sq.isToday ? 'ring-1 ring-white/10' : ''}`}
                title={`${sq.dateStr}${sq.qualified ? ' ✓ Streak' : ''}`}
              >
                {sq.qualified && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-[2px]"
                    style={{ boxShadow: `inset 0 0 3px ${flame.glow}` }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-widest text-white/20">
            <Zap className="w-2.5 h-2.5" />
            <span>Best: {bestStreak}</span>
          </div>
          <div className={`text-[8px] uppercase tracking-widest font-bold ${flame.color} opacity-80`}>
            {currentStreak >= 30 ? '🔥 Legendary' : 
             currentStreak >= 14 ? '🔥 On Fire' :
             currentStreak >= 7 ? '✨ Building' :
             currentStreak >= 3 ? '🌱 Growing' :
             currentStreak > 0 ? '🌱 Started' : '💤 Inactive'}
          </div>
        </div>
      </div>

      {/* Decorative Particles */}
      {currentStreak > 0 && (
        <div className="absolute bottom-3 right-3 flex gap-1 pointer-events-none">
          {[1, 2, 3].map((p) => (
            <motion.div
              key={p}
              animate={{ 
                y: [0, -15, -8],
                opacity: [0, 0.6, 0],
                scale: [0, 1, 0.5]
              }}
              transition={{ 
                duration: 2 + p, 
                repeat: Infinity,
                delay: p * 0.5
              }}
              className={`w-1 h-1 rounded-full ${currentStreak >= 14 ? 'bg-rose-400/30' : 'bg-amber-400/30'}`}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default StreakWidget;