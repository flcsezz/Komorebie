import React from 'react';
import { type TierConfig } from '../../lib/leagues';

interface LeagueBadgeProps {
  tier: TierConfig;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-5 h-5 text-[10px]',
  md: 'w-7 h-7 text-sm',
  lg: 'w-10 h-10 text-lg',
};

const LeagueBadge: React.FC<LeagueBadgeProps> = ({
  tier,
  size = 'sm',
  showName = false,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className={`${sizeClasses[size]} ${tier.bgColor} ${tier.borderColor} border rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden`}
        title={`${tier.name} — ${tier.description}`}
      >
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `linear-gradient(110deg, transparent 30%, ${tier.glowColor} 50%, transparent 70%)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s ease-in-out infinite',
          }}
        />
        <span className="relative z-10 leading-none">{tier.icon}</span>
      </div>
      {showName && (
        <span className={`text-xs font-bold uppercase tracking-wider ${tier.textColor}`}>
          {tier.name}
        </span>
      )}
    </div>
  );
};

export default LeagueBadge;
