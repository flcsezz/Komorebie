import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  LayoutDashboard, Layers, 
  Settings, LogOut, Users,
  Crown, Bell, Palette, Menu, ChevronDown, Maximize, Minimize,
  Calendar, SlidersHorizontal, Music, Eye, Image as ImageIcon,
  Trophy, MessageSquare, Share2, LifeBuoy
} from 'lucide-react';
import { useZenClock } from '../../context/ZenClockContext';
import { useAuth } from '../../context/AuthContext';

const BACKGROUNDS = [
  { id: 'forest', name: 'Forest Sanctuary', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop' },
  { id: 'rain', name: 'Rainy Window', url: 'https://images.unsplash.com/photo-1428592953211-077101b2021b?q=80&w=2560&auto=format&fit=crop' },
  { id: 'mountain', name: 'Mountain Lake', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2560&auto=format&fit=crop' },
  { id: 'anime', name: 'Anime Style Zen', url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=2560&auto=format&fit=crop' },
  { id: 'city', name: 'Night City', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2560&auto=format&fit=crop' }
];

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
const SidebarLink = ({ to, icon: Icon, label, active, isCollapsed }: { to: string, icon: any, label: string, active: boolean, isCollapsed: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl relative group transition-colors duration-300 ${
      active 
        ? 'text-white font-medium bg-white/10' 
        : 'text-white/40 hover:text-white hover:bg-white/5'
    }`}
  >
    <Icon 
      className={`w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-white' : ''}`} 
      strokeWidth={active ? 2 : 1.5} 
    />
    <AnimatePresence>
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
  const { timeLeft, isActive, duration } = useZenClock();
  const { signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / (duration * 60)) * 100;

  const [bgImage, setBgImage] = useState(() => localStorage.getItem('komorebie-bg') || BACKGROUNDS[0].url);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync sidebar with timer state
  useEffect(() => {
    if (isActive) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [isActive]);

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
    localStorage.setItem('komorebie-bg', bgImage);
  }, [bgImage]);

  

  return (
    <div className="flex h-screen overflow-hidden relative bg-transparent">
        {/* Dynamic Background Image */}
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000 ease-in-out pointer-events-none opacity-40"
          style={{ backgroundImage: `url(${bgImage})`, transform: 'scale(1.1)' }}
        />
        {/* Dark Overlay */}
        <div className="fixed inset-0 z-[1] bg-slate-950/20 pointer-events-none" />
        
        {/* Sidebar */}
        <motion.aside 
          initial={false}
          animate={{ width: isCollapsed ? 80 : 260 }}
          transition={springConfig}
          className="h-screen border-r border-white/10 flex flex-col z-30 glass relative"
        >
          {/* Sidebar Header */}
          <div className={`py-6 flex items-center min-h-[80px] overflow-hidden transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
            <Branding isCollapsed={isCollapsed} />
          </div>

          {/* User Profile */}
          <div className="px-4 mb-8">
            <Link 
              to="/app/profile"
              className={`flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/5 transition-colors hover:bg-white/10 group/profile ${isCollapsed ? 'w-12 h-12 justify-center mx-auto' : 'w-full'}`}
            >
              <div className="w-8 h-8 rounded-lg bg-cover bg-center flex-shrink-0 border border-white/10 group-hover/profile:border-sage-200/30 transition-colors" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop)' }} />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col"
                  >
                    <span className="text-sm font-medium text-white/80 group-hover/profile:text-white transition-colors">maverick</span>
                    <span className="text-[10px] text-white/30">View Profile</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2 space-y-1 custom-scrollbar">
            {/* Main Nav */}
            <SidebarLink to="/app" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/app'} isCollapsed={isCollapsed} />
            <SidebarLink to="/app/calendar" icon={Calendar} label="Calendar" active={location.pathname === '/app/calendar'} isCollapsed={isCollapsed} />
            <SidebarLink to="/app/flashcards" icon={Layers} label="Flashcards" active={location.pathname === '/app/flashcards'} isCollapsed={isCollapsed} />

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
              <SidebarLink to="/app/friends" icon={Users} label="Friends" active={location.pathname === '/app/friends'} isCollapsed={isCollapsed} />
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
              <AnimatePresence>
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
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 -ml-2 rounded-xl transition-colors text-white/40 hover:text-white cursor-pointer hover:bg-white/5 flex-shrink-0 mr-2"
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
              
              <AnimatePresence>
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                    className="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full group"
                  >
                    <div className="relative w-4 h-4">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="8" cy="8" r="7" className="stroke-white/5 fill-none" strokeWidth="1" />
                        <motion.circle 
                          cx="8" cy="8" r="7" 
                          className="stroke-sage-200 fill-none" 
                          strokeWidth="1.5" 
                          strokeDasharray="44"
                          animate={{ strokeDashoffset: 44 - (44 * progress) / 100 }}
                        />
                      </svg>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-white/80 tabular-nums">
                      {formatTime(timeLeft)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button className="flex items-center gap-2 px-4 py-1.5 bg-sage-200/10 text-sage-200 border border-sage-200/20 rounded-full text-[9px] uppercase tracking-[0.2em] transition-colors hover:bg-sage-200/20 font-bold cursor-pointer">
                <Crown className="w-3 h-3" strokeWidth={3} />
                Go Premium
              </button>

              <button 
                onClick={toggleFullscreen}
                className="p-2 bg-white/5 border border-white/10 rounded-full transition-colors hover:bg-white/10 text-white/40 hover:text-white cursor-pointer ml-2"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Maximize className="w-3.5 h-3.5" strokeWidth={1.5} />}
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
                        {BACKGROUNDS.map((bg) => (
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
                            <div className="w-6 h-4 rounded bg-cover bg-center" style={{ backgroundImage: `url(${bg.url})` }} />
                            {bg.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 pl-1 pr-3 py-0.5 bg-white/5 border border-white/10 rounded-full transition-colors duration-300 cursor-pointer group">
                <div className="w-7 h-7 rounded-full bg-sage-200/20 flex items-center justify-center border border-white/5 overflow-hidden relative">
                  <span className="text-sage-200 text-[10px] font-bold relative z-10">M</span>
                </div>
                <span className="text-xs font-light text-white/50 group-hover:text-white transition-colors">Menelaus</span>
              </button>
              
              <button className="p-2 bg-white/5 border border-white/10 rounded-full transition-colors hover:bg-white/10 text-white/30 hover:text-white cursor-pointer relative">
                <Bell className="w-3.5 h-3.5" strokeWidth={1.5} />
                <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-sage-200 rounded-full border border-slate-950" />
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className="min-h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
    </div>
  );
};

export default AppLayout;