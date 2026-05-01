import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { type PomodoroState } from '../types/clock';
import { useAuth } from './AuthContext';
import { logFocusSession } from '../lib/analytics';

interface ZenClockContextType {
  timeLeft: number;
  duration: number;
  isActive: boolean;
  isPomodoroMode: boolean;
  pomodoroState: PomodoroState;
  pomodoroCycle: number;
  selectedAlarm: string;
  isAlarmPlaying: boolean;
  isSessionComplete: boolean;
  toggleTimer: () => Promise<void>;
  setDuration: (duration: number) => void;
  setIsPomodoroMode: (isPomodoro: boolean) => void;
  resetTimer: () => void;
  setSelectedAlarm: (alarm: string) => void;
  stopAlarm: () => void;
  completeSession: () => void;
  skipBreak: () => void;
}

const ZenClockContext = createContext<ZenClockContextType | undefined>(undefined);

export const ZenClockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPomodoroMode, setIsPomodoroModeState] = useState(() => {
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
    return saved ? parseFloat(saved) : 25;
  });
  
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState(() => {
    return localStorage.getItem('zen-selected-alarm') || 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
  });
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  
  const { user } = useAuth();
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('zen-pomodoro-mode', isPomodoroMode.toString());
    localStorage.setItem('zen-pomodoro-state', pomodoroState);
    localStorage.setItem('zen-pomodoro-cycle', pomodoroCycle.toString());
    localStorage.setItem('zen-clock-duration', duration.toString());
    localStorage.setItem('zen-selected-alarm', selectedAlarm);
  }, [isPomodoroMode, pomodoroState, pomodoroCycle, duration, selectedAlarm]);

  const stopAlarm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (alarmTimeoutRef.current) {
      clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }
    setIsAlarmPlaying(false);
  }, []);

  const playAlarm = useCallback(() => {
    if (selectedAlarm === 'none') {
      setIsAlarmPlaying(false);
      return;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (alarmTimeoutRef.current) {
      clearTimeout(alarmTimeoutRef.current);
    }

    audioRef.current = new Audio(selectedAlarm);
    audioRef.current.loop = false; // Disable infinite looping
    audioRef.current.play().catch(err => console.error("Alarm play failed:", err));
    setIsAlarmPlaying(true);

    // Stop automatically after 7 seconds
    alarmTimeoutRef.current = setTimeout(() => {
      stopAlarm();
    }, 7000);
  }, [selectedAlarm, stopAlarm]);

  const completeSession = useCallback(() => {
    stopAlarm();
    setIsSessionComplete(false);
    
    let nextDuration = duration;
    if (isPomodoroMode) {
      if (pomodoroState === 'work') {
        if (pomodoroCycle >= 4) {
          setPomodoroState('longBreak');
          nextDuration = 15;
        } else {
          setPomodoroState('shortBreak');
          nextDuration = 5;
        }
      } else {
        if (pomodoroState === 'longBreak') {
          setPomodoroCycle(1);
        } else {
          setPomodoroCycle(prevCycle => prevCycle + 1);
        }
        setPomodoroState('work');
        nextDuration = 25;
      }
    }
    
    setDurationState(nextDuration);
    setTimeLeft(nextDuration * 60);
    setIsActive(false); // Wait for user to start the next session manually
  }, [isPomodoroMode, pomodoroState, pomodoroCycle, duration, stopAlarm]);

  const skipBreak = useCallback(() => {
    if (isPomodoroMode && (pomodoroState === 'shortBreak' || pomodoroState === 'longBreak')) {
      stopAlarm();
      
      if (pomodoroState === 'longBreak') {
        setPomodoroCycle(1);
      } else {
        setPomodoroCycle(prevCycle => prevCycle + 1);
      }
      
      setPomodoroState('work');
      const nextDuration = 25;
      setDurationState(nextDuration);
      setTimeLeft(nextDuration * 60);
      setIsActive(true);
      setIsSessionComplete(false);
    }
  }, [isPomodoroMode, pomodoroState, stopAlarm]);

  const playTransitionSound = useCallback(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Zen Bell
    audio.volume = 0.4;
    audio.play().catch(err => console.error("Transition sound failed:", err));
  }, []);

  // Handle timer tick
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const nextValue = prev - 1;
          
          // Trigger alarm and completion state exactly when hitting 0
          if (nextValue === 0) {
            if (isPomodoroMode) {
              playTransitionSound();
            } else {
              playAlarm();
            }
            setIsSessionComplete(true);
            
            // Log session as completed in Supabase
            if (user) {
              logFocusSession({
                profile_id: user.id,
                duration_seconds: duration * 60,
                elapsed_seconds: duration * 60,
                status: 'completed',
                started_at: sessionStartTime || new Date().toISOString()
              });
            }

            // Automatically exit fullscreen when a session finishes
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => console.error(err));
            }
          }
          
          return nextValue;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, playAlarm, playTransitionSound, isPomodoroMode, user, duration, sessionStartTime]);

  const toggleTimer = async () => {
    if (isSessionComplete) {
      setIsActive(false); // Stop the count-up
      completeSession();
      return;
    }

    if (isActive) {
      // Manual stop - log as abandoned if significant time elapsed (e.g. > 30s)
      const elapsed = duration * 60 - timeLeft;
      if (user && elapsed > 30) {
        logFocusSession({
          profile_id: user.id,
          duration_seconds: duration * 60,
          elapsed_seconds: elapsed,
          status: 'abandoned',
          started_at: sessionStartTime || new Date().toISOString()
        });
      }

      setIsActive(false);
      setTimeLeft(duration * 60);
      setSessionStartTime(null);
      
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (err) {
          console.error("Failed to exit fullscreen:", err);
        }
      }
    } else {
      // Normal start
      setIsActive(true);
      setSessionStartTime(new Date().toISOString());
      
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
    if (!isActive && !isSessionComplete) {
      setTimeLeft(d * 60);
    }
  };

  const setIsPomodoroMode = (enabled: boolean) => {
    setIsPomodoroModeState(enabled);
    if (!isActive && !isSessionComplete) {
      if (enabled) {
        setPomodoroState('work');
        setDurationState(25);
        setTimeLeft(25 * 60);
      } else {
        setDurationState(25);
        setTimeLeft(25 * 60);
      }
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsSessionComplete(false);
    stopAlarm();
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
      selectedAlarm,
      isAlarmPlaying,
      isSessionComplete,
      toggleTimer,
      setDuration,
      setIsPomodoroMode,
      resetTimer,
      setSelectedAlarm,
      stopAlarm,
      completeSession,
      skipBreak
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
