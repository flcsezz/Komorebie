import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';

interface FlashcardFlipProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
  color: { bg: string; border: string; text: string; glow: string };
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const FlashcardFlip: React.FC<FlashcardFlipProps> = ({
  front,
  back,
  isFlipped,
  onFlip,
  color,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const [exitX, setExitX] = useState(0);
  const [hasExited, setHasExited] = useState(false);
  const x = useMotionValue(0);
  const rotateCard = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Label visibility based on drag
  const leftLabelOpacity = useTransform(x, [-150, -50, 0], [1, 0.3, 0]);
  const rightLabelOpacity = useTransform(x, [0, 50, 150], [0, 0.3, 1]);
  const leftLabelScale = useTransform(x, [-150, -50, 0], [1.1, 0.9, 0.8]);
  const rightLabelScale = useTransform(x, [0, 50, 150], [0.8, 0.9, 1.1]);

  useEffect(() => {
    // Reset when card changes
    setHasExited(false);
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
  }, [front, back, x]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold && onSwipeRight) {
      setExitX(300);
      setHasExited(true);
      onSwipeRight();
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      setExitX(-300);
      setHasExited(true);
      onSwipeLeft();
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto" style={{ perspective: 1500 }}>
      {/* Swipe Labels */}
      <motion.div 
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-20 z-10 pointer-events-none"
        style={{ opacity: leftLabelOpacity, scale: leftLabelScale }}
      >
        <div className="px-4 py-2 rounded-2xl bg-red-500/15 border border-red-500/20 text-red-400 text-xs uppercase tracking-widest font-black whitespace-nowrap shadow-2xl">
          Again
        </div>
      </motion.div>
      <motion.div 
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-20 z-10 pointer-events-none"
        style={{ opacity: rightLabelOpacity, scale: rightLabelScale }}
      >
        <div className="px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs uppercase tracking-widest font-black whitespace-nowrap shadow-2xl">
          Good
        </div>
      </motion.div>

      {/* Card Container */}
      <motion.div
        ref={cardRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        onDragEnd={handleDragEnd}
        style={{ x, rotate: rotateCard, opacity }}
        animate={hasExited ? { x: exitX, opacity: 0 } : {}}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="cursor-grab active:cursor-grabbing"
        onClick={(e) => {
          if (Math.abs(x.get()) < 5) {
            onFlip();
            e.stopPropagation();
          }
        }}
      >
        <div className="relative w-full aspect-[2.5/3.5]" style={{ transformStyle: 'preserve-3d' }}>
          {/* The card that flips */}
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ 
              duration: 0.7, 
              ease: [0.23, 1, 0.32, 1],
            }}
            style={{ transformStyle: 'preserve-3d', height: '100%' }}
            className="relative"
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center select-none overflow-hidden"
              style={{ 
                backfaceVisibility: 'hidden',
                background: `linear-gradient(145deg, rgba(30,30,30,0.95), rgba(12,12,12,0.98))`,
                border: `1px solid rgba(255,255,255,0.1)`,
                boxShadow: `0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
              }}
            >
              {/* Decorative corner accents */}
              <div className="absolute top-6 left-6 w-8 h-8 border-t border-l rounded-tl-xl opacity-20" style={{ borderColor: color.text }} />
              <div className="absolute top-6 right-6 w-8 h-8 border-t border-r rounded-tr-xl opacity-20" style={{ borderColor: color.text }} />
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b border-l rounded-bl-xl opacity-20" style={{ borderColor: color.text }} />
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r rounded-br-xl opacity-20" style={{ borderColor: color.text }} />
              
              <div className="text-[10px] uppercase tracking-[0.4em] font-black mb-8 text-white/20">
                Question
              </div>
              <p className="text-xl font-display font-light text-white leading-relaxed max-w-sm">
                {front}
              </p>
              <div className="mt-12 text-[11px] font-bold uppercase tracking-[0.2em] text-sage-200 flex flex-col items-center gap-2">
                <span className="opacity-80">Tap to reveal</span>
                <motion.span
                  animate={{ y: [0, 4, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  ↓
                </motion.span>
              </div>

              {/* Ambient Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 pointer-events-none rounded-full" style={{ background: color.text }} />
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center select-none overflow-hidden"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: `linear-gradient(145deg, rgba(18,18,18,0.98), ${color.bg})`,
                border: `1px solid ${color.border}`,
                boxShadow: `0 20px 80px ${color.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
              }}
            >
              {/* Decorative corner accents */}
              <div className="absolute top-6 left-6 w-8 h-8 border-t border-l rounded-tl-xl opacity-30" style={{ borderColor: color.text }} />
              <div className="absolute top-6 right-6 w-8 h-8 border-t border-r rounded-tr-xl opacity-30" style={{ borderColor: color.text }} />
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b border-l rounded-bl-xl opacity-30" style={{ borderColor: color.text }} />
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r rounded-br-xl opacity-30" style={{ borderColor: color.text }} />
              
              <div className="text-[10px] uppercase tracking-[0.4em] font-black mb-8 text-white/30" style={{ color: color.text }}>
                Answer
              </div>
              <p className="text-xl font-display font-light text-white leading-relaxed max-w-sm">
                {back}
              </p>
              <div className="mt-12 text-[11px] uppercase tracking-widest text-white/20 font-bold">
                Swipe or rate below
              </div>

              {/* Ambient Glow */}
              <div className="absolute inset-0 blur-[100px] opacity-20 pointer-events-none rounded-full" style={{ background: color.text }} />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default FlashcardFlip;
