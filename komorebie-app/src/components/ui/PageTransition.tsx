import React from 'react';
import { motion, type Variants } from 'framer-motion';

/**
 * Premium page transition wrapper for Zen System pages.
 * 
 * Provides a staggered reveal with blur-to-sharp, gentle upward float,
 * and opacity fade. Designed to feel like "sunlight slowly filling a room."
 * 
 * Usage:
 *   <PageTransition>
 *     <PageTransition.Item>...</PageTransition.Item>
 *     <PageTransition.Item>...</PageTransition.Item>
 *   </PageTransition>
 * 
 * Or without children orchestration:
 *   <PageTransition>
 *     <div>content appears with a single smooth reveal</div>
 *   </PageTransition>
 */

// Zen easing: slow inhale, smooth exhale
const zenEase = [0.22, 0.61, 0.36, 1] as any;

const containerVariants: Variants = {
  hidden: { 
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: zenEase,
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: zenEase,
    },
  },
};

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 24,
    filter: 'blur(8px)',
  },
  visible: { 
    opacity: 1, 
    y: 0,
    filter: 'blur(0px)',
    transition: { 
      duration: 0.65,
      ease: zenEase,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(4px)',
    transition: {
      duration: 0.25,
      ease: zenEase,
    },
  },
};

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> & {
  Item: React.FC<PageTransitionItemProps>;
} = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface PageTransitionItemProps {
  children: React.ReactNode;
  className?: string;
}

const PageTransitionItem: React.FC<PageTransitionItemProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

PageTransition.Item = PageTransitionItem;

export { itemVariants as pageItemVariants, containerVariants as pageContainerVariants };
export default PageTransition;
