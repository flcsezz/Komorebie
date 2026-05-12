import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../ui/GlassCard';
import OptimizedImage from '../ui/OptimizedImage';
import LeagueBadge from './LeagueBadge';
import FocusRing from './FocusRing';
import { formatFocusTime } from '../../lib/leagues';
import type { LeaderboardUser } from '../../hooks/useLeaderboard';

interface LeaderboardRowProps {
  user: LeaderboardUser;
  index: number;
  isCurrentUser: boolean;
  isFocusing: boolean;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  user,
  index,
  isCurrentUser,
  isFocusing,
}) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (isCurrentUser) {
      navigate('/app/profile');
    } else {
      navigate(`/app/friends/${user.username}`);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
      onClick={handleProfileClick}
      className="cursor-pointer"
    >
      <GlassCard
        variant="icy"
        className={`group hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 p-4 flex items-center gap-4 ${
          isCurrentUser ? `${user.tier.borderColor} bg-sage-200/5` : ''
        }`}
      >
        {/* Rank */}
        <div className="w-8 text-center text-xs font-bold text-white/20 group-hover:text-white/40 transition-colors tabular-nums">
          {user.rank}
        </div>

        {/* Avatar with Focus Ring */}
        <FocusRing isFocusing={isFocusing} tier={user.tier}>
          <OptimizedImage
            src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
            alt={user.username}
            className="w-10 h-10 rounded-full border border-white/10"
          />
        </FocusRing>

        {/* Name + League */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white truncate">
              {user.display_name || user.username}
            </h4>
            <LeagueBadge tier={user.tier} size="sm" />
            {isCurrentUser && (
              <span className="text-[9px] uppercase tracking-widest font-bold text-sage-200 bg-sage-200/10 px-1.5 py-0.5 rounded">
                You
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">@{user.username}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 text-right">
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-sage-200">
              <Zap className="w-3 h-3" />
              <span className="text-sm font-display tabular-nums">{user.current_streak}</span>
            </div>
            <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Streak</span>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-white/80">
              <Clock className="w-3 h-3 text-white/30" />
              <span className="text-sm font-display font-medium tabular-nums">
                {formatFocusTime(user.total_focus_seconds)}
              </span>
            </div>
            <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Focus</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default LeaderboardRow;
