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
    default: 'bg-black/20 backdrop-blur-[12px] border border-white/5 transform-gpu',
    hero: 'bg-black/20 backdrop-blur-[12px] border border-white/5 transform-gpu',
    minimalist: 'bg-black/20 backdrop-blur-[12px] border border-white/5 transform-gpu',
    icy: 'bg-black/20 backdrop-blur-[12px] border border-white/5 transform-gpu',
    frosted: 'bg-black/20 backdrop-blur-[12px] border border-white/5 transform-gpu'
  };

  return (
    <motion.div 
      variants={animateCard ? cardVariants : undefined}
      initial={animateCard ? "hidden" : undefined}
      whileInView={animateCard ? "show" : undefined}
      viewport={{ once: true, margin: "-20px" }}
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
