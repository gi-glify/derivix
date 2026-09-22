BEGIN;

ALTER TABLE public.binary_indices
  ADD COLUMN IF NOT EXISTS tick_interval_ms integer NOT NULL DEFAULT 1000 CHECK (tick_interval_ms IN (1000, 2000)),
  ADD COLUMN IF NOT EXISTS movement_scale numeric(12,4) NOT NULL DEFAULT 0.1000 CHECK (movement_scale > 0);

INSERT INTO public.binary_indices(symbol,name,precision,base_price,enabled,tick_interval_ms,movement_scale) VALUES
  ('V10','Volatility 10 Index',2,1000.00,true,2000,0.1000),
  ('V15','Volatility 15 Index',2,1500.00,true,2000,0.1500),
  ('V25','Volatility 25 Index',2,2500.00,true,2000,0.2500),
  ('V50','Volatility 50 Index',2,5000.00,true,2000,0.5000),
  ('V75','Volatility 75 Index',2,7500.00,true,2000,0.7500),
  ('V100','Volatility 100 Index',2,10000.00,true,2000,1.0000),
  ('V10_1S','Volatility 10 (1s) Index',2,1000.00,true,1000,0.1000),
  ('V15_1S','Volatility 15 (1s) Index',2,1500.00,true,1000,0.1500),
  ('V25_1S','Volatility 25 (1s) Index',2,2500.00,true,1000,0.2500),
  ('V50_1S','Volatility 50 (1s) Index',2,267860.19,true,1000,0.5000),
  ('V75_1S','Volatility 75 (1s) Index',2,145932.44,true,1000,0.7500),
  ('V100_1S','Volatility 100 (1s) Index',2,83214.72,true,1000,1.0000),
  ('V150_1S','Volatility 150 (1s) Index',2,150000.00,true,1000,1.5000),
  ('V250_1S','Volatility 250 (1s) Index',2,250000.00,true,1000,2.5000)
ON CONFLICT(symbol) DO UPDATE SET
  name=excluded.name, enabled=true, tick_interval_ms=excluded.tick_interval_ms, movement_scale=excluded.movement_scale;

CREATE OR REPLACE FUNCTION public.binary_apply_tick_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE idx public.binary_indices; signed_noise integer;
BEGIN
  SELECT * INTO idx FROM public.binary_indices WHERE symbol=NEW.symbol;
  signed_noise := get_byte(decode(md5(NEW.symbol || ':' || NEW.sequence::text), 'hex'), 0) - 128;
  NEW.value := round(idx.base_price + signed_noise * idx.movement_scale, idx.precision);
  NEW.digit := mod(round(NEW.value * power(10, idx.precision))::bigint, 10)::smallint;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS binary_market_tick_movement ON public.binary_market_ticks;
CREATE TRIGGER binary_market_tick_movement
  BEFORE INSERT ON public.binary_market_ticks
  FOR EACH ROW EXECUTE FUNCTION public.binary_apply_tick_movement();

COMMIT;
