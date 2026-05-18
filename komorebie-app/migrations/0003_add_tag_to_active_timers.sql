-- 0003_add_tag_to_active_timers.sql
ALTER TABLE active_timers ADD COLUMN tag TEXT DEFAULT NULL;
