-- 1. Profiles Table (Heartbeat Sync)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT,
    last_active_at TIMESTAMPTZ,
    last_active_site_origin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns if table exists but columns don't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_active_at') THEN
        ALTER TABLE public.profiles ADD COLUMN last_active_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_active_site_origin') THEN
        ALTER TABLE public.profiles ADD COLUMN last_active_site_origin TEXT;
    END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);


-- 2. Authorized Users Table (Matrix Authorization)
CREATE TABLE IF NOT EXISTS public.authorized_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    expires_at TIMESTAMPTZ, -- NULL means permanent
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authorized users is public read" ON public.authorized_users;
DROP POLICY IF EXISTS "Only Perfhelf can manage authorized_users" ON public.authorized_users;

-- Allow read access to everyone
CREATE POLICY "Authorized users is public read"
    ON public.authorized_users FOR SELECT
    TO authenticated
    USING (true);

-- Admin Policy (Hardcoded Email Check)
-- Note: This relies on the JWT containing the email, which Supabase does by default.
CREATE POLICY "Only Perfhelf can manage authorized_users"
    ON public.authorized_users FOR ALL
    USING (auth.jwt() ->> 'email' = 'perfhelf@gmail.com');
