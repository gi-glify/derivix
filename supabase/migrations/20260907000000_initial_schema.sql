-- ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- Extends Supabase auth.users
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text UNIQUE,
  country text NOT NULL,
  kyc_status text DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_REVIEW')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. WALLETS TABLE
CREATE TABLE wallets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance decimal(20,8) DEFAULT 0.0 CHECK (balance >= 0),
  currency text DEFAULT 'KES',
  updated_at timestamptz DEFAULT now()
);

-- 3. POSITIONS TABLE
CREATE TABLE positions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity decimal(12,4) NOT NULL CHECK (quantity > 0),
  entry_price decimal(20,8) NOT NULL,
  current_price decimal(20,8) NOT NULL,
  exit_price decimal(20,8),
  status text DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  pnl decimal(20,2) DEFAULT 0.0,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 4. TRANSACTIONS TABLE
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'TRADE_PROFIT', 'TRADE_LOSS')),
  amount decimal(20,2) NOT NULL,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REJECTED')),
  provider text,
  reference text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- WALLETS POLICIES
CREATE POLICY "Users can view their own wallet" ON wallets FOR SELECT USING (auth.uid() = (SELECT id FROM profiles WHERE id = wallets.user_id));

-- POSITIONS POLICIES
CREATE POLICY "Users can view their own positions" ON positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own positions" ON positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own positions" ON positions FOR UPDATE USING (auth.uid() = user_id);

-- TRANSACTIONS POLICIES
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

-- AUTOMATION: TRIGGER TO CREATE PROFILE AND WALLET ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS 28657
BEGIN
  INSERT INTO public.profiles (id, full_name, email, country)
  VALUES (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'), 
    new.email, 
    coalesce(new.raw_user_meta_data->>'country', 'Unknown')
  );
  
  INSERT INTO public.wallets (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
28657 LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
