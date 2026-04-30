import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { format, addDays, startOfWeek, subDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Clock, X, Trash2 } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import ZenSelect from '../components/ui/ZenSelect';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

// --- Types ---
type EventColor = 'blue' | 'sage' | 'rose' | 'amber' | 'slate';

interface ScheduleEvent {
  id: string;
  title: string;
  notes?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  color: EventColor;
}

// --- Mock Data ---
const initialEvents: ScheduleEvent[] = [
  { id: '1', title: 'Deep Work Session', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '11:00', color: 'sage' },
  { id: '2', title: 'Review PRs', date: format(new Date(), 'yyyy-MM-dd'), startTime: '13:00', endTime: '14:30', color: 'blue' },
  { id: '3', title: 'Planning', date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), startTime: '10:00', endTime: '11:30', color: 'amber' },
];

const COLORS: Record<EventColor, { bg: string, border: string, text: string }> = {
  blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-200' },
  sage: { bg: 'bg-sage-500/20', border: 'border-sage-500/30', text: 'text-sage-200' },
  rose: { bg: 'bg-rose-500/20', border: 'border-rose-500/30', text: 'text-rose-200' },
  amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-200' },
  slate: { bg: 'bg-slate-500/20', border: 'border-slate-500/30', text: 'text-slate-200' }
};

const HOUR_HEIGHT = 60; // pixels per hour
const MINUTE_HEIGHT = HOUR_HEIGHT / 60;

// Helper to convert HH:mm to minutes from midnight
const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Helper to convert minutes to HH:mm
const minutesToTime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const HOUR_OPTIONS = Array.from({ length: 12 }).map((_, i) => (i + 1).toString().padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 12 }).map((_, i) => (i * 5).toString().padStart(2, '0'));
const AMPM_OPTIONS = ['AM', 'PM'];

const parseTime = (time24: string) => {
  if (!time24) return { hour: '12', minute: '00', ampm: 'AM' };
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return {
    hour: h.toString().padStart(2, '0'),
    minute: mStr.padStart(2, '0'),
    ampm
  };
};

const formatTime = (hour: string, minute: string, ampm: string) => {
  let h = parseInt(hour, 10);
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
};

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.05,
      delayChildren: 0.1,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const eventVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      delay: 0.6, // Wait for calendar widget to finish
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1]
    } 
  }
};

