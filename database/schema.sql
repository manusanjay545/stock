-- QuantStrike AI Supabase Schema
-- Run this in the Supabase SQL Editor

-- 1. Profiles (Linked to auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    plan TEXT DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PRO')),
    subscription_status TEXT DEFAULT 'inactive',
    subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Watchlists
CREATE TABLE watchlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE watchlist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(watchlist_id, symbol)
);

-- RLS
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own watchlists" ON watchlists FOR ALL USING (auth.uid() = user_id);

ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own watchlist items" ON watchlist_items FOR ALL USING (
    EXISTS (SELECT 1 FROM watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid())
);


-- 3. Portfolios
CREATE TABLE portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE portfolio_holdings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    avg_buy_price NUMERIC NOT NULL CHECK (avg_buy_price > 0),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own portfolios" ON portfolios FOR ALL USING (auth.uid() = user_id);

ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own portfolio holdings" ON portfolio_holdings FOR ALL USING (
    EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = portfolio_holdings.portfolio_id AND portfolios.user_id = auth.uid())
);


-- 4. Alerts
CREATE TABLE alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('PRICE_ABOVE', 'PRICE_BELOW', 'VOLUME_ABOVE')),
    threshold_value NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    triggered_at TIMESTAMP WITH TIME ZONE
);

-- RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own alerts" ON alerts FOR ALL USING (auth.uid() = user_id);


-- 5. Saved Screens
CREATE TABLE saved_screens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    query_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE saved_screens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own screens" ON saved_screens FOR ALL USING (auth.uid() = user_id);


-- 6. Instruments Master
CREATE TABLE instruments (
    symbol TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    name TEXT NOT NULL,
    exchange TEXT DEFAULT 'NSE',
    instrument_type TEXT,
    segment TEXT,
    sector TEXT,
    industry TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Public read-only)
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Instruments are public read-only" ON instruments FOR SELECT USING (TRUE);


-- 7. Company Financials (Quarterly)
CREATE TABLE financial_quarterly (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT REFERENCES instruments(symbol),
    quarter_end DATE NOT NULL,
    sales NUMERIC,
    expenses NUMERIC,
    operating_profit NUMERIC,
    other_income NUMERIC,
    depreciation NUMERIC,
    interest NUMERIC,
    profit_before_tax NUMERIC,
    tax NUMERIC,
    net_profit NUMERIC,
    eps NUMERIC,
    UNIQUE(symbol, quarter_end)
);

-- RLS (Public read-only)
ALTER TABLE financial_quarterly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Financials are public read-only" ON financial_quarterly FOR SELECT USING (TRUE);


-- 8. Company Financials (Annual)
CREATE TABLE financial_annual (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT REFERENCES instruments(symbol),
    year_end DATE NOT NULL,
    sales NUMERIC,
    expenses NUMERIC,
    operating_profit NUMERIC,
    other_income NUMERIC,
    depreciation NUMERIC,
    interest NUMERIC,
    profit_before_tax NUMERIC,
    tax NUMERIC,
    net_profit NUMERIC,
    eps NUMERIC,
    dividend_payout NUMERIC,
    UNIQUE(symbol, year_end)
);

-- RLS (Public read-only)
ALTER TABLE financial_annual ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Annual Financials are public read-only" ON financial_annual FOR SELECT USING (TRUE);


-- 9. Balance Sheet
CREATE TABLE balance_sheet (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT REFERENCES instruments(symbol),
    year_end DATE NOT NULL,
    equity_capital NUMERIC,
    reserves NUMERIC,
    borrowings NUMERIC,
    other_liabilities NUMERIC,
    total_liabilities NUMERIC,
    fixed_assets NUMERIC,
    cwip NUMERIC,
    investments NUMERIC,
    other_assets NUMERIC,
    total_assets NUMERIC,
    UNIQUE(symbol, year_end)
);

ALTER TABLE balance_sheet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Balance Sheet is public read-only" ON balance_sheet FOR SELECT USING (TRUE);
