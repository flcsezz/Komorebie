import React, { useState } from 'react';
import { 
  Plus, Calendar as CalendarIcon, ChevronRight
} from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import DashboardStats from '../components/dashboard/DashboardStats';
import SoundscapeSelector from '../components/dashboard/SoundscapeSelector';
import ThePathWidget from '../components/dashboard/ThePathWidget';
import ZenClock from '../components/dashboard/ZenClock';

const TaskCapture: React.FC = () => {
  const [taskInput, setTaskInput] = useState('');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1] 
      } 
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-full w-full max-w-[1600px] mx-auto pt-2"
    >

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Sanctuary Status (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <motion.div 
            variants={itemVariants}
            id="task-capture-col-1"
            onAnimationComplete={() => document.getElementById('task-capture-col-1')?.style.setProperty('transform', '')}
          >
            <div className="space-y-6">
              <DashboardStats />
            </div>
          </motion.div>
        </div>
 
        {/* Center Column: The Altar (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <motion.div 
            variants={itemVariants} 
            className="flex-1"
            id="task-capture-col-2"
            onAnimationComplete={() => document.getElementById('task-capture-col-2')?.style.setProperty('transform', '')}
          >
            <GlassCard variant="icy" className="p-8 flex items-center justify-center min-h-[400px]">
              <ZenClock initialDuration={25} />
            </GlassCard>
          </motion.div>
 
          <motion.div 
            variants={itemVariants}
            id="task-capture-col-3"
            onAnimationComplete={() => document.getElementById('task-capture-col-3')?.style.setProperty('transform', '')}
          >
            <GlassCard variant="icy" className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <h4 className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-bold mb-6">Intent</h4>
                  <div className="relative group/input">
                    <input
                      type="text"
                      value={taskInput}
                      onChange={(e) => setTaskInput(e.target.value)}
                      placeholder="What is your focus intent?"
                      className="w-full bg-slate-950/20 border border-white/5 rounded-2xl px-6 py-5 text-sm font-light placeholder:text-white/10 focus:outline-none focus:border-sage-200/20 transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 transition-opacity">
                      <kbd className="px-1.5 py-0.5 rounded border border-white/10 text-[8px] text-white/20 bg-white/5 font-sans">⏎</kbd>
                    </div>
                  </div>
                </div>
                <div className="flex-1 border-t md:border-t-0 md:border-l border-white/5 pt-8 md:pt-0 md:pl-8">
                  <SoundscapeSelector />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
        {/* Right Column: The Path (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6 h-full">
          <motion.div 
            variants={itemVariants} 
            className="flex-none"
            id="task-capture-col-4"
            onAnimationComplete={() => document.getElementById('task-capture-col-4')?.style.setProperty('transform', '')}
          >
            <GlassCard variant="icy" className="p-5 flex flex-col gap-5 relative group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] font-bold text-white/30">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Deadlines
                </div>
                <button className="text-[8px] uppercase tracking-widest text-sage-200/40 hover:text-sage-200 font-bold transition-colors cursor-pointer">View All</button>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-orange-400/5 border border-orange-400/10 rounded-xl flex justify-between items-center group/item cursor-pointer">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-orange-200/70 font-medium">Midterm: CS201</span>
                    <span className="text-[8px] text-orange-200/30 uppercase tracking-widest font-bold">In 2 days</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-orange-200/20 group-hover/item:translate-x-1 transition-transform" />
                </div>
                <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[8px] uppercase tracking-widest font-bold text-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Plus className="w-3 h-3" />
                  Add Deadline
                </button>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div 
            variants={itemVariants} 
            className="flex-1 overflow-visible"
            id="task-capture-col-5"
            onAnimationComplete={() => document.getElementById('task-capture-col-5')?.style.setProperty('transform', '')}
          >
            <ThePathWidget />
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
};

export default TaskCapture;
