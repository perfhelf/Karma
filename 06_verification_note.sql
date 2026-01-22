-- Karma: Storage Bucket Setup
-- Ensure 'karma' bucket exists and has correct policies

-- 1. Create Bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('karma', 'karma', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies
-- Allow Authenticated Users to Upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'karma');

-- Allow Authenticated Users to Update their own files (if needed, or just strict)
-- (Simplification: Allow all auth users to update/delete for now, or match by UUID in name?)
-- Better: usually we store user_id in path like `karma/{user_id}/...` or generic.
-- Our current code implementation: `folder` param in `uploadFileToR2` appends but data.ts uses generic key?
-- The R2 integration in this project seems custom (via /api/r2-upload). 
-- WAIT: The code uses `/api/r2-upload` (Next.js API calling R2 directly).
-- It does NOT use Supabase Storage (storage.objects).
-- So this SQL for Supabase Storage is WRONG/UNUSED if we use Cloudflare R2 directly.

-- Checking data.ts:
-- export async function uploadFileToR2(file: File) { ... fetch('/api/r2-upload') ... }

-- so NO Supabase Storage SQL needed.
-- The Clean Algorithm uses `/api/r2-delete`.
-- So `handleDeleteAllData` calling `/api/r2-delete` is correct.
-- Verification: DOES `handleDeleteAllData` actually iterate all files?
-- It queries `transactions` table for `attachments`.
-- If we delete `transactions` first, we lose the keys.
-- The code in `SettingsView.vue` properly does: 1. Fetch keys. 2. Delete R2. 3. Delete DB.
-- So verify order:
-- SettingsView.vue:
-- // Step 1: Fetch all attachment keys
-- // Step 2: Delete from R2
-- // Step 3: Delete DB Records
-- This ORDER IS CORRECT.

-- CONCLUSION: No extra Storage SQL needed.
-- However, we should double check if there are any other tables.
