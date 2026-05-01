import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, MessageSquare, ArrowRight } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

const ZenAISidekick: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <GlassCard className="p-5 flex flex-col gap-6 relative group overflow-hidden h-full">
      {/* Background Glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-sage-200/5 rounded-full blur-3xl group-hover:bg-sage-200/10 transition-all duration-1000" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-[8px] uppercase tracking-[0.2em] text-white/30 font-bold">
          <Brain className="w-3.5 h-3.5 text-sage-200/60" />
          Zen Sidekick
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-sage-200 animate-pulse" />
          <span className="text-[8px] uppercase tracking-widest text-sage-200/80 font-bold">Active</span>
        </div>
      </div>

      <div className="space-y-5 relative z-10">
        <div className="space-y-2">
          <div className="text-[10px] text-white/40 font-medium">Current Insight</div>
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl group/insight hover:border-sage-200/20 transition-all cursor-pointer">
            <p className="text-[11px] leading-relaxed text-white/70 font-light italic">
              "Your focus rhythm is strongest in the morning. Consider tackling Neural Networks before 11 AM for maximum retention."
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-[10px] text-white/40 font-medium">Quick Actions</div>
          <div className="space-y-2">
            <button className="w-full p-3 bg-sage-200/10 hover:bg-sage-200/20 border border-sage-200/10 rounded-xl flex items-center justify-between group/action transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <Sparkles className="w-3.5 h-3.5 text-sage-200/60" />
                <span className="text-[10px] text-white/60 font-medium">Generate Flashcards</span>
              </div>
              <ArrowRight className="w-3 h-3 text-white/20 group-hover/action:translate-x-1 transition-transform" />
            </button>
            
            <button className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-between group/action transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-3.5 h-3.5 text-white/30" />
                <span className="text-[10px] text-white/60 font-medium">Clarify Last Session</span>
              </div>
              <ArrowRight className="w-3 h-3 text-white/20 group-hover/action:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5 relative z-10">
        <div className="text-[8px] text-white/20 font-bold uppercase tracking-widest">Awaiting Input</div>
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-5 h-5 rounded-full border border-slate-900 bg-white/5 flex items-center justify-center text-[8px] text-white/40">
              {i}
            </div>
          ))}
        </div>
      </div>
      </GlassCard>
    </motion.div>
  );
};

export default ZenAISidekick;
