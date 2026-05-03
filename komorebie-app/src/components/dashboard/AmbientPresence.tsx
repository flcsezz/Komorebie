import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePresence } from '../../hooks/usePresence';
import { useFriends } from '../../hooks/useFriends';
import { Sparkles, Users } from 'lucide-react';

const AmbientPresence: React.FC = () => {
  const { friends } = useFriends();
  const { presences } = usePresence();

  // Find friends who are actively focusing
  const focusingFriends = friends.filter(f => presences[f.friend.id]?.is_active);

  if (focusingFriends.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-8 z-10 flex flex-col gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
        <Sparkles className="w-3 h-3 text-sage-200 animate-pulse" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
          Focusing Now
        </span>
      </div>

      <div className="flex items-center -space-x-2">
        <AnimatePresence>
          {focusingFriends.map((f, i) => (
            <motion.div
              key={f.friend.id}
              initial={{ opacity: 0, x: -10, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                scale: 1,
                y: [0, -4, 0],
              }}
              transition={{ 
                delay: i * 0.1,
                y: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5
                }
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group"
            >
              <div className="w-10 h-10 rounded-full border-2 border-green-400/20 p-0.5 bg-slate-900 shadow-[0_0_20px_rgba(74,222,128,0.1)] hover:border-green-400/50 transition-colors cursor-help">
                <div className="w-full h-full rounded-full overflow-hidden bg-sage-200/5 flex items-center justify-center">
                  {f.friend.avatar_url ? (
                    <img src={f.friend.avatar_url} alt={f.friend.display_name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <Users className="w-4 h-4 text-white/20" />
                  )}
                </div>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-white/10 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <p className="text-[10px] font-bold text-white/90">{f.friend.display_name}</p>
                <p className="text-[8px] font-medium text-green-400/70 uppercase tracking-widest mt-0.5">
                  Deep Focus Mode
                </p>
              </div>
              
              {/* Silhouette pulse effect */}
              <div className="absolute inset-0 rounded-full bg-green-400/5 animate-ping -z-10" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AmbientPresence;
