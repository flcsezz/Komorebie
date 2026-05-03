import React, { createContext, useContext, useState } from 'react';

interface BackgroundContextType {
  background: string | null;
  setBackground: (bg: string | null) => void;
  resetBackground: () => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [background, setBackground] = useState<string | null>(null);

  const resetBackground = React.useCallback(() => setBackground(null), []);
  const setBackgroundSafe = React.useCallback((bg: string | null) => setBackground(bg), []);

  const value = React.useMemo(() => ({ 
    background, 
    setBackground: setBackgroundSafe, 
    resetBackground 
  }), [background, setBackgroundSafe, resetBackground]);

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
