import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Sparkles, Image as ImageIcon, Video, Music, Loader2, Check } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { ALL_BACKGROUNDS, PUBLIC_BACKGROUNDS, SPECIAL_BACKGROUNDS, ADMIN_MUSIC } from '../../lib/backgrounds';
import { supabase } from '../../lib/supabase';
import ResilientVideo from '../ui/ResilientVideo';

interface ProfileStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalHours: number;
  isAdmin: boolean;
  currentBg: string | null;
  currentAudio: string | null;
  userId: string;
  onUpdate: () => Promise<void>;
}

const DECORATION_UNLOCK_HOURS = 35;

const ProfileStyleModal: React.FC<ProfileStyleModalProps> = ({
  isOpen,
  onClose,
  totalHours,
  isAdmin,
  currentBg,
  currentAudio,
  userId,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'static' | 'live' | 'music'>('static');
  const [saving, setSaving] = useState<string | null>(null);

  const isUnlocked = isAdmin || totalHours >= DECORATION_UNLOCK_HOURS;
  const progress = Math.min((totalHours / DECORATION_UNLOCK_HOURS) * 100, 100);

  const staticBgs = [...PUBLIC_BACKGROUNDS, ...SPECIAL_BACKGROUNDS];
  const liveBgs = ALL_BACKGROUNDS.filter(bg => bg.type === 'video');

  const handleSelectBackground = async (bgUrl: string) => {
    if (!isUnlocked) return;
    setSaving(bgUrl);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ profile_bg: bgUrl })
        .eq('id', userId);
      
      if (error) throw error;
      await onUpdate();
    } catch (err) {
      console.error('Failed to update profile background:', err);
    } finally {
      setSaving(null);
    }
  };

  const handleSelectMusic = async (audioUrl: string) => {
    if (!isAdmin) return; // Currently music is admin-only per requirement
    setSaving(audioUrl);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ unmuted_audio: audioUrl })
        .eq('id', userId);
      
      if (error) throw error;
      await onUpdate();
    } catch (err) {
      console.error('Failed to update profile music:', err);
    } finally {
      setSaving(null);
    }
  };

  const renderPremiumLock = (title: string, description: string) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      <div className="relative mb-6">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30"
        >
          <Lock className="w-8 h-8 text-amber-500" />
        </motion.div>
        <motion.div 
          animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="w-6 h-6 text-amber-400" />
        </motion.div>
      </div>
      <h3 className="text-xl font-display font-light text-white mb-2">{title}</h3>
      <p className="text-sm text-white/40 max-w-xs leading-relaxed">
        {description}
      </p>
      <button className="mt-8 px-6 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-all cursor-not-allowed opacity-50">
        Unlock with Premium
      </button>
    </motion.div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 30 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        className="relative w-full max-w-2xl z-10"
      >
        <GlassCard variant="frosted" className="p-0 overflow-hidden border-white/10 shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
            <div>
              <h2 className="text-xl font-display font-light text-white flex items-center gap-2">
                Profile Decoration
                {!isUnlocked && <Lock className="w-4 h-4 text-white/20" />}
              </h2>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">
                Customize your sanctuary's public face
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress / Locked State for Users < 35h */}
          {!isUnlocked && (
            <div className="px-6 py-4 bg-amber-500/5 border-b border-amber-500/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-tight">Focus Reward</span>
                <span className="text-[10px] font-bold text-amber-500/80">{Math.floor(totalHours)}h / {DECORATION_UNLOCK_HOURS}h</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-amber-500/40"
                />
              </div>
              <p className="text-[10px] text-amber-500/60 mt-2 italic flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Focus for {Math.ceil(DECORATION_UNLOCK_HOURS - totalHours)} more hours to unlock profile customization.
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-white/5 bg-white/2">
            <button 
              onClick={() => setActiveTab('static')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'static' ? 'text-sage-200 bg-white/5' : 'text-white/30 hover:text-white/60 hover:bg-white/2'}`}
            >
              <ImageIcon className="w-4 h-4" />
              Backgrounds
            </button>
            <button 
              onClick={() => setActiveTab('live')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'live' ? 'text-sage-200 bg-white/5' : 'text-white/30 hover:text-white/60 hover:bg-white/2'}`}
            >
              <Video className="w-4 h-4" />
              Live BGs
            </button>
            <button 
              onClick={() => setActiveTab('music')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'music' ? 'text-sage-200 bg-white/5' : 'text-white/30 hover:text-white/60 hover:bg-white/2'}`}
            >
              <Music className="w-4 h-4" />
              Profile Music
            </button>
          </div>

          {/* Content Area */}
          <div className="max-h-[450px] overflow-y-auto custom-scrollbar p-6 bg-slate-950/20">
            <AnimatePresence mode="wait">
              {activeTab === 'static' && (
                <motion.div 
                  key="static"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                  {/* Reset to Dashboard Sync */}
                  <button
                    onClick={() => handleSelectBackground('')}
                    disabled={!isUnlocked}
                    className={`relative group rounded-2xl aspect-[16/10] overflow-hidden border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                      !currentBg ? 'border-sage-200 bg-sage-200/5' : 'border-white/10 bg-white/5 hover:border-white/20'
                    } ${!isUnlocked && 'opacity-40 grayscale cursor-not-allowed'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <Sparkles className="w-5 h-5 text-white/40" />
                    </div>
                    <span className="text-[10px] font-bold text-white/60 uppercase">Sync Dashboard</span>
                    {!currentBg && <div className="absolute top-2 right-2 w-5 h-5 bg-sage-200 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-slate-950" /></div>}
                  </button>

                  {staticBgs.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => handleSelectBackground(bg.url)}
                      disabled={!isUnlocked}
                      className={`relative group rounded-2xl aspect-[16/10] overflow-hidden border-2 transition-all ${
                        currentBg === bg.url ? 'border-sage-200' : 'border-white/10 hover:border-white/20'
                      } ${!isUnlocked && 'opacity-40 grayscale cursor-not-allowed'}`}
                    >
                      <img src={bg.url} alt={bg.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">{bg.name}</span>
                      </div>
                      {currentBg === bg.url && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-sage-200 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-slate-950" />
                        </div>
                      )}
                      {saving === bg.url && (
                        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}

              {activeTab === 'live' && (
                <motion.div key="live">
                  {isAdmin ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {liveBgs.map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => handleSelectBackground(bg.url)}
                          className={`relative group rounded-2xl aspect-[16/10] overflow-hidden border-2 transition-all ${
                            currentBg === bg.url ? 'border-sage-200' : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <ResilientVideo src={bg.url} className="w-full h-full" muted loop playsInline />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                            <span className="text-[9px] font-bold text-white uppercase tracking-wider">{bg.name}</span>
                          </div>
                          {currentBg === bg.url && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-sage-200 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-slate-950" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    renderPremiumLock(
                      "Cinematic Experiences",
                      "Immerse your visitors in a living world with high-fidelity video backgrounds. Available for Premium users and Zen Masters."
                    )
                  )}
                </motion.div>
              )}

              {activeTab === 'music' && (
                <motion.div key="music">
                  {isAdmin ? (
                    <div className="space-y-3">
                      {/* Reset Music */}
                      <button
                        onClick={() => handleSelectMusic('')}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                          !currentAudio ? 'border-sage-200 bg-sage-200/5' : 'border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                            <Music className="w-5 h-5 text-white/40" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-sm font-light text-white">Silent Sanctuary</h4>
                            <p className="text-[9px] text-white/20 uppercase tracking-widest mt-0.5">No ambient profile music</p>
                          </div>
                        </div>
                        {!currentAudio && <Check className="w-4 h-4 text-sage-200" />}
                      </button>

                      {ADMIN_MUSIC.map((track) => (
                        <button
                          key={track.id}
                          onClick={() => handleSelectMusic(track.url)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                            currentAudio === track.url ? 'border-sage-200 bg-sage-200/5' : 'border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-sage-200/10 flex items-center justify-center text-sage-200">
                              <Sparkles className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <h4 className="text-sm font-light text-white">{track.name}</h4>
                              <p className="text-[9px] text-sage-200/60 uppercase tracking-widest mt-0.5">High-Fidelity Ambient Aura</p>
                            </div>
                          </div>
                          {currentAudio === track.url && <Check className="w-4 h-4 text-sage-200" />}
                          {saving === track.url && <Loader2 className="w-4 h-4 text-white animate-spin" />}
                        </button>
                      ))}
                    </div>
                  ) : (
                    renderPremiumLock(
                      "Sonic Identity",
                      "Define your aura with ambient profile music that plays when friends visit. Elevate your status with a premium soundtrack."
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Info */}
          <div className="p-4 bg-white/2 border-t border-white/5 text-center">
            <p className="text-[9px] text-white/20 uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3 text-amber-500/40" />
              Aesthetics separate from dashboard
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default ProfileStyleModal;
