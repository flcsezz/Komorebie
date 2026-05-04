import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, UserMinus, ExternalLink } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import type { FriendWithProfile } from '../../lib/friends';
import type { PresenceState } from '../../hooks/usePresence';

interface FriendCardProps {
  friendship: FriendWithProfile;
  onRemove: (friendshipId: string) => void;
  onViewProfile?: (friend: FriendWithProfile) => void;
  todayFocusSeconds?: number;
  presence?: PresenceState;
}

const FriendCard: React.FC<FriendCardProps> = ({ friendship, onRemove, onViewProfile, todayFocusSeconds = 0, presence }) => {
  const isFocusing = presence?.is_active;
  const { friend, since, friendship_id } = friendship;
  const [confirmRemove, setConfirmRemove] = useState(false);

  const sinceDate = new Date(since);
  const friendsSince = sinceDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <GlassCard
      variant="frosted"
      className="group relative aspect-[2.5/3.5] p-6 flex flex-col items-center text-center overflow-hidden hover:-translate-y-2 transition-all duration-500 shadow-2xl shadow-black/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      {/* Ambient glow on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${isFocusing ? 'var(--color-green-400)' : 'var(--color-sage-200)'}, transparent 70%)` }}
      />

      {/* Decorative corner accents */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-white/10 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-white/10 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-white/10 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-white/10 rounded-br-lg" />

      {/* Avatar Section */}
      <div 
        className="relative mt-4 cursor-pointer"
        onClick={() => onViewProfile?.(friendship)}
      >
        <div className={`w-20 h-20 rounded-[2rem] bg-slate-800 border-2 border-white/5 overflow-hidden flex items-center justify-center shadow-xl group-hover:border-sage-200/30 transition-all duration-500 ${isFocusing ? 'border-green-400/30' : ''}`}>
          {friend.avatar_url ? (
            <img src={friend.avatar_url} alt={friend.display_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-display font-light text-white/40">
              {(friend.display_name || friend.username || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {/* Presence Indicator */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center">
          <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(183,201,176,0.4)] ${isFocusing ? 'bg-green-400 animate-pulse' : 'bg-sage-200/60'}`} />
        </div>
      </div>

      {/* Content */}
      <div className="mt-6 flex-1 flex flex-col min-w-0 w-full">
        <h3 
          className="text-lg font-display font-medium text-white truncate cursor-pointer hover:text-sage-200 transition-colors"
          onClick={() => onViewProfile?.(friendship)}
        >
          {friend.display_name || friend.username}
        </h3>
        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold mt-1">@{friend.username}</p>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mt-8 w-full">
          <div className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
            <Flame className="w-3.5 h-3.5 text-amber-400/60" />
            <span className="text-xs font-display font-bold text-white/90">{friend.current_streak}d</span>
            <span className="text-[7px] uppercase tracking-widest text-white/20 font-bold">Streak</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
            <Clock className="w-3.5 h-3.5 text-sage-200/60" />
            <span className="text-xs font-display font-bold text-white/90">
              {todayFocusSeconds >= 3600 
                ? `${(todayFocusSeconds / 3600).toFixed(1)}h` 
                : `${Math.floor(todayFocusSeconds / 60)}m`}
            </span>
            <span className="text-[7px] uppercase tracking-widest text-white/20 font-bold">Today</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-auto pt-4 flex flex-col items-center gap-1.5 opacity-40 group-hover:opacity-60 transition-opacity">
          <span className="text-[8px] uppercase tracking-[0.25em] font-black text-white/40">Friend</span>
          <span className="text-[9px] text-white/30 font-medium flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            Since {friendsSince}
          </span>
        </div>
      </div>

      {/* Hover Actions Overlay */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); onViewProfile?.(friendship); }}
          className="w-36 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all font-bold text-[10px] uppercase tracking-widest shadow-xl cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          View Profile
        </button>
        
        {!confirmRemove ? (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmRemove(true); }}
            className="w-36 flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/10 transition-all font-bold text-[10px] uppercase tracking-widest shadow-xl cursor-pointer"
          >
            <UserMinus className="w-4 h-4" />
            Remove
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-36 p-3 rounded-2xl bg-red-500/20 border border-red-500/30 flex flex-col gap-2"
          >
            <p className="text-[9px] text-red-200 font-bold uppercase text-center tracking-tight">Confirm Remove?</p>
            <div className="flex gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmRemove(false); }}
                className="flex-1 py-1.5 text-[9px] bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-bold uppercase cursor-pointer"
              >
                No
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(friendship_id); }}
                className="flex-1 py-1.5 text-[9px] bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-bold uppercase cursor-pointer"
              >
                Yes
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </GlassCard>
  );
};


export default FriendCard;
