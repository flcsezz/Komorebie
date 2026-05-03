import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';

interface FlashcardFlipProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
  color: { bg: string; border: string; text: string; glow: string };
  index?: number;
  total?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const FlashcardFlip: React.FC<FlashcardFlipProps> = ({
  front,
  back,
  isFlipped,
  onFlip,
  color,
  index = 0,
  total = 1,
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
    <div className="relative w-full max-w-md mx-auto" style={{ perspective: 1200 }}>
      {/* Card counter */}
      <div className="text-center mb-4">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold">
          {index + 1} / {total}
        </span>
      </div>

      {/* Swipe Labels */}
      <motion.div 
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-10 pointer-events-none"
        style={{ opacity: leftLabelOpacity, scale: leftLabelScale }}
      >
        <div className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] uppercase tracking-wider font-bold whitespace-nowrap">
          Again
        </div>
      </motion.div>
      <motion.div 
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-10 pointer-events-none"
        style={{ opacity: rightLabelOpacity, scale: rightLabelScale }}
      >
        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-wider font-bold whitespace-nowrap">
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
        <div className="relative w-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* The card that flips */}
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ 
              duration: 0.6, 
              ease: [0.23, 1, 0.32, 1],
            }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative"
          >
            {/* Front */}
            <div
              className="rounded-3xl p-8 min-h-[320px] flex flex-col items-center justify-center text-center select-none"
              style={{ 
                backfaceVisibility: 'hidden',
                background: `linear-gradient(145deg, rgba(30,30,30,0.9), rgba(18,18,18,0.95))`,
                border: `1px solid ${color.border}`,
                boxShadow: `0 0 40px ${color.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
              }}
            >
              {/* Decorative corner accents */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t border-l rounded-tl-lg" style={{ borderColor: color.border }} />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r rounded-br-lg" style={{ borderColor: color.border }} />
              
              <div className="text-[9px] uppercase tracking-[0.3em] font-bold mb-6" style={{ color: color.text + '80' }}>
                Question
              </div>
              <p className="text-lg font-display font-light text-white/90 leading-relaxed max-w-sm">
                {front}
              </p>
              <div className="mt-8 text-[10px] text-white/15 flex items-center gap-2">
                <span>Tap to reveal</span>
                <motion.span
                  animate={{ y: [0, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  ↓
                </motion.span>
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-3xl p-8 min-h-[320px] flex flex-col items-center justify-center text-center select-none"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: `linear-gradient(145deg, rgba(30,30,30,0.95), ${color.bg})`,
                border: `1px solid ${color.border}`,
                boxShadow: `0 0 60px ${color.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
              }}
            >
              {/* Decorative corner accents */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t border-l rounded-tl-lg" style={{ borderColor: color.text + '40' }} />
              <div className="absolute top-4 right-4 w-8 h-8 border-t border-r rounded-tr-lg" style={{ borderColor: color.text + '40' }} />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l rounded-bl-lg" style={{ borderColor: color.text + '40' }} />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r rounded-br-lg" style={{ borderColor: color.text + '40' }} />
              
              <div className="text-[9px] uppercase tracking-[0.3em] font-bold mb-6" style={{ color: color.text }}>
                Answer
              </div>
              <p className="text-lg font-display font-light text-white leading-relaxed max-w-sm">
                {back}
              </p>
              <div className="mt-8 text-[10px] text-white/20">
                Swipe or rate below
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default FlashcardFlip;
