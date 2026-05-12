-- 0001_initial_schema.sql
-- Active timers for edge clock sync
CREATE TABLE IF NOT EXISTS active_timers (
  user_id TEXT PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT 0,
  started_at TEXT,
  duration_seconds INTEGER DEFAULT 0,
  session_duration INTEGER DEFAULT 0,
  is_pomodoro BOOLEAN DEFAULT 0,
  pomodoro_state TEXT DEFAULT 'focus',
  updated_at TEXT NOT NULL
);

-- Analytics cache for edge performance
CREATE TABLE IF NOT EXISTS analytics_cache (
  user_id TEXT PRIMARY KEY,
  cached_stats TEXT NOT NULL, -- JSON string
  fetched_at INTEGER NOT NULL -- Unix timestamp
);

-- Presence tracking
CREATE TABLE IF NOT EXISTS user_presence (
  user_id TEXT PRIMARY KEY,
  is_online BOOLEAN NOT NULL DEFAULT 0,
  last_seen TEXT NOT NULL
);
