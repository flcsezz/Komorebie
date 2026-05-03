import React from 'react';
import { motion } from 'framer-motion';
import type { DifficultyRating } from '../../lib/flashcards';

interface DifficultyButtonsProps {
  onRate: (rating: DifficultyRating) => void;
  disabled?: boolean;
  visible?: boolean;
}

const RATINGS: { rating: DifficultyRating; label: string; subLabel: string; color: string; bg: string; border: string }[] = [
  { rating: 0, label: 'Again', subLabel: 'Reset', color: '#F87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
  { rating: 1, label: 'Hard', subLabel: '~1d', color: '#FB923C', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)' },
  { rating: 2, label: 'Okay', subLabel: '~3d', color: '#FBBF24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' },
  { rating: 3, label: 'Good', subLabel: '~7d', color: '#34D399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' },
  { rating: 4, label: 'Easy', subLabel: '~14d', color: '#22D3EE', bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.2)' },
  { rating: 5, label: 'Perfect', subLabel: '~30d', color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
];

const DifficultyButtons: React.FC<DifficultyButtonsProps> = ({ onRate, disabled, visible = true }) => {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ delay: 0.2, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="flex justify-center gap-2 mt-6"
    >
      {RATINGS.map((r) => (
        <motion.button
          key={r.rating}
          onClick={() => onRate(r.rating)}
          disabled={disabled}
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed group"
          style={{
            background: r.bg,
            border: `1px solid ${r.border}`,
          }}
        >
          <span 
            className="text-xs font-medium"
            style={{ color: r.color }}
          >
            {r.label}
          </span>
          <span className="text-[9px] text-white/20 group-hover:text-white/30 transition-colors">
            {r.subLabel}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default DifficultyButtons;
