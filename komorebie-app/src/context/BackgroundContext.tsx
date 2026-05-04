import React, { createContext, useContext, useState } from 'react';

interface BackgroundContextType {
  background: string | null;
  backgroundType: 'image' | 'video';
  setBackground: (bg: string | null, type?: 'image' | 'video') => void;
  resetBackground: () => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [background, setBackground] = useState<string | null>(null);
  const [backgroundType, setBackgroundType] = useState<'image' | 'video'>('image');

  const resetBackground = React.useCallback(() => {
    setBackground(null);
    setBackgroundType('image');
  }, []);

  const setBackgroundSafe = React.useCallback((bg: string | null, type: 'image' | 'video' = 'image') => {
    setBackground(bg);
    setBackgroundType(type);
  }, []);

  const value = React.useMemo(() => ({ 
    background, 
    backgroundType,
    setBackground: setBackgroundSafe, 
    resetBackground 
  }), [background, backgroundType, setBackgroundSafe, resetBackground]);

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
};
