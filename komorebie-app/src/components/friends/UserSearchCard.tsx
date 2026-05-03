import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Check, Clock, Loader2, Flame } from 'lucide-react';
import type { PublicProfile } from '../../lib/friends';

interface UserSearchCardProps {
  profile: PublicProfile;
  friendIds: Set<string>;
  pendingIds: Set<string>;
  onSendRequest: (userId: string) => Promise<{ success: boolean; error?: string }>;
}

const UserSearchCard: React.FC<UserSearchCardProps> = ({ profile, friendIds, pendingIds, onSendRequest }) => {
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFriend = friendIds.has(profile.id);
  const isPending = pendingIds.has(profile.id) || sent;

  const handleAdd = async () => {
    setSending(true);
    setError(null);
    try {
      const result = await onSendRequest(profile.id);
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error || 'Failed');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="group relative aspect-[2.5/3.5] p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden shadow-xl shadow-black/10 flex flex-col items-center text-center"
    >
      {/* Decorative corner accents */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-white/5 rounded-tl-lg group-hover:opacity-40 transition-opacity" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-white/5 rounded-tr-lg group-hover:opacity-40 transition-opacity" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-white/5 rounded-bl-lg group-hover:opacity-40 transition-opacity" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-white/5 rounded-br-lg group-hover:opacity-40 transition-opacity" />

      {/* Profile clickable area */}
      <div 
        className="mt-4 flex flex-col items-center cursor-pointer group/info w-full"
        onClick={() => navigate(`/app/friends/${profile.username}`)}
      >
        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0 group-hover/info:border-white/30 transition-all duration-500 shadow-lg">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-display font-light text-white/40">
              {(profile.display_name || profile.username || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="mt-5 flex-1 flex flex-col min-w-0 w-full">
          <h4 className="text-base font-display font-medium text-white truncate group-hover/info:text-sage-200 transition-colors">
            {profile.display_name || profile.username}
          </h4>
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mt-1">@{profile.username}</p>
        </div>
      </div>

      {profile.current_streak > 0 && (
        <div className="mt-4 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/5 border border-amber-500/10 w-fit mx-auto">
          <Flame className="w-3 h-3 text-amber-400/60" />
          <span className="text-[10px] text-amber-400/60 font-bold">{profile.current_streak}d streak</span>
        </div>
      )}

      {/* Action Button Section */}
      <div className="mt-auto pt-6 w-full">
        {isFriend ? (
          <div className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-sage-200/10 border border-sage-200/20 text-[10px] text-sage-200 uppercase tracking-widest font-black">
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
            Friends
          </div>
        ) : isPending ? (
          <div className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/15 text-[10px] text-amber-400/60 uppercase tracking-widest font-black">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </div>
        ) : (
          <button
            onClick={handleAdd}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-sage-200 text-slate-950 hover:bg-sage-300 transition-all text-[10px] uppercase tracking-widest font-black cursor-pointer disabled:opacity-40 shadow-lg shadow-sage-200/10"
          >
            {sending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
                Add
              </>
            )}
          </button>
        )}
      </div>

      {/* Error text */}
      {error && (
        <p className="absolute bottom-2 text-[8px] text-red-400/60 uppercase font-bold tracking-tighter">
          {error}
        </p>
      )}
    </motion.div>
  );
};

export default UserSearchCard;
