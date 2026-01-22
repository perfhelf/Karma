-- Karma: Fix User ID Defaults Globally
-- Ensure all tables automatically set user_id to the current authenticated user.

-- 1. Transactions (Safety)
ALTER TABLE public.transactions
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 2. Categories
ALTER TABLE public.categories
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 3. Ledgers
ALTER TABLE public.ledgers
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 4. User Settings
ALTER TABLE public.user_settings
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 5. RLS Policy Check (Optional but good practice)
-- Ensure policies allow inserting with default user_id (usually they do if they check auth.uid() = user_id)
