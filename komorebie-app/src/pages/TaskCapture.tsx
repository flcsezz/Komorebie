import React from 'react';
import { 
  Plus, Calendar as CalendarIcon, ChevronRight
} from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import DashboardStats from '../components/dashboard/DashboardStats';
import StreakWidget from '../components/dashboard/StreakWidget';
import SoundscapeSelector from '../components/dashboard/SoundscapeSelector';
import ThePathWidget from '../components/dashboard/ThePathWidget';
import ZenClock from '../components/dashboard/ZenClock';
import { useAnalytics } from '../hooks/useAnalytics';

const TaskCapture: React.FC = () => {
  const { stats, streaks } = useAnalytics();
  
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-full w-full max-w-[1600px] mx-auto pt-2"
    >

      <motion.div 
        layout
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        
        {/* Left Column: Sanctuary Status (3 cols) */}
        <motion.div layout variants={itemVariants} className="lg:col-span-3 flex flex-col gap-6">
          <DashboardStats />
          <StreakWidget streak={stats.currentStreak} bestStreak={streaks.length > 0 ? streaks.length : 0} />
        </motion.div>
 
        {/* Center Column: The Altar (6 cols) */}
        <motion.div layout variants={itemVariants} className="lg:col-span-6 flex flex-col gap-6">
          <GlassCard layout variant="icy" className="p-8 flex items-center justify-center min-h-[400px]">
            <ZenClock />
          </GlassCard>
 
          <GlassCard layout variant="icy" className="p-4">
            <SoundscapeSelector />
          </GlassCard>
        </motion.div>

        {/* Right Column: The Path (3 cols) */}
        <motion.div layout variants={itemVariants} className="lg:col-span-3 flex flex-col gap-6 h-full">
          <GlassCard layout variant="icy" className="flex-none p-5 flex flex-col gap-5 relative group">
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

          <ThePathWidget />
        </motion.div>

      </motion.div>
    </motion.div>
  );
};

export default TaskCapture;
