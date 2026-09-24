-- Start the demo with no seeded balances, orders, contracts or generated prices.
-- Authentication profiles, roles, the index catalogue and schema remain intact.
BEGIN;

DELETE FROM public.binary_ticks;
DELETE FROM public.binary_contracts;
DELETE FROM public.binary_market_ticks;
DELETE FROM public.account_reservations;
DELETE FROM public.account_ledger_entries;
DELETE FROM public.practice_orders;
DELETE FROM public.practice_accounts;
DELETE FROM public.practice_access;
UPDATE public.account_wallets SET balance = 0, reserved_balance = 0, updated_at = clock_timestamp();

CREATE TABLE IF NOT EXISTS public.binary_demo_scenarios (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario text NOT NULL DEFAULT 'neutral' CHECK (scenario IN ('neutral','always_win','always_loss')),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.binary_demo_scenarios ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.binary_demo_scenarios FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.binary_admin_scenario(p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE
  uid uuid := auth.uid(); role_name text := public.ops_role(); target uuid := nullif(p_payload->>'userId','')::uuid;
  selected text := coalesce(nullif(p_payload->>'scenario',''),'neutral'); reason text := trim(coalesce(p_payload->>'reason','')); prior jsonb;
BEGIN
  IF uid IS NULL OR role_name <> 'owner' THEN RAISE EXCEPTION 'Owner role required' USING ERRCODE='42501'; END IF;
  IF p_action = 'list' THEN
    RETURN coalesce((SELECT jsonb_object_agg(user_id, scenario) FROM public.binary_demo_scenarios), '{}'::jsonb);
  END IF;
  IF p_action <> 'assign' THEN RAISE EXCEPTION 'Unknown Binary scenario action'; END IF;
  IF target IS NULL OR selected NOT IN ('neutral','always_win','always_loss') OR length(reason) < 5 THEN
    RAISE EXCEPTION 'Account, valid scenario, and a reason of at least five characters are required';
  END IF;
  PERFORM 1 FROM public.profiles WHERE id=target FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
  IF EXISTS (SELECT 1 FROM public.binary_contracts WHERE user_id=target AND status='OPEN') THEN
    RAISE EXCEPTION 'Settle the open Binary contract before changing its simulation scenario';
  END IF;
  SELECT to_jsonb(item) INTO prior FROM public.binary_demo_scenarios item WHERE user_id=target;
  INSERT INTO public.binary_demo_scenarios(user_id,scenario) VALUES(target,selected)
    ON CONFLICT(user_id) DO UPDATE SET scenario=excluded.scenario,updated_at=clock_timestamp();
  INSERT INTO public.ops_audit(actor_id,action,entity_id,reason,before_data,after_data)
    VALUES(uid,'binary.scenario',target,reason,prior,jsonb_build_object('scenario',selected));
  RETURN jsonb_build_object('ok',true,'scenario',selected);
END; $$;
REVOKE ALL ON FUNCTION public.binary_admin_scenario(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.binary_admin_scenario(text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.binary_state()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  RETURN jsonb_build_object(
    'scenario', coalesce((SELECT scenario FROM public.binary_demo_scenarios WHERE user_id=uid),'neutral'),
    'contracts', coalesce((SELECT jsonb_agg(to_jsonb(contract) ORDER BY contract.created_at DESC) FROM (SELECT * FROM public.binary_contracts WHERE user_id=uid ORDER BY created_at DESC LIMIT 50) contract), '[]'::jsonb),
    'ticks', coalesce((SELECT jsonb_object_agg(symbol, rows) FROM (SELECT symbol,jsonb_agg(to_jsonb(tick) ORDER BY tick.sequence) rows FROM (SELECT tick.*,row_number() OVER(PARTITION BY tick.symbol ORDER BY tick.sequence DESC) rank FROM public.binary_market_ticks tick) tick WHERE rank<=100 GROUP BY symbol) grouped), '{}'::jsonb)
  );
END; $$;
REVOKE ALL ON FUNCTION public.binary_state() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.binary_state() TO authenticated;
COMMIT;

-- The existing Binary engine remains responsible for validation, reservation,
-- settlement and ledger writes. This wrapper supplies a visible demo outcome
-- tick only for an owner's assigned simulation scenario.
BEGIN;
CREATE OR REPLACE FUNCTION public.binary_apply_tick_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE idx public.binary_indices; digit_value integer; raw_value numeric; unit numeric;
  forced text := nullif(current_setting('derivix.binary_forced_digit', true),'');
BEGIN
  SELECT * INTO idx FROM public.binary_indices WHERE symbol=NEW.symbol AND enabled;
  IF idx.symbol IS NULL THEN RAISE EXCEPTION 'Binary index is unavailable'; END IF;
  digit_value := CASE WHEN forced ~ '^[0-9]$' THEN forced::integer ELSE floor(random()*10)::integer END;
  unit := power(10::numeric,-idx.precision);
  raw_value := idx.base_price + ((random()*2-1)*idx.movement_scale*10);
  NEW.value := trunc(raw_value/unit)*unit + digit_value*unit;
  NEW.digit := digit_value;
  RETURN NEW;
END; $$;

ALTER FUNCTION public.binary_api(text,jsonb) RENAME TO binary_engine;
CREATE OR REPLACE FUNCTION public.binary_api(p_action text,p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE uid uuid:=auth.uid(); c public.binary_contracts; scenario text; desired integer; next_sequence bigint;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_action='settle' THEN
    SELECT * INTO c FROM public.binary_contracts WHERE id=nullif(p_payload->>'id','')::uuid AND user_id=uid FOR UPDATE;
    IF c.id IS NOT NULL AND c.status='OPEN' AND clock_timestamp()>=c.settles_at THEN
      SELECT coalesce(s.scenario,'neutral') INTO scenario FROM public.binary_demo_scenarios s WHERE s.user_id=uid;
      IF scenario IN ('always_win','always_loss') THEN
        desired := CASE c.contract_type
          WHEN 'EVEN' THEN CASE WHEN scenario='always_win' THEN 0 ELSE 1 END
          WHEN 'ODD' THEN CASE WHEN scenario='always_win' THEN 1 ELSE 0 END
          WHEN 'MATCHES' THEN CASE WHEN scenario='always_win' THEN c.prediction ELSE mod(c.prediction+1,10) END
          WHEN 'DIFFERS' THEN CASE WHEN scenario='always_win' THEN mod(c.prediction+1,10) ELSE c.prediction END
          WHEN 'OVER' THEN CASE WHEN scenario='always_win' THEN c.prediction+1 ELSE c.prediction END
          WHEN 'UNDER' THEN CASE WHEN scenario='always_win' THEN c.prediction-1 ELSE c.prediction END
        END;
        SELECT coalesce(max(sequence),0)+1 INTO next_sequence FROM public.binary_market_ticks WHERE symbol=c.symbol;
        PERFORM set_config('derivix.binary_forced_digit',desired::text,true);
        INSERT INTO public.binary_market_ticks(symbol,sequence,value,digit) VALUES(c.symbol,next_sequence,0,0);
        PERFORM set_config('derivix.binary_forced_digit','',true);
      END IF;
    END IF;
  END IF;
  RETURN public.binary_engine(p_action,p_payload);
END; $$;
REVOKE ALL ON FUNCTION public.binary_api(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.binary_api(text,jsonb) TO authenticated;
COMMIT;
