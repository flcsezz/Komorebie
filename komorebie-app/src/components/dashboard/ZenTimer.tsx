import React from 'react';
import { motion } from 'framer-motion';
import { Play, Settings2, Timer as TimerIcon, Plus, Minus, Zap } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

interface ZenTimerProps {
  initialTime: number; // in minutes
  onStart: () => void;
  onChange: (time: number) => void;
}

const ZenTimer: React.FC<ZenTimerProps> = ({ initialTime, onStart, onChange }) => {
  const increment = () => onChange(Math.min(initialTime + 5, 120));
  const decrement = () => onChange(Math.max(initialTime - 5, 5));

  return (
    <GlassCard variant="hero" className="relative overflow-hidden aspect-[4/3] flex flex-col items-center justify-center p-8 group">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-sage-200/5 via-transparent to-orange-400/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full animate-slow-spin pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] border border-white/[0.03] rounded-full animate-slow-spin-reverse pointer-events-none" />

      {/* Header Info */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] font-bold text-white/50">
          <TimerIcon className="w-4 h-4 text-sage-200" />
          Focus Ritual
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-sage-200 uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5" />
            +40 Mana
          </div>
          <button className="text-white/20 hover:text-white transition-colors cursor-pointer">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="flex items-center gap-8">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={decrement}
            className="p-3 rounded-full bg-white/5 border border-white/5 text-white/20 hover:text-white/60 hover:bg-white/10 transition-all cursor-pointer"
          >
            <Minus className="w-5 h-5" />
          </motion.button>

          <div className="relative">
            <motion.div 
              key={initialTime}
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              className="text-8xl md:text-9xl font-display font-thin text-white/90 tracking-tighter flex items-baseline"
            >
              {initialTime}
              <span className="text-xl font-sans font-medium text-white/20 ml-2 tracking-widest uppercase">min</span>
            </motion.div>
            
            {/* Visual indicator ring */}
            <svg className="absolute -inset-12 w-[calc(100%+6rem)] h-[calc(100%+6rem)] -rotate-90 pointer-events-none">
              <circle 
                cx="50%" cy="50%" r="48%" 
                className="stroke-white/[0.02]" 
                strokeWidth="1" 
                fill="none" 
              />
              <motion.circle 
                cx="50%" cy="50%" r="48%" 
                stroke="currentColor"
                strokeWidth="2" 
                fill="none"
                strokeDasharray="100 100"
                className="text-sage-200/20"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: initialTime / 120 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
          </div>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={increment}
            className="p-3 rounded-full bg-white/5 border border-white/5 text-white/20 hover:text-white/60 hover:bg-white/10 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Start Button */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center z-10">
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="group/btn flex items-center gap-4 px-10 py-5 rounded-full bg-white/10 border border-white/10 text-white transition-all cursor-pointer overflow-hidden relative shadow-2xl shadow-sage-200/5"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-sage-200/0 via-sage-200/5 to-sage-200/0 -translate-x-full group-hover/btn:animate-shimmer" />
          <span className="text-[13px] font-bold uppercase tracking-[0.4em] relative z-10">Begin Session</span>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center relative z-10 group-hover/btn:bg-white/20 transition-colors">
            <Play className="w-3.5 h-3.5 fill-white" />
          </div>
        </motion.button>
      </div>

      {/* Footer hint */}
      <div className="absolute bottom-4 text-[9px] text-white/30 uppercase tracking-[0.2em] font-medium">
        Deep work sanctuary • Optimized for flow
      </div>
    </GlassCard>
  );
};

export default ZenTimer;
