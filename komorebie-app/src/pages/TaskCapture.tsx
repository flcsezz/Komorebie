import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Calendar as CalendarIcon, ChevronRight, X, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import DashboardStats from '../components/dashboard/DashboardStats';
import StreakWidget from '../components/dashboard/StreakWidget';
import SoundscapeSelector from '../components/dashboard/SoundscapeSelector';
import ThePathWidget from '../components/dashboard/ThePathWidget';
import ZenClock from '../components/dashboard/ZenClock';
import { useZenClock } from '../context/ZenClockContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuth } from '../context/AuthContext';
import { createDeadline, deleteDeadline } from '../lib/analytics';

const TaskCapture: React.FC = () => {
  const { stats, streakDates, deadlines, refresh } = useAnalytics();
  const { isActive } = useZenClock();
  const { user } = useAuth();

  // Deadline modal
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlineTitle, setDeadlineTitle] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineDesc, setDeadlineDesc] = useState('');
  const [savingDeadline, setSavingDeadline] = useState(false);

  const handleCreateDeadline = async () => {
    if (!user || !deadlineTitle || !deadlineDate) return;
    setSavingDeadline(true);
    await createDeadline({
      user_id: user.id,
      title: deadlineTitle,
      deadline_date: deadlineDate,
      description: deadlineDesc,
    });
    setDeadlineTitle('');
    setDeadlineDate('');
    setDeadlineDesc('');
    setShowDeadlineModal(false);
    setSavingDeadline(false);
    refresh();
  };

  const handleDeleteDeadline = async (id: string) => {
    await deleteDeadline(id);
    refresh();
  };

  // Calculate days until deadline
  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    return `In ${diff} days`;
  };

  const getDeadlineColor = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { bg: 'bg-red-400/5', border: 'border-red-400/10', text: 'text-red-200/70', sub: 'text-red-200/30' };
    if (diff <= 2) return { bg: 'bg-orange-400/5', border: 'border-orange-400/10', text: 'text-orange-200/70', sub: 'text-orange-200/30' };
    if (diff <= 7) return { bg: 'bg-amber-400/5', border: 'border-amber-400/10', text: 'text-amber-200/70', sub: 'text-amber-200/30' };
    return { bg: 'bg-sage-200/5', border: 'border-sage-200/10', text: 'text-sage-200/70', sub: 'text-sage-200/30' };
  };

  // Filter active (non-completed, non-past) deadlines
  const activeDeadlines = deadlines
    .filter(d => !d.is_completed)
    .slice(0, 3); // Show max 3 on dashboard

  return (
    <>
    <div className="min-h-full w-full max-w-[1800px] mx-auto pt-0 px-8">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Column: Streak + Analytics */}
        <div 
          className="w-full lg:w-auto flex flex-col gap-4 transition-all duration-700 ease-in-out"
          style={{ flex: isActive ? '2.43 1 0%' : '2.67 1 0%' }}
        >
          <StreakWidget 
            currentStreak={stats.currentStreak} 
            bestStreak={stats.bestStreak} 
            streakDates={streakDates}
          />
          <DashboardStats />
        </div>
 
        {/* Center Column: The Altar */}
        <div 
          className="w-full lg:w-auto flex flex-col gap-4 transition-all duration-700 ease-in-out"
          style={{ flex: isActive ? '6.78 1 0%' : '6.55 1 0%' }}
        >
          <GlassCard variant="icy" className="p-6 flex items-center justify-center min-h-[380px]">
            <ZenClock />
          </GlassCard>
 
          <GlassCard variant="icy" className="p-3">
            <SoundscapeSelector />
          </GlassCard>
        </div>

        {/* Right Column: Deadlines + The Path */}
        <div 
          className="w-full lg:w-auto flex flex-col gap-4 h-full transition-all duration-700 ease-in-out"
          style={{ flex: isActive ? '2.79 1 0%' : '2.78 1 0%' }}
        >
          {/* Deadlines Widget */}
          <GlassCard variant="icy" className="flex-none p-4 flex flex-col gap-3 relative group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] font-bold text-white/30">
                <CalendarIcon className="w-3.5 h-3.5" />
                Deadlines
              </div>
              <button 
                onClick={() => setShowDeadlineModal(true)}
                className="text-[8px] uppercase tracking-widest text-sage-200/40 hover:text-sage-200 font-bold transition-colors cursor-pointer"
              >
                + Add
              </button>
            </div>
            <div className="space-y-2.5">
              <AnimatePresence mode="popLayout">
                {activeDeadlines.length > 0 ? (
                  activeDeadlines.map((d) => {
                    const colors = getDeadlineColor(d.deadline_date);
                    return (
                      <motion.div 
                        key={d.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        layout
                        className={`p-3 ${colors.bg} border ${colors.border} rounded-xl flex justify-between items-center group/item cursor-pointer transition-all hover:scale-[1.01]`}
                      >
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <span className={`text-[10px] ${colors.text} font-medium truncate`}>{d.title}</span>
                          <span className={`text-[8px] ${colors.sub} uppercase tracking-widest font-bold`}>
                            {getDaysUntil(d.deadline_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteDeadline(d.id); }}
                            className="p-1 rounded-lg text-white/10 hover:text-red-400/60 hover:bg-red-400/5 transition-all opacity-0 group-hover/item:opacity-100 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <ChevronRight className="w-3 h-3 text-white/10 group-hover/item:translate-x-0.5 transition-transform" />
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4"
                  >
                    <p className="text-[9px] text-white/15 uppercase tracking-widest font-bold">No deadlines set</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={() => setShowDeadlineModal(true)}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[8px] uppercase tracking-widest font-bold text-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:text-white/40"
              >
                <Plus className="w-3 h-3" />
                Add Deadline
              </button>
            </div>
          </GlassCard>

          <ThePathWidget />
        </div>

      </div>
    </div>

    {/* Deadline Creation Modal */}
    {createPortal(
      <AnimatePresence>
        {showDeadlineModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              onClick={() => setShowDeadlineModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm z-10"
            >
              <GlassCard variant="frosted" className="p-6 shadow-2xl border-white/20">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-display font-medium text-white">New Deadline</h2>
                  <button onClick={() => setShowDeadlineModal(false)} className="text-white/50 hover:text-white transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5 font-bold">Title</label>
                    <input 
                      autoFocus
                      type="text" 
                      value={deadlineTitle}
                      onChange={e => setDeadlineTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-sage-200/40 transition-colors"
                      placeholder="e.g., Midterm: CS201"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5 font-bold">Due Date</label>
                    <input 
                      type="date" 
                      value={deadlineDate}
                      style={{ colorScheme: 'dark' }}
                      onChange={e => setDeadlineDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sage-200/40 transition-colors cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5 font-bold">Description (Optional)</label>
                    <textarea 
                      value={deadlineDesc}
                      onChange={e => setDeadlineDesc(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-sage-200/40 transition-colors resize-none h-20"
                      placeholder="Add notes..."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setShowDeadlineModal(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all font-medium text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreateDeadline}
                      disabled={!deadlineTitle || !deadlineDate || savingDeadline}
                      className="flex-1 bg-sage-200 hover:bg-sage-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(183,201,176,0.3)] text-sm cursor-pointer"
                    >
                      {savingDeadline ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
};

export default TaskCapture;
