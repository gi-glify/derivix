BEGIN;

CREATE OR REPLACE FUNCTION public.binary_state()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  RETURN jsonb_build_object(
    'contracts', coalesce((
      SELECT jsonb_agg(to_jsonb(contract) ORDER BY contract.created_at DESC)
      FROM (SELECT * FROM public.binary_contracts WHERE user_id=uid ORDER BY created_at DESC LIMIT 50) contract
    ), '[]'::jsonb),
    'ticks', coalesce((
      SELECT jsonb_object_agg(symbol, rows)
      FROM (
        SELECT symbol, jsonb_agg(to_jsonb(tick) ORDER BY tick.sequence) AS rows
        FROM (
          SELECT tick.*, row_number() OVER (PARTITION BY tick.symbol ORDER BY tick.sequence DESC) AS rank
          FROM public.binary_market_ticks tick
        ) tick
        WHERE rank <= 100
        GROUP BY symbol
      ) grouped
    ), '{}'::jsonb)
  );
END; $$;

REVOKE ALL ON FUNCTION public.binary_state() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.binary_state() TO authenticated;
COMMIT;
