import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Clock, Zap, ArrowLeft, RotateCcw } from 'lucide-react';

interface StudyCompleteProps {
  stats: {
    totalCards: number;
    correctCards: number;
    durationSeconds: number;
  };
  deckTitle: string;
  deckEmoji: string;
  color: { text: string; bg: string; border: string; glow: string };
  onClose: () => void;
  onStudyAgain: () => void;
}

const StudyComplete: React.FC<StudyCompleteProps> = ({
  stats,
  deckTitle,
  deckEmoji,
  color,
  onClose,
  onStudyAgain,
}) => {
  const accuracy = stats.totalCards > 0 
    ? Math.round((stats.correctCards / stats.totalCards) * 100) 
    : 0;
  
  const minutes = Math.floor(stats.durationSeconds / 60);
  const seconds = stats.durationSeconds % 60;

  const getPerformanceMessage = () => {
    if (accuracy >= 90) return { text: 'Outstanding!', sub: 'Your mastery is shining through' };
    if (accuracy >= 70) return { text: 'Great Work!', sub: 'Keep building that knowledge' };
    if (accuracy >= 50) return { text: 'Good Progress!', sub: 'Practice makes perfect' };
    return { text: 'Keep Going!', sub: 'Every review strengthens your memory' };
  };

  const performance = getPerformanceMessage();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="w-full max-w-md mx-auto"
    >
      <div 
        className="rounded-3xl p-8 text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(145deg, rgba(30,30,30,0.95), ${color.bg})`,
          border: `1px solid ${color.border}`,
          boxShadow: `0 0 60px ${color.glow}`,
        }}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{ backgroundColor: color.text + '30' }}
              initial={{
                x: Math.random() * 400,
                y: Math.random() * 400,
                scale: 0,
              }}
              animate={{
                y: [null, -100],
                scale: [0, 1, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 3,
                delay: i * 0.3,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>

        {/* Trophy Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center relative"
          style={{ background: color.bg, border: `2px solid ${color.border}` }}
        >
          <span className="text-4xl">{deckEmoji}</span>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
          </motion.div>
        </motion.div>

        {/* Performance Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-display font-light text-white mb-1">
            {performance.text}
          </h2>
          <p className="text-sm text-white/30">{performance.sub}</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-3 mt-8"
        >
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <Target className="w-5 h-5 mx-auto mb-2" style={{ color: color.text }} />
            <div className="text-xl font-display font-bold text-white">{accuracy}%</div>
            <div className="text-[9px] uppercase tracking-widest text-white/20 mt-1">Accuracy</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <Zap className="w-5 h-5 mx-auto mb-2 text-amber-400" />
            <div className="text-xl font-display font-bold text-white">{stats.totalCards}</div>
            <div className="text-[9px] uppercase tracking-widest text-white/20 mt-1">Reviewed</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <Clock className="w-5 h-5 mx-auto mb-2 text-cyan-400" />
            <div className="text-xl font-display font-bold text-white">
              {minutes > 0 ? `${minutes}m` : `${seconds}s`}
            </div>
            <div className="text-[9px] uppercase tracking-widest text-white/20 mt-1">Time</div>
          </div>
        </motion.div>

        {/* Accuracy Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6"
        >
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${accuracy}%` }}
              transition={{ delay: 0.9, duration: 1, ease: [0.23, 1, 0.32, 1] }}
              className="h-full rounded-full"
              style={{ 
                background: `linear-gradient(90deg, ${color.text}40, ${color.text})`,
                boxShadow: `0 0 12px ${color.glow}`,
              }}
            />
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex gap-3 mt-8"
        >
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-white/40 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Deck
          </button>
          <button
            onClick={onStudyAgain}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer"
            style={{
              background: color.bg,
              color: color.text,
              border: `1px solid ${color.border}`,
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Study Again
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StudyComplete;
