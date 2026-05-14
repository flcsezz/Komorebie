import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { type PomodoroState } from '../types/clock';
import { useAuth } from './AuthContext';
import { logFocusSession } from '../lib/analytics';
import { analyticsCache } from '../lib/analyticsCache';

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

// Pomodoro duration constants (minutes)
const POMODORO_WORK_MINUTES = 25;
const POMODORO_SHORT_BREAK_MINUTES = 5;
const POMODORO_LONG_BREAK_MINUTES = 15;
const POMODORO_TOTAL_CYCLES = 4;

// Failsafe constants
const MAX_SESSION_OVERTIME_SECONDS = 1800; // 30 minutes max overtime
const STALE_SESSION_THRESHOLD_MS = 3600 * 1000; // 1 hour stale limit

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
  
  const { user, session } = useAuth();
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLocalUpdateRef = useRef<number>(0);
  // Guard to prevent double-firing of completion logic within the tick effect
  const hasTriggeredCompletionRef = useRef<boolean>(false);
  // Debounce timer for cloud sync
  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Raw cloud sync (no debounce) — used internally
  const syncTimerToCloudImmediate = useCallback(async (
    active: boolean, 
    start: string | null, 
    remSeconds: number, 
    isPom: boolean, 
    pomState: PomodoroState,
    sessionDurSeconds: number
  ) => {
    if (!user || !session) return;
    lastLocalUpdateRef.current = Date.now();
    
    try {
      await fetch('/api/timer/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          is_active: active,
          started_at: start,
          duration_seconds: remSeconds,
          session_duration: sessionDurSeconds,
          is_pomodoro: isPom,
          pomodoro_state: pomState
        })
      });
    } catch (err) {
      console.error('Failed to sync timer to cloud:', err);
    }
  }, [user, session]);

  // Debounced cloud sync — coalesces rapid state changes (500ms trailing edge)
  const syncTimerToCloud = useCallback((
    active: boolean,
    start: string | null,
    remSeconds: number,
    isPom: boolean,
    pomState: PomodoroState,
    sessionDurSeconds: number
  ) => {
    // Update the local guard immediately so real-time listener ignores echo
    lastLocalUpdateRef.current = Date.now();

    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }
    syncDebounceRef.current = setTimeout(() => {
      syncTimerToCloudImmediate(active, start, remSeconds, isPom, pomState, sessionDurSeconds);
    }, 500);
  }, [syncTimerToCloudImmediate]);

  // Edge Polling Sync Listener
  useEffect(() => {
    if (!user || !session) return;

    const pollTimer = async () => {
      // Ignore if we recently updated locally (avoid race conditions/jumps)
      if (Date.now() - lastLocalUpdateRef.current < 5000) {
        return;
      }

      try {
        const response = await fetch('/api/timer/sync', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) return;
        const data = await response.json() as any;
        if (!data) return;

        const isActive = !!data.is_active;
        const isPomodoro = !!data.is_pomodoro;

        if (isActive && data.started_at) {
          const startedAt = new Date(data.started_at).getTime();
          // CRITICAL FIX: Use session_duration (absolute) to compute the stable target end time.
          // Using duration_seconds from a heartbeat would shift the target backward because it's the *remaining* time!
          const sessionDur = data.session_duration || data.duration_seconds;
          const targetEnd = startedAt + (sessionDur * 1000);
          const now = Date.now();

          // FAILSAFE: If the session is stale, ignore it
          if (targetEnd < now - STALE_SESSION_THRESHOLD_MS) return;

          const remaining = Math.ceil((targetEnd - now) / 1000);
          
          setDurationState(sessionDur / 60);
          setTargetEndTime(targetEnd);
          setTimeLeft(remaining);
          setIsActive(true);
          setSessionStartTime(data.started_at);
          setIsPomodoroModeState(isPomodoro);
          setPomodoroState(data.pomodoro_state);
          hasTriggeredCompletionRef.current = false;
        } else {
          setIsActive(false);
          setTargetEndTime(null);
          const sessionDur = data.session_duration || data.duration_seconds;
          if (sessionDur) setDurationState(sessionDur / 60);
          if (data.duration_seconds !== undefined) {
            setTimeLeft(data.duration_seconds);
          }
        }
      } catch (err) {
        console.error('Error polling cloud timer:', err);
      }
    };

    const interval = setInterval(pollTimer, 10000);
    pollTimer();

    return () => clearInterval(interval);
  }, [user, session]);

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

  const playTransitionSound = useCallback(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Zen Bell
    audio.volume = 0.4;
    audio.play().catch(err => console.error("Transition sound failed:", err));
  }, []);

  // --- LOG HELPER: logs a focus session if it qualifies ---
  const logSessionIfQualified = useCallback((
    elapsedSeconds: number,
    status: 'completed' | 'abandoned',
    startedAt: string | null
  ) => {
    if (!user) return;
    if (elapsedSeconds < 300) return; // Must be >= 5 minutes

    // FAILSAFE: Cap overtime to prevent farming
    const maxAllowed = (duration * 60) + MAX_SESSION_OVERTIME_SECONDS;
    const finalElapsed = Math.min(elapsedSeconds, maxAllowed);

    console.log(`[Zen] Logging ${status} session (qualified):`, finalElapsed, 'seconds');
    logFocusSession({
      user_id: user.id,
      duration_seconds: duration * 60,
      elapsed_seconds: finalElapsed,
      status,
      started_at: startedAt || new Date().toISOString()
    }).then((result) => {
      console.log('[Zen] Session logged to Supabase:', result);
      if (user) analyticsCache.invalidate(user.id);
    }).catch((err: Error | unknown) => {
      console.error('[Zen] FAILED to log session:', err);
    });
  }, [user, duration]);

  /**
   * advancePomodoroPhase — called automatically when a Pomodoro period timer hits 0.
   * Handles work→break and break→work transitions with auto-start.
   * After a long break ends, shows session complete (full 4-cycle set done).
   */
  const advancePomodoroPhase = useCallback(() => {
    // Log the completed work period
    if (pomodoroState === 'work') {
      // Include any overtime accrued before the tick detected 0
      const totalElapsedSeconds = duration * 60 + Math.abs(Math.min(0, timeLeft));
      logSessionIfQualified(totalElapsedSeconds, 'completed', sessionStartTime);
    }

    let nextPomState: PomodoroState;
    let nextCycle = pomodoroCycle;
    let nextDurationMinutes: number;

    if (pomodoroState === 'work') {
      // Work → Break
      if (pomodoroCycle >= POMODORO_TOTAL_CYCLES) {
        nextPomState = 'longBreak';
        nextDurationMinutes = POMODORO_LONG_BREAK_MINUTES;
      } else {
        nextPomState = 'shortBreak';
        nextDurationMinutes = POMODORO_SHORT_BREAK_MINUTES;
      }
    } else {
      // Break → Work (or end of full cycle)
      if (pomodoroState === 'longBreak') {
        // Full 4-cycle Pomodoro set is complete
        console.log('[Zen] Full Pomodoro set complete (4 cycles + long break)');
        setPomodoroState('work');
        setPomodoroCycle(1);
        setDurationState(POMODORO_WORK_MINUTES);
        setTimeLeft(POMODORO_WORK_MINUTES * 60);
        setIsActive(false);
        setIsSessionComplete(true);
        setSessionStartTime(null);
        setTargetEndTime(null);
        playAlarm(); // Play full alarm for end of Pomodoro set
        syncTimerToCloud(false, null, POMODORO_WORK_MINUTES * 60, true, 'work', POMODORO_WORK_MINUTES * 60);
        return;
      } else {
        // Short break ended → advance cycle, start work
        nextCycle = pomodoroCycle + 1;
        nextPomState = 'work';
        nextDurationMinutes = POMODORO_WORK_MINUTES;
      }
    }

    // Play transition sound between phases
    playTransitionSound();

    // Auto-start the next phase
    const now = Date.now();
    const startTime = new Date(now).toISOString();
    const nextDurationSeconds = nextDurationMinutes * 60;
    const targetEnd = now + (nextDurationSeconds * 1000);

    setPomodoroState(nextPomState);
    setPomodoroCycle(nextCycle);
    setDurationState(nextDurationMinutes);
    setTimeLeft(nextDurationSeconds);
    setIsActive(true);
    setIsSessionComplete(false);
    setSessionStartTime(startTime);
    setTargetEndTime(targetEnd);
    hasTriggeredCompletionRef.current = false; // Reset guard for the new phase

    // Sync the new phase to cloud
    syncTimerToCloud(true, startTime, nextDurationSeconds, true, nextPomState, nextDurationSeconds);

    console.log(`[Zen] Pomodoro auto-advanced: ${pomodoroState} → ${nextPomState}, cycle ${nextCycle}/${POMODORO_TOTAL_CYCLES}`);
  }, [pomodoroState, pomodoroCycle, duration, sessionStartTime, timeLeft, logSessionIfQualified, playTransitionSound, playAlarm, syncTimerToCloud]);

  /**
   * completeSession — called when the user manually clicks "COMPLETE SESSION".
   * Used for:
   * 1. Non-Pomodoro mode: after alarm plays and user acknowledges
   * 2. Pomodoro mode: after full 4-cycle set (long break ended)
   * 3. Fallback: if user manually triggers completion
   */
  const completeSession = useCallback(() => {
    stopAlarm();

    // Log session if in non-pomodoro mode or if this is a manual completion during work
    if (!isPomodoroMode || pomodoroState === 'work') {
      const totalElapsedSeconds = duration * 60 + Math.abs(Math.min(0, timeLeft));
      logSessionIfQualified(totalElapsedSeconds, 'completed', sessionStartTime);
    }

    setIsSessionComplete(false);
    setSessionStartTime(null);
    setTargetEndTime(null);
    
    let nextDuration = duration;
    let nextPomState = pomodoroState;

    if (isPomodoroMode) {
      // Reset to work state for new Pomodoro set
      nextPomState = 'work';
      nextDuration = POMODORO_WORK_MINUTES;
      setPomodoroState(nextPomState);
      setPomodoroCycle(1);
    }
    
    setDurationState(nextDuration);
    setTimeLeft(nextDuration * 60);
    setIsActive(false);
    hasTriggeredCompletionRef.current = false;
    
    // SYNC: Clear active timer from cloud with the NEW state
    syncTimerToCloud(false, null, nextDuration * 60, isPomodoroMode, nextPomState, nextDuration * 60);
  }, [isPomodoroMode, pomodoroState, duration, timeLeft, sessionStartTime, stopAlarm, syncTimerToCloud, logSessionIfQualified]);

  const skipBreak = useCallback(() => {
    if (isPomodoroMode && (pomodoroState === 'shortBreak' || pomodoroState === 'longBreak')) {
      stopAlarm();
      
      // Correctly reset cycle counter based on which break was skipped
      const nextCycle = pomodoroState === 'longBreak' ? 1 : pomodoroCycle + 1;
      setPomodoroCycle(nextCycle);
      
      setPomodoroState('work');
      const nextDuration = POMODORO_WORK_MINUTES;
      setDurationState(nextDuration);
      setTimeLeft(nextDuration * 60);
      setIsActive(true);
      setIsSessionComplete(false);
      hasTriggeredCompletionRef.current = false;

      // SYNC: Start next pomodoro leg in cloud
      const startTime = new Date().toISOString();
      setSessionStartTime(startTime);
      const targetEnd = Date.now() + (nextDuration * 60 * 1000);
      setTargetEndTime(targetEnd);
      syncTimerToCloud(true, startTime, nextDuration * 60, isPomodoroMode, 'work', nextDuration * 60);
    }
  }, [isPomodoroMode, pomodoroState, pomodoroCycle, stopAlarm, syncTimerToCloud]);

  // Cloud heartbeat — writes updated_at every 30s while timer is active
  // This signals to other devices that the timer is still alive
  useEffect(() => {
    if (isActive && user && session && sessionStartTime && targetEndTime) {
      heartbeatRef.current = setInterval(() => {
        const remaining = Math.ceil((targetEndTime - Date.now()) / 1000);
        const sessionDur = duration * 60;
        
        fetch('/api/timer/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            is_active: true,
            started_at: sessionStartTime,
            duration_seconds: remaining,
            session_duration: sessionDur,
            is_pomodoro: isPomodoroMode,
            pomodoro_state: pomodoroState
          })
        }).catch(err => console.error('[Zen] Heartbeat failed:', err));

        // Mark as local update to prevent the real-time listener from echoing
        lastLocalUpdateRef.current = Date.now();
      }, 70_000);
    }

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [isActive, user, session, sessionStartTime, targetEndTime, duration, isPomodoroMode, pomodoroState]);

  // Handle timer tick and tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive && targetEndTime) {
        // Hard recalculate from authoritative targetEndTime on tab re-focus
        const remaining = Math.ceil((targetEndTime - Date.now()) / 1000);
        setTimeLeft(remaining);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (isActive && targetEndTime) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.ceil((targetEndTime - now) / 1000);
        setTimeLeft(remaining);
        
        // When hitting 0 or below, trigger completion logic ONCE
        if (remaining <= 0 && !hasTriggeredCompletionRef.current) {
          hasTriggeredCompletionRef.current = true;

            if (isPomodoroMode) {
              // Auto-advance to next Pomodoro phase
              advancePomodoroPhase();
            } else {
              // Non-Pomodoro: play alarm and show "COMPLETE SESSION" button
              playAlarm();
              setIsSessionComplete(true);
            }
          }

          // FAILSAFE: If we've overran by too much, auto-complete
          if (remaining < -MAX_SESSION_OVERTIME_SECONDS) {
            console.log('[Zen] Session overran limit. Auto-completing.');
            completeSession();
          }
        }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, targetEndTime, playAlarm, advancePomodoroPhase, isPomodoroMode, completeSession]);

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
      hasTriggeredCompletionRef.current = false;

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
      hasTriggeredCompletionRef.current = false;
      
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
      const nextDuration = POMODORO_WORK_MINUTES;
      setDurationState(nextDuration);
      setTimeLeft(nextDuration * 60);
      setPomodoroCycle(1); // Always reset cycle when toggling mode
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
    hasTriggeredCompletionRef.current = false;
    
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
