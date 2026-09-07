-- Dynamic user profiles and persisted simulated market ticks.
-- Run after the initial schema migration.

CREATE TABLE IF NOT EXISTS public.market_ticks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol text NOT NULL,
  open numeric(20,8) NOT NULL,
  high numeric(20,8) NOT NULL,
  low numeric(20,8) NOT NULL,
  close numeric(20,8) NOT NULL,
  volume numeric(20,4) NOT NULL DEFAULT 0,
  interval text NOT NULL DEFAULT '1m',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS market_ticks_symbol_created_at_idx ON public.market_ticks (symbol, created_at DESC);
ALTER TABLE public.market_ticks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read market ticks" ON public.market_ticks;
CREATE POLICY "Authenticated users can read market ticks" ON public.market_ticks FOR SELECT TO authenticated USING (true);

-- Keep profile updates restricted to the signed-in owner.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Enable Postgres Changes for the client-side Realtime subscription.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'market_ticks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.market_ticks;
  END IF;
END $$;
