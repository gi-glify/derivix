BEGIN;

-- The client asks the server to advance the shared simulation frequently.
-- This trigger is the authority that decides whether an individual index is
-- due for a new tick, so one-second and two-second indices never share an
-- accidental global cadence.
CREATE OR REPLACE FUNCTION public.binary_apply_tick_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  idx public.binary_indices;
  latest_at timestamptz;
  digit_value integer;
  raw_value numeric;
  unit numeric;
BEGIN
  SELECT * INTO idx FROM public.binary_indices WHERE symbol=NEW.symbol AND enabled;
  IF idx.symbol IS NULL THEN RAISE EXCEPTION 'Binary index is unavailable'; END IF;

  SELECT max(created_at) INTO latest_at FROM public.binary_market_ticks WHERE symbol=NEW.symbol;
  IF latest_at IS NOT NULL
    AND latest_at > clock_timestamp() - make_interval(secs => idx.tick_interval_ms::numeric / 1000) THEN
    RETURN NULL;
  END IF;

  digit_value := floor(random() * 10)::integer;
  unit := power(10::numeric, -idx.precision);
  raw_value := idx.base_price + ((random() * 2 - 1) * idx.movement_scale * 10);
  NEW.value := trunc(raw_value / unit) * unit + digit_value * unit;
  NEW.digit := digit_value;
  RETURN NEW;
END; $$;

COMMIT;
