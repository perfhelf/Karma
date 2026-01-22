
-- 02_separate_karma_auth.sql
-- Separate Authorization Table for Karma Project

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.karma_authorized_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ, -- NULL means permanent
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.karma_authorized_users ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow anyone to READ (Checking if they are authorized)
CREATE POLICY "Allow public read access"
ON public.karma_authorized_users
FOR SELECT
USING (true);

-- Allow Admin (service_role or specific users) to ALL
-- For simplicity in this app, we rely on Service Role for mutations usually,
-- but we adding a policy for specific whitelist emails if needed.
-- Since our Admin API uses Service Role, it bypasses RLS.
-- But for Client-side insert (if any), we need policy.

-- For now, let's keep it simple: Read-only for public, Full access for Service Role.
CREATE POLICY "Allow service_role full access"
ON public.karma_authorized_users
FOR ALL
USING (auth.role() = 'service_role');

-- If you want the 'perfhelf@gmail.com' user to be able to insert from client:
CREATE POLICY "Allow admin insert/update"
ON public.karma_authorized_users
FOR ALL
USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'perfhelf@gmail.com'));
