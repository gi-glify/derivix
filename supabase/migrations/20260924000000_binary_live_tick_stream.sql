BEGIN;

CREATE TABLE IF NOT EXISTS public.binary_market_ticks (
  id bigserial PRIMARY KEY,
  symbol text NOT NULL REFERENCES public.binary_indices(symbol),
  sequence bigint NOT NULL CHECK (sequence > 0),
  value numeric(20,8) NOT NULL,
  digit smallint NOT NULL CHECK (digit BETWEEN 0 AND 9),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(symbol, sequence)
);

CREATE INDEX IF NOT EXISTS binary_market_ticks_symbol_sequence_idx
  ON public.binary_market_ticks(symbol, sequence DESC);

ALTER TABLE public.binary_market_ticks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.binary_market_ticks FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.binary_api(p_action text,p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE
  uid uuid := auth.uid();
  c public.binary_contracts;
  w public.account_wallets;
  idx public.binary_indices;
  latest public.binary_market_ticks;
  key uuid := nullif(p_payload->>'idempotencyKey','')::uuid;
  stake numeric := nullif(p_payload->>'stake','')::numeric;
  duration integer := nullif(p_payload->>'durationTicks','')::integer;
  digit integer;
  value numeric;
  won boolean;
  net numeric;
  next_sequence bigint;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  INSERT INTO public.account_wallets(user_id) VALUES(uid) ON CONFLICT(user_id) DO NOTHING;

  IF p_action = 'markets' THEN
    RETURN jsonb_build_object('indices', coalesce((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.symbol) FROM public.binary_indices i WHERE i.enabled), '[]'::jsonb));
  END IF;

  IF p_action = 'tick' THEN
    PERFORM pg_advisory_xact_lock(hashtext('derivix-binary-live-tick-v1'));
    IF EXISTS (SELECT 1 FROM public.binary_market_ticks WHERE created_at > clock_timestamp() - interval '900 milliseconds') THEN
      RETURN jsonb_build_object('recorded', false);
    END IF;
    FOR idx IN SELECT * FROM public.binary_indices WHERE enabled ORDER BY symbol LOOP
      SELECT coalesce(max(sequence), 0) + 1 INTO next_sequence FROM public.binary_market_ticks WHERE symbol = idx.symbol;
      value := round(idx.base_price + ((get_byte(decode(md5(idx.symbol || ':' || floor(extract(epoch FROM clock_timestamp()))::bigint::text), 'hex'), 0) - 128) * 0.01), idx.precision);
      digit := mod(round(value * power(10, idx.precision))::bigint, 10)::integer;
      INSERT INTO public.binary_market_ticks(symbol, sequence, value, digit) VALUES(idx.symbol, next_sequence, value, digit);
    END LOOP;
    RETURN jsonb_build_object('recorded', true);
  END IF;

  IF p_action IN ('state','history') THEN
    RETURN jsonb_build_object(
      'contracts', coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM (SELECT * FROM public.binary_contracts WHERE user_id=uid ORDER BY created_at DESC LIMIT 50) x), '[]'::jsonb),
      'ticks', coalesce((SELECT jsonb_object_agg(symbol, rows) FROM (SELECT symbol, jsonb_agg(to_jsonb(t) ORDER BY t.sequence) rows FROM (SELECT * FROM public.binary_market_ticks ORDER BY sequence DESC LIMIT 300) t GROUP BY symbol) grouped), '{}'::jsonb)
    );
  END IF;

  IF p_action = 'create' THEN
    IF key IS NULL OR stake IS NULL OR stake <= 0 OR duration IS NULL OR duration < 1 OR duration > 100 THEN RAISE EXCEPTION 'Valid idempotency key, stake and duration are required'; END IF;
    SELECT * INTO c FROM public.binary_contracts WHERE user_id=uid AND idempotency_key=key;
    IF c.id IS NOT NULL THEN RETURN jsonb_build_object('contract',to_jsonb(c)); END IF;
    SELECT * INTO idx FROM public.binary_indices WHERE symbol=p_payload->>'symbol' AND enabled;
    IF idx.symbol IS NULL THEN RAISE EXCEPTION 'Binary index is unavailable'; END IF;
    IF p_payload->>'contractType' IN ('MATCHES','DIFFERS','OVER','UNDER') AND ((p_payload->>'prediction')::integer NOT BETWEEN 0 AND 9) THEN RAISE EXCEPTION 'Prediction must be a digit'; END IF;
    SELECT * INTO w FROM public.account_wallets WHERE user_id=uid FOR UPDATE;
    IF w.balance-w.reserved_balance<stake THEN RAISE EXCEPTION 'Insufficient available balance'; END IF;
    SELECT * INTO latest FROM public.binary_market_ticks WHERE symbol=idx.symbol ORDER BY sequence DESC LIMIT 1;
    value := coalesce(latest.value, idx.base_price);
    digit := coalesce(latest.digit, mod(round(value * power(10, idx.precision))::bigint, 10)::integer);
    INSERT INTO public.binary_contracts(user_id,symbol,contract_type,prediction,stake,payout,duration_ticks,opening_value,opening_digit,idempotency_key,settles_at)
      VALUES(uid,idx.symbol,p_payload->>'contractType',nullif(p_payload->>'prediction','')::integer,stake,round(stake*1.96,2),duration,value,digit,key,clock_timestamp()+make_interval(secs=>duration)) RETURNING * INTO c;
    UPDATE public.account_wallets SET reserved_balance=reserved_balance+stake,updated_at=clock_timestamp() WHERE user_id=uid;
    INSERT INTO public.account_ledger_entries(user_id,amount,entry_type,mode,idempotency_key,reference_id,metadata) VALUES(uid,0,'STAKE_RESERVE','demo',gen_random_uuid(),c.id,jsonb_build_object('stake',stake));
    RETURN jsonb_build_object('contract',to_jsonb(c));
  END IF;

  IF p_action = 'settle' THEN
    SELECT * INTO c FROM public.binary_contracts WHERE id=nullif(p_payload->>'id','')::uuid AND user_id=uid FOR UPDATE;
    IF c.id IS NULL THEN RAISE EXCEPTION 'Contract not found'; END IF;
    IF c.status<>'OPEN' THEN RETURN jsonb_build_object('contract',to_jsonb(c)); END IF;
    IF clock_timestamp() < c.settles_at THEN RAISE EXCEPTION 'Contract has not expired'; END IF;
    SELECT * INTO latest FROM public.binary_market_ticks WHERE symbol=c.symbol AND created_at>=c.created_at ORDER BY sequence DESC LIMIT 1;
    IF latest.id IS NULL THEN RAISE EXCEPTION 'Awaiting simulated market tick'; END IF;
    digit := latest.digit;
    value := latest.value;
    won := CASE c.contract_type WHEN 'OVER' THEN digit>c.prediction WHEN 'UNDER' THEN digit<c.prediction WHEN 'MATCHES' THEN digit=c.prediction WHEN 'DIFFERS' THEN digit<>c.prediction WHEN 'ODD' THEN mod(digit,2)=1 WHEN 'EVEN' THEN mod(digit,2)=0 END;
    net := CASE WHEN won THEN c.payout-c.stake ELSE -c.stake END;
    UPDATE public.account_wallets SET reserved_balance=reserved_balance-c.stake,balance=balance+net,updated_at=clock_timestamp() WHERE user_id=uid;
    UPDATE public.binary_contracts SET status=CASE WHEN won THEN 'WON' ELSE 'LOST' END,final_value=value,final_digit=digit,settled_at=clock_timestamp() WHERE id=c.id RETURNING * INTO c;
    INSERT INTO public.account_ledger_entries(user_id,amount,entry_type,mode,idempotency_key,reference_id,metadata) VALUES(uid,net,CASE WHEN won THEN 'TRADE_PROFIT' ELSE 'TRADE_LOSS' END,'demo',gen_random_uuid(),c.id,jsonb_build_object('final_digit',digit,'contract_type',c.contract_type));
    RETURN jsonb_build_object('contract',to_jsonb(c));
  END IF;

  RAISE EXCEPTION 'Unknown binary action';
END; $$;

REVOKE ALL ON FUNCTION public.binary_api(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.binary_api(text,jsonb) TO authenticated;
COMMIT;
