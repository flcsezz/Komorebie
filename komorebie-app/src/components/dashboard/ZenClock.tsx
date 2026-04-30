import React, { useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { useZenClock } from '../../context/ZenClockContext';

const ZenClock: React.FC = () => {
  const {
    timeLeft,
    duration,
    isActive,
    isPomodoroMode,
    pomodoroState,
    pomodoroCycle,
    toggleTimer,
    setDuration,
    setIsPomodoroMode
  } = useZenClock();

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
    if (!isActive && !isPomodoroMode) {
      setDuration(Math.min(duration + 5, 240));
    }
  };

  const handleDecrement = () => {
    if (!isActive && !isPomodoroMode) {
      setDuration(Math.max(duration - 5, 5));
    }
  };

  const totalSeconds = duration * 60;
  // Progress goes from 0 to 1
  const progress = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0;
  const dotsToLight = Math.floor(progress * 60);

  const formatTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getThemeColor = () => {
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
  const centerX = 225; 
  const centerY = 225;
  const circumference = 2 * Math.PI * (radius + 15);

  return (
    <motion.div 
      layout
      className={`relative flex flex-col items-center justify-center w-full transition-all duration-700 ease-in-out ${
        isActive ? 'min-h-[580px]' : 'min-h-[480px]'
      } group/clock overflow-hidden`}
    >
      {/* Pomodoro Top Tag */}
      <AnimatePresence mode="wait">
        {isPomodoroMode && (
          <motion.div
            key={pomodoroState}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute top-6 px-4 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-widest z-30 ${
              pomodoroState === 'work' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}
          >
            {pomodoroState === 'work' ? `FOCUS · CYCLE ${pomodoroCycle}/4` :
             pomodoroState === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK'}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        layout
        className={`relative flex items-center justify-center transition-all duration-700 ${
          isActive ? 'scale-110' : 'scale-100'
        }`}
        style={{ width: '450px', height: '450px' }}
      >
        
        {/* Subtle Tomato Background in Pomodoro Mode */}
        <AnimatePresence>
          {isPomodoroMode && (
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
          viewBox="0 0 450 450" 
          className="absolute inset-0 w-full h-full z-10"
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
            animate={{ strokeDashoffset: circumference - (progress * circumference) }}
            transition={{ duration: isActive ? 1.05 : 0.4, ease: isActive ? "linear" : "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 8px ${themeColor}66)`
            }}
          />

          {/* Dot Matrix Ring */}
          {dots.map((_, i) => {
            const angle = (i * 6) * (Math.PI / 180);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            const isLit = i < dotsToLight;
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
                  {!isActive && !isPomodoroMode && (
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
                  key={isActive ? 'active' : 'setup'}
                  initial={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.1, filter: 'blur(4px)' }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-7xl md:text-8xl font-bold tracking-tight text-white tabular-nums flex-shrink-0 min-w-[200px] md:min-w-[260px] text-center"
                >
                  {isActive ? formatTime() : <motion.span>{roundedDuration}</motion.span>}
                </motion.div>
              </AnimatePresence>

              {/* Plus Button */}
              <div className="w-12 flex justify-start">
                <AnimatePresence>
                  {!isActive && !isPomodoroMode && (
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
              layout
              className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/30 mt-4"
            >
              {isActive ? 'Remaining' : 'Minutes'}
            </motion.div>
            
            {/* Start / Stop Toggle */}
            <motion.button
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTimer}
              className={`mt-6 px-12 py-3.5 rounded-full border transition-all duration-500 cursor-pointer font-display font-bold text-[12px] uppercase tracking-[0.25em] ${
                isActive 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]' 
                  : isPomodoroMode 
                    ? pomodoroState === 'work' 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                    : 'bg-sage-200/10 border-sage-200/20 text-sage-200 hover:bg-sage-200/20 shadow-[0_0_30px_rgba(183,201,176,0.15)]'
              }`}
            >
              {isActive ? 'STOP' : 'START'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Pomodoro Toggle */}
      <AnimatePresence>
        {!isActive && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-0 right-0 z-30"
          >
            <div className="flex items-center gap-3 bg-slate-950/40 backdrop-blur-md border border-white/5 pl-4 pr-1.5 py-1.5 rounded-full shadow-xl opacity-0 group-hover/clock:opacity-100 transition-all duration-500 ease-in-out">
              <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Pomodoro</span>
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

      {/* Breathing Indicator - Atmospheric Glow */}
      <motion.div
        animate={{
          scale: isActive ? [1, 1.2, 1] : 1,
          opacity: isActive ? [0.4, 0.7, 0.4] : 0.15,
        }}
        transition={{
          duration: isActive ? 3 : 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute w-[450px] h-[450px] rounded-full blur-[90px] -z-10 pointer-events-none transition-colors duration-1000 ${
          isPomodoroMode 
            ? pomodoroState === 'work' ? 'bg-red-500/10' : 'bg-blue-500/10'
            : 'bg-sage-200/5'
        }`}
      />
    </motion.div>
  );
};

export default ZenClock;