import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Clock, Loader2 } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import type { FriendRequest } from '../../lib/friends';

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
}

const FriendRequestCard: React.FC<FriendRequestCardProps> = ({ request, onAccept, onReject, onCancel }) => {
  const { profile, direction, created_at } = request;
  const [acting, setActing] = useState<string | null>(null);

  const [now] = useState(() => Date.now());
  const timeAgo = getTimeAgo(created_at, now);

  const handleAction = async (action: string, fn?: (id: string) => Promise<void>) => {
    if (!fn) return;
    setActing(action);
    try {
      await fn(request.id);
    } finally {
      setActing(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: direction === 'incoming' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <GlassCard variant="icy" className="p-4 group hover:border-white/15 transition-all">
        <div className="flex items-center gap-3.5">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-display font-light text-white/40">
                {(profile.display_name || profile.username || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-display font-light text-white truncate">
              {profile.display_name || profile.username}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-white/25 tracking-wider">@{profile.username}</span>
              <span className="text-[9px] text-white/15 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {timeAgo}
              </span>
            </div>
          </div>

          {/* Actions */}
          {direction === 'incoming' ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAction('accept', onAccept)}
                disabled={!!acting}
                className="w-8 h-8 rounded-xl bg-sage-200/10 border border-sage-200/20 text-sage-200 hover:bg-sage-200/20 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
                title="Accept"
              >
                {acting === 'accept' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
              </button>
              <button
                onClick={() => handleAction('reject', onReject)}
                disabled={!!acting}
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-white/30 hover:text-red-400 hover:bg-red-400/5 hover:border-red-400/20 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
                title="Decline"
              >
                {acting === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" strokeWidth={2.5} />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/15 text-[9px] text-amber-400/60 uppercase tracking-widest font-bold">
                Pending
              </span>
              <button
                onClick={() => handleAction('cancel', onCancel)}
                disabled={!!acting}
                className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-all cursor-pointer disabled:opacity-40"
                title="Cancel Request"
              >
                {acting === 'cancel' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};

function getTimeAgo(dateStr: string, now: number): string {
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default FriendRequestCard;
