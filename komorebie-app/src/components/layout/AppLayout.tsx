import React, { useState, useEffect, useCallback, useLayoutEffect, useRef, Suspense } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  LayoutDashboard, Layers, 
  Settings, LogOut, Users,
  Crown, Bell, Palette, Menu, ChevronDown, Maximize, Minimize,
  Calendar, SlidersHorizontal, Music, Eye, Image as ImageIcon,
  Trophy, MessageSquare, Share2, LifeBuoy, Clock, BarChart3, Loader2, Flame, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import InitialLoader from '../ui/InitialLoader';
import OnboardingOverlay from '../profile/OnboardingOverlay';
import { getRequestCount } from '../../lib/friends';
import { supabase } from '../../lib/supabase';
import { useBackground } from '../../context/BackgroundContext';
import { getVisibleBackgrounds, ALL_BACKGROUNDS } from '../../lib/backgrounds';

// Spring configuration for animations
const springConfig = { type: "spring" as const, stiffness: 300, damping: 35 };

const BrandingText = () => (
  <Link to="/app" className="flex flex-col justify-center overflow-hidden whitespace-nowrap group outline-none">
    <span className="text-[17px] font-display tracking-[0.25em] font-light text-white/90 group-hover:text-white transition-colors duration-500 leading-none mt-0.5">
      KOMOREBIE
    </span>
  </Link>
);

