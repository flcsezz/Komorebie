import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format, subDays, eachDayOfInterval, isToday as isDateToday, isYesterday as isDateYesterday } from 'date-fns';
import {
  Plus, X, Trash2, Flame, Pencil, Sprout, Flower2, Leaf, Snowflake
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import { useHabits } from '../hooks/useHabits';

const COLOR_MAP: Record<string, { ring: string; bg: string; text: string; glow: string; dot: string; shadow: string }> = {
  sage:   { ring: 'ring-sage-200/40', bg: 'bg-sage-200/15', text: 'text-sage-200', glow: 'shadow-[0_0_12px_rgba(183,201,176,0.4)]', dot: 'bg-sage-200', shadow: 'shadow-sage-200/20' },
  blue:   { ring: 'ring-blue-400/40', bg: 'bg-blue-400/15', text: 'text-blue-400', glow: 'shadow-[0_0_12px_rgba(96,165,250,0.4)]', dot: 'bg-blue-400', shadow: 'shadow-blue-400/20' },
  amber:  { ring: 'ring-amber-400/40', bg: 'bg-amber-400/15', text: 'text-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]', dot: 'bg-amber-400', shadow: 'shadow-amber-400/20' },
  rose:   { ring: 'ring-rose-400/40', bg: 'bg-rose-400/15', text: 'text-rose-400', glow: 'shadow-[0_0_12px_rgba(251,113,133,0.4)]', dot: 'bg-rose-400', shadow: 'shadow-rose-400/20' },
  violet: { ring: 'ring-violet-400/40', bg: 'bg-violet-400/15', text: 'text-violet-400', glow: 'shadow-[0_0_12px_rgba(167,139,250,0.4)]', dot: 'bg-violet-400', shadow: 'shadow-violet-400/20' },
  moss:   { ring: 'ring-emerald-500/40', bg: 'bg-emerald-500/15', text: 'text-emerald-400', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]', dot: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
};
const COLOR_KEYS = Object.keys(COLOR_MAP);

// ─── Animation Variants ──────────────────────────────────────────────────────
const GROWTH_VARIANTS = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
  exit: { scale: 0.8, opacity: 0 }
};

