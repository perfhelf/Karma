-- Karma Accounting System: Database Schema
-- Version 2.0 - With Multi-Ledger Support

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Exchange Rates Table (汇率表)
CREATE TABLE public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    currency_code TEXT NOT NULL UNIQUE,
    rate_to_cny NUMERIC(20, 6) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Settings Table (用户设置)
CREATE TABLE public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    base_currency TEXT NOT NULL DEFAULT 'CNY',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ledgers Table (账本表) - NEW
CREATE TABLE public.ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📒',
    color TEXT DEFAULT '#22c55e',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Categories Table (分类表)
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    icon TEXT DEFAULT '📁',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Transactions Table (账单表)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    ledger_id UUID REFERENCES public.ledgers(id) ON DELETE SET NULL,  -- NULL = 总账户
    amount_base NUMERIC(20, 2) NOT NULL,      -- 结算币种金额
    original_amount NUMERIC(20, 2) NOT NULL,  -- 原始金额
    currency TEXT NOT NULL DEFAULT 'CNY',
    type TEXT NOT NULL DEFAULT 'expense',
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,  -- Array of { key, url, name }
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Row Level Security (RLS)
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Exchange Rates: Public Read
CREATE POLICY "Everyone can view exchange rates"
    ON public.exchange_rates FOR SELECT
    TO authenticated
    USING (true);

-- User Settings Policies
CREATE POLICY "Users can view own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Ledgers Policies
CREATE POLICY "Users can view own ledgers"
    ON public.ledgers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ledgers"
    ON public.ledgers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ledgers"
    ON public.ledgers FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ledgers"
    ON public.ledgers FOR DELETE
    USING (auth.uid() = user_id);

-- Categories Policies
CREATE POLICY "Users can view own categories"
    ON public.categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);

-- 8. Indexes for performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_ledger_id ON public.transactions(ledger_id);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_ledgers_user_id ON public.ledgers(user_id);

-- 9. Initial Exchange Rates (示例数据)
INSERT INTO public.exchange_rates (currency_code, rate_to_cny) VALUES
    ('USD', 7.25),
    ('EUR', 7.85),
    ('GBP', 9.15),
    ('JPY', 0.047),
    ('HKD', 0.93),
    ('AUD', 4.65),
    ('MYR', 1.62),
    ('THB', 0.21),
    ('SGD', 5.35)
ON CONFLICT (currency_code) DO UPDATE SET rate_to_cny = EXCLUDED.rate_to_cny, updated_at = NOW();