const Branding = ({ isCollapsed }: { isCollapsed?: boolean }) => (
  <Link to="/app" className="flex items-center gap-3 group outline-none">
    {/* Logo Mark - Minimalist Zen Garden / Sunlight Motif */}
    <div className="flex-shrink-0 relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-lg overflow-hidden transition-all duration-700 ease-out group-hover:border-sage-200/40 group-hover:shadow-[0_0_20px_rgba(183,201,176,0.15)] group-hover:-translate-y-0.5">
      {/* Subtle diagonal shine effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_ease-out] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
      
      {/* Icon composition */}
      <div className="relative flex items-center justify-center w-full h-full">
        {/* Core light/sun */}
        <div className="absolute w-2 h-2 rounded-full bg-sage-200 shadow-[0_0_8px_rgba(183,201,176,0.8)] transition-transform duration-700 group-hover:scale-110" />
        
        {/* Orbiting element 1 - representing focus */}
        <div className="absolute w-5 h-5 rounded-full border border-sage-200/30 transition-transform duration-1000 group-hover:rotate-90 group-hover:scale-110" />
        
        {/* Orbiting element 2 - representing structure */}
        <div className="absolute w-5 h-5 rounded-full border border-white/20 scale-75 rotate-45 transition-transform duration-1000 group-hover:-rotate-45 group-hover:scale-95 group-hover:border-sage-200/20" />
      </div>
    </div>
    
    {/* Typographic Wordmark */}
    <AnimatePresence initial={false}>
      {!isCollapsed && (
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 'auto', opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={springConfig}
          className="flex flex-col justify-center overflow-hidden whitespace-nowrap"
        >
          <span className="text-[17px] font-display tracking-[0.25em] font-light text-white/90 group-hover:text-white transition-colors duration-500 leading-none mt-0.5">
            KOMOREBIE
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  </Link>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SidebarLink = ({ to, icon: Icon, label, active, isCollapsed, badge }: { 
  to: string, 
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>, 
  label: string, 
  active: boolean, 
  isCollapsed: boolean,
  badge?: number 
}) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl relative group transition-colors duration-300 ${
      active 
        ? 'text-white font-medium bg-white/10' 
        : 'text-white/40 hover:text-white hover:bg-white/5'
    }`}
  >
    <div className="relative">
      <Icon 
        className={`w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-white' : ''}`} 
        strokeWidth={active ? 2 : 1.5} 
      />
      {!!badge && badge > 0 && (
        <div className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-sage-200 text-slate-950 text-[7px] font-black flex items-center justify-center z-20">
          {badge > 9 ? '9+' : badge}
        </div>
      )}
    </div>
    <AnimatePresence initial={false}>
      {!isCollapsed && (
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="text-sm tracking-wide relative z-10 whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
    {!!badge && badge > 0 && !isCollapsed && (
      <span className="ml-auto text-[9px] font-bold bg-sage-200/15 text-sage-200 px-1.5 py-0.5 rounded-full">
        {badge}
      </span>
    )}
    {isCollapsed && (
      <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] border border-white/10">
        {label}
      </div>
    )}
  </Link>
);

const SidebarSection = ({ label, isCollapsed, children }: { label: string, isCollapsed: boolean, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  if (isCollapsed) {
    return (
      <div className="py-2 border-t border-white/5 mt-4">
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-1 mt-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] hover:text-white/40 transition-colors"
      >
        <span>{label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AppLayout: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, stats, refresh } = useAnalytics();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const lastPathRef = useRef(location.pathname);

  // Instant transition trigger on path change
  useLayoutEffect(() => {
    if (location.pathname !== lastPathRef.current) {
      setIsTransitioning(true);
      setPrevPath(lastPathRef.current); // Store old path
      lastPathRef.current = location.pathname;
      
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const [bgImage, setBgImage] = useState(() => {
    return localStorage.getItem('komorebie-bg') || ALL_BACKGROUNDS[0].url;
  });

  // Sync background state with profile when it loads
  useEffect(() => {
    if (profile?.preferred_bg && profile.preferred_bg !== bgImage) {
      setBgImage(profile.preferred_bg);
      localStorage.setItem('komorebie-bg', profile.preferred_bg);
    }
  }, [profile?.preferred_bg, bgImage]);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
const [isFullscreen, setIsFullscreen] = useState(false);
  const [friendRequestBadge, setFriendRequestBadge] = useState(0);
  const { background: backgroundOverride } = useBackground();
  
  // Fetch friend request count for badge
  const fetchFriendBadge = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getRequestCount(user.id);
      setFriendRequestBadge(count);
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    fetchFriendBadge();
    const interval = setInterval(fetchFriendBadge, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchFriendBadge]);

  useEffect(() => {
    const isLeavingFocus = prevPath === '/app/focus/session' && location.pathname !== '/app/focus/session';
    
    if (isLeavingFocus && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [location.pathname, prevPath]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error("Error attempting to enable fullscreen:", err);
      }
    } else {
      if (document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch (err) {
          console.error("Error attempting to exit fullscreen:", err);
        }
      }
    }
  };

  useEffect(() => {
    // Only sync if we have a user and the bgImage is different from what's in the profile
    // to avoid redundant updates on mount
    if (user && profile && bgImage !== profile.preferred_bg) {
      localStorage.setItem('komorebie-bg', bgImage);
      supabase.from('profiles').update({ preferred_bg: bgImage }).eq('id', user.id).then(() => {});
    }
  }, [bgImage, user, profile]);

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-sage-200 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden relative bg-transparent">
        {/* Premium Route Transition Loader */}
        <InitialLoader show={isTransitioning} />

        {/* First-time Onboarding Overlay */}
        <AnimatePresence>
          {user && profile && !profile.has_completed_onboarding && !profile.username && (
            <OnboardingOverlay 
              userId={user.id} 
              onComplete={() => refresh()} 
            />
          )}
        </AnimatePresence>

        {/* Dynamic Background Image */}
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-700 ease-in-out pointer-events-none opacity-40"
          style={{ backgroundImage: `url(${backgroundOverride || bgImage})`, transform: 'scale(1.05)' }}
        />
        {/* Background Overlay */}
        <div className="fixed inset-0 z-[1] bg-slate-950/20 pointer-events-none" />
        
        {/* Sidebar - Hover Peek Behavior */}
        <motion.aside 
          initial={false}
          animate={{ width: isCollapsed ? 80 : 260 }}
          transition={springConfig}
          onMouseEnter={() => setIsCollapsed(false)}
          onMouseLeave={() => setIsCollapsed(true)}
          className="h-screen border-r border-white/10 flex flex-col z-30 glass relative"
        >
          {/* Sidebar Header */}
          <div 
            className={`py-6 flex items-center min-h-[80px] overflow-hidden transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}
          >
            <Branding isCollapsed={isCollapsed} />
          </div>

          {/* User Profile */}
          <div className="px-4 mb-8">
            <Link 
              to="/app/profile"
              className={`flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/5 transition-colors hover:bg-white/10 group/profile ${isCollapsed ? 'w-12 h-12 justify-center mx-auto' : 'w-full'}`}
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-white/10 group-hover/profile:border-sage-200/30 transition-colors" 
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 border border-white/10 group-hover/profile:border-sage-200/30 transition-colors">
                  <span className="text-xs font-bold text-white/40">{(profile?.display_name || user?.email || 'E').charAt(0).toUpperCase()}</span>
                </div>
              )}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col"
                  >
                    <span className="text-sm font-medium text-white/80 group-hover/profile:text-white transition-colors">
                      {profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Explorer'}
                    </span>
                    <span className="text-[10px] text-white/30">View Profile</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2 space-y-1 custom-scrollbar">
            {/* Main Nav */}
            <SidebarLink to="/app" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/app'} isCollapsed={isCollapsed} />
            <SidebarLink to="/app/analytics" icon={BarChart3} label="Analytics" active={location.pathname === '/app/analytics'} isCollapsed={isCollapsed} />
            <SidebarLink to="/app/calendar" icon={Calendar} label="Calendar" active={location.pathname === '/app/calendar'} isCollapsed={isCollapsed} />
            <SidebarLink to="/app/flashcards" icon={Layers} label="Flashcards" active={location.pathname.startsWith('/app/flashcards')} isCollapsed={isCollapsed} />

            {/* Preferences */}
            <SidebarSection label="Preferences" isCollapsed={isCollapsed}>
              <SidebarLink to="/app/customize" icon={SlidersHorizontal} label="Customize" active={location.pathname === '/app/customize'} isCollapsed={isCollapsed} />
              <SidebarLink to="/app/music" icon={Music} label="Music" active={location.pathname === '/app/music'} isCollapsed={isCollapsed} />
              <SidebarLink to="/app/focus" icon={Eye} label="Focus Mode" active={location.pathname === '/app/focus'} isCollapsed={isCollapsed} />
              <SidebarLink to="/app/background" icon={ImageIcon} label="Background" active={location.pathname === '/app/background'} isCollapsed={isCollapsed} />
            </SidebarSection>

            {/* Community */}
            <SidebarSection label="Community" isCollapsed={isCollapsed}>
              <SidebarLink to="/app/leaderboard" icon={Trophy} label="Leaderboard" active={location.pathname === '/app/leaderboard'} isCollapsed={isCollapsed} />
              <SidebarLink to="/app/friends" icon={Users} label="Friends" active={location.pathname === '/app/friends'} isCollapsed={isCollapsed} badge={friendRequestBadge} />
            </SidebarSection>

            {/* Join Our Gang */}
            {!isCollapsed && (
              <div className="mt-12 p-4 text-center">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-4">Join Our Gang!</p>
                <div className="flex justify-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#5865F2] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-[#5865F2]/20">
                    <MessageSquare className="w-5 h-5 text-white" fill="currentColor" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#FF4500] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-[#FF4500]/20">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/5 space-y-1 bg-slate-950/10">
            <SidebarLink to="/app/settings" icon={Settings} label="Settings" active={location.pathname === '/app/settings'} isCollapsed={isCollapsed} />
            <SidebarLink to="/app/contact" icon={LifeBuoy} label="Contact Us" active={location.pathname === '/app/contact'} isCollapsed={isCollapsed} />
            <button 
              onClick={handleSignOut}
              className={`w-full flex items-center gap-3 px-4 py-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-colors duration-300 text-sm font-light group cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.5} />
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    Log out
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          
          {/* Topbar */}
          <header className="h-20 flex items-center justify-between px-8 relative z-30">
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center gap-2 cursor-pointer group"
                onMouseEnter={() => isCollapsed && setIsCollapsed(false)}
              >
                <button 
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-2 -ml-2 rounded-xl transition-colors text-white/40 group-hover:text-white cursor-pointer hover:bg-white/5 flex-shrink-0 mr-2"
                  title="Toggle Sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <AnimatePresence initial={false}>
                  {isCollapsed && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={springConfig}
                      className="overflow-hidden mr-2"
                    >
                      <BrandingText />
                    </motion.div>
                  )}
</AnimatePresence>
              </div>
              
              <button className="flex items-center gap-2 px-4 py-1.5 bg-sage-200/10 text-sage-200 border border-sage-200/20 rounded-full text-[9px] uppercase tracking-[0.2em] transition-colors hover:bg-sage-200/20 font-bold cursor-pointer">
                <Crown className="w-3 h-3" strokeWidth={3} />
                Go Premium
              </button>

              <button 
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full transition-colors hover:bg-white/10 text-white/40 hover:text-white cursor-pointer"
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Maximize className="w-3.5 h-3.5" strokeWidth={1.5} />}
                <span className="text-[10px] font-medium">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
              </button>
              
              <div className="relative flex items-center ml-2">
                <button 
                  onClick={() => setShowBgPicker(!showBgPicker)}
                  className="p-2 bg-white/5 border border-white/10 rounded-full transition-colors hover:bg-white/10 text-white/40 hover:text-white cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                
                <AnimatePresence>
                  {showBgPicker && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-12 left-0 w-48 bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 z-[100] shadow-2xl"
                    >
                      <h5 className="px-3 py-2 text-[9px] uppercase tracking-widest text-white/30 font-bold">Backgrounds</h5>
                      <div className="space-y-1">
                        {getVisibleBackgrounds(user?.email).map((bg) => (
                          <button
                            key={bg.id}
                            onClick={() => {
                              setBgImage(bg.url);
                              setShowBgPicker(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-[10px] transition-colors flex items-center gap-2 ${
                              bgImage === bg.url ? 'bg-sage-200/10 text-sage-200' : 'text-white/40 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className="w-6 h-4 rounded bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${bg.url})` }} />
                            {bg.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="flex items-center gap-3" ref={profileMenuRef}>
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-3 pl-1 pr-3 py-0.5 rounded-full transition-all duration-300 cursor-pointer group border ${
                    showProfileMenu ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'
                  }`}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="PFP" className="w-7 h-7 rounded-full object-cover border border-white/5" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-sage-200/20 flex items-center justify-center border border-white/5 overflow-hidden relative">
                      <span className="text-sage-200 text-[10px] font-bold relative z-10">
                        {(profile?.display_name || user?.email || 'E').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-xs font-light text-white/50 group-hover:text-white transition-colors flex items-center gap-2">
                    {profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Explorer'}
                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </span>
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-12 right-0 w-48 bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-2xl p-2 z-[100] shadow-2xl"
                    >
                      <div className="px-3 py-2 mb-1 border-b border-white/5">
                        <p className="text-[10px] font-bold text-white/80 truncate">{profile?.display_name || 'Explorer'}</p>
                        <p className="text-[9px] text-white/30 truncate">@{profile?.username || 'explorer'}</p>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-[9px] text-amber-400 font-bold">
                            <Flame className="w-2.5 h-2.5" />
                            {stats.currentStreak}d
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-sage-200 font-bold">
                            <Sparkles className="w-2.5 h-2.5" />
                            {stats.mana}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-0.5">
                        <Link 
                          to="/app/profile" 
                          onClick={() => setShowProfileMenu(false)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] text-white/50 hover:bg-white/5 hover:text-white transition-all group"
                        >
                          <Users className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                          My Sanctuary
                        </Link>
                        <Link 
                          to="/app/settings" 
                          onClick={() => setShowProfileMenu(false)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] text-white/50 hover:bg-white/5 hover:text-white transition-all group"
                        >
                          <Settings className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                          Settings
                        </Link>
                        <div className="h-px bg-white/5 my-1 mx-2" />
                        <button 
                          onClick={() => {
                            setShowProfileMenu(false);
                            handleSignOut();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] text-red-400/60 hover:bg-red-400/5 hover:text-red-400 transition-all group cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                          Log Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <button className="p-2 bg-white/5 border border-white/10 rounded-full transition-colors hover:bg-white/10 text-white/30 hover:text-white cursor-pointer relative">
                <Bell className="w-3.5 h-3.5" strokeWidth={1.5} />
                <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-sage-200 rounded-full border border-slate-950" />
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar relative">
            <div className="min-h-full">
              <Suspense fallback={<InitialLoader show={true} />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
          
          {/* Bottom Right Time */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full z-20">
            <Clock className="w-3.5 h-3.5 text-sage-200" />
            <span className="text-[11px] font-mono font-semibold text-white/80 tabular-nums">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
    </div>
  );
};

export default AppLayout;