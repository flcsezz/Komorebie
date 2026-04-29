import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  LayoutDashboard, CheckSquare, FileText, Layers, 
  BarChart3, Home, Users, Settings, LogOut,
  Crown, Bell, Palette
} from 'lucide-react';

const BACKGROUNDS = [
  { id: 'forest', name: 'Forest Sanctuary', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop' },
  { id: 'rain', name: 'Rainy Window', url: 'https://images.unsplash.com/photo-1428592953211-077101b2021b?q=80&w=2560&auto=format&fit=crop' },
  { id: 'mountain', name: 'Mountain Lake', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2560&auto=format&fit=crop' },
  { id: 'anime', name: 'Anime Style Zen', url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=2560&auto=format&fit=crop' },
  { id: 'city', name: 'Night City', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2560&auto=format&fit=crop' }
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SidebarLink = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 relative group ${
      active 
        ? 'text-sage-200 font-medium' 
        : 'text-white/40 hover:text-white'
    }`}
  >
    {active && (
      <motion.div 
        layoutId="sidebar-active"
        className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
    <Icon 
      className={`w-4.5 h-4.5 relative z-10 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-sage-200' : ''}`} 
      strokeWidth={active ? 2 : 1.5} 
    />
    <span className="text-xs tracking-wide relative z-10">{label}</span>
  </Link>
);

const AppLayout: React.FC = () => {
  const location = useLocation();
  const [bgImage, setBgImage] = useState(() => localStorage.getItem('komorebie-bg') || BACKGROUNDS[0].url);
  const [showBgPicker, setShowBgPicker] = useState(false);

  useEffect(() => {
    localStorage.setItem('komorebie-bg', bgImage);
  }, [bgImage]);

  return (
    <div className="flex h-screen overflow-hidden relative bg-slate-950">
        {/* Dynamic Background Image */}
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
          style={{ backgroundImage: `url(${bgImage})`, transform: 'scale(1.1)' }}
        />
        {/* Dark Overlay */}
        <div className="fixed inset-0 z-[1] bg-slate-950/20" />
        
        {/* Sidebar */}
        <aside className="w-56 border-r border-white/5 flex flex-col z-30 bg-slate-950/40 backdrop-blur-2xl relative">
          <div className="p-8">
            <Link to="/app" className="text-xl font-display font-light tracking-tighter text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sage-200 shadow-[0_0_10px_rgba(183,201,176,0.5)]" />
              KOMOREBIE
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2 space-y-6 custom-scrollbar">
            {/* Main nav */}
            <div className="space-y-0.5">
              <SidebarLink to="/app" icon={LayoutDashboard} label="Sanctuary" active={location.pathname === '/app'} />
              <SidebarLink to="/app/tasks" icon={CheckSquare} label="Tasks" active={location.pathname === '/app/tasks'} />
              <SidebarLink to="/app/notes" icon={FileText} label="Notes" active={location.pathname === '/app/notes'} />
              <SidebarLink to="/app/flashcards" icon={Layers} label="Flashcards" active={location.pathname === '/app/flashcards'} />
              <SidebarLink to="/app/analytics" icon={BarChart3} label="Analytics" active={location.pathname === '/app/analytics'} />
            </div>

            {/* Atmosphere */}
            <div>
              <h4 className="px-4 text-[9px] font-bold text-white/20 uppercase tracking-[0.4em] mb-3">Atmosphere</h4>
              <div className="space-y-0.5">
                <SidebarLink to="/app/room" icon={Home} label="Zen Room" active={location.pathname === '/app/room'} />
                <SidebarLink to="/app/social" icon={Users} label="Social" active={location.pathname === '/app/social'} />
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-white/5 space-y-0.5 bg-slate-950/10">
            <SidebarLink to="/app/settings" icon={Settings} label="Settings" active={location.pathname === '/app/settings'} />
            <button className="w-full flex items-center gap-3 px-4 py-2 text-white/20 hover:text-red-400/60 hover:bg-red-400/5 rounded-xl transition-all duration-300 text-[11px] font-light group cursor-pointer">
              <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.5} />
              Log out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Topbar */}
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-slate-950/20 backdrop-blur-xl relative z-30">
            <div className="flex items-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-1.5 bg-sage-200/10 text-sage-200 border border-sage-200/20 rounded-full text-[9px] uppercase tracking-[0.2em] hover:bg-sage-200/20 transition-all font-bold cursor-pointer"
              >
                <Crown className="w-3 h-3" strokeWidth={3} />
                Go Premium
              </motion.button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowBgPicker(!showBgPicker)}
                  className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-white/40 hover:text-white cursor-pointer"
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
                            className={`w-full text-left px-3 py-2 rounded-xl text-[10px] transition-all flex items-center gap-2 ${
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
              <button className="flex items-center gap-2 pl-1 pr-3 py-0.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all duration-300 cursor-pointer group">
                <div className="w-7 h-7 rounded-full bg-sage-200/20 flex items-center justify-center border border-white/5 overflow-hidden relative">
                  <span className="text-sage-200 text-[10px] font-bold relative z-10">M</span>
                </div>
                <span className="text-xs font-light text-white/50 group-hover:text-white transition-colors">Menelaus</span>
              </button>
              
              <button className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-white/30 hover:text-white cursor-pointer relative">
                <Bell className="w-3.5 h-3.5" strokeWidth={1.5} />
                <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-sage-200 rounded-full border border-slate-950" />
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                id="page-transition-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  duration: 0.6, 
                  ease: [0.16, 1, 0.3, 1] 
                }}
                onAnimationComplete={(definition) => {
                  // When the 'animate' state finishes, clear the transform style
                  // to prevent it from creating a stacking context that breaks 
                  // backdrop-filter on child widgets.
                  const el = document.getElementById('page-transition-container');
                  if (el) el.style.transform = '';
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
