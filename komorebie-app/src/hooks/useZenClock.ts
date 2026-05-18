import { useContext } from 'react';
import { ZenClockContext, type ZenClockContextType } from '../context/ZenClockContext';

export const useZenClock = (): ZenClockContextType => {
  const context = useContext(ZenClockContext);
  if (context === undefined) {
    throw new Error('useZenClock must be used within a ZenClockProvider');
  }
  return context;
};
