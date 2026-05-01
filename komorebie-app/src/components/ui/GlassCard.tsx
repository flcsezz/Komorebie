import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, type HTMLMotionProps } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  children?: React.ReactNode;
  className?: string;
  hoverGlow?: boolean;
  variant?: 'default' | 'hero' | 'minimalist' | 'icy' | 'frosted';
  animateCard?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.5, 
      ease: [0.16, 1, 0.3, 1] as const,
      opacity: { duration: 0.4 } 
    } 
  }
};

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  hoverGlow = true,
  variant = 'default',
  animateCard = true,
  ...props
}) => {
  const variantClasses = {
    default: 'glass transform-gpu',
    hero: 'glass-hero transform-gpu',
    minimalist: 'glass transform-gpu',
    icy: 'glass-icy transform-gpu',
    frosted: 'glass-frosted transform-gpu'
  };

  return (
    <motion.div 
      variants={animateCard ? cardVariants : undefined}
      className={cn(
        variantClasses[variant],
        "rounded-3xl",
        hoverGlow && "hover:border-sage-200/30 transition-all duration-500",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
