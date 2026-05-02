import React, { useMemo } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import GlassCard from '../components/ui/GlassCard';
import { motion } from 'framer-motion';
import { 
  Flame, 
  CheckCircle2, 
  Trophy,
  TrendingUp,
  Activity,
  Clock
} from 'lucide-react';

const FlowAnalytics: React.FC = () => {
  const { stats, streakDates } = useAnalytics();

  // Map streaks to garden grid (49 cells = 7 weeks)
  const gardenData = useMemo(() => {
    return Array.from({ length: 49 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (48 - i));
      const dateStr = date.toISOString().split('T')[0];
      const entry = streakDates.get(dateStr);
      
      const focusTime = entry ? entry.seconds : 0;
      const opacity = focusTime === 0 ? 0.05 : Math.min(0.15 + (focusTime / 14400) * 0.85, 1);
      
      return { dateStr, opacity, active: focusTime > 0 };
    });
  }, [streakDates]);

  // Weekly distribution data for bar chart
  const weeklyBarData = useMemo(() => {
    return stats.weeklyData.map(d => ({
      ...d,
      hours: Math.round((d.focusSeconds / 3600) * 10) / 10,
      percent: Math.max(d.focusSeconds > 0 ? 8 : 3, (d.focusSeconds / Math.max(...stats.weeklyData.map(w => w.focusSeconds), 1)) * 100),
    }));
  }, [stats.weeklyData]);

  const totalHoursFormatted = stats.totalHours >= 1 ? `${stats.totalHours}h` : `${Math.floor(stats.totalHours * 60)}m`;

  return (
    <div className="min-h-screen pt-12 pb-20 px-6 max-w-7xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
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
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard 
          icon={Clock} 
          label="Focus Time" 
          value={totalHoursFormatted} 
          subValue={`${stats.weekHours}h this week`} 
          trend={stats.totalHours > 0 ? `${stats.sessionsToday} today` : "Start a session"} 
          color="sage"
        />
        <StatCard 
          icon={Flame} 
          label="Current Streak" 
          value={`${stats.currentStreak}`} 
          subValue={`Best: ${stats.bestStreak} days`} 
          trend={stats.currentStreak > 0 ? "🔥 Active" : "Inactive"} 
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
        {/* Weekly Distribution */}
        <div className="lg:col-span-2">
          <GlassCard className="p-8 h-[450px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-display font-light text-white/80">Weekly Focus</h3>
                <p className="text-xs text-white/30 tracking-widest uppercase mt-1">This week's distribution</p>
              </div>
              <TrendingUp className="w-5 h-5 text-sage-200/40" />
            </div>

            {/* Bar Chart */}
            <div className="flex-1 flex items-end gap-3 px-4">
              {weeklyBarData.map((d, i) => {
                const isToday = i === weeklyBarData.length - 1;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group/bar relative">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900/95 border border-white/10 text-[9px] text-white/70 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                      {d.hours}h
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${d.percent}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      className={`w-full max-w-[60px] rounded-t-lg transition-colors ${
                        isToday ? 'bg-sage-200/50 shadow-[0_0_12px_rgba(183,201,176,0.2)]' 
                        : d.focusSeconds > 0 ? 'bg-white/15 hover:bg-white/25' : 'bg-white/5'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between mt-4 px-4">
              {weeklyBarData.map((d, i) => {
                const isToday = i === weeklyBarData.length - 1;
                return (
                  <div key={`label-${d.date}`} className={`flex-1 text-center text-[11px] font-semibold tracking-wide ${isToday ? 'text-sage-200/60' : 'text-white/30'}`}>
                    {d.day}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Focus Garden / Heatmap */}
        <div className="lg:col-span-1">
          <GlassCard className="p-8 h-full flex flex-col">
            <div className="mb-8">
              <h3 className="text-xl font-display font-light text-white/80">Focus Garden</h3>
              <p className="text-xs text-white/30 tracking-widest uppercase mt-1">Last 7 weeks</p>
            </div>
            
            <div className="grid grid-cols-7 gap-2 flex-1">
              {gardenData.map((day) => (
                <div
                  key={day.dateStr}
                  className={`aspect-square rounded-sm transition-colors duration-500 hover:ring-1 hover:ring-white/20 relative group/day ${day.active ? 'bg-sage-200' : 'bg-white/10'}`}
                  style={{ opacity: day.opacity }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-[8px] text-white rounded opacity-0 group-hover/day:opacity-100 whitespace-nowrap pointer-events-none z-50">
                    {day.dateStr}
                  </div>
                </div>
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
        </div>
      </div>
    </div>
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
    <div>
      <GlassCard className="p-8 group hover:border-white/20 transition-all duration-500">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-6 border ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-white/30 text-[10px] uppercase tracking-[0.2em] mb-2 font-bold">{label}</div>
        <div className="text-3xl font-display font-light text-white mb-2">{value}</div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/20 uppercase tracking-widest">{subValue}</span>
          <span className={`text-[10px] font-bold ${trend.includes('🔥') || trend.includes('today') ? 'text-sage-200/60' : 'text-white/40'}`}>
            {trend}
          </span>
        </div>
      </GlassCard>
    </div>
  );
};

export default FlowAnalytics;
