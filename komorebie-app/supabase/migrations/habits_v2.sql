-- Add flexible frequencies and freeze days to habits

-- Modify habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS frequency_type TEXT NOT NULL DEFAULT 'daily';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS target_days JSONB;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS target_per_week INTEGER;

-- Add check constraint for frequency_type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_frequency_type'
  ) THEN
    ALTER TABLE habits ADD CONSTRAINT check_frequency_type CHECK (frequency_type IN ('daily', 'specific_days', 'x_per_week'));
  END IF;
END $$;

-- Modify habit_logs table
ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT false;

-- Allow users to freeze logs for any past date if they are freezing it
-- We'll just replace the RLS policy for insert/update to allow if log_date <= CURRENT_DATE
-- instead of restricting to 1 day, because freezing can happen later.
DROP POLICY IF EXISTS "Users can insert habit logs within grace period" ON habit_logs;
CREATE POLICY "Users can insert habit logs within grace period"
  ON habit_logs FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND log_date <= CURRENT_DATE
  );

DROP POLICY IF EXISTS "Users can update habit logs within grace period" ON habit_logs;
CREATE POLICY "Users can update habit logs within grace period"
  ON habit_logs FOR UPDATE USING (
    auth.uid() = user_id
    AND log_date <= CURRENT_DATE
  );
