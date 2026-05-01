import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import { Flame, Sparkles, Trophy } from 'lucide-react';

interface StreakWidgetProps {
  streak?: number;
  bestStreak?: number;
  lastFocusDate?: string;
}

const StreakWidget: React.FC<StreakWidgetProps> = ({ 
  streak = 12, 
  bestStreak = 24,
}) => {
  return (
    <GlassCard className="p-6 relative overflow-hidden group">
      {/* Animated Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 blur-[60px] rounded-full group-hover:bg-amber-500/20 transition-all duration-1000" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-amber-200" />
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
            Inner Flame
          </div>
        </div>

        <div className="flex items-end gap-3 mb-6">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl font-display font-light text-white"
          >
            {streak}
          </motion.span>
          <div className="mb-2">
            <div className="text-[10px] uppercase tracking-widest text-amber-200/60 font-bold">Days</div>
            <div className="text-[10px] uppercase tracking-widest text-white/20">Current</div>
          </div>
        </div>

        {/* The Flame Visualizer */}
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-6 flex">
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className={`h-full flex-1 border-r border-slate-900/50 ${
                i < (streak % 7 || 7) ? 'bg-amber-400/40' : 'bg-white/5'
              }`}
            />
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
            <span className="text-white/30 flex items-center gap-2">
              <Trophy className="w-3 h-3" /> Best Streak
            </span>
            <span className="text-white/60">{bestStreak} Days</span>
          </div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
            <span className="text-white/30 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Next Reward
            </span>
            <span className="text-white/60">3 Days</span>
          </div>
        </div>
      </div>

      {/* Decorative Particles (Simulated) */}
      <div className="absolute bottom-4 right-4 flex gap-1">
        {[1, 2, 3].map((p) => (
          <motion.div
            key={p}
            animate={{ 
              y: [0, -20, -10],
              opacity: [0, 1, 0],
              scale: [0, 1, 0.5]
            }}
            transition={{ 
              duration: 2 + p, 
              repeat: Infinity,
              delay: p * 0.5
            }}
            className="w-1 h-1 rounded-full bg-amber-400/30"
          />
        ))}
      </div>
    </GlassCard>
  );
};

export default StreakWidget;
