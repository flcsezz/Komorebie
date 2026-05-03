import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Reliable Google Actions sounds
export const SOUNDSCAPES = [
  { id: 'rain', label: 'Rain', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
  { id: 'forest', label: 'Forest', url: 'https://actions.google.com/sounds/v1/ambiences/summer_forest.ogg' },
  { id: 'wind', label: 'Wind', url: 'https://actions.google.com/sounds/v1/weather/strong_wind.ogg' },
  { id: 'waves', label: 'Ocean', url: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg' },
  { id: 'fire', label: 'Campfire', url: 'https://actions.google.com/sounds/v1/ambiences/fire.ogg' },
  { id: 'lofi', label: 'Cafe', url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg' },
];

interface SoundscapeContextType {
  volumes: Record<string, number>;
  isMuted: boolean;
  setVolume: (id: string, value: number) => void;
  toggleMute: () => void;
  toggleSound: (id: string) => void;
}

const SoundscapeContext = createContext<SoundscapeContextType | undefined>(undefined);

export const SoundscapeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [volumes, setVolumes] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('zen-soundscape-volumes');
    return saved ? JSON.parse(saved) : SOUNDSCAPES.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {});
  });
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('zen-soundscape-muted') === 'true';
  });

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // Sync volumes to localStorage
  useEffect(() => {
    localStorage.setItem('zen-soundscape-volumes', JSON.stringify(volumes));
    localStorage.setItem('zen-soundscape-muted', isMuted.toString());
  }, [volumes, isMuted]);

  // Manage Audio Elements
  useEffect(() => {
    SOUNDSCAPES.forEach(sound => {
      if (!audioRefs.current[sound.id]) {
        const audio = new Audio(sound.url);
        audio.loop = true;
        audio.preload = 'none'; // Don't download immediately
        audioRefs.current[sound.id] = audio;
      }

      const audio = audioRefs.current[sound.id];
      const vol = volumes[sound.id];
      const isPlaying = vol > 0 && !isMuted;

      audio.volume = isPlaying ? vol / 100 : 0;

      if (isPlaying) {
        if (audio.paused) {
          audio.play().catch(err => {
            // This is common if the user hasn't interacted with the page yet
            console.warn(`[Zen] Soundscape ${sound.id} play deferred:`, err.message);
          });
        }
      } else {
        if (!audio.paused) {
          // If we are just turning volume to 0 but keep it "playing" (looping)
          // it might be better to pause to save bandwidth/resources
          if (vol === 0 || isMuted) {
            audio.pause();
          }
        }
      }
    });
  }, [volumes, isMuted]);

  const setVolume = (id: string, value: number) => {
    setVolumes(prev => ({ ...prev, [id]: value }));
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const toggleSound = (id: string) => {
    setVolumes(prev => ({
      ...prev,
      [id]: prev[id] > 0 ? 0 : 50
    }));
  };

  return (
    <SoundscapeContext.Provider value={{ volumes, isMuted, setVolume, toggleMute, toggleSound }}>
      {children}
    </SoundscapeContext.Provider>
  );
};

export const useSoundscape = () => {
  const context = useContext(SoundscapeContext);
  if (context === undefined) {
    throw new Error('useSoundscape must be used within a SoundscapeProvider');
  }
  return context;
};
