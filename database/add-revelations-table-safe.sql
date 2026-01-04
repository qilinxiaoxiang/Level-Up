-- Safe migration: Add revelations table
-- This version won't error if table already exists

-- Drop existing table if you want to start fresh (OPTIONAL - comment out if you want to keep existing data)
-- DROP TABLE IF EXISTS revelations CASCADE;

-- Create table
CREATE TABLE IF NOT EXISTS revelations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_message TEXT,
  provider TEXT NOT NULL DEFAULT 'deepseek',
  revelation_text TEXT NOT NULL,
  context_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'revelations_user_id_fkey'
  ) THEN
    ALTER TABLE revelations
    ADD CONSTRAINT revelations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS revelations_user_id_idx ON revelations(user_id);
CREATE INDEX IF NOT EXISTS revelations_created_at_idx ON revelations(created_at DESC);

-- Enable RLS
ALTER TABLE revelations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own revelations" ON revelations;
DROP POLICY IF EXISTS "Users can insert their own revelations" ON revelations;
DROP POLICY IF EXISTS "Users can delete their own revelations" ON revelations;

-- Create policies
CREATE POLICY "Users can view their own revelations"
  ON revelations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own revelations"
  ON revelations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own revelations"
  ON revelations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON revelations TO authenticated;