const HabitsPage: React.FC = () => {
  const {
    habits, loading,
    logs, toggle, addHabit,
    editHabit, removeHabit, freezeLog
  } = useHabits();

  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<{ id?: string; name: string; description: string; icon: string; color: string; frequency_type: 'daily' | 'specific_days' | 'x_per_week'; target_days: number[]; target_per_week: number } | null>(null);
  const [freezePrompt, setFreezePrompt] = useState<{ habitId: string; date: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Date range for the grid (15 days total, 10 visible)
  const [dateRange] = useState(() => {
    const end = new Date();
    const start = subDays(end, 14);
    return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
  });

  // Auto-scroll to the end (today) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [loading]);

  const openCreateModal = () => {
    setEditingHabit({ name: '', description: '', icon: 'circle-check', color: 'sage', frequency_type: 'daily', target_days: [], target_per_week: 3 });
    setShowModal(true);
  };

  const openEditModal = (h: typeof habits[0]) => {
    setEditingHabit({ id: h.id, name: h.name, description: h.description || '', icon: h.icon, color: h.color, frequency_type: h.frequency_type || 'daily', target_days: h.target_days || [], target_per_week: h.target_per_week || 3 });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingHabit || !editingHabit.name.trim()) return;
    setSaving(true);
    if (editingHabit.id) {
      await editHabit(editingHabit.id, {
        name: editingHabit.name, description: editingHabit.description,
        icon: editingHabit.icon, color: editingHabit.color,
        frequency_type: editingHabit.frequency_type, target_days: editingHabit.target_days, target_per_week: editingHabit.target_per_week
      });
    } else {
      await addHabit({
        name: editingHabit.name, description: editingHabit.description,
        icon: editingHabit.icon, color: editingHabit.color,
        frequency_type: editingHabit.frequency_type, target_days: editingHabit.target_days, target_per_week: editingHabit.target_per_week
      });
    }
    setSaving(false);
    setShowModal(false);
    setEditingHabit(null);
  };

  const handleDelete = async () => {
    if (!editingHabit?.id) return;
    setSaving(true);
    await removeHabit(editingHabit.id);
    setSaving(false);
    setShowModal(false);
    setEditingHabit(null);
  };

  const handleToggle = async (habitId: string, date: string) => {
    await toggle(habitId, date);
  };

  return (
    <div className="min-h-full w-full max-w-[1100px] mx-auto pt-8 px-4 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-display font-light text-white tracking-tight"
          >
            Daily <span className="text-sage-200 italic font-serif">Habits</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-white/60 tracking-widest uppercase font-medium"
          >
            Nurture your consistency
          </motion.p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-sage-200 text-slate-950 px-8 py-4 rounded-2xl font-bold transition-all shadow-[0_10px_30px_rgba(183,201,176,0.2)] text-sm cursor-pointer"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Plant New Habit
        </motion.button>
      </div>

      {/* Main Grid View */}
      <GlassCard variant="frosted" className="p-0 overflow-hidden border-white/10 shadow-2xl bg-black/20">
        <div className="flex h-full min-h-[500px]">
          {/* Left Column: Habit Labels */}
          <div className="w-[180px] md:w-[240px] flex-shrink-0 border-r border-white/10 bg-white/[0.03] z-10">
            <div className="h-16 border-b border-white/10 flex items-center px-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Habits</span>
            </div>
            <div className="py-4">
              {habits.map((habit) => (
                <div key={habit.id} className="h-20 flex flex-col justify-center px-6 group">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-white truncate group-hover:text-sage-200 transition-colors">
                        {habit.name}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <Flame className={`w-3 h-3 ${habit.currentStreak > 0 ? 'text-amber-400' : 'text-white/20'}`} />
                        <span className="text-[10px] font-bold text-white/50">{habit.currentStreak}d</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => openEditModal(habit)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {habits.length === 0 && !loading && (
                <div className="px-6 py-10 text-center">
                  <p className="text-xs text-white/40 italic">No seeds planted...</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Scrollable Dates & Grid */}
          <div className="flex-1 overflow-x-auto custom-scrollbar" ref={scrollRef}>
            <div className="min-w-max">
              {/* Date Header */}
              <div className="h-16 flex border-b border-white/10 bg-white/[0.02]">
                {dateRange.map((date) => {
                  const isToday = isDateToday(new Date(date + 'T00:00:00'));
                  return (
                    <div key={date} className={`w-20 flex flex-col items-center justify-center border-r border-white/10 ${isToday ? 'bg-sage-200/10' : ''}`}>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-0.5">
                        {format(new Date(date + 'T00:00:00'), 'EEE')}
                      </span>
                      <span className={`text-sm font-display ${isToday ? 'text-sage-200 font-bold' : 'text-white/80'}`}>
                        {format(new Date(date + 'T00:00:00'), 'd')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Grid Content */}
              <div className="py-4">
                {habits.map((habit) => {
                  const colors = COLOR_MAP[habit.color] || COLOR_MAP.sage;
                  return (
                    <div key={habit.id} className="h-20 flex">
                      {dateRange.map((date) => {
                        const done = logs.some(l => l.habit_id === habit.id && l.log_date === date && l.is_completed);
                        const isFrozen = logs.some(l => l.habit_id === habit.id && l.log_date === date && l.is_frozen);
                        const dateObj = new Date(date + 'T00:00:00');
                        const dayOfWeek = dateObj.getDay();
                        const isRequired = habit.frequency_type === 'daily' || (habit.frequency_type === 'specific_days' && (habit.target_days || []).includes(dayOfWeek));
                        const isPast = dateObj <= new Date();
                        const canToggle = isDateToday(dateObj) || isDateYesterday(dateObj);
                        
                        // Seed logic
                        const stage = habit.currentStreak >= 14 ? 'blooming' : habit.currentStreak >= 7 ? 'plant' : habit.currentStreak >= 3 ? 'sprout' : 'seed';

                        return (
                          <div 
                            key={`${habit.id}-${date}`} 
                            className={`w-20 border-r border-white/[0.08] flex items-center justify-center group/cell ${isDateToday(dateObj) ? 'bg-sage-200/[0.05]' : ''}`}
                          >
                            <button
                              disabled={!canToggle && !(isPast && !done && !isFrozen)}
                              onClick={() => {
                                if (canToggle) handleToggle(habit.id, date);
                                else setFreezePrompt({ habitId: habit.id, date });
                              }}
                              className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 cursor-pointer disabled:cursor-default ${
                                done || isFrozen
                                  ? `${colors.bg} ${colors.glow} ring-2 ${colors.ring}` 
                                  : isPast 
                                    ? isRequired ? 'bg-white/[0.05] hover:bg-white/[0.1] border border-transparent' : 'border border-dashed border-white/20 hover:bg-white/[0.1]'
                                    : 'opacity-10 pointer-events-none'
                              }`}
                            >
                              <AnimatePresence mode="wait">
                                {isFrozen ? (
                                  <motion.div key="frozen" variants={GROWTH_VARIANTS} initial="initial" animate="animate" exit="exit">
                                    <Snowflake className={`w-5 h-5 ${colors.text} filter drop-shadow-sm opacity-80`} strokeWidth={2.5} />
                                  </motion.div>
                                ) : done ? (
                                  <motion.div
                                    key="check"
                                    variants={GROWTH_VARIANTS}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                  >
                                    {stage === 'blooming' ? (
                                      <Flower2 className={`w-6 h-6 ${colors.text} filter drop-shadow-md animate-pulse`} strokeWidth={2.5} />
                                    ) : stage === 'plant' ? (
                                      <Leaf className={`w-5 h-5 ${colors.text} filter drop-shadow-sm`} strokeWidth={2.5} />
                                    ) : stage === 'sprout' ? (
                                      <Sprout className={`w-5 h-5 ${colors.text} filter drop-shadow-sm`} strokeWidth={2.5} />
                                    ) : (
                                      <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                                    )}
                                  </motion.div>
                                ) : (
                                  (canToggle || (isPast && !done && !isFrozen)) && (
                                    <motion.div 
                                      whileHover={{ scale: 1.2 }}
                                      className={`w-2.5 h-2.5 rounded-full bg-white/20 group-hover/cell:bg-white/40 transition-colors ${!isRequired && isPast ? 'opacity-50' : ''}`} 
                                    />
                                  )
                                )}
                              </AnimatePresence>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Legend / Stats */}
      <div className="mt-8 flex flex-wrap gap-6 items-center justify-center">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10">
          <div className="w-2 h-2 rounded-full bg-sage-200" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Seed (0-2d)</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10">
          <Sprout className="w-4 h-4 text-sage-200" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Sprout (3-6d)</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10">
          <Leaf className="w-4 h-4 text-sage-200" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Plant (7-13d)</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10">
          <Flower2 className="w-4 h-4 text-sage-200" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Blooming (14d+)</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10">
          <Snowflake className="w-4 h-4 text-blue-300" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Frozen Day</span>
        </div>
      </div>

      {/* Modals */}
      {createPortal(
        <AnimatePresence>
          {showModal && editingHabit && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg" onClick={() => setShowModal(false)} />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className="relative w-full max-w-md z-10"
              >
                <GlassCard variant="frosted" className="p-8 border-white/20 shadow-3xl bg-slate-900/40">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-display font-medium text-white">
                      {editingHabit.id ? 'Edit Habit' : 'New Habit'}
                    </h2>
                    <button onClick={() => setShowModal(false)} className="text-white/50 hover:text-white transition-colors cursor-pointer">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-2 font-bold">Habit Name</label>
                      <input
                        autoFocus type="text" value={editingHabit.name}
                        onChange={e => setEditingHabit({ ...editingHabit, name: e.target.value })}
                        className="w-full bg-white/[0.05] border border-white/20 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-sage-200 transition-colors"
                        placeholder="What are you nurturing?"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-2 font-bold">Color Theme</label>
                      <div className="flex gap-4">
                        {COLOR_KEYS.map(c => (
                          <button 
                            key={c} 
                            onClick={() => setEditingHabit({ ...editingHabit, color: c })}
                            className={`w-10 h-10 rounded-2xl ${COLOR_MAP[c].dot} transition-all cursor-pointer ${
                              editingHabit.color === c ? 'ring-2 ring-white ring-offset-4 ring-offset-slate-950 scale-110' : 'opacity-60 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-2 font-bold">Frequency</label>
                      <select
                        value={editingHabit.frequency_type}
                        onChange={e => setEditingHabit({ ...editingHabit, frequency_type: e.target.value as any })}
                        className="w-full bg-white/[0.05] border border-white/20 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-sage-200 transition-colors cursor-pointer appearance-none"
                      >
                        <option value="daily" className="bg-slate-900">Daily</option>
                        <option value="specific_days" className="bg-slate-900">Specific Days</option>
                        <option value="x_per_week" className="bg-slate-900">Times per Week</option>
                      </select>
                    </div>

                    {editingHabit.frequency_type === 'specific_days' && (
                      <div>
                        <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-2 font-bold">Days of the Week</label>
                        <div className="flex gap-2">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                            const isSelected = editingHabit.target_days.includes(i);
                            return (
                              <button
                                key={i}
                                onClick={() => {
                                  const newDays = isSelected 
                                    ? editingHabit.target_days.filter(d => d !== i)
                                    : [...editingHabit.target_days, i];
                                  setEditingHabit({ ...editingHabit, target_days: newDays });
                                }}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  isSelected ? 'bg-sage-200 text-slate-950' : 'bg-white/10 text-white/60 hover:bg-white/20'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {editingHabit.frequency_type === 'x_per_week' && (
                      <div>
                        <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-2 font-bold">Target Times per Week</label>
                        <input
                          type="number" min="1" max="7" value={editingHabit.target_per_week}
                          onChange={e => setEditingHabit({ ...editingHabit, target_per_week: parseInt(e.target.value) || 1 })}
                          className="w-full bg-white/[0.05] border border-white/20 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-sage-200 transition-colors"
                        />
                      </div>
                    )}

                    <div className="flex gap-4 pt-6 border-t border-white/10">
                      {editingHabit.id && (
                        <button 
                          onClick={handleDelete}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-bold cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </button>
                      )}
                      <button 
                        onClick={handleSave}
                        className="flex-[2] bg-sage-200 text-slate-950 py-3 rounded-xl font-bold hover:bg-sage-200/90 transition-all shadow-lg text-sm cursor-pointer"
                      >
                        {saving ? 'Saving...' : editingHabit.id ? 'Update Habit' : 'Plant Habit'}
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

      {/* Freeze Confirmation Modal */}
      {createPortal(
        <AnimatePresence>
          {freezePrompt && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg" onClick={() => setFreezePrompt(null)} />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className="relative w-full max-w-sm z-10"
              >
                <GlassCard variant="frosted" className="p-8 border-blue-400/20 shadow-[0_0_30px_rgba(96,165,250,0.15)] bg-slate-900/40">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-display font-medium text-white flex items-center gap-2">
                      <Snowflake className="w-5 h-5 text-blue-400" />
                      Freeze this day?
                    </h2>
                  </div>
                  <p className="text-sm text-white/70 mb-8">
                    Use 100 Mana to preserve your streak for <strong className="text-white">{freezePrompt.date}</strong>? You can't undo this action.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setFreezePrompt(null)}
                      className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-colors text-sm font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={async () => {
                        if (!freezePrompt) return;
                        const p = freezePrompt;
                        setFreezePrompt(null);
                        await freezeLog(p.habitId, p.date);
                      }}
                      className="flex-1 bg-blue-400 text-slate-950 py-3 rounded-xl font-bold hover:bg-blue-300 transition-all text-sm cursor-pointer"
                    >
                      Use Mana
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default HabitsPage;
