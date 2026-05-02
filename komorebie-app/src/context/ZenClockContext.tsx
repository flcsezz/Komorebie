import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { type PomodoroState } from '../types/clock';
import { useAuth } from './AuthContext';
import { logFocusSession } from '../lib/analytics';
import { analyticsCache } from '../lib/analyticsCache';
import { supabase } from '../lib/supabase';

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

  // Cloud Sync Helper
  const syncTimerToCloud = useCallback(async (active: boolean, start: string | null, durSeconds: number, isPom: boolean, pomState: PomodoroState) => {
    if (!user) return;
    
    try {
      await supabase.from('active_timers').upsert({
        user_id: user.id,
        started_at: start,
        duration_seconds: durSeconds,
        is_active: active,
        is_pomodoro: isPom,
        pomodoro_state: pomState,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to sync timer to cloud:', err);
    }
  }, [user]);

  // Initial Cloud Sync
  useEffect(() => {
    const fetchCloudTimer = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('active_timers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (data && data.is_active && data.started_at) {
          const startedAt = new Date(data.started_at).getTime();
          const now = new Date().getTime();
          const elapsed = Math.floor((now - startedAt) / 1000);
          
          if (elapsed < data.duration_seconds && elapsed > 0) {
            // Timer is still running in the cloud - RESUME
            setDurationState(data.duration_seconds / 60);
            setTimeLeft(data.duration_seconds - elapsed);
            setIsActive(true);
            setSessionStartTime(data.started_at);
            setIsPomodoroModeState(data.is_pomodoro);
            setPomodoroState(data.pomodoro_state);
          } else if (elapsed >= data.duration_seconds) {
             // Timer finished while user was away - clear cloud state
             await supabase.from('active_timers').update({ is_active: false }).eq('user_id', user.id);
          }
        }
      } catch (err) {
        console.error('Error fetching cloud timer:', err);
      }
    };
    
    fetchCloudTimer();
  }, [user]);

  // Real-time Sync Listener
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`timer_sync_${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'active_timers',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const data = payload.new as any;
        if (!data) return;

        // Only react to changes that didn't originate from this session's own syncTimerToCloud
        // (Basic check: if the cloud state matches our local state, ignore)
        if (data.is_active === isActive && data.pomodoro_state === pomodoroState && Math.abs(timeLeft - (data.duration_seconds - Math.floor((Date.now() - new Date(data.started_at).getTime()) / 1000))) < 5) {
          return;
        }

        if (data.is_active && data.started_at) {
          const startedAt = new Date(data.started_at).getTime();
          const now = new Date().getTime();
          const elapsed = Math.floor((now - startedAt) / 1000);
          
          if (elapsed < data.duration_seconds && elapsed > 0) {
            setDurationState(data.duration_seconds / 60);
            setTimeLeft(data.duration_seconds - elapsed);
            setIsActive(true);
            setSessionStartTime(data.started_at);
            setIsPomodoroModeState(data.is_pomodoro);
            setPomodoroState(data.pomodoro_state);
          }
        } else {
          // Cloud says stopped
          setIsActive(false);
          // Only reset timeLeft if we were active
          if (isActive) {
            setTimeLeft(duration * 60);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isActive, pomodoroState, duration, timeLeft]);

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

    // --- LOG THE COMPLETED SESSION ---
    // This runs when the user clicks "Complete Session" after timer hits 0.
    // The elapsed time includes the original duration + any overtime (negative timeLeft).
    if (user && (!isPomodoroMode || pomodoroState === 'work')) {
      const totalElapsedSeconds = duration * 60 + Math.abs(Math.min(0, timeLeft));
      if (totalElapsedSeconds >= 60) { // Minimum 1 minute to log
        console.log('[Zen] Logging completed session:', totalElapsedSeconds, 'seconds');
        logFocusSession({
          user_id: user.id,
          duration_seconds: duration * 60,
          elapsed_seconds: totalElapsedSeconds,
          status: 'completed',
          started_at: sessionStartTime || new Date().toISOString()
        }).then((result) => {
          console.log('[Zen] Session logged to Supabase:', result);
          if (user) analyticsCache.invalidate(user.id);
        }).catch((err) => {
          console.error('[Zen] FAILED to log session:', err);
        });
      }
    }

    setIsSessionComplete(false);
    setSessionStartTime(null);
    
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
    setIsActive(false);
    
    // SYNC: Clear active timer from cloud
    syncTimerToCloud(false, null, nextDuration * 60, isPomodoroMode, pomodoroState);
  }, [isPomodoroMode, pomodoroState, pomodoroCycle, duration, timeLeft, sessionStartTime, user, stopAlarm, syncTimerToCloud]);

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

      // SYNC: Start next pomodoro leg in cloud
      const startTime = new Date().toISOString();
      setSessionStartTime(startTime);
      syncTimerToCloud(true, startTime, nextDuration * 60, isPomodoroMode, 'work');
    }
  }, [isPomodoroMode, pomodoroState, stopAlarm, syncTimerToCloud]);

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
          
          // Trigger alarm exactly when hitting 0
          if (nextValue === 0) {
            if (isPomodoroMode) {
              playTransitionSound();
            } else {
              playAlarm();
            }
            setIsSessionComplete(true);

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
  }, [isActive, playAlarm, playTransitionSound, isPomodoroMode, user, duration, sessionStartTime, pomodoroState]);

  const toggleTimer = async () => {
    if (isSessionComplete) {
      // The UI button now calls completeSession() directly for this case,
      // but keep as fallback just in case.
      completeSession();
      return;
    }

    if (isActive) {
      // Manual stop before completion — log as abandoned if significant time elapsed
      const elapsed = duration * 60 - timeLeft;
      console.log('[Zen] Manual stop. Elapsed:', elapsed, 'seconds. User:', user?.id);
      
      if (user && elapsed >= 60 && (!isPomodoroMode || pomodoroState === 'work')) {
        console.log('[Zen] Logging abandoned session:', elapsed, 'seconds');
        try {
          const result = await logFocusSession({
            user_id: user.id,
            duration_seconds: duration * 60,
            elapsed_seconds: elapsed,
            status: 'abandoned',
            started_at: sessionStartTime || new Date().toISOString()
          });
          console.log('[Zen] Abandoned session logged:', result);
          analyticsCache.invalidate(user.id);
        } catch (err) {
          console.error('[Zen] FAILED to log abandoned session:', err);
        }
      }

      setIsActive(false);
      setTimeLeft(duration * 60);
      setSessionStartTime(null);
      
      // SYNC: Push stop event to cloud
      syncTimerToCloud(false, null, duration * 60, isPomodoroMode, pomodoroState);
      
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (err) {
          console.error("Failed to exit fullscreen:", err);
        }
      }
    } else {
      // Normal start
      const startTime = new Date().toISOString();
      setIsActive(true);
      setSessionStartTime(startTime);
      
      // SYNC: Push start event to cloud
      syncTimerToCloud(true, startTime, duration * 60, isPomodoroMode, pomodoroState);
      
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
    
    // SYNC: Clear cloud timer
    syncTimerToCloud(false, null, duration * 60, isPomodoroMode, pomodoroState);
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
