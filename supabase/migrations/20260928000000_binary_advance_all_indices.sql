BEGIN;

CREATE OR REPLACE FUNCTION public.binary_advance_ticks()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE
  uid uuid := auth.uid();
  idx public.binary_indices;
  next_sequence bigint;
  inserted_count integer := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('derivix-binary-advance-all-v1'));

  FOR idx IN SELECT * FROM public.binary_indices WHERE enabled ORDER BY symbol LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.binary_market_ticks
      WHERE symbol=idx.symbol
        AND created_at > clock_timestamp() - make_interval(secs => idx.tick_interval_ms::double precision / 1000)
    ) THEN
      SELECT coalesce(max(sequence), 0) + 1 INTO next_sequence
      FROM public.binary_market_ticks WHERE symbol=idx.symbol;
      INSERT INTO public.binary_market_ticks(symbol,sequence,value,digit)
      VALUES(idx.symbol,next_sequence,idx.base_price,0);
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('recorded', inserted_count);
END; $$;

REVOKE ALL ON FUNCTION public.binary_advance_ticks() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.binary_advance_ticks() TO authenticated;
COMMIT;
