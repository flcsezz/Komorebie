import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Trees, Wind, Waves, Volume2, VolumeX, Music4, Flame } from 'lucide-react';
import { useSoundscape, SOUNDSCAPES } from '../../context/SoundscapeContext';

const SOUNDSCAPE_ICONS: Record<string, any> = {
  rain: CloudRain,
  forest: Trees,
  wind: Wind,
  waves: Waves,
  fire: Flame,
  lofi: Music4,
};

const SOUNDSCAPE_COLORS: Record<string, string> = {
  rain: 'text-blue-300',
  forest: 'text-green-300',
  wind: 'text-cyan-100',
  waves: 'text-blue-200',
  fire: 'text-orange-400',
  lofi: 'text-purple-300',
};

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

const SoundscapeSelector: React.FC = () => {
  const { volumes, isMuted, setVolume, toggleMute, toggleSound } = useSoundscape();

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex justify-between items-center px-2">
        <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/50 font-bold">Ambient Mixer</h4>
        <div className="flex items-center gap-2">
          {Object.values(volumes).some(v => v > 0) && !isMuted && (
            <Visualizer isActive={true} color="text-sage-200" />
          )}
          <button 
            onClick={toggleMute}
            className={`p-1.5 rounded-full border transition-colors cursor-pointer flex items-center justify-center ${
              isMuted 
                ? 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto custom-scrollbar pb-1.5 gap-2 px-1 snap-x snap-mandatory">
        {SOUNDSCAPES.map((sound) => {
          const Icon = SOUNDSCAPE_ICONS[sound.id];
          const color = SOUNDSCAPE_COLORS[sound.id];
          const vol = volumes[sound.id];
          const isActive = vol > 0;
          
          return (
            <div 
              key={sound.id}
              onWheel={(e) => {
                if (isActive) {
                  e.stopPropagation();
                  const delta = e.deltaY < 0 ? 5 : -5;
                  setVolume(sound.id, Math.max(0, Math.min(100, vol + delta)));
                }
              }}
              className={`snap-start min-w-[80px] flex-1 p-2.5 rounded-2xl border transition-all duration-500 flex flex-col gap-2 relative group ${
                isActive 
                  ? 'bg-white/10 border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.05)]' 
                  : 'bg-white/5 border-transparent hover:border-white/10 cursor-pointer overflow-hidden'
              }`}
            >
              <div 
                className="flex flex-col items-center justify-center gap-2 z-10 cursor-pointer"
                onClick={(e) => {
                  if ((e.target as HTMLElement).tagName !== 'INPUT') {
                    toggleSound(sound.id);
                  }
                }}
              >
                <div className={`p-2 rounded-xl ${isActive ? 'bg-white/10 ' + color : 'bg-white/5 text-white/20 group-hover:text-white/40'} transition-all`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/60'} transition-colors`}>
                    {sound.label}
                  </span>
                  <AnimatePresence>
                    {isActive && (
                      <motion.span 
                         initial={{ opacity: 0, height: 0 }}
                         animate={{ opacity: 1, height: 'auto' }}
                         exit={{ opacity: 0, height: 0 }}
                         className={`text-[9px] font-bold tracking-wider ${color}`}
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
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="relative h-1 w-full bg-white/10 rounded-full z-20 mt-0.5 flex items-center"
                  >
                    <motion.div 
                      initial={false}
                      animate={{ width: `${vol}%` }}
                      transition={{ ease: "easeOut", duration: 0.1 }}
                      className={`absolute inset-y-0 left-0 rounded-full ${color.replace('text', 'bg')}`}
                    />
                    <motion.div
                      initial={false}
                      animate={{ left: `${vol}%` }}
                      transition={{ ease: "easeOut", duration: 0.1 }}
                      className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]"
                      style={{ marginLeft: '-4px' }}
                    />
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={vol}
                      onChange={(e) => setVolume(sound.id, parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {isActive && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  className={`absolute inset-0 ${color.replace('text', 'bg')} blur-2xl -z-0 pointer-events-none rounded-2xl`}
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