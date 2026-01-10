# Database Initialization Guide

This guide will help you set up your Supabase database for the Revelation application.

## Prerequisites

- [ ] Supabase account created at [supabase.com](https://supabase.com)
- [ ] Project created on Supabase
- [ ] Project URL and API keys available

## Step 1: Run the Schema

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

2. **Copy and Run schema.sql**
   - Open `database/schema.sql` from this project
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)

3. **Verify Tables Created**
   - Click on "Table Editor" in the left sidebar
   - You should see all the tables:
     - `user_profiles`
     - `goals`
     - `tasks`
     - `daily_task_completions`
     - `pomodoros`
     - `items`
     - `user_inventory`
     - `user_equipment`
     - `achievements`
     - `user_achievements`
     - `streak_history`

## Step 2: Set Up Authentication Trigger

To automatically create a user profile when someone signs up, we need to add a trigger.

1. **Create Profile Creation Trigger**

   In the Supabase SQL Editor, run this query:

   ```sql
   -- Function to create user profile on signup
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS trigger AS $$
   BEGIN
     INSERT INTO public.user_profiles (id, username)
     VALUES (
       new.id,
       new.email  -- use email as default username
     );
     RETURN new;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Trigger the function every time a user is created
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

2. **Verify the Trigger**
   - Go to Database → Triggers
   - You should see `on_auth_user_created`

## Step 3: Configure Authentication

1. **Enable Email Authentication**
   - Go to Authentication → Providers
   - Ensure "Email" is enabled
   - Configure email templates (optional)

2. **Set Up Email Confirmation** (Optional)
   - Go to Authentication → Settings
   - Toggle "Enable email confirmations" based on your preference
   - For development, you might want to disable this

## Step 4: Get Your Credentials

You'll need these for your frontend `.env` file:

1. **Project URL**
   - Go to Settings → API
   - Copy the "Project URL"
   - Example: `https://abcdefghijklmnop.supabase.co`

2. **Anon/Public Key**
   - Still in Settings → API
   - Copy the "anon public" key
   - This is safe to use in your frontend

3. **Service Role Key** (Optional, for backend/admin tasks)
   - In Settings → API
   - Copy the "service_role" key
   - ⚠️ **NEVER expose this in frontend code**

## Step 5: Test the Database

Run a test query to ensure everything works:

```sql
-- Check if seed data loaded
SELECT COUNT(*) as item_count FROM items;
SELECT COUNT(*) as achievement_count FROM achievements;

-- Should return:
-- item_count: 7
-- achievement_count: 6
```

If you see these counts, your database is ready! 🎉

## Step 6: Set Up Your Environment File

1. Create a `.env.local` file in your project root (see main README)
2. Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Common Issues & Solutions

### Issue: "permission denied for table user_profiles"

**Solution**: Make sure Row Level Security policies are enabled. Re-run the RLS section of `schema.sql`.

### Issue: "foreign key constraint violation"

**Solution**: The order matters. Make sure you ran the entire `schema.sql` file in order, not individual sections.

### Issue: User profile not created on signup

**Solution**:
1. Check that the trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
2. Re-run the trigger creation SQL from Step 2

### Issue: Seed data (items/achievements) not showing

**Solution**: Check if items table has the RLS policy allowing reads. Run:
```sql
SELECT * FROM items;
```
If you get permission denied, re-run the RLS policies section.

## Next Steps

Once your database is initialized:

1. ✅ Database schema created
2. ✅ Authentication trigger set up
3. ✅ Credentials copied
4. 🔜 Set up your frontend project
5. 🔜 Configure `.env.local` file
6. 🔜 Start building!

---

## Resetting the Database (Development Only)

If you need to start fresh during development:

⚠️ **WARNING**: This will delete ALL data!

```sql
-- Drop all tables (cascades to dependent objects)
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS user_equipment CASCADE;
DROP TABLE IF EXISTS user_inventory CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS pomodoros CASCADE;
DROP TABLE IF EXISTS daily_task_completions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS streak_history CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS xp_needed_for_level CASCADE;
DROP FUNCTION IF EXISTS add_rewards CASCADE;
DROP FUNCTION IF EXISTS update_hp CASCADE;
DROP FUNCTION IF EXISTS get_active_goals CASCADE;

-- Then re-run schema.sql
```

---

## Support

If you encounter issues:
1. Check Supabase logs (Database → Logs)
2. Verify your Supabase plan supports the features you're using
3. Check the Supabase documentation: https://supabase.com/docs
