import React from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon, Flame, Zap, Target, TrendingUp } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

interface StatItemProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon: Icon, label, value, subValue, color }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 text-[8px] uppercase tracking-[0.2em] text-white/30 font-bold">
      <Icon className={`w-3 h-3 ${color}`} strokeWidth={2.5} />
      {label}
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-display font-light text-white/90">{value}</span>
      {subValue && <span className="text-[10px] text-white/20 font-light">{subValue}</span>}
    </div>
  </div>
);

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const DashboardStats: React.FC = () => {
  return (
    <motion.div variants={itemVariants} className="flex flex-col gap-5">
      {/* Streak & Mana Quick View */}
      <motion.div variants={itemVariants}>
        <GlassCard variant="icy" animateCard={false} className="p-5 flex flex-col gap-6 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sage-200/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-sage-200/10 transition-all duration-700" />
          
          <StatItem 
            icon={Flame} 
            label="Current Streak" 
            value={12} 
            subValue="Days" 
            color="text-orange-400/60" 
          />
          
          <StatItem 
            icon={Zap} 
            label="Sanctuary Mana" 
            value={1420} 
            subValue="Available" 
            color="text-sage-200" 
          />
        </GlassCard>
      </motion.div>

      {/* Focus Rhythm */}
      <motion.div variants={itemVariants} className="flex-1">
        <GlassCard variant="icy" animateCard={false} className="h-full p-5 flex flex-col relative group">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-[8px] uppercase tracking-[0.2em] text-white/30 font-bold">
              <Target className="w-3.5 h-3.5" />
              Focus Rhythm
            </div>
            <TrendingUp className="w-3.5 h-3.5 text-sage-200/40" />
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-white/40 font-light">Today's Focus</span>
                <span className="text-lg font-display font-light">4h 20m</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] as const }}
                  className="h-full bg-sage-200/40 rounded-full shadow-[0_0_10px_rgba(183,201,176,0.3)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 items-end h-16 mt-8">
              {[30, 45, 20, 80, 60, 40, 90].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.05 }}
                  className={`rounded-t-sm ${i === 6 ? 'bg-sage-200/40' : 'bg-white/10'}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[6px] uppercase tracking-widest text-white/20 font-bold">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span className="text-sage-200/40">S</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Companion Progress */}
      <motion.div variants={itemVariants}>
        <GlassCard variant="icy" animateCard={false} className="p-4 flex items-center gap-4 group cursor-pointer hover:border-white/20 transition-all">
          <div className="w-12 h-12 rounded-xl bg-slate-950/40 flex items-center justify-center border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-sage-200/10 animate-breath" />
            <span className="text-lg relative z-10">🦊</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold mb-0.5">Companion</span>
            <span className="text-xs text-white/70 font-medium">Forest Fox · Lvl 4</span>
            <div className="w-24 h-1 bg-slate-950/40 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-sage-200/40 rounded-full" style={{ width: '65%' }} />
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default DashboardStats;
