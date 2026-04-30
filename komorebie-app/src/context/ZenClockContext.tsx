import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { type PomodoroState } from '../types/clock';

interface ZenClockContextType {
  timeLeft: number;
  duration: number;
  isActive: boolean;
  isPomodoroMode: boolean;
  pomodoroState: PomodoroState;
  pomodoroCycle: number;
  toggleTimer: () => Promise<void>;
  setDuration: (duration: number) => void;
  setIsPomodoroMode: (isPomodoro: boolean) => void;
  resetTimer: () => void;
}

const ZenClockContext = createContext<ZenClockContextType | undefined>(undefined);

export const ZenClockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPomodoroMode, setIsPomodoroMode] = useState(() => {
    return localStorage.getItem('zen-pomodoro-mode') === 'true';
  });
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>(() => {
    return (localStorage.getItem('zen-pomodoro-state') as PomodoroState) || 'work';
  });
  const [pomodoroCycle, setPomodoroCycle] = useState(() => {
    return parseInt(localStorage.getItem('zen-pomodoro-cycle') || '1', 10);
  });

  const [duration, setDurationState] = useState(() => {
    const saved = localStorage.getItem('zen-clock-duration');
    return saved ? parseInt(saved, 10) : 25;
  });
  
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('zen-pomodoro-mode', isPomodoroMode.toString());
    localStorage.setItem('zen-pomodoro-state', pomodoroState);
    localStorage.setItem('zen-pomodoro-cycle', pomodoroCycle.toString());
    localStorage.setItem('zen-clock-duration', duration.toString());
  }, [isPomodoroMode, pomodoroState, pomodoroCycle, duration]);

  // Handle timer tick
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsActive(false);
            
            if (isPomodoroMode) {
              if (pomodoroState === 'work') {
                if (pomodoroCycle >= 4) {
                  setPomodoroState('longBreak');
                  const d = 15;
                  setDurationState(d);
                  setTimeLeft(d * 60);
                } else {
                  setPomodoroState('shortBreak');
                  const d = 5;
                  setDurationState(d);
                  setTimeLeft(d * 60);
                }
              } else {
                if (pomodoroState === 'longBreak') {
                  setPomodoroCycle(1);
                } else {
                  setPomodoroCycle(prevCycle => prevCycle + 1);
                }
                setPomodoroState('work');
                const d = 25;
                setDurationState(d);
                setTimeLeft(d * 60);
              }
            } else {
              // Reset the timer to the selected duration when it hits 0
              setTimeLeft(duration * 60);
            }
            
            // Automatically exit fullscreen when a session finishes
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => console.error(err));
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPomodoroMode, pomodoroState, pomodoroCycle, duration]);

  const toggleTimer = async () => {
    if (isActive) {
      setIsActive(false);
      setTimeLeft(duration * 60);
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (err) {
          console.error("Failed to exit fullscreen:", err);
        }
      }
    } else {
      if (timeLeft === 0) {
        setTimeLeft(duration * 60);
      }
      setIsActive(true);
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.error("Failed to enter fullscreen:", err);
      }
    }
  };

  const setDuration = (d: number) => {
    setDurationState(d);
    if (!isActive) {
      setTimeLeft(d * 60);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration * 60);
  };

  return (
    <ZenClockContext.Provider value={{
      timeLeft,
      duration,
      isActive,
      isPomodoroMode,
      pomodoroState,
      pomodoroCycle,
      toggleTimer,
      setDuration,
      setIsPomodoroMode,
      resetTimer
    }}>
      {children}
    </ZenClockContext.Provider>
  );
};

export const useZenClock = () => {
  const context = useContext(ZenClockContext);
  if (context === undefined) {
    throw new Error('useZenClock must be used within a ZenClockProvider');
  }
  return context;
};
