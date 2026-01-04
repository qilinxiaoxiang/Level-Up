-- Migration: Add revelations table to store revelation history
-- Created: 2026-01-04

CREATE TABLE IF NOT EXISTS revelations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Input
  user_message TEXT,
  provider TEXT NOT NULL DEFAULT 'deepseek', -- 'deepseek' or 'openai'

  -- Output
  revelation_text TEXT NOT NULL,

  -- Context snapshot (optional, for debugging)
  context_snapshot JSONB,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS revelations_user_id_idx ON revelations(user_id);
CREATE INDEX IF NOT EXISTS revelations_created_at_idx ON revelations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE revelations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own revelations
CREATE POLICY "Users can view their own revelations"
  ON revelations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own revelations"
  ON revelations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Optional: Allow users to delete their own revelations
CREATE POLICY "Users can delete their own revelations"
  ON revelations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON revelations TO authenticated;
