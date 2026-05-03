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
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);
  
  const { user } = useAuth();
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLocalUpdateRef = useRef<number>(0);

  // Cloud Sync Helper
  const syncTimerToCloud = useCallback(async (
    active: boolean, 
    start: string | null, 
    remSeconds: number, 
    isPom: boolean, 
    pomState: PomodoroState,
    sessionDurSeconds: number
  ) => {
    if (!user) return;
    lastLocalUpdateRef.current = Date.now();
    
    try {
      await supabase.from('active_timers').upsert({
        user_id: user.id,
        started_at: start,
        duration_seconds: remSeconds,
        session_duration: sessionDurSeconds,
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
          
        if (data) {
          if (data.is_active && data.started_at) {
            const startedAt = new Date(data.started_at).getTime();
            const now = Date.now();
            // Use session_duration if available, otherwise fallback to duration_seconds
            const sessionDur = data.session_duration || data.duration_seconds;
            const targetEnd = startedAt + (data.duration_seconds * 1000);
            const remaining = Math.ceil((targetEnd - now) / 1000);
            
            setDurationState(sessionDur / 60);
            setTargetEndTime(targetEnd);
            setTimeLeft(remaining);
            setIsActive(true);
            setSessionStartTime(data.started_at);
            setIsPomodoroModeState(data.is_pomodoro);
            setPomodoroState(data.pomodoro_state);
          } else if (!data.is_active) {
            // Paused state in cloud
            const sessionDur = data.session_duration || data.duration_seconds;
            setDurationState(sessionDur / 60);
            // Only restore timeLeft if we don't have a newer local state
            setTimeLeft(data.duration_seconds || (sessionDur));
            setIsActive(false);
            setIsPomodoroModeState(data.is_pomodoro);
            setPomodoroState(data.pomodoro_state);
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
        const data = payload.new as {
          is_active: boolean;
          started_at: string | null;
          duration_seconds: number;
          session_duration?: number;
          is_pomodoro: boolean;
          pomodoro_state: PomodoroState;
        };
        if (!data) return;

        const cloudRemaining = data.is_active && data.started_at 
          ? data.duration_seconds - Math.floor((Date.now() - new Date(data.started_at).getTime()) / 1000)
          : data.duration_seconds;

        // Ignore if we recently updated locally (avoid race conditions/jumps)
        if (Date.now() - lastLocalUpdateRef.current < 2000) {
          return;
        }

        if (data.is_active === isActive && data.pomodoro_state === pomodoroState && Math.abs(timeLeft - cloudRemaining) < 3) {
          return;
        }

        if (data.is_active && data.started_at) {
          const startedAt = new Date(data.started_at).getTime();
          const targetEnd = startedAt + (data.duration_seconds * 1000);
          const remaining = Math.ceil((targetEnd - Date.now()) / 1000);
          const sessionDur = data.session_duration || data.duration_seconds;
          
          setDurationState(sessionDur / 60);
          setTargetEndTime(targetEnd);
          setTimeLeft(remaining);
          setIsActive(true);
          setSessionStartTime(data.started_at);
          setIsPomodoroModeState(data.is_pomodoro);
          setPomodoroState(data.pomodoro_state);
        } else {
          setIsActive(false);
          setTargetEndTime(null);
          const sessionDur = data.session_duration || data.duration_seconds;
          if (sessionDur) setDurationState(sessionDur / 60);
          if (data.duration_seconds !== undefined) {
            setTimeLeft(data.duration_seconds);
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

    // Capture current values from closure
    let nextPomState = pomodoroState;
    let nextCycle = pomodoroCycle;
    let nextDuration = duration;

    // --- LOG THE COMPLETED SESSION ---
    if (user && (!isPomodoroMode || pomodoroState === 'work')) {
      const totalElapsedSeconds = duration * 60 + Math.abs(Math.min(0, timeLeft));
      if (totalElapsedSeconds >= 300) {
        console.log('[Zen] Logging completed session (qualified):', totalElapsedSeconds, 'seconds');
        logFocusSession({
          user_id: user.id,
          duration_seconds: duration * 60,
          elapsed_seconds: totalElapsedSeconds,
          status: 'completed',
          started_at: sessionStartTime || new Date().toISOString()
        }).then((result) => {
          console.log('[Zen] Session logged to Supabase:', result);
          if (user) analyticsCache.invalidate(user.id);
        }).catch((err: Error | unknown) => {
          console.error('[Zen] FAILED to log session:', err);
        });
      }
    }

    setIsSessionComplete(false);
    setSessionStartTime(null);
    
    if (isPomodoroMode) {
      if (pomodoroState === 'work') {
        if (pomodoroCycle >= 4) {
          nextPomState = 'longBreak';
          nextDuration = 15;
        } else {
          nextPomState = 'shortBreak';
          nextDuration = 5;
        }
      } else {
        if (pomodoroState === 'longBreak') {
          nextCycle = 1;
        } else {
          nextCycle = pomodoroCycle + 1;
        }
        nextPomState = 'work';
        nextDuration = 25;
      }
      
      setPomodoroState(nextPomState);
      setPomodoroCycle(nextCycle);
    }
    
    setDurationState(nextDuration);
    setTimeLeft(nextDuration * 60);
    setIsActive(false);
    
    // SYNC: Clear active timer from cloud with the NEW state
    syncTimerToCloud(false, null, nextDuration * 60, isPomodoroMode, nextPomState, nextDuration * 60);
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
      syncTimerToCloud(true, startTime, nextDuration * 60, isPomodoroMode, 'work', nextDuration * 60);
    }
  }, [isPomodoroMode, pomodoroState, stopAlarm, syncTimerToCloud]);

  const playTransitionSound = useCallback(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Zen Bell
    audio.volume = 0.4;
    audio.play().catch(err => console.error("Transition sound failed:", err));
  }, []);

  // Handle timer tick and tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive && targetEndTime) {
        const remaining = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
        setTimeLeft(remaining);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (isActive && targetEndTime) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.ceil((targetEndTime - now) / 1000);
        setTimeLeft(remaining);
        
        // When hitting exactly 0 or resuming past 0, trigger notifications but DO NOT stop
        if (remaining <= 0 && !isSessionComplete) {
          if (isPomodoroMode) {
            playTransitionSound();
          } else {
            playAlarm();
          }
          setIsSessionComplete(true);
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, targetEndTime, playAlarm, playTransitionSound, isPomodoroMode, isSessionComplete]);

  const toggleTimer = async () => {
    if (isSessionComplete) {
      // The UI button now calls completeSession() directly for this case,
      // but keep as fallback just in case.
      completeSession();
      return;
    }

    if (isActive) {
      // Manual stop before completion — log as abandoned if significant time elapsed
      const currentSeconds = timeLeft;
      const elapsed = duration * 60 - currentSeconds;
      console.log('[Zen] Manual stop. Elapsed:', elapsed, 'seconds. User:', user?.id);
      
      setIsActive(false);
      setSessionStartTime(null);
      setTargetEndTime(null);

      // RESET: Immediately reset timeLeft on stop so progress bar clears
      const resetTime = duration * 60;
      setTimeLeft(resetTime);
      
      // SYNC: Push stop event to cloud with the RESET duration
      syncTimerToCloud(false, null, resetTime, isPomodoroMode, pomodoroState, resetTime);

      if (user && elapsed >= 300 && (!isPomodoroMode || pomodoroState === 'work')) {
        console.log('[Zen] Logging abandoned session (qualified):', elapsed, 'seconds');
        // Do not await to prevent UI blocking
        logFocusSession({
          user_id: user.id,
          duration_seconds: duration * 60,
          elapsed_seconds: elapsed,
          status: 'abandoned',
          started_at: sessionStartTime || new Date().toISOString()
        }).then((result) => {
          console.log('[Zen] Abandoned session logged:', result);
          analyticsCache.invalidate(user.id);
        }).catch((err) => {
          console.error('[Zen] FAILED to log abandoned session:', err);
        });
      }
    } else {
      // Normal start
      const now = Date.now();
      const startTime = new Date(now).toISOString();
      
      // RESET: Always reset to full duration when starting a new session from STOPPED state
      const initialTime = duration * 60;
      const targetEnd = now + (initialTime * 1000);
      
      setIsActive(true);
      setTimeLeft(initialTime);
      setSessionStartTime(startTime);
      setTargetEndTime(targetEnd);
      
      // SYNC: Push start event to cloud with the RESET duration
      syncTimerToCloud(true, startTime, initialTime, isPomodoroMode, pomodoroState, initialTime);
      
      try {
        const doc = document as any;
        const el = document.documentElement as any;
        const isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

        if (!isFull) {
          if (el.requestFullscreen) {
            await el.requestFullscreen();
          } else if (el.webkitRequestFullscreen) {
            await el.webkitRequestFullscreen();
          } else if (el.mozRequestFullScreen) {
            await el.mozRequestFullScreen();
          } else if (el.msRequestFullscreen) {
            await el.msRequestFullscreen();
          }
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
      // Immediate cloud sync for duration change while stopped
      syncTimerToCloud(false, null, d * 60, isPomodoroMode, pomodoroState, d * 60);
    }
  };

  const setIsPomodoroMode = (enabled: boolean) => {
    setIsPomodoroModeState(enabled);
    if (!isActive && !isSessionComplete) {
      if (enabled) setPomodoroState('work');
      const nextDuration = 25;
      setDurationState(nextDuration);
      setTimeLeft(nextDuration * 60);
      // Immediate cloud sync for mode change while stopped
      syncTimerToCloud(false, null, nextDuration * 60, enabled, enabled ? 'work' : pomodoroState, nextDuration * 60);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsSessionComplete(false);
    stopAlarm();
    setTimeLeft(duration * 60);
    setTargetEndTime(null);
    
    // SYNC: Clear cloud timer
    syncTimerToCloud(false, null, duration * 60, isPomodoroMode, pomodoroState, duration * 60);
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
