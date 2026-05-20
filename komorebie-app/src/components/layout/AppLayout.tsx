import React, { useState, useEffect, useCallback, useLayoutEffect, useRef, Suspense } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  LayoutDashboard, Layers,
  LogOut, Users,
  Crown, Menu, ChevronDown, Maximize, Minimize,
  Calendar, Music, Image as ImageIcon,
  Trophy, Clock, BarChart3, Flame, Sparkles, Check,
  ListChecks, Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDataSync } from '../../context/DataSyncContext';
import { useDevice } from '../../hooks/useDevice';
import InitialLoader from '../ui/InitialLoader';
import ResilientVideo from '../ui/ResilientVideo';
import OnboardingOverlay from '../profile/OnboardingOverlay';
import ConfirmModal from '../ui/ConfirmModal';
import { getRequestCount } from '../../lib/friends';
import { useBackground } from '../../context/BackgroundContext';
import { ALL_BACKGROUNDS } from '../../lib/backgrounds';
import OptimizedImage from '../ui/OptimizedImage';
import { ADMIN_EMAIL } from '../../lib/backgrounds';
import { TIERS, ADMIN_OVERRIDE_KEY, type TierKey } from '../../lib/leagues';

// Spring configuration for animations
const springConfig = { type: "spring" as const, stiffness: 300, damping: 35 };

const ManaCrystalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.5)] animate-pulse" style={{ animationDuration: '3s' }}>
    <path d="M12 2L5 9L12 22L19 9L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M12 2V22" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    <path d="M5 9H19" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    <path d="M12 2L8 9L12 22L16 9L12 2Z" stroke="currentColor" strokeWidth="1" opacity="0.7" strokeLinejoin="round" fill="currentColor" fillOpacity="0.05" />
  </svg>
);

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
  const { profile, stats, refresh, loading: dataLoading } = useDataSync();
  const { isMobile, isTouch } = useDevice();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const lastPathRef = useRef(location.pathname);
  const { background: backgroundOverride } = useBackground();

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

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSignOut = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmSignOut = async () => {
    setShowLogoutConfirm(false);
    await signOut();
  };

  const [bgImage, setBgImage] = useState(() => {
    const saved = localStorage.getItem('komorebie-bg');
    if (saved) return saved;
    const cosmic = ALL_BACKGROUNDS.find(b => b.id === 'cosmic-nebula');
    return cosmic ? cosmic.url : ALL_BACKGROUNDS[0].url;
  });

  const lastSyncedBgRef = useRef<string | null>(null);

  // Sync local bg state with profile background if it changes
  useEffect(() => {
    if (profile?.preferred_bg && profile.preferred_bg !== lastSyncedBgRef.current) {
      console.log('AppLayout: Syncing bgImage from profile:', profile.preferred_bg);
      setBgImage(profile.preferred_bg);
      localStorage.setItem('komorebie-bg', profile.preferred_bg);
      lastSyncedBgRef.current = profile.preferred_bg;
    }
  }, [profile?.preferred_bg]);

  // Log background override status for debugging
  useEffect(() => {
    if (backgroundOverride) {
      console.log('AppLayout: Background override active:', backgroundOverride);
    }
  }, [backgroundOverride]);

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
  const { backgroundType } = useBackground();
   const activeBg = backgroundOverride || bgImage;
  
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
    return () => clearTimeout(interval);
  }, [fetchFriendBadge]);

  useEffect(() => {
    const isLeavingFocus = prevPath === '/app/focus/session' && location.pathname !== '/app/focus/session';
    
    if (isLeavingFocus && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [location.pathname, prevPath]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFull = !!(doc.fullscreenElement || 
                       doc.webkitFullscreenElement || 
                       doc.mozFullScreenElement || 
                       doc.msFullscreenElement);
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const doc = document as any;
      const el = document.documentElement as any;

      const fullscreenElement = doc.fullscreenElement || 
                                doc.webkitFullscreenElement || 
                                doc.mozFullscreenElement || 
                                doc.msFullscreenElement;

      if (!fullscreenElement) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
          await el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
          await el.msRequestFullscreen();
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  };

const isVideoByExtension = activeBg ? /\.(mp4|webm|mov|ogg)($|\?)/i.test(activeBg) : false;
   const isVideo = backgroundType === 'video' || isVideoByExtension || (ALL_BACKGROUNDS.find(b => b.url === activeBg)?.type === 'video');

  // 2. Main app initialization
  // Use the premium InitialLoader instead of a plain spinner for a better UX
  if (authLoading || dataLoading) {
    return <InitialLoader show={true} />;
  }

  const needsOnboarding = user && (!profile || (!profile.has_completed_onboarding && !profile.username));

  return (
    <div className="flex h-screen overflow-hidden relative bg-transparent">
        <ConfirmModal 
          isOpen={showLogoutConfirm}
          title="Log Out"
          message="Are you sure you want to leave the sanctuary? Your progress is saved."
          confirmText="Log Out"
          isDestructive={true}
          onConfirm={confirmSignOut}
          onCancel={() => setShowLogoutConfirm(false)}
        />
        {/* Premium Route Transition Loader */}
        <InitialLoader show={isTransitioning} />

        {/* First-time Onboarding Overlay */}
        <AnimatePresence>
          {needsOnboarding && (
            <OnboardingOverlay 
              userId={user.id} 
              onComplete={() => refresh(true)} 
            />
          )}
        </AnimatePresence>

        {/* Dynamic Background — Crossfade System */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-950">
          <AnimatePresence mode="popLayout">
            {activeBg && (
              <motion.div
                key={activeBg}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                {isVideo ? (
                  <ResilientVideo
                    key={activeBg}
                    src={activeBg}
                    className="absolute inset-0"
                  />
                ) : (
                  <OptimizedImage
                    key={activeBg}
                    src={activeBg}
                    alt="Background"
                    loading="eager" // Backgrounds are critical
                    fetchPriority="high" // React 19 supports this
                    className="absolute inset-0"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Subtle dark overlay to ensure UI elements remain readable regardless of background content */}
          <div className="absolute inset-0 bg-slate-950/40 z-1" />
        </div>
        
        {/* Sidebar - Hover Peek Behavior (Desktop/Tablet) */}
        {!isMobile && (
          <motion.aside 
            initial={false}
            animate={{ width: isCollapsed ? 80 : 260 }}
            transition={springConfig}
            onMouseEnter={() => !isTouch && setIsCollapsed(false)}
            onMouseLeave={() => !isTouch && setIsCollapsed(true)}
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
                <OptimizedImage 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-lg flex-shrink-0 border border-white/10 group-hover/profile:border-sage-200/30 transition-colors" 
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
                    <span className="text-sm font-medium text-white/90 group-hover/profile:text-white transition-colors">
                      {profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Explorer'}
                    </span>
                    <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider">View Profile</span>
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
            <SidebarLink to="/app/habits" icon={ListChecks} label="Habits" active={location.pathname === '/app/habits'} isCollapsed={isCollapsed} />
            <SidebarLink to="/app/flashcards" icon={Layers} label="Flashcards" active={location.pathname.startsWith('/app/flashcards')} isCollapsed={isCollapsed} />

            {/* Preferences */}
            <SidebarSection label="Preferences" isCollapsed={isCollapsed}>
               <SidebarLink to="/app/music" icon={Music} label="Music" active={location.pathname === '/app/music'} isCollapsed={isCollapsed} />
               <SidebarLink to="/app/background" icon={ImageIcon} label="Background" active={location.pathname === '/app/background'} isCollapsed={isCollapsed} />
            </SidebarSection>

            {/* Community */}
            <SidebarSection label="Community" isCollapsed={isCollapsed}>
              <SidebarLink to="/app/leaderboard" icon={Trophy} label="Leaderboard" active={location.pathname === '/app/leaderboard'} isCollapsed={isCollapsed} />
              <SidebarLink to="/app/friends" icon={Users} label="Friends" active={location.pathname === '/app/friends'} isCollapsed={isCollapsed} badge={friendRequestBadge} />
            </SidebarSection>
          </div>

{/* Footer */}
           <div className="p-4 border-t border-white/5 space-y-1 bg-slate-950/10">
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
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          
          {/* Topbar */}
          <header className={`flex items-center justify-between relative z-30 ${isMobile ? 'h-16 px-4' : 'h-20 px-8'}`}>
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center gap-2 cursor-pointer group"
                onMouseEnter={() => isCollapsed && setIsCollapsed(false)}
              >
                <button 
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-2 -ml-2 rounded-xl transition-colors text-white/40 group-hover:text-white cursor-pointer hover:bg-white/5 flex-shrink-0 mr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-200/50"
                  title="Toggle Sidebar"
                  aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                  aria-expanded={!isCollapsed}
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
              
              <button className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-1.5 bg-sage-200/15 text-sage-200 border border-sage-200/30 rounded-full text-[10px] uppercase tracking-[0.2em] transition-colors hover:bg-sage-200/25 font-bold cursor-pointer shadow-[0_0_15px_rgba(183,201,176,0.1)]">
                <Crown className="w-3.5 h-3.5" strokeWidth={3} />
                <span className="hidden md:inline">Go Premium</span>
              </button>

{!isMobile && (
                 <button 
                   onClick={toggleFullscreen}
                   className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full transition-colors hover:bg-white/10 text-white/40 hover:text-white cursor-pointer"
                 >
                   {isFullscreen ? <Minimize className="w-3.5 h-3.5" strokeWidth={2} /> : <Maximize className="w-3.5 h-3.5" strokeWidth={2} />}
                   <span className="text-[11px] font-bold tracking-wide">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                 </button>
               )}
             </div>
            
            {/* Premium, Animated Mana Pill dropdown trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center gap-3 pl-3.5 pr-1.5 py-1 rounded-full transition-all duration-300 cursor-pointer group border backdrop-blur-xl ${
                  showProfileMenu 
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/40 shadow-[0_0_20px_rgba(52,211,153,0.25)]' 
                    : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-400/30 hover:shadow-[0_0_15px_rgba(52,211,153,0.15)]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <ManaCrystalIcon />
                  <span className="text-xs font-bold text-emerald-200 tabular-nums tracking-wide">{stats.mana.toLocaleString()}</span>
                  <span className="text-[8px] text-emerald-400/60 uppercase tracking-widest font-mono">mana</span>
                </div>
                
                <div className="h-4 w-px bg-emerald-500/20" />
                
                {profile?.avatar_url ? (
                  <OptimizedImage src={profile.avatar_url} alt="PFP" className="w-6.5 h-6.5 rounded-full border border-emerald-400/20" />
                ) : (
                  <div className="w-6.5 h-6.5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-400/20 overflow-hidden relative">
                    <span className="text-emerald-300 text-[9px] font-bold">
                      {(profile?.display_name || user?.email || 'E').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <ChevronDown className={`w-3.5 h-3.5 text-emerald-400/50 group-hover:text-emerald-400 transition-all duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
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
                       <p className="text-[11px] font-bold text-white/90 truncate">{profile?.display_name || 'Explorer'}</p>
                       <p className="text-[10px] text-white/40 font-medium truncate">@{profile?.username || 'explorer'}</p>
                       
                       <div className="flex items-center gap-3 mt-2">
                         <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                           <Flame className="w-3 h-3" />
                           {stats.currentStreak}d
                         </div>
                         <div className="flex items-center gap-1 text-[10px] text-sage-200 font-bold">
                           <Sparkles className="w-3 h-3" />
                           {stats.mana}
                         </div>
                       </div>
                     </div>
                     
                     <div className="space-y-0.5">
                       <Link 
                         to="/app/profile" 
                         onClick={() => setShowProfileMenu(false)}
                         className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] text-white/60 hover:bg-white/5 hover:text-white transition-all group font-medium"
                       >
                         <Users className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                         My Sanctuary
                       </Link>
                       <div className="h-px bg-white/5 my-1 mx-2" />
                       <button 
                         onClick={() => {
                           setShowProfileMenu(false);
                           handleSignOut();
                         }}
                         className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] text-red-400/80 hover:bg-red-400/5 hover:text-red-400 transition-all group cursor-pointer font-medium"
                       >
                         <LogOut className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                         Log Out
                       </button>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
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
          
          {/* Bottom Right Time (Desktop/Tablet) */}
          {!isMobile && (
            <div className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full z-20 hover:bg-white/10 transition-colors">
              <Clock className="w-4 h-4 text-sage-200" />
              <span className="text-[12px] font-mono font-bold text-white tabular-nums">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {/* Mobile Bottom Navigation */}
          {isMobile && (
            <nav className="h-16 glass-deep border-t border-white/10 flex items-center justify-around px-2 relative z-50">
              <Link to="/app" className={`flex flex-col items-center gap-1 p-2 ${location.pathname === '/app' ? 'text-sage-200' : 'text-white/40'}`}>
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-tighter">Dashboard</span>
              </Link>
              <Link to="/app/analytics" className={`flex flex-col items-center gap-1 p-2 ${location.pathname === '/app/analytics' ? 'text-sage-200' : 'text-white/40'}`}>
                <BarChart3 className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-tighter">Analytics</span>
              </Link>
              <Link to="/app/friends" className={`flex flex-col items-center gap-1 p-2 ${location.pathname === '/app/friends' ? 'text-sage-200' : 'text-white/40'}`}>
                <div className="relative">
                  <Users className="w-5 h-5" />
                  {!!friendRequestBadge && friendRequestBadge > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-sage-200 text-slate-950 text-[7px] font-black flex items-center justify-center">
                      {friendRequestBadge}
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-tighter">Social</span>
              </Link>
              <Link to="/app/settings" className={`flex flex-col items-center gap-1 p-2 ${location.pathname === '/app/settings' ? 'text-sage-200' : 'text-white/40'}`}>
                <Settings className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-tighter">Settings</span>
              </Link>
            </nav>
          )}

          {/* Portal target for floating page controls (e.g. Previewers, Presence) */}
          <div id="floating-page-controls" className="pointer-events-none" />

          {/* Admin League Panel */}
          {((user?.email || '').toLowerCase() === (ADMIN_EMAIL || '').toLowerCase() && (ADMIN_EMAIL || '') !== '') && (
            <AdminLeaguePanel isSidebarCollapsed={isCollapsed} />
          )}
        </div>
    </div>
  );
};

const AdminLeaguePanel = ({ isSidebarCollapsed }: { isSidebarCollapsed: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [leagueOverride, setLeagueOverride] = useState<TierKey | null>(() => {
    return localStorage.getItem(ADMIN_OVERRIDE_KEY) as TierKey | null;
  });

  const handleSelect = (key: TierKey | null) => {
    setLeagueOverride(key);
    if (key) localStorage.setItem(ADMIN_OVERRIDE_KEY, key);
    else localStorage.removeItem(ADMIN_OVERRIDE_KEY);
    // Reload to apply changes globally
    window.location.reload();
  };

  return (
    <div 
      className="fixed bottom-24 md:bottom-8 z-[100] transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] pointer-events-auto"
      style={{ left: isSidebarCollapsed ? '96px' : '276px' }}
    >
      <div className="relative">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10, x: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10, x: -10 }}
              className="absolute bottom-full left-0 mb-4 p-3 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl min-w-[180px]"
            >
              <div className="flex flex-col gap-1">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold px-2 py-1">Admin Overrides</p>
                {TIERS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => handleSelect(t.key)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer ${
                      leagueOverride === t.key
                        ? `${t.bgColor} ${t.textColor} border ${t.borderColor}`
                        : 'text-white/40 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {t.name}
                    {leagueOverride === t.key && <Check className="w-3 h-3" />}
                  </button>
                ))}
                <div className="h-px bg-white/5 my-1" />
                <button
                  onClick={() => handleSelect(null)}
                  className={`px-3 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer ${
                    !leagueOverride
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  Reset (Auto)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-200/50 ${
            isOpen 
              ? 'bg-sage-200 border-sage-200 text-slate-900 rotate-90' 
              : 'bg-slate-900/80 backdrop-blur-md border-white/10 text-white/40 hover:text-sage-200 hover:border-sage-200/50'
          }`}
          aria-label={isOpen ? "Close Admin Menu" : "Open Admin Menu"}
          aria-expanded={isOpen}
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AppLayout;