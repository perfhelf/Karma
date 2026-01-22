-- Karma: Fix Ledger Creation & Add Archive Feature

-- 1. Fix: Set default user_id to auth.uid() for Ledgers
-- This ensures that inserts without user_id automatically use the current authenticated user
ALTER TABLE public.ledgers
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 2. Feature: Add is_archived column to Ledgers
-- This allows ledgers to be archived instead of deleted
ALTER TABLE public.ledgers
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- 3. Update RLS policies if necessary (usually not needed if just adding a column, 
-- but ensuring the default value works might require checking insert policies)
-- Existing policies:
-- CREATE POLICY "Users can insert own ledgers" ON public.ledgers FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Since we now auto-set user_id = auth.uid(), this policy should pass perfectly.
