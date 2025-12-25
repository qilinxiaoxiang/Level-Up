-- Re-runnable migration for user-defined shop items

CREATE TABLE IF NOT EXISTS user_shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  gold_cost INTEGER NOT NULL,
  is_purchased BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_shop_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_shop_items'
      AND policyname = 'Users can manage own shop items'
  ) THEN
    CREATE POLICY "Users can manage own shop items" ON user_shop_items
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END
$$;
