BEGIN;

CREATE TABLE IF NOT EXISTS public.binary_indices (
  symbol text PRIMARY KEY,
  name text NOT NULL,
  precision smallint NOT NULL CHECK (precision BETWEEN 0 AND 8),
  base_price numeric(20,8) NOT NULL CHECK (base_price > 0),
  enabled boolean NOT NULL DEFAULT true
);
INSERT INTO public.binary_indices(symbol,name,precision,base_price) VALUES
  ('V50_1S','Volatility 50 (1s) Index',2,267860.19),
  ('V75_1S','Volatility 75 (1s) Index',2,145932.44),
  ('V100_1S','Volatility 100 (1s) Index',2,83214.72)
ON CONFLICT(symbol) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.binary_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL REFERENCES public.binary_indices(symbol),
  contract_type text NOT NULL CHECK (contract_type IN ('OVER','UNDER','MATCHES','DIFFERS','ODD','EVEN')),
  prediction smallint CHECK (prediction BETWEEN 0 AND 9),
  stake numeric(20,2) NOT NULL CHECK (stake > 0),
  payout numeric(20,2) NOT NULL CHECK (payout >= 0),
  duration_ticks integer NOT NULL CHECK (duration_ticks BETWEEN 1 AND 100),
  opening_value numeric(20,8) NOT NULL,
  opening_digit smallint NOT NULL CHECK (opening_digit BETWEEN 0 AND 9),
  final_value numeric(20,8),
  final_digit smallint CHECK (final_digit BETWEEN 0 AND 9),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','WON','LOST','CANCELLED')),
  idempotency_key uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  settles_at timestamptz NOT NULL,
  settled_at timestamptz,
  UNIQUE(user_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS public.binary_ticks (
  id bigserial PRIMARY KEY,
  contract_id uuid NOT NULL REFERENCES public.binary_contracts(id) ON DELETE CASCADE,
  sequence integer NOT NULL CHECK (sequence > 0),
  value numeric(20,8) NOT NULL,
  digit smallint NOT NULL CHECK (digit BETWEEN 0 AND 9),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contract_id,sequence)
);
ALTER TABLE public.binary_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binary_ticks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.binary_indices,public.binary_contracts,public.binary_ticks FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.binary_api(p_action text,p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE uid uuid:=auth.uid(); c public.binary_contracts; w public.account_wallets; idx public.binary_indices;
  key uuid:=nullif(p_payload->>'idempotencyKey','')::uuid; stake numeric:=nullif(p_payload->>'stake','')::numeric;
  duration integer:=nullif(p_payload->>'durationTicks','')::integer; seq integer; digit integer; value numeric; won boolean; net numeric;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  INSERT INTO public.account_wallets(user_id) VALUES(uid) ON CONFLICT(user_id) DO NOTHING;
  IF p_action='markets' THEN RETURN jsonb_build_object('indices',coalesce((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.symbol) FROM public.binary_indices i WHERE i.enabled),'[]'::jsonb)); END IF;
  IF p_action IN ('state','history') THEN
    RETURN jsonb_build_object('contracts',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM (SELECT * FROM public.binary_contracts WHERE user_id=uid ORDER BY created_at DESC LIMIT 50)x),'[]'::jsonb),'ticks',coalesce((SELECT jsonb_object_agg(symbol,rows) FROM (SELECT c2.symbol,jsonb_agg(to_jsonb(t) ORDER BY t.sequence) rows FROM public.binary_contracts c2 JOIN public.binary_ticks t ON t.contract_id=c2.id WHERE c2.user_id=uid GROUP BY c2.symbol)q),'{}'::jsonb));
  END IF;
  IF p_action='create' THEN
    IF key IS NULL OR stake IS NULL OR stake<=0 OR duration IS NULL OR duration<1 OR duration>100 THEN RAISE EXCEPTION 'Valid idempotency key, stake and duration are required'; END IF;
    SELECT * INTO c FROM public.binary_contracts WHERE user_id=uid AND idempotency_key=key;
    IF c.id IS NOT NULL THEN RETURN jsonb_build_object('contract',to_jsonb(c)); END IF;
    SELECT * INTO idx FROM public.binary_indices WHERE symbol=p_payload->>'symbol' AND enabled;
    IF idx.symbol IS NULL THEN RAISE EXCEPTION 'Binary index is unavailable'; END IF;
    IF p_payload->>'contractType' IN ('MATCHES','DIFFERS','OVER','UNDER') AND ((p_payload->>'prediction')::integer NOT BETWEEN 0 AND 9) THEN RAISE EXCEPTION 'Prediction must be a digit'; END IF;
    SELECT * INTO w FROM public.account_wallets WHERE user_id=uid FOR UPDATE;
    IF w.balance-w.reserved_balance<stake THEN RAISE EXCEPTION 'Insufficient available balance'; END IF;
    value:=idx.base_price; digit:=right(to_char(value,'FM999999999999990.00'),1)::integer;
    INSERT INTO public.binary_contracts(user_id,symbol,contract_type,prediction,stake,payout,duration_ticks,opening_value,opening_digit,idempotency_key,settles_at)
      VALUES(uid,idx.symbol,p_payload->>'contractType',nullif(p_payload->>'prediction','')::integer,stake,round(stake*1.96,2),duration,value,digit,key,now()+make_interval(secs=>greatest(1,duration))) RETURNING * INTO c;
    UPDATE public.account_wallets SET reserved_balance=reserved_balance+stake,updated_at=now() WHERE user_id=uid;
    INSERT INTO public.account_ledger_entries(user_id,amount,entry_type,mode,idempotency_key,reference_id,metadata) VALUES(uid,0,'STAKE_RESERVE','demo',gen_random_uuid(),c.id,jsonb_build_object('stake',stake));
    RETURN jsonb_build_object('contract',to_jsonb(c));
  END IF;
  IF p_action='settle' THEN
    SELECT * INTO c FROM public.binary_contracts WHERE id=nullif(p_payload->>'id','')::uuid AND user_id=uid FOR UPDATE;
    IF c.id IS NULL THEN RAISE EXCEPTION 'Contract not found'; END IF;
    IF c.status<>'OPEN' THEN RETURN jsonb_build_object('contract',to_jsonb(c)); END IF;
    SELECT * INTO idx FROM public.binary_indices WHERE symbol=c.symbol;
    FOR seq IN 1..c.duration_ticks LOOP
      IF NOT EXISTS(SELECT 1 FROM public.binary_ticks WHERE contract_id=c.id AND sequence=seq) THEN
        digit:=mod(('x'||substr(md5(c.id::text||':'||seq::text),1,8))::bit(32)::bigint,10)::integer;
        value:=round(idx.base_price+(seq*0.01),idx.precision);
        INSERT INTO public.binary_ticks(contract_id,sequence,value,digit) VALUES(c.id,seq,value,digit);
      END IF;
    END LOOP;
    SELECT * INTO c FROM public.binary_contracts WHERE id=c.id FOR UPDATE;
    SELECT digit,value INTO digit,value FROM public.binary_ticks WHERE contract_id=c.id ORDER BY sequence DESC LIMIT 1;
    won:=CASE c.contract_type WHEN 'OVER' THEN digit>c.prediction WHEN 'UNDER' THEN digit<c.prediction WHEN 'MATCHES' THEN digit=c.prediction WHEN 'DIFFERS' THEN digit<>c.prediction WHEN 'ODD' THEN mod(digit,2)=1 WHEN 'EVEN' THEN mod(digit,2)=0 END;
    net:=CASE WHEN won THEN c.payout-c.stake ELSE -c.stake END;
    UPDATE public.account_wallets SET reserved_balance=reserved_balance-c.stake,balance=balance+net,updated_at=now() WHERE user_id=uid;
    UPDATE public.binary_contracts SET status=CASE WHEN won THEN 'WON' ELSE 'LOST' END,final_value=value,final_digit=digit,settled_at=now() WHERE id=c.id RETURNING * INTO c;
    INSERT INTO public.account_ledger_entries(user_id,amount,entry_type,mode,idempotency_key,reference_id,metadata) VALUES(uid,net,CASE WHEN won THEN 'TRADE_PROFIT' ELSE 'TRADE_LOSS' END,'demo',gen_random_uuid(),c.id,jsonb_build_object('final_digit',digit,'contract_type',c.contract_type));
    RETURN jsonb_build_object('contract',to_jsonb(c));
  END IF;
  RAISE EXCEPTION 'Unknown binary action';
END; $$;
REVOKE ALL ON FUNCTION public.binary_api(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.binary_api(text,jsonb) TO authenticated;
COMMIT;
