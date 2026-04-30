import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import GlassCard from '../components/ui/GlassCard';
import { Mail, Lock, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuthGateway: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError("Verification email sent. Please check your inbox.");
        setLoading(false);
        return;
      }
      navigate('/app');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full animate-slow-spin pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] border border-white/[0.03] rounded-full animate-slow-spin-reverse pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard variant="frosted" className="p-8 md:p-10 shadow-2xl border-white/10">
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sage-200/10 border border-sage-200/20 mb-6"
            >
              <Sparkles className="w-6 h-6 text-sage-200" />
            </motion.div>
            <h1 className="text-2xl font-display font-light tracking-[0.2em] text-white mb-2 uppercase">
              {isLogin ? 'Welcome Back' : 'Create Sanctuary'}
            </h1>
            <p className="text-white/40 text-xs tracking-widest font-light uppercase">
              {isLogin ? 'Enter your focus sanctuary' : 'Begin your journey to deep focus'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] text-white/30 uppercase tracking-[0.2em] ml-4">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-sage-200/50 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@sanctuary.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-light text-white placeholder:text-white/10 focus:outline-none focus:border-sage-200/30 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] text-white/30 uppercase tracking-[0.2em] ml-4">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-sage-200/50 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-light text-white placeholder:text-white/10 focus:outline-none focus:border-sage-200/30 transition-all"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-[11px] text-red-400 text-center font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-4 rounded-2xl bg-sage-200/10 hover:bg-sage-200/20 border border-sage-200/20 text-sage-200 font-bold text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Enter Sanctuary' : 'Join Komorebie'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-widest">
              <span className="bg-[#121212] px-4 text-white/20 font-bold">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 font-medium text-xs transition-all flex items-center justify-center gap-3 group"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 12.23c0-.85-.08-1.68-.22-2.48H12v4.69h5.11c-.22 1.48-.91 2.74-2.02 3.59v2.98h3.27c1.91-1.75 3.02-4.33 3.02-7.39z"/><path d="M12 21.46c2.53 0 4.65-.84 6.2-2.27l-3.27-2.98c-.84.56-1.92.89-3.08.89-2.37 0-4.38-1.6-5.1-3.75H3.34v3.08A9.48 9.48 0 0 0 12 21.46z"/><path d="M6.9 13.35A5.67 5.67 0 0 1 6.64 12c0-.46.08-.91.22-1.35V7.57H3.34A9.48 9.48 0 0 0 2 12c0 1.54.37 2.99 1.02 4.29l3.88-2.94z"/><path d="M12 6.54c1.38 0 2.62.48 3.59 1.41l2.69-2.69A9.43 9.43 0 0 0 12 2.54 9.48 9.48 0 0 0 3.34 7.57l3.56 2.94c.72-2.15 2.73-3.75 5.1-3.75z"/></svg>
            Google
          </button>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] text-white/30 uppercase tracking-[0.2em] hover:text-white transition-colors"
            >
              {isLogin ? "Don't have a sanctuary? Sign Up" : "Already have a sanctuary? Login"}
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default AuthGateway;