export default function SchedulePage() {
  const [view, setView] = useState<'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>(initialEvents);
  
  // Modals and Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  
  // Current Time Line
  const [now, setNow] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  const scrollToNow = () => {
    if (scrollContainerRef.current) {
      const minutes = now.getHours() * 60 + now.getMinutes();
      const top = minutes * MINUTE_HEIGHT;
      scrollContainerRef.current.scrollTo({ top: Math.max(0, top - 200), behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Initial scroll
    setTimeout(scrollToNow, 100);
  }, [view]);

  // Derived state
  const startDate = view === 'week' ? startOfWeek(currentDate, { weekStartsOn: 1 }) : currentDate;
  const days = Array.from({ length: view === 'week' ? 7 : 1 }).map((_, i) => addDays(startDate, i));

  // Handlers
  const handlePrev = () => setCurrentDate(prev => subDays(prev, view === 'week' ? 7 : 1));
  const handleNext = () => setCurrentDate(prev => addDays(prev, view === 'week' ? 7 : 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleSaveEvent = (event: ScheduleEvent) => {
    if (events.find(e => e.id === event.id)) {
      setEvents(events.map(e => e.id === event.id ? event : e));
    } else {
      setEvents([...events, event]);
    }
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const openNewModal = (dateStr?: string, timeStr?: string) => {
    const d = dateStr || format(currentDate, 'yyyy-MM-dd');
    const start = timeStr || '09:00';
    setEditingEvent({
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      date: d,
      startTime: start,
      endTime: minutesToTime(timeToMinutes(start) + 60),
      color: 'sage'
    });
    setIsModalOpen(true);
  };

  // Drag state
  const [dragState, setDragState] = useState<{ id: string, type: 'move' | 'resize', startY: number, initialStartMins: number, initialEndMins: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent, event: ScheduleEvent, type: 'move' | 'resize') => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragState({
      id: event.id,
      type,
      startY: e.clientY,
      initialStartMins: timeToMinutes(event.startTime),
      initialEndMins: timeToMinutes(event.endTime)
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    const deltaY = e.clientY - dragState.startY;
    const deltaMins = Math.round((deltaY / MINUTE_HEIGHT) / 15) * 15; // snap to 15 mins

    setEvents(events.map(ev => {
      if (ev.id !== dragState.id) return ev;
      if (dragState.type === 'move') {
        const newStart = Math.max(0, Math.min(24 * 60 - 15, dragState.initialStartMins + deltaMins));
        const duration = dragState.initialEndMins - dragState.initialStartMins;
        return {
          ...ev,
          startTime: minutesToTime(newStart),
          endTime: minutesToTime(Math.min(24 * 60, newStart + duration))
        };
      } else {
        const newEnd = Math.max(dragState.initialStartMins + 15, Math.min(24 * 60, dragState.initialEndMins + deltaMins));
        return {
          ...ev,
          endTime: minutesToTime(newEnd)
        };
      }
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragState) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDragState(null);
    }
  };

  return (
    <>
    <motion.div 
      className="h-full flex flex-col pt-12 max-w-[1400px] mx-auto px-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-display font-light text-white">
            {format(currentDate, view === 'week' ? 'MMMM yyyy' : 'MMMM d, yyyy')}
          </h1>
          <div className="flex bg-white/5 p-1 rounded-xl backdrop-blur-md border border-white/10">
            <button 
              onClick={handlePrev}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleToday}
              className="px-3 py-1.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
            >
              Today
            </button>
            <button 
              onClick={handleNext}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl backdrop-blur-md border border-white/10">
            <button 
              onClick={() => setView('day')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${view === 'day' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'}`}
            >
              Day
            </button>
            <button 
              onClick={() => setView('week')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${view === 'week' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'}`}
            >
              Week
            </button>
          </div>
          <button 
            onClick={() => openNewModal()}
            className="flex items-center gap-2 bg-sage-200 hover:bg-sage-300 text-slate-950 px-5 py-2 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(183,201,176,0.4)]"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </motion.div>

      {/* Calendar Body */}
      <motion.div variants={itemVariants} className="flex-1 flex flex-col overflow-hidden mb-6 relative">
        <GlassCard variant="frosted" className="flex-1 flex flex-col overflow-hidden relative h-full">
        {/* Days Header */}
        <div className="flex border-b border-white/10 pr-4"> {/* pr-4 to account for scrollbar */}
          <div className="w-16 flex-shrink-0" /> {/* Time axis spacer */}
          {days.map((day, i) => (
            <div key={i} className="flex-1 text-center py-4 border-l border-white/5">
              <div className="text-xs font-medium text-white/50 uppercase tracking-wider">{format(day, 'EEE')}</div>
              <div className={`text-xl font-display mt-1 ${isSameDay(day, new Date()) ? 'text-sage-400 font-semibold' : 'text-white/90'}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable Grid */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto relative"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
            {/* Time Axis */}
            <div className="w-16 flex-shrink-0 border-r border-white/5 relative">
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="absolute w-full text-right pr-2 text-xs text-white/40 font-medium" style={{ top: h * HOUR_HEIGHT - 8 }}>
                  {h === 0 ? '' : format(new Date().setHours(h, 0), 'h a')}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {days.map((day, i) => {
              const dayEvents = events.filter(e => e.date === format(day, 'yyyy-MM-dd'));
              const isToday = isSameDay(day, now);

              return (
                <div key={i} className="flex-1 border-r border-white/5 relative group cursor-crosshair" onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('.event-block')) return;
                  
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const mins = Math.floor(y / MINUTE_HEIGHT / 15) * 15;
                  openNewModal(format(day, 'yyyy-MM-dd'), minutesToTime(mins));
                }}>
                  {/* Grid Lines */}
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h} className="absolute w-full border-t border-white/5 pointer-events-none" style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }} />
                  ))}

                  {/* Current Time Indicator */}
                  {isToday && (
                    <div className="absolute w-full z-20 pointer-events-none" style={{ top: (now.getHours() * 60 + now.getMinutes()) * MINUTE_HEIGHT }}>
                      <div className="h-px bg-red-500 relative">
                        <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                      </div>
                    </div>
                  )}

                  {/* Events */}
                  {dayEvents.map(event => {
                    const startMins = timeToMinutes(event.startTime);
                    const endMins = timeToMinutes(event.endTime);
                    const isDragging = dragState?.id === event.id;

                    return (
                      <motion.div
                        key={event.id}
                        layoutId={event.id}
                        variants={eventVariants}
                        initial="hidden"
                        animate="show"
                        onPointerDown={(e) => handlePointerDown(e, event, 'move')}
                        onClick={(e) => { e.stopPropagation(); setEditingEvent(event); setIsModalOpen(true); }}
                        className={`event-block absolute left-1 right-1 rounded-lg border p-2 overflow-hidden cursor-grab active:cursor-grabbing ${COLORS[event.color].bg} ${COLORS[event.color].border} ${isDragging ? 'z-30 shadow-2xl scale-[1.02]' : 'z-10'} transition-transform`}
                        style={{
                          top: startMins * MINUTE_HEIGHT,
                          height: (endMins - startMins) * MINUTE_HEIGHT,
                        }}
                      >
                        <div className={`text-xs font-semibold ${COLORS[event.color].text} truncate`}>{event.title}</div>
                        <div className="text-[10px] text-white/50 truncate mt-0.5">{event.startTime} - {event.endTime}</div>
                        
                        {/* Resize Handle */}
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center hover:bg-white/10 transition-colors"
                          onPointerDown={(e) => handlePointerDown(e, event, 'resize')}
                        >
                          <div className="w-8 h-1 rounded-full bg-white/20" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll to current time button */}
        <button 
          onClick={scrollToNow}
          className="absolute bottom-6 right-6 p-3 bg-slate-800 border border-white/10 rounded-full text-white/70 hover:text-white shadow-lg hover:bg-slate-700 transition-all backdrop-blur-md z-40"
          title="Scroll to current time"
        >
          <Clock className="w-5 h-5" />
        </button>
      </GlassCard>
      </motion.div>
      </motion.div>

      {/* Event Modal (Rendered via Portal to escape transforms) */}
      {createPortal(
        <AnimatePresence>
          {isModalOpen && editingEvent && (
            <div className="fixed inset-0 z-[100] pointer-events-none p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto"
                onClick={() => setIsModalOpen(false)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="absolute pointer-events-auto w-full max-w-sm top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <GlassCard variant="frosted" className="p-5 shadow-2xl border-white/20">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-display font-medium text-white">
                    {events.find(e => e.id === editingEvent.id) ? 'Edit Event' : 'New Event'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Title</label>
                    <input 
                      autoFocus
                      type="text" 
                      value={editingEvent.title}
                      onChange={e => setEditingEvent({...editingEvent, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-sage-200/50 transition-colors"
                      placeholder="e.g., Deep Work Session"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Date</label>
                      <input 
                        type="date" 
                        value={editingEvent.date}
                        style={{ colorScheme: 'dark' }}
                        onChange={e => setEditingEvent({...editingEvent, date: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-sage-200/50 transition-colors cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-4 col-span-2 sm:col-span-1">
                      <div>
                        <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Start</label>
                        <div className="flex gap-1.5">
                          <ZenSelect 
                            value={parseTime(editingEvent.startTime).hour}
                            onChange={val => {
                              const p = parseTime(editingEvent.startTime);
                              setEditingEvent({...editingEvent, startTime: formatTime(val, p.minute, p.ampm)});
                            }}
                            options={HOUR_OPTIONS}
                          />
                          <span className="flex items-center text-white/50 font-bold">:</span>
                          <ZenSelect 
                            value={parseTime(editingEvent.startTime).minute}
                            onChange={val => {
                              const p = parseTime(editingEvent.startTime);
                              setEditingEvent({...editingEvent, startTime: formatTime(p.hour, val, p.ampm)});
                            }}
                            options={MINUTE_OPTIONS}
                          />
                          <ZenSelect 
                            value={parseTime(editingEvent.startTime).ampm}
                            onChange={val => {
                              const p = parseTime(editingEvent.startTime);
                              setEditingEvent({...editingEvent, startTime: formatTime(p.hour, p.minute, val)});
                            }}
                            options={AMPM_OPTIONS}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">End</label>
                        <div className="flex gap-1.5">
                          <ZenSelect 
                            value={parseTime(editingEvent.endTime).hour}
                            onChange={val => {
                              const p = parseTime(editingEvent.endTime);
                              setEditingEvent({...editingEvent, endTime: formatTime(val, p.minute, p.ampm)});
                            }}
                            options={HOUR_OPTIONS}
                          />
                          <span className="flex items-center text-white/50 font-bold">:</span>
                          <ZenSelect 
                            value={parseTime(editingEvent.endTime).minute}
                            onChange={val => {
                              const p = parseTime(editingEvent.endTime);
                              setEditingEvent({...editingEvent, endTime: formatTime(p.hour, val, p.ampm)});
                            }}
                            options={MINUTE_OPTIONS}
                          />
                          <ZenSelect 
                            value={parseTime(editingEvent.endTime).ampm}
                            onChange={val => {
                              const p = parseTime(editingEvent.endTime);
                              setEditingEvent({...editingEvent, endTime: formatTime(p.hour, p.minute, val)});
                            }}
                            options={AMPM_OPTIONS}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Color</label>
                    <div className="flex gap-3">
                      {(Object.keys(COLORS) as EventColor[]).map(c => (
                        <button
                          key={c}
                          onClick={() => setEditingEvent({...editingEvent, color: c})}
                          className={`w-8 h-8 rounded-full ${COLORS[c].bg} border-2 ${editingEvent.color === c ? 'border-white' : 'border-transparent'} transition-all hover:scale-110`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Notes</label>
                    <textarea 
                      value={editingEvent.notes || ''}
                      onChange={e => setEditingEvent({...editingEvent, notes: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-sage-200/50 transition-colors resize-none h-24"
                      placeholder="Add any context or links..."
                    />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-6">
                    {events.find(e => e.id === editingEvent.id) ? (
                      <button 
                        onClick={() => handleDeleteEvent(editingEvent.id)}
                        className="text-red-400 hover:text-red-300 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    ) : <div />}
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleSaveEvent(editingEvent)}
                        className="bg-sage-200 hover:bg-sage-300 text-slate-950 px-6 py-2 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(183,201,176,0.4)] text-sm"
                      >
                        Save
                      </button>
                    </div>
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
}
