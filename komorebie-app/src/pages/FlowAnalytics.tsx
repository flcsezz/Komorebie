import React from 'react';
import { motion, type Variants } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';

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

const FlowAnalytics: React.FC = () => {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-screen pt-32 pb-20 px-4 max-w-6xl mx-auto"
    >
      <motion.header variants={itemVariants} className="mb-20">
        <h2 className="text-sm uppercase tracking-[0.4em] text-white/30 mb-4 font-light">
          Growth through Rhythm
        </h2>
        <h1 className="text-4xl md:text-5xl font-display font-light">Flow Analytics</h1>
      </motion.header>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <motion.div variants={itemVariants}><StatCard title="Focus Time" value="42.5h" trend="+12%" /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Deep Work Ratio" value="78%" trend="+5%" /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Sessions" value="124" trend="+8%" /></motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <GlassCard animateCard={false} className="h-96 flex flex-col justify-end p-8">
          <div className="flex justify-between items-end gap-2 h-64">
            {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 bg-sage-200/20 rounded-t-lg relative group"
              >
                <div className="absolute inset-0 bg-sage-200/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg shadow-[0_0_20px_rgba(183,201,176,0.2)]" />
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-6 text-[10px] uppercase tracking-widest text-white/20 font-light px-2">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div variants={itemVariants}>
          <GlassCard animateCard={false} className="p-8">
            <h3 className="text-lg font-display font-light mb-6 text-white/60">Wisdom from the Garden</h3>
            <p className="text-white/40 font-light leading-relaxed">
              You are most focused between 9:00 AM and 11:30 AM. 
              Try scheduling your most demanding tasks during this window to maintain your rhythm.
            </p>
          </GlassCard>
        </motion.div>
        <motion.div variants={itemVariants}>
          <GlassCard animateCard={false} className="p-8">
            <h3 className="text-lg font-display font-light mb-6 text-white/60">Next Goal</h3>
            <p className="text-white/40 font-light leading-relaxed">
              Aim for a 3-hour deep work block tomorrow. Your current average is 2.4 hours. 
              The garden awaits your stillness.
            </p>
          </GlassCard>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const StatCard = ({ title, value, trend }: { title: string, value: string, trend: string }) => (
  <GlassCard animateCard={false} className="p-8">
    <div className="text-white/30 text-xs uppercase tracking-widest mb-4 font-light">{title}</div>
    <div className="text-4xl font-display font-light mb-2">{value}</div>
    <div className="text-sage-200/60 text-xs font-light">{trend} this week</div>
  </GlassCard>
);

export default FlowAnalytics;
