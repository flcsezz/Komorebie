import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Lock, 
  CheckCircle2, 
  Info,
  Crown,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { PUBLIC_BACKGROUNDS, SPECIAL_BACKGROUNDS, LIVE_BACKGROUNDS, SPECIAL_LIVE_BACKGROUNDS, ADMIN_EMAIL } from '../lib/backgrounds';
import type { Background } from '../lib/backgrounds';
import { useBackground } from '../context/BackgroundContext';
import { supabase } from '../lib/supabase';

const BackgroundPage: React.FC = () => {
  const { user } = useAuth();
  const { profile, refresh } = useAnalytics();
  const { setBackground: setGlobalBg } = useBackground();
  const [selectedId, setSelectedId] = useState<string | null>(profile?.preferred_bg || null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [collectionType, setCollectionType] = useState<'standard' | 'live'>('standard');

  // Check for admin access
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const handleSelect = async (bg: Background, target: 'dashboard' | 'profile' = 'dashboard') => {
    if (bg.isSpecial && !isAdmin) return;
    
    // If it's a dashboard change, update UI instantly
    if (target === 'dashboard') {
      setSelectedId(bg.url);
      setGlobalBg(bg.url, bg.type);
    }
    
    setIsUpdating(true);
    
    try {
      if (user) {
        const updateData = target === 'dashboard' 
          ? { preferred_bg: bg.url } 
          : { profile_bg: bg.url };

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);
          
        if (error) throw error;
        
        if (target === 'dashboard') {
          localStorage.setItem('komorebie-bg', bg.url);
        }
        
        // Refresh analytics context to sync across app
        await refresh();
      }
    } catch (err) {
      console.error(`Failed to update ${target} background:`, err);
    } finally {
      setIsUpdating(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };


  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* Header Section */}
      <div className="mb-12 space-y-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-2.5 rounded-2xl bg-sage-200/10 border border-sage-200/20 text-sage-200">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-light tracking-tight text-white/90">Atmospheric Backdrops</h1>
            <p className="text-white/40 text-sm font-light">Set the mood for your deep work sanctuary.</p>
          </div>
        </motion.div>

        {/* Collection Toggle */}
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
          <button
            onClick={() => setCollectionType('standard')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              collectionType === 'standard' 
                ? 'bg-sage-200 text-slate-950 shadow-lg' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setCollectionType('live')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              collectionType === 'live' 
                ? 'bg-sage-200 text-slate-950 shadow-lg' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Live Wallpapers
          </button>
        </div>
      </div>

      {/* Main Selection Grid */}
      <div className="space-y-12">
        {/* Public Collection */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-white/20">Standard Collection</h2>
            <div className="h-px flex-1 bg-white/5 mx-6" />
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {(collectionType === 'standard' ? PUBLIC_BACKGROUNDS : LIVE_BACKGROUNDS).map((bg) => (
              <BackgroundCard 
                key={bg.id}
                bg={bg}
                isSelected={selectedId === bg.url || profile?.preferred_bg === bg.url}
                isHovered={hoveredId === bg.id}
                isAdmin={isAdmin}
                currentProfileBg={profile?.profile_bg}
                onHover={() => setHoveredId(bg.id)}
                onLeave={() => setHoveredId(null)}
                onSelect={(target) => handleSelect(bg, target)}
                isUpdating={isUpdating && selectedId === bg.url}
              />
            ))}
          </motion.div>
        </section>

        {/* Live Wallpaper Placeholder (for non-admin) */}
        {!isAdmin && collectionType === 'live' && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-white/20">Exclusive Motion Series</h2>
              <div className="h-px flex-1 bg-white/5 mx-6" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="aspect-[16/10] rounded-3xl border border-white/5 bg-white/2 flex flex-col items-center justify-center gap-3 grayscale">
                  <Lock className="w-6 h-6 text-white/10" />
                  <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">Locked Content</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Admin Collection - Only visible to you */}
        {isAdmin && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-sage-200">Admin Access</h2>
                <Crown className="w-3 h-3 text-sage-200/60" />
              </div>
              <div className="h-px flex-1 bg-sage-200/10 mx-6" />
              <div className="flex items-center gap-2 text-[10px] text-sage-200/60 font-medium">
                <Lock className="w-3 h-3" />
                <span>Private Assets</span>
              </div>
            </div>
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {(collectionType === 'standard' ? SPECIAL_BACKGROUNDS : SPECIAL_LIVE_BACKGROUNDS).map((bg) => (
                <BackgroundCard 
                  key={bg.id}
                  bg={bg}
                  isSelected={selectedId === bg.url || profile?.preferred_bg === bg.url}
                  isHovered={hoveredId === bg.id}
                  isAdmin={isAdmin}
                  currentProfileBg={profile?.profile_bg}
                  onHover={() => setHoveredId(bg.id)}
                  onLeave={() => setHoveredId(null)}
                  onSelect={(target) => handleSelect(bg, target)}
                  isSpecial
                  isUpdating={isUpdating && selectedId === bg.url}
                />
              ))}
            </motion.div>
          </section>
        )}
      </div>

      {/* Info Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-20 p-6 rounded-3xl bg-white/2 border border-white/5 flex flex-col md:flex-row items-center gap-6"
      >
        <div className="p-3 rounded-2xl bg-sage-200/5 text-sage-200">
          <Info className="w-5 h-5" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-sm font-medium text-white/80">Pro-tip: Focus Beats Assets</h4>
          <p className="text-xs text-white/30 font-light mt-1">Consistency is key. Every 5-minute session builds your focus rhythm and unlocks new aesthetic possibilities.</p>
        </div>
        <button className="px-6 py-2 bg-sage-200/10 hover:bg-sage-200/20 text-sage-200 text-xs font-bold rounded-full transition-all border border-sage-200/20 flex items-center gap-2 group">
          View Achievements
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </div>
  );
};

interface BackgroundCardProps {
  bg: Background;
  isSelected: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: (target?: 'dashboard' | 'profile') => void;
  isAdmin?: boolean;
  currentProfileBg?: string | null;
  isLocked?: boolean;
  isSpecial?: boolean;
  isUpdating?: boolean;
}

const BackgroundCard: React.FC<BackgroundCardProps> = ({ 
  bg, 
  isSelected, 
  isHovered, 
  isAdmin,
  currentProfileBg,
  onHover, 
  onLeave, 
  onSelect,
  isLocked,
  isSpecial,
  isUpdating
}) => {
  const isSelectedAsProfile = currentProfileBg === bg.url;
  return (
    <motion.div
      layout
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 }
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={() => onSelect()}
      className={`group relative aspect-[16/10] rounded-3xl overflow-hidden border cursor-pointer transition-all duration-500 bg-optimize-quality ${
        isSelected 
          ? (isSpecial ? 'border-amber-400/40 shadow-[0_0_30px_rgba(251,191,36,0.15)]' : 'border-sage-200/40 shadow-[0_0_30px_rgba(183,201,176,0.15)]') 
          : 'border-white/10 hover:border-white/30'
      } ${isLocked ? 'cursor-not-allowed' : ''}`}
    >
      {/* Background Media */}
      {bg.type === 'video' ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ${isHovered ? 'scale-110' : 'scale-100'} ${isLocked ? 'blur-sm grayscale brightness-50' : ''}`}
        >
          <source src={bg.url} type={bg.url?.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
        </video>
      ) : (
        <div 
          className={`absolute inset-0 bg-cover bg-center transition-transform duration-1000 bg-optimize-quality ${isHovered ? 'scale-110' : 'scale-100'} ${isLocked ? 'blur-sm grayscale brightness-50' : ''}`}
          style={{ backgroundImage: `url(${bg.url})` }}
        />
      )}
      
      {/* Selection Overlay */}
      <AnimatePresence>
        {isSelected && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-10 flex items-center justify-center ${isSpecial ? 'bg-amber-400/10' : 'bg-sage-200/10'}`}
          >
            <div className={`p-2 rounded-full ${isSpecial ? 'bg-amber-400 text-slate-950' : 'bg-sage-200 text-slate-950'} shadow-2xl`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-slate-950/40 backdrop-blur-[2px]">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40">
            <Lock className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Locked</span>
        </div>
      )}

      {/* Labels */}
      <div className="absolute inset-x-0 bottom-0 z-30 p-4 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pt-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-white/90">{bg.name}</span>
            {isSpecial && (
              <span className="text-[9px] font-black text-amber-400/80 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <Crown className="w-2.5 h-2.5" />
                Special Edition
              </span>
            )}
          </div>
          
          <AnimatePresence>
            {isHovered && !isLocked && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2"
              >
                {isAdmin ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelect('dashboard'); }}
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border transition-all ${
                        isSelected ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60'
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelect('profile'); }}
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border transition-all ${
                        isSelectedAsProfile ? 'bg-sage-200 border-sage-200 text-slate-950' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60'
                      }`}
                    >
                      Profile
                    </button>
                  </>
                ) : (
                  !isSelected && (
                    <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest bg-white/10 px-2 py-1 rounded-full border border-white/5">
                      Apply
                    </div>
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Updating Loader */}
      {isUpdating && (
        <div className="absolute inset-0 z-40 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-sage-200 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </motion.div>
  );
};

export default BackgroundPage;
