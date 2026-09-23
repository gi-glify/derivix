BEGIN;

CREATE OR REPLACE FUNCTION public.binary_apply_tick_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  idx public.binary_indices;
  digit_value integer;
  raw_value numeric;
  unit numeric;
BEGIN
  SELECT * INTO idx FROM public.binary_indices WHERE symbol=NEW.symbol AND enabled;
  IF idx.symbol IS NULL THEN RAISE EXCEPTION 'Binary index is unavailable'; END IF;
  digit_value := floor(random() * 10)::integer;
  unit := power(10::numeric, -idx.precision);
  raw_value := idx.base_price + ((random() * 2 - 1) * idx.movement_scale * 10);
  NEW.value := trunc(raw_value / unit) * unit + digit_value * unit;
  NEW.digit := digit_value;
  RETURN NEW;
END; $$;

INSERT INTO public.binary_market_ticks(symbol,sequence,value,digit)
SELECT idx.symbol, coalesce((SELECT max(t.sequence) FROM public.binary_market_ticks t WHERE t.symbol=idx.symbol), 0) + 1, idx.base_price, 0
FROM public.binary_indices idx
WHERE idx.enabled
  AND NOT EXISTS (SELECT 1 FROM public.binary_market_ticks t WHERE t.symbol=idx.symbol);

COMMIT;
