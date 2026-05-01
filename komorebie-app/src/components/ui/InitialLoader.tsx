import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const zenEase = [0.22, 0.61, 0.36, 1] as any;

/**
 * Premium initial loading screen.
 * Shows on app mount with the Komorebie light motif,
 * then dissolves out gracefully once the app is ready.
 */
const InitialLoader: React.FC<{ minDuration?: number, show?: boolean }> = ({ minDuration = 1300, show }) => {
  const [internalVisible, setInternalVisible] = useState(true);

  useEffect(() => {
    if (show === undefined) {
      const timer = setTimeout(() => setInternalVisible(false), minDuration);
      return () => clearTimeout(timer);
    }
  }, [minDuration, show]);

  const isVisible = show !== undefined ? show : internalVisible;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={show !== undefined ? `transition-${show}` : 'initial-mount'}
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            filter: 'blur(12px)',
            scale: 1.05,
          }}
          transition={{ duration: 0.8, ease: zenEase }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950"
        >
          {/* Ambient glow orb */}
          <motion.div
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.15, 0.35, 0.15],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-72 h-72 rounded-full bg-sage-200/20 blur-[80px] pointer-events-none"
          />

          {/* Core light dot */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: zenEase }}
            className="relative"
          >
            <motion.div
              animate={{
                scale: [0.9, 1.1, 0.9],
                opacity: [0.5, 0.9, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-5 h-5 rounded-full bg-sage-200 shadow-[0_0_30px_rgba(183,201,176,0.6),0_0_60px_rgba(183,201,176,0.3)]"
            />
          </motion.div>

          {/* Brand text */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: zenEase }}
            className="mt-10"
          >
            <span className="text-[11px] font-display uppercase tracking-[0.5em] text-white/60 font-light ml-[0.5em]">
              Komorebie
            </span>
          </motion.div>

          {/* Subtle loading bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 80 }}
            transition={{ duration: minDuration / 1000 * 0.9, ease: 'easeInOut' as any }}
            className="h-[1px] bg-gradient-to-r from-transparent via-sage-200/40 to-transparent mt-6"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InitialLoader;
