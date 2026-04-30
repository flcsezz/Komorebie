import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Trees, Wind, Waves, Volume2, VolumeX, Music4, Flame } from 'lucide-react';

// Reliable Google Actions sounds (Royalty Free & Fast CDN)
const SOUNDSCAPES = [
  { id: 'rain', icon: CloudRain, label: 'Rain', color: 'text-blue-300', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
  { id: 'forest', icon: Trees, label: 'Forest', color: 'text-green-300', url: 'https://actions.google.com/sounds/v1/ambiences/summer_forest.ogg' },
  { id: 'wind', icon: Wind, label: 'Wind', color: 'text-cyan-100', url: 'https://actions.google.com/sounds/v1/weather/strong_wind.ogg' },
  { id: 'waves', icon: Waves, label: 'Ocean', color: 'text-blue-200', url: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg' },
  { id: 'fire', icon: Flame, label: 'Campfire', color: 'text-orange-400', url: 'https://actions.google.com/sounds/v1/ambiences/fire.ogg' },
  { id: 'lofi', icon: Music4, label: 'Cafe', color: 'text-purple-300', url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg' },
];

const Visualizer = ({ isActive, color }: { isActive: boolean, color: string }) => {
  return (
    <div className="flex items-end justify-center gap-[2px] h-3 w-5 opacity-80">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ height: '20%' }}
          animate={{ height: isActive ? ['20%', '100%', '40%', '80%', '20%'] : '20%' }}
          transition={{
            duration: 1 + i * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.1,
          }}
          className={`w-[2px] rounded-t-full ${color.replace('text', 'bg')}`}
        />
      ))}
    </div>
  );
};

const AudioPlayer = ({ url, volume, isPlaying, isMuted }: { url: string, volume: number, isPlaying: boolean, isMuted: boolean }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        // Handle potential autoplay blocking
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn("Autoplay prevented:", error);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, url]);

  // Using preload="none" is critical to prevent the browser from downloading 6 audio streams simultaneously on load
  return <audio ref={audioRef} src={url} loop preload="none" />;
};

const SoundscapeSelector: React.FC = () => {
  const [volumes, setVolumes] = useState<Record<string, number>>(
    SOUNDSCAPES.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {})
  );
  const [isMuted, setIsMuted] = useState(false);

  const handleVolumeChange = (id: string, value: number) => {
    setVolumes(prev => ({ ...prev, [id]: value }));
  };

  const toggleSound = (id: string) => {
    setVolumes(prev => ({
      ...prev,
      [id]: prev[id] > 0 ? 0 : 50 // Default to 50% when toggled on
    }));
  };

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="flex justify-between items-center px-2">
        <h4 className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-bold">Ambient Mixer</h4>
        <div className="flex items-center gap-2">
          {Object.values(volumes).some(v => v > 0) && !isMuted && (
            <Visualizer isActive={true} color="text-sage-200" />
          )}
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-full border transition-colors cursor-pointer flex items-center justify-center ${
              isMuted 
                ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto custom-scrollbar pb-2 gap-3 px-2 snap-x snap-mandatory">
        {SOUNDSCAPES.map((sound) => {
          const Icon = sound.icon;
          const vol = volumes[sound.id];
          const isActive = vol > 0;
          
          return (
            <div 
              key={sound.id}
              onWheel={(e) => {
                if (isActive) {
                  // Adjust volume via wheel (scroll up = +5%, scroll down = -5%)
                  // prevent default scrolling when adjusting volume
                  e.stopPropagation();
                  const delta = e.deltaY < 0 ? 5 : -5;
                  handleVolumeChange(sound.id, Math.max(0, Math.min(100, vol + delta)));
                }
              }}
              className={`snap-start min-w-[100px] flex-1 p-4 rounded-3xl border transition-all duration-500 flex flex-col gap-4 relative group ${
                isActive 
                  ? 'bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                  : 'bg-white/5 border-transparent hover:border-white/10 cursor-pointer overflow-hidden'
              }`}
            >
              <AudioPlayer url={sound.url} volume={vol} isPlaying={isActive} isMuted={isMuted} />

              <div 
                className="flex flex-col items-center justify-center gap-3 z-10 cursor-pointer"
                onClick={(e) => {
                  // Only toggle if they click the icon/label area, not the slider
                  if ((e.target as HTMLElement).tagName !== 'INPUT') {
                    toggleSound(sound.id);
                  }
                }}
              >
                <div className={`p-3 rounded-2xl ${isActive ? 'bg-white/10 ' + sound.color : 'bg-white/5 text-white/20 group-hover:text-white/40'} transition-all`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-white/80' : 'text-white/20 group-hover:text-white/40'} transition-colors`}>
                    {sound.label}
                  </span>
                  <AnimatePresence>
                    {isActive && (
                      <motion.span 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`text-[8px] font-bold tracking-wider ${sound.color}`}
                      >
                        {vol}%
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <AnimatePresence>
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="relative h-1.5 w-full bg-white/10 rounded-full z-20 mt-1 flex items-center"
                  >
                    {/* Active Track */}
                    <motion.div 
                      initial={false}
                      animate={{ width: `${vol}%` }}
                      transition={{ ease: "easeOut", duration: 0.1 }}
                      className={`absolute inset-y-0 left-0 rounded-full ${sound.color.replace('text', 'bg')}`}
                    />
                    {/* Slider Thumb (Dot) */}
                    <motion.div
                      initial={false}
                      animate={{ left: `${vol}%` }}
                      transition={{ ease: "easeOut", duration: 0.1 }}
                      className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]"
                      style={{ marginLeft: '-5px' }} // Center the dot on the exact percentage
                    />
                    {/* Invisible Range Input */}
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={vol}
                      onChange={(e) => handleVolumeChange(sound.id, parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dynamic Background Pulse for active sounds */}
              {isActive && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.15 }}
                  className={`absolute inset-0 ${sound.color.replace('text', 'bg')} blur-3xl -z-0 pointer-events-none rounded-3xl`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SoundscapeSelector;