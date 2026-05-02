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

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

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

  const monthName = new Date(viewMonth.year, viewMonth.month).toLocaleString('default', { month: 'short' });
  const yearStr = viewMonth.year !== new Date().getFullYear() ? ` ${viewMonth.year}` : '';

  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
  // Convert Sunday-first (0=Sun) to Monday-first (0=Mon)
  const rawFirstDay = new Date(viewMonth.year, viewMonth.month, 1).getDay();
  const firstDayOfWeek = rawFirstDay === 0 ? 6 : rawFirstDay - 1; // Mon=0, Sun=6

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

  // Determine the box color based on streak status
  const getSquareClasses = (sq: typeof daySquares[0]) => {
    if (sq.isFuture) return 'bg-white/[0.02] border-transparent';
    
    const entry = streakDates.get(sq.dateStr);
    
    if (sq.qualified) {
      // Active streak day — uses the flame-level color
      if (currentStreak >= 30) return 'bg-violet-400/35 border-violet-400/25';
      if (currentStreak >= 14) return 'bg-rose-400/35 border-rose-400/25';
      if (currentStreak >= 7) return 'bg-orange-400/35 border-orange-400/25';
      return 'bg-amber-400/35 border-amber-400/25';
    }
    
    if (entry?.qualified) {
      // Was qualified but NOT in current streak (broken streak → grey)
      return 'bg-white/[0.06] border-white/[0.04]';
    }
    
    if (entry && entry.seconds > 0) {
      // Some focus but didn't qualify for streak (partial effort)
      return 'bg-white/[0.04] border-transparent';
    }
    
    return 'bg-white/[0.02] border-transparent';
  };

  const statusLabel = currentStreak >= 30 ? '🔥 Legendary' : 
    currentStreak >= 14 ? '🔥 On Fire' :
    currentStreak >= 7 ? '✨ Building' :
    currentStreak >= 3 ? '🌱 Growing' :
    currentStreak > 0 ? '🌱 Started' : '💤 Inactive';

  return (
    <GlassCard className="p-3.5 relative overflow-hidden group">
      {/* Animated Background Glow */}
      <motion.div 
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-[40px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${flame.glow}, transparent 70%)` }}
      />
      
      <div className="relative z-10">
        {/* Header Row: flame icon + streak number + best */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg ${flame.bg} border ${flame.border} flex items-center justify-center`}>
              <Flame className={`w-5 h-5 ${flame.color}`} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <motion.span 
                key={currentStreak}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl font-display font-semibold text-white leading-none"
              >
                {currentStreak}
              </motion.span>
              <span className={`text-[10px] uppercase tracking-[0.15em] ${flame.color} font-bold opacity-70`}>day streak</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[7px] text-white/20 font-medium">
            <Trophy className="w-2 h-2" />
            <span>Best: {bestStreak}</span>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-1.5">
          <button 
            onClick={prevMonth}
            className="p-0.5 rounded hover:bg-white/5 text-white/20 hover:text-white/40 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-2 h-2" />
          </button>
          <AnimatePresence mode="wait">
            <motion.span 
              key={`${viewMonth.year}-${viewMonth.month}`}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              className="text-[9px] uppercase tracking-[0.12em] text-white/30 font-bold"
            >
              {monthName}{yearStr}
            </motion.span>
          </AnimatePresence>
          <button 
            onClick={nextMonth}
            className="p-0.5 rounded hover:bg-white/5 text-white/20 hover:text-white/40 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-2 h-2" />
          </button>
        </div>

        {/* Calendar Grid - Labels on the side */}
        <div className="flex gap-2.5 items-start">
          {/* Weekday Labels on the side */}
          <div className="flex flex-col justify-between py-1 h-[110px]">
            {WEEKDAY_LABELS.map((d, i) => (
              <div 
                key={`side-wk-${i}`} 
                className="text-[7px] text-white/15 font-bold uppercase select-none leading-none h-2.5 flex items-center"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid: Columns are weeks, Rows are weekdays */}
          <div className="flex-1 grid grid-rows-7 grid-flow-col gap-1.5 h-[110px]">
            {/* Generate all possible cells in the month grid (max 6 weeks) */}
            {(() => {
              const cells = [];
              const totalDays = daysInMonth;
              
              // We need to map each day to its correct row (weekday) and column (week)
              // firstDayOfWeek (0-6 for Mon-Sun)
              for (let d = 1; d <= totalDays; d++) {
                const date = new Date(viewMonth.year, viewMonth.month, d);
                const rawDay = date.getDay();
                const row = rawDay === 0 ? 6 : rawDay - 1; // Mon=0, Sun=6
                
                // Calculate column based on which week this day falls into
                // Week 0 starts at day 1, but we need to account for the firstDayOfWeek offset
                const col = Math.floor((d + firstDayOfWeek - 1) / 7);
                
                const sq = daySquares.find(s => s.day === d);
                if (sq) {
                  cells.push(
                    <motion.div
                      key={sq.dateStr}
                      initial={false}
                      animate={{ opacity: 1 }}
                      style={{ 
                        gridRowStart: row + 1,
                        gridColumnStart: col + 1
                      }}
                      className={`
                        w-2.5 h-2.5 rounded-[1.5px] border transition-colors duration-200 
                        relative 
                        ${getSquareClasses(sq)} 
                        ${sq.isToday ? 'ring-1 ring-white/30 ring-offset-0' : ''}
                      `}
                      title={`${sq.day} — ${sq.qualified ? 'Streak ✓' : streakDates.get(sq.dateStr)?.seconds ? `${Math.round((streakDates.get(sq.dateStr)?.seconds || 0) / 60)}m focus` : 'No focus'}`}
                    />
                  );
                }
              }
              return cells;
            })()}
          </div>
        </div>

        {/* Status Footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-white/20">
            <Zap className="w-2 h-2" />
            <span>{statusLabel}</span>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              <div className="w-2 h-2 rounded-sm bg-amber-400/35" />
              <span className="text-[7px] text-white/15">Active</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-2 h-2 rounded-sm bg-white/[0.06]" />
              <span className="text-[7px] text-white/15">Broken</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default StreakWidget;