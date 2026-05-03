import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import { Flame, ChevronLeft, ChevronRight, Trophy, Zap, Clock, CheckCircle2, History } from 'lucide-react';
import { toLocalISO } from '../../lib/analyticsCache';

interface StreakWidgetProps {
  currentStreak: number;
  bestStreak: number;
  streakDates: Map<string, { qualified: boolean; seconds: number; sessions: number; tasksDone: number }>;
}

// Flame icon changes based on streak level
const getFlameColor = (streak: number) => {
  if (streak >= 30) return { color: 'text-violet-300', bg: 'bg-violet-500/15', border: 'border-violet-500/25', glow: 'rgba(139, 92, 246, 0.3)' };
  if (streak >= 14) return { color: 'text-rose-300', bg: 'bg-rose-500/15', border: 'border-rose-500/25', glow: 'rgba(244, 63, 94, 0.3)' };
  if (streak >= 7) return { color: 'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-500/25', glow: 'rgba(249, 115, 22, 0.3)' };
  if (streak >= 3) return { color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/25', glow: 'rgba(245, 158, 11, 0.3)' };
  return { color: 'text-amber-200/60', bg: 'bg-amber-500/10', border: 'border-amber-500/15', glow: 'rgba(245, 158, 11, 0.15)' };
};

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

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
      
      const date = new Date(lastQualifiedDate);
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
      const dateStr = toLocalISO(date);
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

  // Determine the box color based on focus time and streak status
  const getSquareClasses = (sq: typeof daySquares[0]) => {
    if (sq.isFuture) return 'bg-white/[0.02] border-transparent';
    
    const entry = streakDates.get(sq.dateStr);
    const seconds = entry?.seconds || 0;
    
    // Intensity levels (1: <30m, 2: <1h, 3: <2h, 4: 2h+)
    const intensity = seconds >= 7200 ? 4 : seconds >= 3600 ? 3 : seconds >= 1800 ? 2 : seconds > 0 ? 1 : 0;
    
    if (sq.qualified) {
      // Active streak day — uses the flame-level color with intensity
      if (currentStreak >= 30) {
        if (intensity === 4) return 'bg-violet-400/80 border-violet-400/40';
        if (intensity === 3) return 'bg-violet-400/60 border-violet-400/30';
        if (intensity === 2) return 'bg-violet-400/40 border-violet-400/20';
        return 'bg-violet-400/25 border-violet-400/15';
      }
      if (currentStreak >= 14) {
        if (intensity === 4) return 'bg-rose-400/80 border-rose-400/40';
        if (intensity === 3) return 'bg-rose-400/60 border-rose-400/30';
        if (intensity === 2) return 'bg-rose-400/40 border-rose-400/20';
        return 'bg-rose-400/25 border-rose-400/15';
      }
      if (currentStreak >= 7) {
        if (intensity === 4) return 'bg-orange-400/80 border-orange-400/40';
        if (intensity === 3) return 'bg-orange-400/60 border-orange-400/30';
        if (intensity === 2) return 'bg-orange-400/40 border-orange-400/20';
        return 'bg-orange-400/25 border-orange-400/15';
      }
      // Amber streak
      if (intensity === 4) return 'bg-amber-400/80 border-amber-400/40';
      if (intensity === 3) return 'bg-amber-400/60 border-amber-400/30';
      if (intensity === 2) return 'bg-amber-400/40 border-amber-400/20';
      return 'bg-amber-400/25 border-amber-400/15';
    }
    
    if (intensity > 0) {
      // Non-active streak focus day (soft white/sage intensity)
      if (intensity === 4) return 'bg-white/40 border-white/20';
      if (intensity === 3) return 'bg-white/25 border-white/15';
      if (intensity === 2) return 'bg-white/15 border-white/10';
      return 'bg-white/10 border-white/5';
    }
    
    return 'bg-white/[0.03] border-white/[0.02]';
  };

  const statusLabel = currentStreak >= 30 ? '🔥 Legendary' : 
    currentStreak >= 14 ? '🔥 On Fire' :
    currentStreak >= 7 ? '✨ Building' :
    currentStreak >= 3 ? '🌱 Growing' :
    currentStreak > 0 ? '🌱 Started' : '💤 Inactive';

  return (
    <GlassCard className="p-4 relative overflow-hidden group">
      {/* Animated Background Glow */}
      <motion.div 
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-[40px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${flame.glow}, transparent 70%)` }}
      />
      
      <div className="relative z-10">
        {/* Header Row: flame icon + streak number + best */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${flame.bg} border ${flame.border} flex items-center justify-center shadow-lg shadow-black/5`}>
              <Flame className={`w-5.5 h-5.5 ${flame.color}`} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <motion.span 
                  key={currentStreak}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-display font-medium text-white leading-none"
                >
                  {currentStreak}
                </motion.span>
                <span className={`text-[11px] uppercase tracking-[0.2em] ${flame.color} font-bold`}>Days</span>
              </div>
              <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold -mt-0.5">Current Streak</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
            <Trophy className="w-3.5 h-3.5 text-amber-200" />
            <span className="text-[11px] text-white/80 font-medium tracking-wide">Best: {bestStreak}</span>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4 px-1">
          <button 
            onClick={prevMonth}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer border border-white/5"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <AnimatePresence mode="wait">
            <motion.span 
              key={`${viewMonth.year}-${viewMonth.month}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-[12px] uppercase tracking-[0.25em] text-white font-bold"
            >
              {monthName}{yearStr}
            </motion.span>
          </AnimatePresence>
          <button 
            onClick={nextMonth}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer border border-white/5"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="flex gap-4 items-start px-1">
          {/* Weekday Labels on the side */}
          <div className="flex flex-col justify-between h-[96px] py-[1px]">
            {WEEKDAY_LABELS.map((d, i) => (
              <div 
                key={`side-wk-${i}`} 
                className="text-[9px] text-white/40 font-bold uppercase select-none leading-none h-3 flex items-center pr-1"
              >
                {d.charAt(0)}
              </div>
            ))}
          </div>

          {/* Grid: Columns are weeks, Rows are weekdays */}
          <div className="flex-1 grid grid-rows-7 grid-flow-col gap-[2px] h-[96px]">
            {/* Generate all possible cells in the month grid */}
            {(() => {
              const cells = [];
              const totalDays = daysInMonth;
              
              for (let d = 1; d <= totalDays; d++) {
                const date = new Date(viewMonth.year, viewMonth.month, d);
                const rawDay = date.getDay();
                const row = rawDay === 0 ? 6 : rawDay - 1; // Mon=0, Sun=6
                const col = Math.floor((d + firstDayOfWeek - 1) / 7);
                
                const sq = daySquares.find(s => s.day === d);
                if (sq) {
                  const entry = streakDates.get(sq.dateStr);
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
                        w-3 h-3 rounded-[3px] border transition-all duration-300 
                        relative group/sq
                        ${getSquareClasses(sq)} 
                        ${sq.isToday ? 'ring-1 ring-white/40 ring-offset-1 ring-offset-transparent' : ''}
                      `}
                    >
                      {/* Custom Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-[#0a0a0c]/90 backdrop-blur-md border border-white/10 rounded-xl text-[10px] text-white whitespace-nowrap opacity-0 group-hover/sq:opacity-100 pointer-events-none transition-all duration-200 z-50 shadow-2xl scale-90 group-hover/sq:scale-100 origin-bottom">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-1.5 mb-0.5">
                            <span className="font-bold text-white/90">{sq.day} {monthName}</span>
                            {sq.qualified && <span className="text-amber-300 font-bold text-[8px] uppercase tracking-tighter">Streak ✓</span>}
                          </div>
                          
                          <div className="flex items-center gap-2 text-white/70">
                            <Clock className="w-2.5 h-2.5 text-white/40" />
                            <span>{entry?.seconds ? `${Math.round(entry.seconds / 60)}m focus` : 'No focus'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-white/70">
                            <History className="w-2.5 h-2.5 text-white/40" />
                            <span>{entry?.sessions || 0} sessions</span>
                          </div>

                          <div className="flex items-center gap-2 text-white/70">
                            <CheckCircle2 className="w-2.5 h-2.5 text-white/40" />
                            <span>{entry?.tasksDone || 0} tasks done</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }
              }
              return cells;
            })()}
          </div>
        </div>

        {/* Status Footer */}
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/50 font-medium">
            <Zap className="w-3 h-3" />
            <span>{statusLabel}</span>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-[1.5px] bg-amber-400/40" />
              <span className="text-[9px] text-white/40 font-medium">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-[1.5px] bg-white/15" />
              <span className="text-[9px] text-white/40 font-medium">Focus</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default StreakWidget;