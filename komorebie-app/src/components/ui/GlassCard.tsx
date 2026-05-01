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
  animateCard?: boolean; // Kept for backwards compatibility but unused
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  hoverGlow = true,
  variant = 'default',
  animateCard = true,
  ...props
}) => {
  const variantClasses = {
    default: 'glass',
    hero: 'glass-hero',
    minimalist: 'glass',
    icy: 'glass-icy',
    frosted: 'glass-frosted'
  };

  return (
    <motion.div 
      className={cn(
        variantClasses[variant],
        "rounded-3xl",
        hoverGlow && "hover:border-sage-200/30 transition-colors duration-500",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
