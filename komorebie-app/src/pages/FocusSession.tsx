import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, Square } from 'lucide-react';
import { useZenClock } from '../context/ZenClockContext';

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

const FocusSession: React.FC = () => {
  const {
    timeLeft,
    duration,
    isActive,
    toggleTimer,
    resetTimer
  } = useZenClock();
  
  const navigate = useNavigate();
  const location = useLocation();
  const task = location.state?.task || "Deep Work";

  React.useEffect(() => {
    if (timeLeft === 0 && isActive) {
      navigate('/app/analytics');
    }
  }, [timeLeft, isActive, navigate]);

  const onEnd = () => {
    resetTimer();
    navigate('/app/analytics');
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / (duration * 60)) * 100;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-screen flex flex-col items-center justify-center relative"
    >
      <motion.div variants={itemVariants} className="relative w-80 h-80 flex items-center justify-center">
        {/* Progress Circle */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="160"
            cy="160"
            r="150"
            className="stroke-white/5 fill-none"
            strokeWidth="2"
          />
          <motion.circle
            cx="160"
            cy="160"
            r="150"
            className="stroke-sage-200/40 fill-none"
            strokeWidth="2"
            strokeDasharray="942"
            animate={{ strokeDashoffset: 942 - (942 * progress) / 100 }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </svg>

        <div className="text-center">
          <motion.div 
            className="text-7xl font-display font-light tracking-tighter tabular-nums text-white"
          >
            {formatTime(timeLeft)}
          </motion.div>
          <div className="text-white/20 text-xs uppercase tracking-[0.4em] mt-4 font-light">
            {task}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-20 flex gap-12 items-center">
        <button
          onClick={() => toggleTimer()}
          className="text-white/30 hover:text-white transition-colors cursor-pointer"
        >
          {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>
        <button
          onClick={onEnd}
          className="text-white/30 hover:text-white transition-colors cursor-pointer"
        >
          <Square className="w-6 h-6" />
        </button>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="absolute bottom-20 text-center"
      >
        <h3 className="text-xl font-display font-light text-white/60 italic">
          "Focus like sunlight through trees."
        </h3>
      </motion.div>
    </motion.div>
  );
};

export default FocusSession;
