-- Optimize get_mega_sync_data function
-- Replace the slow PL/pgSQL FOREACH loop with a highly-efficient set-based query (unnest + SQL STABLE).
-- This allows the Postgres query planner to inline and parallelize execution.

CREATE OR REPLACE FUNCTION public.get_mega_sync_data(target_user_ids uuid[])
 RETURNS TABLE(user_id uuid, mega_payload jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT u.id AS user_id,
    jsonb_build_object(
      'profile', COALESCE((SELECT to_jsonb(p) FROM public.profiles p WHERE p.id = u.id), '{}'::jsonb),
      'tasks', COALESCE((SELECT jsonb_agg(t) FROM (SELECT * FROM public.tasks t2 WHERE t2.user_id = u.id ORDER BY t2.created_at DESC) t), '[]'::jsonb),
      'habits', COALESCE((SELECT jsonb_agg(h) FROM (SELECT * FROM public.habits h2 WHERE h2.user_id = u.id ORDER BY h2.created_at ASC) h), '[]'::jsonb),
      'habit_logs', COALESCE((SELECT jsonb_agg(hl) FROM (SELECT * FROM public.habit_logs hl2 WHERE hl2.user_id = u.id AND hl2.log_date > (CURRENT_DATE - INTERVAL '14 days') ORDER BY hl2.log_date DESC) hl), '[]'::jsonb),
      'deadlines', COALESCE((SELECT jsonb_agg(d) FROM (SELECT * FROM public.deadlines d2 WHERE d2.user_id = u.id ORDER BY d2.deadline_date ASC) d), '[]'::jsonb),
      'user_preferences', COALESCE((SELECT to_jsonb(up) FROM public.user_preferences up WHERE up.user_id = u.id LIMIT 1), '{}'::jsonb),
      'notes', COALESCE((SELECT jsonb_agg(n) FROM (SELECT * FROM public.notes n2 WHERE n2.user_id = u.id ORDER BY n2.updated_at DESC) n), '[]'::jsonb),
      'flashcard_decks', COALESCE((SELECT jsonb_agg(fd) FROM (SELECT * FROM public.flashcard_decks fd2 WHERE fd2.user_id = u.id ORDER BY fd2.updated_at DESC) fd), '[]'::jsonb),
      'flashcard_cards', COALESCE((SELECT jsonb_agg(fc) FROM (SELECT * FROM public.flashcard_cards fc2 WHERE fc2.user_id = u.id) fc), '[]'::jsonb),
      'flashcard_study_sessions', COALESCE((SELECT jsonb_agg(fss) FROM (SELECT * FROM public.flashcard_study_sessions fss2 WHERE fss2.user_id = u.id ORDER BY fss2.started_at DESC LIMIT 100) fss), '[]'::jsonb),
      'sessions', COALESCE((SELECT jsonb_agg(fs) FROM (SELECT id, status, elapsed_seconds, started_at, tag FROM public.focus_sessions fs2 WHERE fs2.user_id = u.id ORDER BY fs2.started_at DESC LIMIT 500) fs), '[]'::jsonb),
      'streaks', COALESCE((SELECT jsonb_agg(st) FROM (SELECT focus_date, total_focus_seconds, sessions_count, streak_qualified FROM public.streaks st2 WHERE st2.user_id = u.id ORDER BY st2.focus_date DESC LIMIT 365) st), '[]'::jsonb),
      'tag_colors', COALESCE((SELECT jsonb_agg(tc) FROM (SELECT tag, color FROM public.tag_colors tc2 WHERE tc2.user_id = u.id) tc), '[]'::jsonb)
    ) AS mega_payload
  FROM unnest(target_user_ids) AS u(id);
$function$;
