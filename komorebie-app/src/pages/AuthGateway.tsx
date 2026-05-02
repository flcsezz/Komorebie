import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import GlassCard from '../components/ui/GlassCard';
import { Sparkles } from 'lucide-react';

const AuthGateway: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Initiating ${provider} Login with origin:`, window.location.origin);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/app`
        }
      });
      if (error) {
        console.error(`Supabase ${provider} OAuth error:`, error);
        throw error;
      }
    } catch (err) {
      const error = err as Error;
      console.error(`${provider} Login Exception:`, error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full animate-slow-spin pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] border border-white/[0.03] rounded-full animate-slow-spin-reverse pointer-events-none" />
      
      {/* Ambient gradient orbs — give backdrop-filter something to blur */}
      <div className="ambient-orb ambient-orb-sage w-[400px] h-[400px] absolute top-1/4 right-1/4" style={{ animationDelay: '-3s' }} />
      <div className="ambient-orb ambient-orb-indigo w-[350px] h-[350px] absolute bottom-1/4 left-1/3" style={{ animationDelay: '-10s' }} />
      <div className="ambient-orb ambient-orb-warm w-[250px] h-[250px] absolute top-1/3 left-1/4" style={{ animationDelay: '-6s' }} />

      <div className="w-full max-w-md relative z-10">
        <GlassCard variant="frosted" className="p-8 md:p-10 shadow-2xl border-white/10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sage-200/10 border border-sage-200/20 mb-6">
              <Sparkles className="w-6 h-6 text-sage-200" />
            </div>
            <h1 className="text-2xl font-display font-light tracking-[0.2em] text-white mb-2 uppercase">
              Enter KOMOREBIE
            </h1>
            <p className="text-white/40 text-[10px] tracking-[0.25em] font-light uppercase mt-4">
              Connect to begin your journey
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              type="button"
              className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-medium text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"><path d="M21 12.23c0-.85-.08-1.68-.22-2.48H12v4.69h5.11c-.22 1.48-.91 2.74-2.02 3.59v2.98h3.27c1.91-1.75 3.02-4.33 3.02-7.39z"/><path d="M12 21.46c2.53 0 4.65-.84 6.2-2.27l-3.27-2.98c-.84.56-1.92.89-3.08.89-2.37 0-4.38-1.6-5.1-3.75H3.34v3.08A9.48 9.48 0 0 0 12 21.46z"/><path d="M6.9 13.35A5.67 5.67 0 0 1 6.64 12c0-.46.08-.91.22-1.35V7.57H3.34A9.48 9.48 0 0 0 2 12c0 1.54.37 2.99 1.02 4.29l3.88-2.94z"/><path d="M12 6.54c1.38 0 2.62.48 3.59 1.41l2.69-2.69A9.43 9.43 0 0 0 12 2.54 9.48 9.48 0 0 0 3.34 7.57l3.56 2.94c.72-2.15 2.73-3.75 5.1-3.75z"/></svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleOAuthLogin('github')}
              disabled={loading}
              type="button"
              className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-medium text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              Continue with GitHub
            </button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-[11px] text-red-400 text-center font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 text-center">
            <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">
              By entering, you agree to our terms of sanctuary
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AuthGateway;
