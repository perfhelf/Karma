-- Karma: Fix Transaction Creation
-- Similar to ledgers, we need to ensure transactions default to the current user if not specified.

-- 1. Fix: Set default user_id to auth.uid() for Transactions
ALTER TABLE public.transactions
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 2. Optional: Ensure Categories also have this default, just in case
ALTER TABLE public.categories
ALTER COLUMN user_id SET DEFAULT auth.uid();
