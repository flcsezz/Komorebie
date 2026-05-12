import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../ui/GlassCard';
import OptimizedImage from '../ui/OptimizedImage';
import LeagueBadge from './LeagueBadge';
import { formatFocusTime, getTierForSeconds } from '../../lib/leagues';
import type { HallOfFameUser } from '../../hooks/useLeaderboard';

interface HallOfFameProps {
  champions: HallOfFameUser[];
}

const RANK_ICONS = ['🥇', '🥈', '🥉'];

const HallOfFame: React.FC<HallOfFameProps> = ({ champions }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem('komorebie-hof-seen') !== 'true';
  });

  if (champions.length === 0) return null;

  const handleToggle = () => {
    setIsExpanded(prev => {
      if (prev) localStorage.setItem('komorebie-hof-seen', 'true');
      return !prev;
    });
  };

  return (
    <GlassCard variant="frosted" className="overflow-hidden">
      {/* Header (always visible) */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-5 text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 group-hover:text-white/80 transition-colors">
              Last Week's Champions
            </h3>
          </div>
        </div>
        <div className="text-white/20 group-hover:text-white/40 transition-colors">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2.5">
              {champions.map((champ, i) => {
                const tier = getTierForSeconds(champ.total_focus_seconds);
                const isCurrentUser = champ.id === currentUser?.id;

                const handleChampionClick = () => {
                  if (isCurrentUser) {
                    navigate('/app/profile');
                  } else {
                    navigate(`/app/friends/${champ.username}`);
                  }
                };

                return (
                  <motion.div
                    key={champ.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 22 }}
                    onClick={handleChampionClick}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-amber-400/20 active:bg-white/[0.05] transition-all cursor-pointer"
                  >
                    <span className="text-lg leading-none">{RANK_ICONS[i]}</span>

                    <OptimizedImage
                      src={champ.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${champ.username}`}
                      alt={champ.username}
                      className="w-8 h-8 rounded-full border border-white/10"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {champ.display_name || champ.username}
                      </p>
                      <p className="text-[9px] text-white/25 uppercase tracking-widest font-bold">
                        @{champ.username}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-display text-white/70 tabular-nums">
                        {formatFocusTime(champ.total_focus_seconds)}
                      </span>
                      <LeagueBadge tier={tier} size="sm" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};

export default HallOfFame;
