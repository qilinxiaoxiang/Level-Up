# Database Migration Log

## 2026-01-10: Add linked_task_ids to pomodoros

**Migration ID:** `20260110193953_add_linked_task_ids_to_pomodoros.sql`

### Changes Applied
- Added `linked_task_ids JSONB` column to `pomodoros` table
- Migrated existing `task_id` data to `linked_task_ids` as single-element arrays
- Kept `task_id` column for backward compatibility

### Purpose
Enable pomodoros to be linked to multiple tasks simultaneously, supporting:
- One-time tasks automatically linked to related daily tasks
- User-editable task links via the edit pomodoro interface
- Flexible time tracking across multiple tasks without duplication

### Deployment Status
✅ **Successfully applied** to production database on 2026-01-10 19:40 UTC

### Migration Process
1. Created migration file in `supabase/migrations/`
2. Resolved remote/local migration conflict by creating placeholder for `20260110000001`
3. Pushed migration using `echo "Y" | supabase db push --linked`
4. Regenerated TypeScript types with `supabase gen types typescript --linked`
5. Verified compilation with `npx tsc --noEmit`

### Issues Encountered
**Problem:** Remote database had migration `20260110000001` that didn't exist locally
**Solution:** Created placeholder file `supabase/migrations/20260110000001_remote_migration.sql`
**Documentation:** Updated README.md with procedure to handle migration conflicts

### Verification
- ✅ Migration listed in remote database
- ✅ TypeScript types updated successfully
- ✅ Frontend builds without errors
- ✅ All changes committed and pushed to Git

### Related Code Changes
- `frontend/src/types/index.ts` - Added `linked_task_ids?: string[] | null`
- `frontend/src/types/database.ts` - Auto-generated with new column
- `frontend/src/components/dashboard/EditPomodoroModal.tsx` - Multi-select interface
- `frontend/src/components/dashboard/TodayPomodorosModal.tsx` - Display logic
- `frontend/src/components/battle/PomodoroModal.tsx` - Save logic
- `database/schema.sql` - Updated schema definition

### Rollback Procedure
If needed, to rollback this migration:
```sql
-- Remove the column (data will be lost)
ALTER TABLE pomodoros DROP COLUMN IF EXISTS linked_task_ids;
```
**⚠️ Warning:** This will permanently delete all multi-task link data. Ensure `task_id` is populated before rollback.
