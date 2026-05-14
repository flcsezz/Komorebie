import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, Zap, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../ui/GlassCard';
import OptimizedImage from '../ui/OptimizedImage';
import LeagueBadge from './LeagueBadge';
import FocusRing from './FocusRing';
import { formatFocusTime } from '../../lib/leagues';
import type { LeaderboardUser } from '../../hooks/useLeaderboard';

interface PodiumCardProps {
  user?: LeaderboardUser;
  rank: number;
  delay: number;
  isCurrentUser: boolean;
  isFocusing: boolean;
}

const PodiumCard: React.FC<PodiumCardProps> = ({ user, rank, delay, isCurrentUser, isFocusing }) => {
  const navigate = useNavigate();
  if (!user) return <div className="hidden md:block h-full min-h-[200px]" />;

  const isFirst = rank === 1;
  const isSecond = rank === 2;

  const handleProfileClick = () => {
    if (isCurrentUser) {
      navigate('/app/profile');
    } else {
      navigate(`/app/friends/${user.username}`);
    }
  };

  const rankColors = {
    1: { bg: 'bg-amber-400/20', border: 'border-amber-400/40', text: 'text-amber-300' },
    2: { bg: 'bg-slate-300/20', border: 'border-slate-300/40', text: 'text-slate-200' },
    3: { bg: 'bg-orange-400/20', border: 'border-orange-400/40', text: 'text-orange-300' },
  };

  const colors = rankColors[rank as 1 | 2 | 3] || rankColors[3];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        type: 'spring',
        stiffness: 280,
        damping: 22,
      }}
      className={`relative ${isFirst ? 'order-2 md:-translate-y-6' : isSecond ? 'order-1' : 'order-3'}`}
    >
      <div 
        onClick={handleProfileClick}
        className="cursor-pointer"
      >
        <GlassCard
          variant={isFirst ? 'frosted' : 'icy'}
          className={`p-8 text-center relative overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] ${
            isFirst ? 'border-sage-200/40 ring-1 ring-sage-200/20 shadow-2xl shadow-sage-200/10' : ''
          } ${isCurrentUser ? 'border-sage-200/20' : ''}`}
        >
        {/* Glow effect for #1 */}
        {isFirst && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-sage-200/10 blur-[60px] pointer-events-none" />
        )}

        {/* Rank Badge */}
        <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center border-2 ${colors.bg} ${colors.border} ${colors.text}`}>
          {isFirst ? <Crown className="w-6 h-6" /> : <Medal className="w-6 h-6" />}
        </div>

        {/* Avatar with Focus Ring */}
        <div className="relative inline-block mb-3">
          <FocusRing isFocusing={isFocusing} tier={user.tier}>
            <OptimizedImage
              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
              alt={user.username}
              className={`rounded-full border-2 ${
                isFirst ? 'w-24 h-24 border-sage-200' : 'w-20 h-20 border-white/20'
              }`}
            />
          </FocusRing>
          {isCurrentUser && (
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-sage-200 rounded-full border-2 border-slate-950 shadow-lg z-20" />
          )}
        </div>

        {/* Name + Tier */}
        <div className="space-y-1 mb-5">
          <div className="flex items-center justify-center gap-2">
            <h3 className={`font-display font-medium truncate ${isFirst ? 'text-xl' : 'text-lg'}`}>
              {user.display_name || user.username}
            </h3>
            <LeagueBadge tier={user.tier} size="sm" />
          </div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">@{user.username}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5 text-sage-200">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-lg font-display font-light">{user.current_streak}</span>
            </div>
            <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Streak</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5 text-white/90">
              <Clock className="w-3.5 h-3.5 text-white/30" />
              <span className="text-lg font-display font-light">{formatFocusTime(user.total_focus_seconds)}</span>
            </div>
            <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Focus</span>
          </div>
        </div>
        </GlassCard>
      </div>
    </motion.div>
  );
};

export default PodiumCard;
