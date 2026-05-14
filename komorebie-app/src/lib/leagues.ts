/**
 * League Tier System for Komorebie Leaderboard
 * 
 * Tiers are determined by WEEKLY focus time (not percentile).
 * This works for any user-base size and feels fair.
 */

export type TierKey = 'ember' | 'stone' | 'iron' | 'gold' | 'diamond' | 'zenmaster' | 'transcendent';

export interface TierConfig {
  key: TierKey;
  name: string;
  icon: string;
  /** Minimum weekly focus seconds to qualify for this tier */
  minSeconds: number;
  /** Tailwind border color class */
  borderColor: string;
  /** Tailwind text color class */
  textColor: string;
  /** Tailwind bg color class for badge */
  bgColor: string;
  /** CSS glow color (rgba) for focus ring and badge shimmer */
  glowColor: string;
  /** Short description for tooltip / league header */
  description: string;
}

/**
 * Tier definitions ordered from lowest to highest.
 * Thresholds are in seconds of weekly focus time.
 */
export const TIERS: TierConfig[] = [
  {
    key: 'ember',
    name: 'Ember',
    icon: '🔥',
    minSeconds: 0,
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    description: 'Just getting started — every minute counts',
  },
  {
    key: 'stone',
    name: 'Stone',
    icon: '🪨',
    minSeconds: 3600, // 1 hour
    borderColor: 'border-slate-400/30',
    textColor: 'text-slate-300',
    bgColor: 'bg-slate-400/15',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    description: 'Building a solid foundation',
  },
  {
    key: 'iron',
    name: 'Iron',
    icon: '⚔️',
    minSeconds: 10800, // 3 hours
    borderColor: 'border-blue-400/30',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-400/15',
    glowColor: 'rgba(96, 165, 250, 0.4)',
    description: 'Forging discipline through deep work',
  },
  {
    key: 'gold',
    name: 'Gold',
    icon: '👑',
    minSeconds: 25200, // 7 hours
    borderColor: 'border-yellow-400/40',
    textColor: 'text-yellow-300',
    bgColor: 'bg-yellow-400/15',
    glowColor: 'rgba(250, 204, 21, 0.5)',
    description: 'A true student of focus',
  },
  {
    key: 'diamond',
    name: 'Diamond',
    icon: '💎',
    minSeconds: 54000, // 15 hours
    borderColor: 'border-cyan-300/40',
    textColor: 'text-cyan-300',
    bgColor: 'bg-cyan-300/15',
    glowColor: 'rgba(103, 232, 249, 0.5)',
    description: 'Exceptional dedication to the craft',
  },
  {
    key: 'zenmaster',
    name: 'Zen Master',
    icon: '🧘',
    minSeconds: 108000, // 30 hours
    borderColor: 'border-sage-200/50',
    textColor: 'text-sage-200',
    bgColor: 'bg-sage-200/15',
    glowColor: 'rgba(183, 201, 176, 0.5)',
    description: 'The mind is still — mastery achieved',
  },
  {
    key: 'transcendent',
    name: 'Transcendent',
    icon: '✦',
    minSeconds: 144000, // 40 hours
    borderColor: 'border-violet-400/50',
    textColor: 'text-violet-300',
    bgColor: 'bg-violet-400/20',
    glowColor: 'rgba(167, 139, 250, 0.6)',
    description: 'Beyond limits — one with the flow',
  },
];

export const ADMIN_OVERRIDE_KEY = 'komorebie-admin-league-override';

/**
 * Get the tier config for a given number of weekly focus seconds.
 * Walks the tier list in reverse to find the highest matching tier.
 * Supports an optional override (e.g. for admin testing).
 */
export function getTierForSeconds(weeklyFocusSeconds: number, overrideKey?: TierKey | null): TierConfig {
  if (overrideKey) {
    const override = TIERS.find(t => t.key === overrideKey);
    if (override) return override;
  }
  
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (weeklyFocusSeconds >= TIERS[i].minSeconds) {
      return TIERS[i];
    }
  }
  return TIERS[0]; // fallback to Ember
}

/**
 * Get the tier config by key.
 */
export function getTierByKey(key: TierKey): TierConfig {
  return TIERS.find(t => t.key === key) || TIERS[0];
}

/**
 * Get the next tier above the current one (for progress display).
 * Returns null if already at the highest tier.
 */
export function getNextTier(currentTier: TierConfig): TierConfig | null {
  const idx = TIERS.findIndex(t => t.key === currentTier.key);
  if (idx < 0 || idx >= TIERS.length - 1) return null;
  return TIERS[idx + 1];
}

/**
 * Calculate progress percentage toward the next tier.
 * Returns 100 if at the highest tier.
 */
export function getTierProgress(weeklyFocusSeconds: number): number {
  const currentTier = getTierForSeconds(weeklyFocusSeconds);
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return 100;

  const rangeStart = currentTier.minSeconds;
  const rangeEnd = nextTier.minSeconds;
  const progress = ((weeklyFocusSeconds - rangeStart) / (rangeEnd - rangeStart)) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Format seconds into a human-readable string.
 */
export function formatFocusTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
