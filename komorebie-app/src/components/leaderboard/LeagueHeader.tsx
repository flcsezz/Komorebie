import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import LeagueBadge from './LeagueBadge';
import { formatFocusTime, getTierProgress, getNextTier, type TierConfig } from '../../lib/leagues';

interface LeagueHeaderProps {
  tier: TierConfig;
  weeklySeconds: number;
  leagueUserCount: number;
  leagueRank: number | null;
}

const LeagueHeader: React.FC<LeagueHeaderProps> = ({
  tier,
  weeklySeconds,
  leagueUserCount,
  leagueRank,
}) => {
  const progress = getTierProgress(weeklySeconds);
  const nextTier = getNextTier(tier);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      <GlassCard variant="frosted" className="p-5 relative overflow-hidden">
        {/* Tier glow background */}
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] pointer-events-none opacity-20"
          style={{ background: tier.glowColor }}
        />

        <div className="relative z-10 space-y-6">
          {/* Top: Tier info */}
          <div className="flex items-center gap-4">
            <LeagueBadge tier={tier} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-display font-medium ${tier.textColor}`}>
                  {tier.name}
                </h3>
                <span className="text-xs text-white/30 font-medium">
                  {formatFocusTime(weeklySeconds)} this week
                </span>
              </div>
              <p className="text-[10px] text-white/25 uppercase tracking-widest font-bold mt-0.5">
                {leagueRank !== null ? `Rank #${leagueRank}` : 'Unranked'}
                {leagueUserCount > 0 ? ` · ${leagueUserCount} focuser${leagueUserCount !== 1 ? 's' : ''} here` : ''}
              </p>
            </div>
          </div>

          {/* Bottom: Progress to next tier */}
          {nextTier ? (
            <div className="w-full max-w-[240px] space-y-1.5">
              <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-bold">
                <span className="text-white/25">Progress to {nextTier.icon} {nextTier.name}</span>
                <span className="text-white/30">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: tier.glowColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                />
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-white/25 uppercase tracking-widest font-bold">
              ✦ Highest league achieved
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default LeagueHeader;
