import React, { useState, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useAnalytics } from '../hooks/useAnalytics';
import GlassCard from '../components/ui/GlassCard';
import { 
  Flame, 
  CheckCircle2, 
  Trophy,
  TrendingUp,
  Activity,
  Clock
} from 'lucide-react';

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
      duration: 0.6, 
      ease: [0.16, 1, 0.3, 1] as any
    } 
  }
};

const FlowAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const { stats, streaks } = useAnalytics();

  // Map streaks to garden grid (49 cells = 7 weeks)
  const gardenData = useMemo(() => {
    const data = Array.from({ length: 49 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (48 - i));
      const dateStr = date.toISOString().split('T')[0];
      const streakEntry = streaks.find((s: any) => s.focus_date === dateStr);
      
      // Calculate opacity based on focus time (max 4 hours = 14400s)
      const focusTime = streakEntry ? streakEntry.total_focus_seconds : 0;
      const opacity = focusTime === 0 ? 0.05 : Math.min(0.15 + (focusTime / 14400) * 0.85, 1);
      
      return { dateStr, opacity, active: focusTime > 0 };
    });
    return data;
  }, [streaks]);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-screen pt-12 pb-20 px-6 max-w-7xl mx-auto"
    >
      <motion.header variants={itemVariants} className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-sage-200/10 flex items-center justify-center border border-sage-200/20">
              <Activity className="w-5 h-5 text-sage-200" />
            </div>
            <h2 className="text-sm uppercase tracking-[0.4em] text-white/30 font-light">
              Inner Rhythm
            </h2>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-light text-white tracking-tight">
            Flow <span className="text-white/40">Analytics</span>
          </h1>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-xl">
          {(['day', 'week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-2 rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ${
                timeRange === range 
                ? 'bg-sage-200/10 text-sage-200 shadow-lg' 
                : 'text-white/30 hover:text-white/60'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </motion.header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard 
          icon={Clock} 
          label="Focus Time" 
          value={`${stats.totalHours}h`} 
          subValue={`${stats.weekHours}h this week`} 
          trend={stats.totalHours > 0 ? "+100%" : "0%"} 
          color="sage"
        />
        <StatCard 
          icon={Flame} 
          label="Current Streak" 
          value={`${stats.currentStreak} Days`} 
          subValue="Keep the fire alive" 
          trend="Consistency" 
          color="amber"
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Tasks Done" 
          value={stats.tasksDone.toString()} 
          subValue="Completed in flow" 
          trend="Achievement" 
          color="blue"
        />
        <StatCard 
          icon={Trophy} 
          label="Sessions" 
          value={stats.totalSessions.toString()} 
          subValue={`${stats.sessionsToday} today`} 
          trend="Total Flow" 
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Large Stats View */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <GlassCard className="p-8 h-[450px] flex flex-col">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-xl font-display font-light text-white/80">Growth Summary</h3>
                <p className="text-xs text-white/30 tracking-widest uppercase mt-1">Deep work distribution</p>
              </div>
              <TrendingUp className="w-5 h-5 text-sage-200/40" />
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-display font-light text-white mb-4">84%</div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-sage-200/40 font-bold">Flow Efficiency</div>
              </div>
            </div>

            <div className="flex justify-between mt-8 text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold px-2">
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

        {/* Focus Garden / Heatmap */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <GlassCard className="p-8 h-full flex flex-col">
            <div className="mb-8">
              <h3 className="text-xl font-display font-light text-white/80">Focus Garden</h3>
              <p className="text-xs text-white/30 tracking-widest uppercase mt-1">Annual consistency</p>
            </div>
            
            <div className="grid grid-cols-7 gap-2 flex-1">
              {gardenData.map((day, i) => (
                <motion.div
                  key={day.dateStr}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.005 }}
                  className={`aspect-square rounded-sm transition-colors duration-500 hover:bg-white relative group/day ${day.active ? 'bg-sage-200' : 'bg-white/10'}`}
                  style={{ opacity: day.opacity }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-[8px] text-white rounded opacity-0 group-hover/day:opacity-100 whitespace-nowrap pointer-events-none z-50">
                    {day.dateStr}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/40">
                <span>Less Flow</span>
                <div className="flex gap-1">
                  {[0.1, 0.3, 0.6, 0.9].map((op) => (
                    <div key={op} className="w-2.5 h-2.5 rounded-sm bg-sage-200" style={{ opacity: op }} />
                  ))}
                </div>
                <span>Deep Flow</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
};

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue: string;
  trend: string;
  color: 'sage' | 'amber' | 'blue' | 'purple';
}

const StatCard = ({ icon: Icon, label, value, subValue, trend, color }: StatCardProps) => {
  const colors = {
    sage: 'text-sage-200 bg-sage-200/10 border-sage-200/20',
    amber: 'text-amber-200 bg-amber-200/10 border-amber-200/20',
    blue: 'text-blue-200 bg-blue-200/10 border-blue-200/20',
    purple: 'text-purple-200 bg-purple-200/10 border-purple-200/20',
  };

  return (
    <motion.div variants={itemVariants}>
      <GlassCard className="p-8 group hover:border-white/20 transition-all duration-500">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-6 border ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-white/30 text-[10px] uppercase tracking-[0.2em] mb-2 font-bold">{label}</div>
        <div className="text-3xl font-display font-light text-white mb-2">{value}</div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/20 uppercase tracking-widest">{subValue}</span>
          <span className={`text-[10px] font-bold ${trend.startsWith('+') ? 'text-sage-200/60' : 'text-white/40'}`}>
            {trend}
          </span>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default FlowAnalytics;
