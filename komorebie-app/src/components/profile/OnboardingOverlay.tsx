import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Sparkles, User, AtSign, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface OnboardingOverlayProps {
  onComplete: () => void;
  userId: string;
}

const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ onComplete, userId }) => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const containerVariants: any = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        staggerChildren: 0.1 
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 1.1, 
      transition: { duration: 0.3 } 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Check if username is taken
      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existing) {
        setError('This username is already taken. Try another one.');
        setLoading(false);
        return;
      }

      // Upsert profile (ensure it exists and update it)
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username,
          display_name: displayName || username,
          full_name: displayName || username,
          has_completed_onboarding: true,
          display_name_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;
      
      onComplete();
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const emailName = user.email ? user.email.split('@')[0] : 'user';
      const defaultName = user.user_metadata?.full_name || user.user_metadata?.name || emailName;
      let baseUsername = emailName.toLowerCase().replace(/[^a-z0-9_]/g, '');
      
      if (baseUsername.length < 3) baseUsername = baseUsername + '123';

      let finalUsername = baseUsername;
      let isUnique = false;
      let counter = 0;
      
      while (!isUnique) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', finalUsername)
          .maybeSingle();
          
        if (!existing) {
          isUnique = true;
        } else {
          counter++;
          finalUsername = `${baseUsername}${counter}`;
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: finalUsername,
          display_name: defaultName,
          full_name: defaultName,
          has_completed_onboarding: true,
          display_name_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;
      
      onComplete();
    } catch (err: any) {
      console.error('Onboarding skip error:', err);
      setError('Failed to skip onboarding. Please try manually configuring identity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" 
      />
      
      {/* Background Decorative Elements - Matching Login Screen */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Concentric Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] border border-white/5 rounded-full animate-slow-spin opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/[0.03] rounded-full animate-slow-spin-reverse opacity-20" />
        
        {/* Ambient Gradient Orbs - Synchronized with AuthGateway */}
        <div className="ambient-orb ambient-orb-sage w-[600px] h-[600px] absolute top-1/4 right-[-10%] opacity-40" style={{ animationDelay: '-3s' }} />
        <div className="ambient-orb ambient-orb-indigo w-[500px] h-[500px] absolute bottom-[-10%] left-[-10%] opacity-30" style={{ animationDelay: '-10s' }} />
        <div className="ambient-orb ambient-orb-warm w-[400px] h-[400px] absolute top-1/3 left-1/4 opacity-20" style={{ animationDelay: '-6s' }} />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full max-w-xl z-10"
      >
        <GlassCard variant="frosted" className="p-8 sm:p-12 shadow-2xl border-white/10 overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sage-200/20 to-transparent flex items-center justify-center border border-sage-200/30 mx-auto mb-6 shadow-[0_0_40px_rgba(183,201,176,0.1)]">
                    <Sparkles className="w-10 h-10 text-sage-200" />
                  </div>
                  <h1 className="text-3xl font-display font-light text-white mb-3">Begin Your Journey</h1>
                  <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed font-light">
                    Welcome to <span className="text-white/80 font-medium tracking-widest">KOMOREBIE</span>. A space designed for deep focus and restorative work.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: ShieldCheck, title: 'Safe Haven', desc: 'No trackers, no distractions.' },
                    { icon: Zap, title: 'Deep Work', desc: 'Flow-state optimized UI.' }
                  ].map((feat, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <feat.icon className="w-5 h-5 text-sage-200/60 mb-2" />
                      <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">{feat.title}</h3>
                      <p className="text-[10px] text-white/30 leading-tight">{feat.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setStep(2)}
                    disabled={loading}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-4 rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                  >
                    Configure Identity
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    onClick={handleSkip}
                    disabled={loading}
                    className="w-full text-white/40 hover:text-white/80 font-medium py-3 text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                    Skip & Auto-Generate
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-sage-200/10 flex items-center justify-center border border-sage-200/20">
                    <User className="w-6 h-6 text-sage-200" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-light text-white">Your Identity</h2>
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold mt-1">Finalize your sanctuary address</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Display Name</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-sage-200/50 transition-colors">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Master Explorer"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-sage-200/40 transition-all text-sm"
                      />
                    </div>
                    <p className="text-[11px] text-white/40 ml-1">Visible to others. Can be changed every 7 days.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Unique Username</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-sage-200/50 transition-colors">
                        <AtSign className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="e.g. wanderer_42"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-sage-200/40 transition-all text-sm"
                      />
                    </div>
                    <div className="flex items-start gap-2 ml-1">
                      <ShieldCheck className="w-3 h-3 text-amber-200/60 mt-0.5" />
                      <p className="text-[11px] text-amber-200/60 italic leading-tight">Attention: Your username is permanent and cannot be changed later.</p>
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-medium"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-4 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all text-sm"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || username.length < 3 || !displayName}
                      className="flex-1 bg-sage-200 hover:bg-sage-300 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold py-4 rounded-2xl shadow-[0_0_30px_rgba(183,201,176,0.3)] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          Finalize Identity
                          <Check className="w-4 h-4 transition-transform group-hover:scale-125" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default OnboardingOverlay;
