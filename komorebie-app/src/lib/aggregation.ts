/**
 * aggregation.ts — The ONE canonical analytics engine.
 *
 * This file is the SINGLE source of truth for all analytics derivation logic.
 * It is shared between:
 *   - analyticsCache.ts  (client-side hook consumers)
 *   - DataSyncContext.tsx (app-wide stats provider)
 *   - worker.ts          (edge analytics computation)
 *
 * Rules:
 *   1. ONE validity filter:  elapsed >= 300s OR status === 'completed'
 *   2. ONE date standard:    UTC (toISOString().split('T')[0])
 *   3. NO local-time transforms — caller converts at render layer only
 *   4. NO Supabase imports — this is pure data transformation
 *   5. NO side effects — all functions are pure, deterministic
 *
 * Architecture:
 *   Raw DB data (sessions, streaks, tasks)
 *       ↓  computeStats()
 *   Derived stats object (SyncStats)
 *       ↓  consumed by
 *   All widgets, cards, graphs, tooltips, heatmaps
 */

// ─── Constants ──────────────────────────────────────────────────────────────

/** Minimum elapsed seconds for a session to count toward analytics. */
export const VALID_SESSION_MIN_SECONDS = 300; // 5 minutes

/** Mana earned per minute of valid focus time. */
export const MANA_PER_MINUTE = 1;

// ─── Date utilities ──────────────────────────────────────────────────────────

/**
 * Convert any date value to a YYYY-MM-DD UTC string.
 * This is THE only date formatting function in the app.
 *
 * Always uses UTC to match:
 *   - Supabase CURRENT_DATE (UTC)
 *   - focus_sessions.started_at (timestamptz stored in UTC)
 *   - Cloudflare Worker new Date().toISOString()
 *
 * Display-layer code may use Intl.DateTimeFormat for local display,
 * but all comparisons and grouping MUST use this function.
 */
export function toUTCDate(date: Date | string | null | undefined): string {
  if (!date) return '1970-01-01';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '1970-01-01';
  return d.toISOString().split('T')[0];
}

/** Get today's UTC date string. */
export function todayUTC(): string {
  return toUTCDate(new Date());
}

/** Get yesterday's UTC date string. */
export function yesterdayUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

/** Get Monday of the current ISO week as a UTC date string. */
export function thisWeekMondayUTC(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diffToMonday);
  return monday.toISOString().split('T')[0];
}

// ─── Input types (raw DB shapes) ─────────────────────────────────────────────

export interface RawSession {
  id?: string;
  status: string;
  elapsed_seconds?: number | null;
  started_at: string;
  tag?: string | null;
}

export interface RawStreak {
  focus_date: string;
  total_focus_seconds: number;
  sessions_count: number;
  streak_qualified: boolean;
}

export interface RawTask {
  id?: string;
  is_completed: boolean;
  completed_at?: string | null;
}

export interface RawProfile {
  id?: string;
  username?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  mana_points?: number;
  current_streak?: number;
  best_streak?: number;
  daily_goal_seconds?: number;
  preferred_bg?: string | null;
  profile_bg?: string | null;
  unmuted_audio?: boolean | string | null;
  [key: string]: unknown;
}

export interface RawAnalyticsPayload {
  profile: RawProfile;
  sessions: RawSession[];
  streaks: RawStreak[];
  tasks: RawTask[];
  deadlines?: unknown[];
  // Pre-computed overrides from edge worker (skip client re-computation if present)
  totalSeconds?: number;
  totalSessions?: number;
  todayFocusSeconds?: number;
  sessionsToday?: number;
  completedToday?: number;
  tasksDone?: number;
  tasksDoneToday?: number;
}

// ─── Output type ─────────────────────────────────────────────────────────────

export interface DailyStats {
  date: string;
  day: string;
  focusSeconds: number;
  sessionsCount: number;
  tasksDone: number;
}

export interface ComputedStats {
  totalSeconds: number;
  totalHours: number;
  totalSessions: number;
  sessionsToday: number;
  completedToday: number;
  tasksDone: number;
  tasksDoneToday: number;
  currentStreak: number;
  bestStreak: number;
  mana: number;
  todayFocusSeconds: number;
  weeklyData: DailyStats[];
  weekSeconds: number;
  weekHours: number;
}

export type TagAnalyticItem = {
  tag: string;
  total_seconds: number;
  session_count: number;
};

// ─── Core computation ────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Determine if a session is "valid" (counts toward analytics).
 * Single canonical definition used everywhere.
 */
export function isValidSession(s: RawSession): boolean {
  return s.status === 'completed' || (s.elapsed_seconds ?? 0) >= VALID_SESSION_MIN_SECONDS;
}

/**
 * computeStats — derives all displayed statistics from raw DB payloads.
 *
 * Design:
 *   - If the edge worker pre-computed a field (e.g. totalSeconds from the
 *     worker's aggregation), it is used directly to avoid redundant work.
 *   - Otherwise, client-side computation falls back using the same validity
 *     rules and UTC date logic.
 *   - ALL three today-metrics (focus time, session count, completed count)
 *     are derived from the SAME validSessions list — ensuring they always agree.
 */
