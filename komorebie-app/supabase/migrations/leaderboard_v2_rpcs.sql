-- ============================================================
-- Komorebie Leaderboard v2 — Database RPCs
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. Weekly leaderboard (current ISO week: Monday to today)
CREATE OR REPLACE FUNCTION get_leaderboard_weekly()
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  current_streak int,
  total_focus_seconds bigint
) AS $$
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.current_streak,
    COALESCE(SUM(s.total_focus_seconds), 0)::bigint AS total_focus_seconds
  FROM profiles p
  LEFT JOIN streaks s
    ON s.user_id = p.id
    AND s.focus_date >= date_trunc('week', CURRENT_DATE)::date
    AND s.focus_date <= CURRENT_DATE
  WHERE p.username IS NOT NULL
  GROUP BY p.id, p.username, p.display_name, p.avatar_url, p.current_streak
  ORDER BY total_focus_seconds DESC
  LIMIT 100;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Monthly leaderboard (current calendar month)
CREATE OR REPLACE FUNCTION get_leaderboard_monthly()
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  current_streak int,
  total_focus_seconds bigint
) AS $$
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.current_streak,
    COALESCE(SUM(s.total_focus_seconds), 0)::bigint AS total_focus_seconds
  FROM profiles p
  LEFT JOIN streaks s
    ON s.user_id = p.id
    AND s.focus_date >= date_trunc('month', CURRENT_DATE)::date
    AND s.focus_date <= CURRENT_DATE
  WHERE p.username IS NOT NULL
  GROUP BY p.id, p.username, p.display_name, p.avatar_url, p.current_streak
  ORDER BY total_focus_seconds DESC
  LIMIT 100;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. All-time leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard_all_time()
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  current_streak int,
  total_focus_seconds bigint
) AS $$
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.current_streak,
    COALESCE(SUM(s.total_focus_seconds), 0)::bigint AS total_focus_seconds
  FROM profiles p
  LEFT JOIN streaks s ON s.user_id = p.id
  WHERE p.username IS NOT NULL
  GROUP BY p.id, p.username, p.display_name, p.avatar_url, p.current_streak
  ORDER BY total_focus_seconds DESC
  LIMIT 100;
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Previous week's top 3 champions
CREATE OR REPLACE FUNCTION get_previous_week_champions()
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  total_focus_seconds bigint
) AS $$
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(s.total_focus_seconds), 0)::bigint AS total_focus_seconds
  FROM profiles p
  JOIN streaks s
    ON s.user_id = p.id
    AND s.focus_date >= (date_trunc('week', CURRENT_DATE) - interval '7 days')::date
    AND s.focus_date <  date_trunc('week', CURRENT_DATE)::date
  WHERE p.username IS NOT NULL
  GROUP BY p.id, p.username, p.display_name, p.avatar_url
  ORDER BY total_focus_seconds DESC
  LIMIT 3;
$$ LANGUAGE sql SECURITY DEFINER;
