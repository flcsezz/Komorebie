import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Tag, Plus, ChevronDown, Trash2, Settings, Play, Square } from 'lucide-react';
import { useZenClock } from '../../hooks/useZenClock';
import { useDataSync } from '../../context/DataSyncContext';

const ALARM_PRESETS = [
  { id: 'none', name: 'No Alarm', url: 'none' },
  { id: 'zen-bell', name: 'Zen Bell', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  { id: 'digital', name: 'Digital', url: 'https://assets.mixkit.co/active_storage/sfx/1003/1003-preview.mp3' },
  { id: 'birds', name: 'Birds', url: 'https://assets.mixkit.co/active_storage/sfx/134/134-preview.mp3' },
  { id: 'bowl', name: 'Tibetan Bowl', url: 'https://assets.mixkit.co/active_storage/sfx/2865/2865-preview.mp3' },
];

const PRESET_COLORS = [
  { name: 'Sage', value: '#B7C9B0' },
  { name: 'Forest', value: '#829B74' },
  { name: 'Sakura', value: '#EFC7C8' },
  { name: 'Sunset Gold', value: '#D4AF37' },
  { name: 'Lavender', value: '#BDB2FF' },
  { name: 'Ocean Blue', value: '#A0C4FF' },
  { name: 'Teal', value: '#9BF6FF' },
  { name: 'Mint', value: '#CAFFBF' },
  { name: 'Apricot', value: '#FFD6A5' },
  { name: 'Coral', value: '#FFADAD' },
];

const ZenClock: React.FC = () => {
  const {
    timeLeft,
    duration,
    isActive,
    isPomodoroMode,
    pomodoroState,
    pomodoroCycle,
    selectedAlarm,
    isSessionComplete,
    toggleTimer,
    setDuration,
    setIsPomodoroMode,
    setSelectedAlarm,
    completeSession,
    skipBreak,
    currentTag,
    setCurrentTag,
    pomodoroWorkTime,
    pomodoroBreakTime,
    pomodoroLongBreakTime,
    setPomodoroWorkTime,
    setPomodoroBreakTime,
    setPomodoroLongBreakTime
  } = useZenClock();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'timer' | 'pomodoro' | 'alarm'>('timer');

  // Input states for Timer Section
  const [timerMinutesInput, setTimerMinutesInput] = useState(duration.toString());

  // Input states for Pomodoro Section
  const [pomodoroWorkInput, setPomodoroWorkInput] = useState(pomodoroWorkTime.toString());
  const [pomodoroBreakInput, setPomodoroBreakInput] = useState(pomodoroBreakTime.toString());
  const [pomodoroLongBreakInput, setPomodoroLongBreakInput] = useState(pomodoroLongBreakTime.toString());

  // Preview Audio states for Alarms Section
  const [previewingAlarmId, setPreviewingAlarmId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const { tagColors, setTagColor, deleteTag } = useDataSync();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync inputs with state when modal is opened or state changes
  useEffect(() => {
    if (showSettingsModal) {
      setTimerMinutesInput(duration.toString());
      setPomodoroWorkInput(pomodoroWorkTime.toString());
      setPomodoroBreakInput(pomodoroBreakTime.toString());
      setPomodoroLongBreakInput(pomodoroLongBreakTime.toString());
    }
  }, [showSettingsModal, duration, pomodoroWorkTime, pomodoroBreakTime, pomodoroLongBreakTime]);

  // Dropdown click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleDeleteTag = async (tagToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentTag === tagToDelete) {
      setCurrentTag(null);
    }
    await deleteTag(tagToDelete);
  };

  const unusedPresets = PRESET_COLORS.filter(preset => 
    !Object.values(tagColors).some(usedColor => usedColor.toLowerCase() === preset.value.toLowerCase())
  );

  const handleToggleAlarmPreview = (id: string, url: string) => {
    if (previewingAlarmId === id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewingAlarmId(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(url);
      audio.volume = 0.4;
      previewAudioRef.current = audio;
      setPreviewingAlarmId(id);
      audio.play().catch(err => console.error("Alarm preview failed:", err));
      
      // Auto-stop preview after 4 seconds
      const timeout = setTimeout(() => {
        if (previewAudioRef.current === audio) {
          audio.pause();
          setPreviewingAlarmId(null);
        }
      }, 4000);

      audio.onended = () => {
        clearTimeout(timeout);
        setPreviewingAlarmId(null);
      };
    }
  };

  const handleCloseSettings = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPreviewingAlarmId(null);
    setShowSettingsModal(false);
  };

  // Motion values for smooth counting
  const displayDuration = useMotionValue(duration);
  const roundedDuration = useTransform(displayDuration, (v) => Math.round(v));

  useEffect(() => {
    // When duration changes, animate the displayed number
    const controls = animate(displayDuration, duration, {
      duration: 0.5,
      ease: "easeOut"
    });
    return () => controls.stop();
  }, [duration, displayDuration]);

  const handleIncrement = () => {
    if (!isActive && !isPomodoroMode && !isSessionComplete) {
      if (duration < 5) {
        setDuration(5);
      } else {
        setDuration(Math.min(duration + 5, 240));
      }
    }
  };

  const handleDecrement = () => {
    if (!isActive && !isPomodoroMode && !isSessionComplete) {
      if (duration > 5) {
        setDuration(duration - 5);
      } else if (duration > 0.2) { // approx 5 mins
        setDuration(10 / 60);
      }
    }
  };

  const totalSeconds = duration * 60;
  // Progress goes from 0 to 1, clamped to prevent visual glitches in overtime
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(1, (totalSeconds - timeLeft) / totalSeconds)) : 0;
  const dotsToLight = Math.floor(progress * 60);

  const formatTime = () => {
    const absSeconds = Math.abs(timeLeft);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getThemeColor = () => {
    if (isSessionComplete) return '#4ade80'; // Green
    if (!isPomodoroMode) return '#B7C9B0'; // sage-200
    if (pomodoroState === 'work') return '#ef4444'; // red-500
    return '#60a5fa'; // blue-400
  };

  const themeColor = getThemeColor();

  /**
   * Layout Constants
   */
  const dots = Array.from({ length: 60 });
  const radius = 190; 
  const centerX = 250; 
  const centerY = 250;
  const circumference = 2 * Math.PI * (radius + 15);

  const canSkipBreak = isPomodoroMode && isActive && !isSessionComplete && (pomodoroState === 'shortBreak' || pomodoroState === 'longBreak');

  return (
    <motion.div 
      className={`relative flex flex-col items-center justify-center w-full transition-all duration-700 ease-in-out ${
        isActive ? 'min-h-[450px] md:min-h-[580px]' : 'min-h-[350px] md:min-h-[480px]'
      } group/clock`}
    >
      {/* Pomodoro Top Tag */}
      <AnimatePresence mode="wait">
        {isPomodoroMode && !isSessionComplete && (
          <motion.div
            key={pomodoroState}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute top-0 md:top-6 px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest z-30 ${
              pomodoroState === 'work' ? 'bg-red-500/15 border-red-500/30 text-red-400' : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
            }`}
          >
            {pomodoroState === 'work' ? `FOCUS · CYCLE ${pomodoroCycle}/4` :
             pomodoroState === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK'}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className={`relative flex items-center justify-center transition-all duration-700 w-full max-w-[500px] aspect-square ${
          isActive || isSessionComplete ? 'scale-105 md:scale-110' : 'scale-95 md:scale-100'
        }`}
      >
        
        {/* Subtle Tomato Background in Pomodoro Mode */}
        <AnimatePresence>
          {isPomodoroMode && !isSessionComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.04, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
            >
              <svg width="320" height="320" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-red-500">
                <path d="M12 21c-5.5 0-9-3-9-8s3-9 9-9 9 4 9 9-3.5 8-9 8z" fill="currentColor"/>
                <path d="M12 4V2M12 4c-1.5 0-3-2-3-2M12 4c1.5 0 3-2 3-2" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Ring Configuration */}
        <svg 
          viewBox="0 0 500 500" 
          className="absolute inset-0 w-full h-full z-10 overflow-visible"
          style={{ transform: 'rotate(90deg) scaleX(-1)' }}
        >
          {/* Background Track */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius + 15}
            fill="none"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth="1"
          />
          
          {/* Active Smooth Progress */}
          <motion.circle
            cx={centerX}
            cy={centerY}
            r={radius + 15}
            fill="none"
            stroke={themeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ 
              strokeDashoffset: isSessionComplete ? 0 : circumference - (progress * circumference),
            }}
            transition={{ 
              strokeDashoffset: { duration: isActive && !isSessionComplete ? 1.05 : 0.4, ease: isActive ? "linear" : "easeOut" },
            }}
            className={isSessionComplete ? "animate-pulse-glow" : ""}
            style={{
              '--glow-color': isSessionComplete ? 'rgba(74, 222, 128, 0.6)' : (themeColor === '#B7C9B0' ? 'rgba(183, 201, 176, 0.6)' : `${themeColor}66`)
            } as React.CSSProperties}
          />

          {/* Dot Matrix Ring */}
          {dots.map((_, i) => {
            const angle = (i * 6) * (Math.PI / 180);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            const isLit = i < dotsToLight || isSessionComplete;
            const isQuarter = i % 15 === 0;
            
            return (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r={isQuarter ? 3 : 1.5}
                initial={false}
                animate={{
                  fill: isLit ? themeColor : (isQuarter ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)'),
                  opacity: isLit ? 1 : 0.6,
                  filter: isLit ? `drop-shadow(0 0 4px ${themeColor}CC)` : 'none'
                }}
                transition={{ duration: 0.5 }}
              />
            );
          })}
        </svg>

        {/* Timer Control Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center font-display z-20">
          
          <div className="flex flex-col items-center justify-center scale-90 md:scale-100">
            <div className="relative flex items-center justify-center w-full px-4 gap-4 md:gap-6">
              
              {/* Minus Button */}
              <div className="w-12 flex justify-end">
                <AnimatePresence>
                  {!isActive && !isPomodoroMode && !isSessionComplete && duration > 0.2 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex justify-end"
                    >
                      <button 
                        onClick={handleDecrement}
                        className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-sage-200 hover:bg-white/10 transition-all duration-500 ease-in-out cursor-pointer opacity-0 group-hover/clock:opacity-100 shrink-0"
                      >
                        <span className="text-3xl font-light">-</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Time Display */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={isActive || isSessionComplete || duration < 1 ? 'active' : 'setup'}
                  initial={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.1, filter: 'blur(4px)' }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={`text-7xl md:text-8xl font-bold tracking-tight tabular-nums flex-shrink-0 min-w-[200px] md:min-w-[260px] text-center ${isSessionComplete ? 'text-green-400' : 'text-white'}`}
                >
                  {isActive || isSessionComplete || duration < 1 ? formatTime() : <motion.span>{roundedDuration}</motion.span>}
                </motion.div>
              </AnimatePresence>

              {/* Plus Button */}
              <div className="w-12 flex justify-start">
                <AnimatePresence>
                  {!isActive && !isPomodoroMode && !isSessionComplete && duration < 240 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex justify-start"
                    >
                      <button 
                        onClick={handleIncrement}
                        className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-sage-200 hover:bg-white/10 transition-all duration-500 ease-in-out cursor-pointer opacity-0 group-hover/clock:opacity-100 shrink-0"
                      >
                        <span className="text-3xl font-light">+</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
            </div>
            
            <motion.div 
              className="text-[11px] font-mono uppercase tracking-[0.4em] text-white/50 mt-4 h-3 flex items-center justify-center"
            >
              {!isSessionComplete && (isActive ? (timeLeft < 0 ? 'Overtime' : 'Remaining') : 'Minutes')}
            </motion.div>
            
            {/* Start / Stop Toggle */}
            <div className="flex flex-col items-center gap-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isSessionComplete ? completeSession : toggleTimer}
                className={`px-12 py-3.5 rounded-full border transition-all duration-500 cursor-pointer font-display font-bold text-[13px] uppercase tracking-[0.25em] ${
                  isSessionComplete
                    ? 'bg-green-500/20 border-green-500/40 text-green-400 animate-pulse-glow'
                    : isActive 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]' 
                      : isPomodoroMode 
                        ? pomodoroState === 'work' 
                          ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                        : 'bg-sage-200/10 border-sage-200/20 text-sage-200 hover:bg-sage-200/20 shadow-[0_0_30px_rgba(183,201,176,0.15)]'
                }`}
                style={isSessionComplete ? {
                  '--glow-color': 'rgba(74, 222, 128, 0.4)'
                } as React.CSSProperties : {}}
              >
                {isSessionComplete ? 'COMPLETE SESSION' : isActive ? 'STOP' : 'START'}
              </motion.button>

              <AnimatePresence>
                {canSkipBreak && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={skipBreak}
                    className="px-6 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Skip Break
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tag Selector Pill / Dropdown */}
      <motion.div
        initial={{ y: 15 }}
        animate={{ y: 0 }}
        className="mt-6 flex flex-col items-center gap-2 z-30 opacity-0 group-hover/clock:opacity-100 focus-within:opacity-100 transition-opacity duration-500"
      >
        {Object.keys(tagColors).length === 0 ? (
          <motion.button
            whileHover={!isActive ? { scale: 1.05 } : {}}
            whileTap={!isActive ? { scale: 0.95 } : {}}
            onClick={() => {
              if (isActive) return;
              setNewTagName('');
              setNewTagColor(unusedPresets[0]?.value || '#B7C9B0');
              setErrorMsg('');
              setShowAddModal(true);
            }}
            disabled={isActive}
            className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 bg-slate-950/40 text-white/70 hover:border-white/20 transition-all duration-300 cursor-pointer text-xs font-semibold uppercase tracking-wider shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5 text-sage-200" />
            Add Tag
          </motion.button>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={!isActive ? { scale: 1.02 } : {}}
              whileTap={!isActive ? { scale: 0.98 } : {}}
              onClick={() => !isActive && setShowDropdown(!showDropdown)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all duration-300 ${
                isActive 
                  ? 'bg-slate-950/20 border-white/5 text-white/40 cursor-default' 
                  : 'bg-slate-950/40 border-white/10 text-white/80 hover:border-white/20 cursor-pointer'
              }`}
            >
              <Tag className="w-3.5 h-3.5" style={{ color: currentTag ? (tagColors[currentTag] || '#B7C9B0') : 'rgba(255,255,255,0.4)' }} />
              <span className="text-[13px] font-sans font-medium tracking-wide truncate max-w-[100px]">
                {currentTag || 'No Tag'}
              </span>
              {!isActive && <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />}
            </motion.button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-slate-900/90 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1"
                >
                  {/* No Tag Option */}
                  <button
                    onClick={() => {
                      setCurrentTag(null);
                      setShowDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-left text-[11px] font-semibold tracking-wider uppercase transition-colors hover:bg-white/5 ${
                      !currentTag ? 'text-sage-200 bg-white/5' : 'text-white/50'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    No Tag
                  </button>
                  
                  <div className="h-[1px] bg-white/5 my-1" />

                  {/* Tags List */}
                  <div className="max-h-36 overflow-y-auto flex flex-col gap-0.5 custom-scrollbar">
                    {Object.keys(tagColors).map((tag) => {
                      const color = tagColors[tag];
                      const isSelected = currentTag === tag;
                      return (
                        <div
                          key={tag}
                          className={`group/item w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all ${
                            isSelected ? 'bg-white/5 text-white' : 'text-white/60 hover:bg-white/5'
                          }`}
                        >
                          <button
                            onClick={() => {
                              setCurrentTag(tag);
                              setShowDropdown(false);
                            }}
                            className="flex-1 flex items-center gap-2 text-left text-[11px] font-semibold truncate capitalize"
                          >
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="truncate">{tag}</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteTag(tag, e)}
                            className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded text-white/40 hover:text-red-400 transition-all ml-1 cursor-pointer"
                            title="Delete Tag"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="h-[1px] bg-white/5 my-1" />

                  {/* Add Tag Option */}
                  {Object.keys(tagColors).length >= 6 ? (
                    <div className="w-full text-center px-3 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest text-white/30 bg-white/[0.02]">
                      Max Tags
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setNewTagName('');
                        setNewTagColor(unusedPresets[0]?.value || '#B7C9B0');
                        setErrorMsg('');
                        setShowDropdown(false);
                        setShowAddModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-center text-[10px] font-bold uppercase tracking-wider text-sage-200 hover:text-white bg-sage-200/10 border border-sage-200/20 hover:bg-sage-200/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Add Tag
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Add Tag Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-950/30 backdrop-blur-md"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-slate-900/90 border border-white/10 p-6 rounded-3xl shadow-2xl backdrop-blur-2xl z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <Tag className="w-5 h-5 text-sage-200" />
                  <div>
                    <h4 className="text-sm font-display font-medium text-white uppercase tracking-wider">
                      Create New Tag
                    </h4>
                    <p className="text-[9px] font-mono text-white/40 uppercase">
                      Customize your tag & color
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-xl bg-white/5 border border-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Tag Name (Max 13 Chars)</label>
                  <input
                    type="text"
                    maxLength={13}
                    placeholder="e.g. coding"
                    value={newTagName}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow letters, numbers, spaces, hyphens, and underscores only
                      const sanitized = val.replace(/[^a-zA-Z0-9\s-_]/g, '');
                      setNewTagName(sanitized);
                      if (tagColors[sanitized.trim()]) {
                        setErrorMsg('Tag name already exists');
                      } else {
                        setErrorMsg('');
                      }
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-sage-200/40 focus:ring-0 transition-colors"
                  />
                  {errorMsg && <p className="text-red-400 text-[10px] mt-1 font-mono uppercase">{errorMsg}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Select Unique Color</label>
                  
                  {/* Preset Colors Grid */}
                  <div className="grid grid-cols-5 gap-3.5 mb-4">
                    {PRESET_COLORS.map((preset) => {
                      const isSelected = newTagColor.toLowerCase() === preset.value.toLowerCase();
                      const isUsed = Object.values(tagColors).some(usedColor => usedColor.toLowerCase() === preset.value.toLowerCase());
                      
                      return (
                        <button
                          key={preset.name}
                          disabled={isUsed}
                          onClick={() => {
                            setNewTagColor(preset.value);
                          }}
                          className={`
                            w-8 h-8 rounded-full relative cursor-pointer transition-all duration-300 hover:scale-110
                            ${isSelected ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-80'}
                            ${isUsed ? 'opacity-20 cursor-not-allowed line-through' : ''}
                          `}
                          style={{ backgroundColor: preset.value }}
                          title={isUsed ? `${preset.name} (Already in use)` : preset.name}
                        >
                          {isSelected && (
                            <div className="absolute inset-0 rounded-full border border-white/40 scale-120 animate-pulse" />
                          )}
                          {isUsed && (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold opacity-60">✕</div>
                          )}
                        </button>
                      );
                    })}

                    {/* Custom Color Input Wrapper */}
                    <div className="relative w-8 h-8 rounded-full border border-white/10 overflow-hidden flex items-center justify-center bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 hover:scale-110 transition-all cursor-pointer">
                      <input
                        type="color"
                        value={newTagColor.startsWith('#') ? newTagColor : '#B7C9B0'}
                        onChange={(e) => {
                          const color = e.target.value;
                          setNewTagColor(color);
                          const exists = Object.values(tagColors).some(usedColor => usedColor.toLowerCase() === color.toLowerCase());
                          if (exists) {
                            setErrorMsg('Color is already assigned to another tag');
                          } else {
                            setErrorMsg('');
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        title="Custom Color"
                      />
                      <span className="text-[10px] font-bold text-white pointer-events-none">+</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!newTagName.trim() || !!errorMsg || Object.keys(tagColors).length >= 6}
                  onClick={async () => {
                    const name = newTagName.trim();
                    if (!name) return;
                    
                    await setTagColor(name, newTagColor);
                    setCurrentTag(name);
                    setShowAddModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-sage-200 text-slate-950 text-[10px] font-bold uppercase tracking-widest hover:bg-sage-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(183,201,176,0.2)] cursor-pointer"
                >
                  Create Tag
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alarms and Pomodoro Toggle Section */}
      <AnimatePresence>
        {!isActive && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-0 right-0 z-40 flex flex-col items-end gap-3"
          >
            {/* Settings Gear Button */}
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 cursor-pointer bg-slate-950/40 border-white/5 text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover/clock:opacity-100 focus-visible:opacity-100 outline-none"
              title="Zen Clock Settings"
              aria-label="Zen Clock Settings"
            >
              <Settings className="w-4 h-4 transition-transform duration-500 hover:rotate-45" />
            </button>

            {/* Pomodoro Toggle */}
            <div className="flex items-center gap-3 bg-slate-950/40 backdrop-blur-md border border-white/5 pl-4 pr-1.5 py-1.5 rounded-full shadow-xl opacity-0 group-hover/clock:opacity-100 transition-all duration-500 ease-in-out">
              <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Pomodoro</span>
              <button 
                onClick={() => setIsPomodoroMode(!isPomodoroMode)}
                className={`w-12 h-6 rounded-full relative transition-colors ${isPomodoroMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5 border border-white/10'}`}
              >
                <motion.div 
                  layout
                  className={`w-4 h-4 rounded-full absolute top-1 flex items-center justify-center ${isPomodoroMode ? 'bg-red-500 right-1' : 'bg-white/30 left-1'}`}
                >
                  {/* Tomato Stem */}
                  {isPomodoroMode && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="absolute -top-1 w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_4px_rgba(74,222,128,0.8)]" 
                    />
                  )}
                </motion.div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ZenClock Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseSettings}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-slate-950/85 border border-white/10 p-6 rounded-3xl shadow-2xl backdrop-blur-2xl z-10 overflow-hidden"
            >
              {/* Glow accent */}
              <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-sage-200/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2.5">
                  <Settings className="w-5 h-5 text-sage-200 animate-spin-slow" />
                  <div>
                    <h4 className="text-sm font-display font-medium text-white uppercase tracking-wider">
                      ZenClock Settings
                    </h4>
                    <p className="text-[9px] font-mono text-white/40 uppercase">
                      Customize your focus sanctuary
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseSettings}
                  className="p-1 rounded-xl bg-white/5 border border-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="flex bg-white/5 p-1 rounded-2xl mb-6 relative z-10 border border-white/5">
                {(['timer', 'pomodoro', 'alarm'] as const).map((tab) => {
                  const isActiveTab = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all relative cursor-pointer ${
                        isActiveTab ? 'text-slate-950 font-black' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {isActiveTab && (
                        <motion.div
                          layoutId="activeSettingsTab"
                          className="absolute inset-0 bg-sage-200 rounded-xl -z-10 shadow-lg"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="min-h-[220px] flex flex-col justify-between relative z-10">
                <AnimatePresence mode="wait">
                  {activeTab === 'timer' && (
                    <motion.div
                      key="timer-tab"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-4"
                    >
                      <div>
                        <label className="block text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5">
                          Standard Duration (Minutes)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            max={240}
                            placeholder="e.g. 25"
                            value={timerMinutesInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*$/.test(val)) {
                                setTimerMinutesInput(val);
                              }
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-sage-200/40 transition-colors"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/20 uppercase">
                            min
                          </span>
                        </div>
                        <p className="text-[9px] font-mono text-white/30 mt-2 uppercase tracking-wide">
                          ⚠️ Value must be between 1 and 240 minutes.
                        </p>
                      </div>

                      <button
                        disabled={
                          !timerMinutesInput || 
                          isNaN(parseInt(timerMinutesInput, 10)) || 
                          parseInt(timerMinutesInput, 10) < 1 || 
                          parseInt(timerMinutesInput, 10) > 240
                        }
                        onClick={() => {
                          const m = parseInt(timerMinutesInput, 10);
                          setDuration(m);
                          handleCloseSettings();
                        }}
                        className="w-full mt-4 py-3 rounded-xl bg-sage-200 text-slate-950 text-[10px] font-bold uppercase tracking-widest hover:bg-sage-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(183,201,176,0.2)] cursor-pointer"
                      >
                        Save Timer Duration
                      </button>
                    </motion.div>
                  )}

                  {activeTab === 'pomodoro' && (
                    <motion.div
                      key="pomodoro-tab"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5">
                            Focus Interval
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={1}
                              max={180}
                              placeholder="25"
                              value={pomodoroWorkInput}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d*$/.test(val)) {
                                  setPomodoroWorkInput(val);
                                }
                              }}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-sage-200/40 transition-colors"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/20 uppercase">
                              min
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5">
                            Short Break
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={1}
                              max={180}
                              placeholder="5"
                              value={pomodoroBreakInput}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d*$/.test(val)) {
                                  setPomodoroBreakInput(val);
                                }
                              }}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-sage-200/40 transition-colors"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/20 uppercase">
                              min
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5">
                          Long Break
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            max={180}
                            placeholder="15"
                            value={pomodoroLongBreakInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*$/.test(val)) {
                                setPomodoroLongBreakInput(val);
                              }
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-sage-200/40 transition-colors"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/20 uppercase">
                            min
                          </span>
                        </div>
                      </div>

                      <p className="text-[9px] font-mono text-white/30 uppercase tracking-wide">
                        ⚠️ Focus & Break intervals must be between 1 and 180 minutes.
                      </p>

                      <button
                        disabled={
                          !pomodoroWorkInput || isNaN(parseInt(pomodoroWorkInput, 10)) || parseInt(pomodoroWorkInput, 10) < 1 || parseInt(pomodoroWorkInput, 10) > 180 ||
                          !pomodoroBreakInput || isNaN(parseInt(pomodoroBreakInput, 10)) || parseInt(pomodoroBreakInput, 10) < 1 || parseInt(pomodoroBreakInput, 10) > 180 ||
                          !pomodoroLongBreakInput || isNaN(parseInt(pomodoroLongBreakInput, 10)) || parseInt(pomodoroLongBreakInput, 10) < 1 || parseInt(pomodoroLongBreakInput, 10) > 180
                        }
                        onClick={() => {
                          const w = parseInt(pomodoroWorkInput, 10);
                          const b = parseInt(pomodoroBreakInput, 10);
                          const lb = parseInt(pomodoroLongBreakInput, 10);
                          setPomodoroWorkTime(w);
                          setPomodoroBreakTime(b);
                          setPomodoroLongBreakTime(lb);
                          
                          if (isPomodoroMode && !isActive) {
                            const nextDur = pomodoroState === 'work' ? w : (pomodoroState === 'shortBreak' ? b : lb);
                            setDuration(nextDur);
                          }
                          handleCloseSettings();
                        }}
                        className="w-full mt-2 py-3 rounded-xl bg-sage-200 text-slate-950 text-[10px] font-bold uppercase tracking-widest hover:bg-sage-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(183,201,176,0.2)] cursor-pointer"
                      >
                        Save Pomodoro Intervals
                      </button>
                    </motion.div>
                  )}

                  {activeTab === 'alarm' && (
                    <motion.div
                      key="alarm-tab"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar w-full"
                    >
                      {ALARM_PRESETS.map((alarm) => {
                        const isSelected = selectedAlarm === alarm.url;
                        const isTesting = previewingAlarmId === alarm.id;
                        return (
                          <div
                            key={alarm.id}
                            className={`flex items-center justify-between p-2 rounded-2xl border transition-all duration-300 ${
                              isSelected 
                                ? 'bg-sage-200/10 border-sage-200/30 text-white' 
                                : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
                            }`}
                          >
                            <div className="flex flex-col pl-2">
                              <span className="text-xs font-semibold tracking-wide capitalize">
                                {alarm.name}
                              </span>
                              <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">
                                {alarm.id === 'none' ? 'silent finish' : 'audio cue'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Test Button */}
                              {alarm.url !== 'none' && (
                                <button
                                  onClick={() => handleToggleAlarmPreview(alarm.id, alarm.url)}
                                  className={`p-2 rounded-xl transition-all border flex items-center justify-center cursor-pointer ${
                                    isTesting 
                                      ? 'bg-red-500/20 border-red-500/30 text-red-400' 
                                      : 'bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10'
                                  }`}
                                  title={isTesting ? "Stop Test" : "Test Alarm"}
                                >
                                  {isTesting ? (
                                    <Square className="w-3.5 h-3.5 fill-red-400/20" strokeWidth={2} />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 fill-white/10" strokeWidth={2} />
                                  )}
                                </button>
                              )}

                              {/* Apply Button */}
                              <button
                                onClick={() => {
                                  setSelectedAlarm(alarm.url);
                                }}
                                className={`px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                                  isSelected 
                                    ? 'bg-sage-200 text-slate-950 border-sage-200 shadow-md font-black' 
                                    : 'bg-slate-950/40 border-white/5 text-white/50 hover:text-white hover:border-white/10'
                                }`}
                              >
                                {isSelected ? 'Applied' : 'Apply'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Breathing Indicator - Atmospheric Glow */}
      <motion.div
        animate={{
          scale: isActive || isSessionComplete ? [1, 1.2, 1] : 1,
          opacity: isActive || isSessionComplete ? [0.4, 0.7, 0.4] : 0.15,
        }}
        transition={{
          duration: isActive ? 3 : 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute w-[450px] h-[450px] rounded-full blur-[90px] -z-10 pointer-events-none transition-colors duration-1000 ${
          isSessionComplete 
            ? 'bg-green-500/20'
            : isPomodoroMode 
              ? pomodoroState === 'work' ? 'bg-red-500/10' : 'bg-blue-500/10'
              : 'bg-sage-200/5'
        }`}
      />
    </motion.div>
  );
};

export default ZenClock;