export function computeStats(payload: RawAnalyticsPayload): ComputedStats {
  const { profile, sessions, streaks, tasks } = payload;

  // ── Validity filter — canonical, used for ALL today-metrics ────────────
  const validSessions = sessions.filter(isValidSession);

  // ── All-time totals ─────────────────────────────────────────────────────
  const totalSeconds = payload.totalSeconds ??
    validSessions.reduce((acc, s) => acc + (s.elapsed_seconds ?? 0), 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
  const totalSessions = payload.totalSessions ?? validSessions.length;

  // ── Today metrics — all derived from the same list ─────────────────────
  const today = todayUTC();
  const todayValidSessions = validSessions.filter(s => toUTCDate(s.started_at) === today);

  const todayFocusSeconds = payload.todayFocusSeconds ??
    todayValidSessions.reduce((acc, s) => acc + (s.elapsed_seconds ?? 0), 0);
  const sessionsToday = payload.sessionsToday ?? todayValidSessions.length;
  const completedToday = payload.completedToday ??
    todayValidSessions.filter(s => s.status === 'completed').length;

  // ── Task metrics ────────────────────────────────────────────────────────
  const tasksDone = payload.tasksDone ?? tasks.filter(t => t.is_completed).length;
  const tasksDoneToday = payload.tasksDoneToday ??
    tasks.filter(t => t.completed_at && toUTCDate(t.completed_at) === today).length;

  // ── Weekly chart data (last 7 days, Mon-based) ──────────────────────────
  const weeklyData: DailyStats[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const streakEntry = streaks.find(s => s.focus_date === dStr);
    const dayTasksDone = tasks.filter(t =>
      t.completed_at && toUTCDate(t.completed_at) === dStr
    ).length;

    weeklyData.push({
      date: dStr,
      day: DAY_NAMES[d.getUTCDay()],
      focusSeconds: streakEntry?.total_focus_seconds ?? 0,
      sessionsCount: streakEntry?.sessions_count ?? 0,
      tasksDone: dayTasksDone,
    });
  }

  // ── Current-week total (Monday → today) ────────────────────────────────
  const mondayStr = thisWeekMondayUTC();
  const weekSeconds = streaks
    .filter(s => s.focus_date >= mondayStr)
    .reduce((acc, s) => acc + (s.total_focus_seconds ?? 0), 0);
  const weekHours = Math.round((weekSeconds / 3600) * 10) / 10;

  // ── Streak calculation ──────────────────────────────────────────────────
  const qualifiedDates = new Set(
    streaks.filter(s => s.streak_qualified).map(s => s.focus_date)
  );

  let currentStreak = 0;
  const yesterday = yesterdayUTC();
  const isAlive = qualifiedDates.has(today) || qualifiedDates.has(yesterday);

  if (isAlive) {
    // Walk backward from today (or yesterday if today not qualified)
    const startStr = qualifiedDates.has(today) ? today : yesterday;
    const cursor = new Date(startStr + 'T00:00:00Z');
    while (qualifiedDates.has(cursor.toISOString().split('T')[0])) {
      currentStreak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    // Take max with profile field (handles data older than the 365-row limit)
    currentStreak = Math.max(currentStreak, profile?.current_streak ?? 0);
  }

  const bestStreak = Math.max(currentStreak, profile?.best_streak ?? 0);

  return {
    totalSeconds,
    totalHours,
    totalSessions,
    sessionsToday,
    completedToday,
    tasksDone,
    tasksDoneToday,
    currentStreak,
    bestStreak,
    mana: profile?.mana_points ?? 0,
    todayFocusSeconds,
    weeklyData,
    weekSeconds,
    weekHours,
  };
}

// ─── Tag aggregation ──────────────────────────────────────────────────────────

/**
 * Aggregate sessions by tag, applying the validity filter.
 * Used by TagAnalyticsWidget — no independent Supabase calls needed.
 */
export function computeTagStats(
  sessions: RawSession[],
  timeRange: 'today' | 'all' = 'all'
): TagAnalyticItem[] {
  const today = todayUTC();
  const filtered = sessions.filter(s => {
    if (!isValidSession(s)) return false;
    if (timeRange === 'today') return toUTCDate(s.started_at) === today;
    return true;
  });

  const agg: Record<string, { total_seconds: number; session_count: number }> = {};
  for (const s of filtered) {
    const tag = s.tag || 'Untagged';
    if (!agg[tag]) agg[tag] = { total_seconds: 0, session_count: 0 };
    agg[tag].total_seconds += s.elapsed_seconds ?? 0;
    agg[tag].session_count += 1;
  }

  return Object.entries(agg)
    .map(([tag, v]) => ({ tag, total_seconds: v.total_seconds, session_count: v.session_count }))
    .sort((a, b) => b.total_seconds - a.total_seconds);
}

// ─── Streak heatmap builder ───────────────────────────────────────────────────

export type StreakDateMap = Map<string, {
  qualified: boolean;
  seconds: number;
  sessions: number;
  tasksDone: number;
}>;

export function buildStreakDates(
  streaks: RawStreak[],
  tasks: RawTask[] = []
): StreakDateMap {
  const map: StreakDateMap = new Map();

  for (const s of streaks) {
    map.set(s.focus_date, {
      qualified: s.streak_qualified ?? false,
      seconds: s.total_focus_seconds ?? 0,
      sessions: s.sessions_count ?? 0,
      tasksDone: 0,
    });
  }

  for (const t of tasks) {
    if (!t.completed_at) continue;
    const dateStr = toUTCDate(t.completed_at);
    const existing = map.get(dateStr);
    if (existing) {
      existing.tasksDone += 1;
    } else {
      map.set(dateStr, { qualified: false, seconds: 0, sessions: 0, tasksDone: 1 });
    }
  }

  return map;
}
