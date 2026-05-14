-- ═══════════════════════════════════════════════════════════════════════════
-- Habit Tracker — Database Migration
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Habits table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'circle-check',
  color TEXT NOT NULL DEFAULT 'sage',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Habit Logs table
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(habit_id, log_date)
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, log_date);

-- 4. Row Level Security
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Habits: users can only see/manage their own habits
CREATE POLICY "Users can view own habits"
  ON habits FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
  ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON habits FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON habits FOR DELETE USING (auth.uid() = user_id);

-- Habit Logs: users can only see/manage their own logs
-- Grace period: can only insert/update logs for today or yesterday
CREATE POLICY "Users can view own habit logs"
  ON habit_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert habit logs within grace period"
  ON habit_logs FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND log_date >= CURRENT_DATE - INTERVAL '1 day'
    AND log_date <= CURRENT_DATE
  );

CREATE POLICY "Users can update habit logs within grace period"
  ON habit_logs FOR UPDATE USING (
    auth.uid() = user_id
    AND log_date >= CURRENT_DATE - INTERVAL '1 day'
    AND log_date <= CURRENT_DATE
  );

CREATE POLICY "Users can delete own habit logs"
  ON habit_logs FOR DELETE USING (auth.uid() = user_id);
