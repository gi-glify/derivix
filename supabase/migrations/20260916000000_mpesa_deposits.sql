BEGIN;
ALTER TABLE public.payment_attempts DROP CONSTRAINT payment_attempts_status_check;
ALTER TABLE public.payment_attempts ADD CONSTRAINT payment_attempts_status_check CHECK(status IN ('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED','EXPIRED','REVERSED'));
ALTER TABLE public.payment_attempts ADD COLUMN client_request_id uuid,
 ADD COLUMN submitted_at timestamptz, ADD COLUMN next_check_at timestamptz,
 ADD COLUMN provider_updated_at timestamptz;
CREATE UNIQUE INDEX payment_client_request ON public.payment_attempts(user_id,client_request_id);
CREATE UNIQUE INDEX payment_provider_reference ON public.payment_attempts(provider,provider_reference) WHERE provider_reference IS NOT NULL;
REVOKE INSERT,UPDATE,DELETE ON public.payment_attempts FROM anon,authenticated;
GRANT SELECT ON public.payment_attempts TO authenticated;
-- Recorded receipts only: no links to virtual practice balances or local demo wallets.
CREATE TABLE public.deposit_receipts (
 payment_id uuid PRIMARY KEY REFERENCES public.payment_attempts(id),
 user_id uuid NOT NULL REFERENCES auth.users(id),
 amount numeric(20,2) NOT NULL CHECK(amount>0), currency text NOT NULL CHECK(currency='KES'),
 received_at timestamptz NOT NULL DEFAULT now(), reversed_at timestamptz
);
ALTER TABLE public.deposit_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.deposit_receipts FROM anon,authenticated;
GRANT SELECT ON public.deposit_receipts TO authenticated;
CREATE POLICY "Read own deposit receipts" ON public.deposit_receipts FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.payment_status_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), payment_id uuid NOT NULL REFERENCES public.payment_attempts(id),
 status text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_status_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_status_events FROM anon,authenticated;
GRANT SELECT ON public.payment_status_events TO authenticated;
CREATE POLICY "Read own payment timeline" ON public.payment_status_events FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.payment_attempts p WHERE p.id=payment_id AND p.user_id=auth.uid()));
CREATE INDEX payment_events_timeline ON public.payment_status_events(payment_id,created_at);

CREATE FUNCTION public.record_payment_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF new.client_request_id IS NOT NULL AND (TG_OP='INSERT' OR new.status IS DISTINCT FROM old.status) THEN
  INSERT INTO public.payment_status_events(payment_id,status) VALUES(new.id,new.status);
 END IF;
 RETURN new;
END $$;
REVOKE ALL ON FUNCTION public.record_payment_status() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER payment_status_changed AFTER INSERT OR UPDATE OF status ON public.payment_attempts FOR EACH ROW EXECUTE FUNCTION public.record_payment_status();

-- The Edge Function validates the session; only service_role can supply this user ID.
CREATE FUNCTION public.prepare_mpesa_deposit(p_user uuid,p_key uuid,p_amount numeric,p_phone text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE item public.payment_attempts;
BEGIN
 IF p_user IS NULL OR p_key IS NULL OR p_amount IS NULL OR p_amount::text IN ('NaN','Infinity','-Infinity') OR p_amount<100 OR p_amount>150000 OR trunc(p_amount)<>p_amount OR p_phone IS NULL OR p_phone !~ '^254[17][0-9]{8}$' THEN RAISE EXCEPTION 'Invalid deposit details'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 SELECT * INTO item FROM public.payment_attempts WHERE user_id=p_user AND client_request_id=p_key;
 IF FOUND THEN
  IF item.amount<>p_amount OR item.phone<>p_phone THEN RAISE EXCEPTION 'This request ID already belongs to different payment details'; END IF;
  RETURN to_jsonb(item);
 END IF;
 IF EXISTS(SELECT 1 FROM public.payment_attempts WHERE user_id=p_user AND client_request_id IS NOT NULL AND status IN ('PENDING','PROCESSING')) THEN RAISE EXCEPTION 'An existing payment is awaiting confirmation. Check it before starting another.'; END IF;
 IF (SELECT count(*) FROM public.payment_attempts WHERE user_id=p_user AND created_at>now()-interval '1 hour')>=5 THEN RAISE EXCEPTION 'Too many requests. Please try again later.'; END IF;
 INSERT INTO public.payment_attempts(user_id,client_request_id,amount,phone,reference,direction)
 VALUES(p_user,p_key,p_amount,p_phone,'TUID-'||upper(gen_random_uuid()::text),'TOP_UP') RETURNING * INTO item;
 RETURN to_jsonb(item);
END $$;

CREATE FUNCTION public.apply_mpesa_status(p_id uuid,p_transaction jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE item public.payment_attempts; incoming text; remote_time timestamptz;
BEGIN
 SELECT * INTO item FROM public.payment_attempts WHERE id=p_id AND client_request_id IS NOT NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Deposit not found'; END IF;
 IF p_transaction->>'type' IS DISTINCT FROM 'STK' OR p_transaction->>'currency' IS DISTINCT FROM 'KES'
 OR (p_transaction->>'amount')::numeric IS DISTINCT FROM item.amount
 OR p_transaction->>'phone_number' IS DISTINCT FROM item.phone
 OR p_transaction->>'external_reference' IS DISTINCT FROM item.reference
 OR nullif(p_transaction->>'transaction_id','') IS NULL
 OR (item.provider_reference IS NOT NULL AND item.provider_reference IS DISTINCT FROM p_transaction->>'transaction_id') THEN RAISE EXCEPTION 'Provider payment details do not match'; END IF;
 incoming:=CASE p_transaction->>'status' WHEN 'SUCCESS' THEN 'COMPLETED' ELSE p_transaction->>'status' END;
 IF incoming IS NULL OR incoming NOT IN ('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED','EXPIRED','REVERSED') THEN RAISE EXCEPTION 'Unknown provider status'; END IF;
 remote_time:=(p_transaction->>'updated_at')::timestamptz;
 IF remote_time IS NULL THEN RAISE EXCEPTION 'Missing provider timestamp'; END IF;
 IF item.provider_updated_at IS NOT NULL AND remote_time<item.provider_updated_at THEN RETURN to_jsonb(item); END IF;
 IF item.status='REVERSED' OR (item.status='COMPLETED' AND incoming<>'REVERSED') THEN RETURN to_jsonb(item); END IF;
 -- Late success is permitted; transient statuses must not undo a terminal result.
 IF item.status IN ('FAILED','CANCELLED','EXPIRED') AND incoming IN ('PENDING','PROCESSING') THEN RETURN to_jsonb(item); END IF;
 UPDATE public.payment_attempts SET status=incoming,provider_reference=p_transaction->>'transaction_id',provider_updated_at=remote_time,
 failure_reason=CASE WHEN incoming IN ('FAILED','CANCELLED','EXPIRED','REVERSED') THEN left(coalesce(p_transaction->>'result_desc','Payment was not completed'),500) ELSE NULL END,updated_at=now() WHERE id=item.id;
 IF incoming<>item.status THEN
  INSERT INTO public.ops_audit(actor_id,action,entity_id,reason,before_data,after_data) VALUES(item.user_id,'payment.provider_status',item.id,'Confirmed through authenticated Palpluss transaction lookup',jsonb_build_object('status',item.status),jsonb_build_object('status',incoming,'reference',item.reference));
 END IF;
 IF incoming='COMPLETED' THEN
  INSERT INTO public.deposit_receipts(payment_id,user_id,amount,currency) VALUES(item.id,item.user_id,item.amount,'KES') ON CONFLICT(payment_id) DO NOTHING;
  INSERT INTO public.ops_payment_evidence(payment_id,provider_reference,reconciled_at) VALUES(item.id,p_transaction->>'transaction_id',now()) ON CONFLICT(payment_id) DO UPDATE SET reconciled_at=excluded.reconciled_at;
  UPDATE public.user_progress SET first_deposit_at=coalesce(first_deposit_at,now()),updated_at=now() WHERE user_id=item.user_id;
 ELSIF incoming='REVERSED' THEN
  UPDATE public.deposit_receipts SET reversed_at=coalesce(reversed_at,now()) WHERE payment_id=item.id;
  DELETE FROM public.ops_payment_evidence WHERE payment_id=item.id;
 END IF;
 SELECT * INTO item FROM public.payment_attempts WHERE id=p_id;
 RETURN to_jsonb(item);
END $$;
REVOKE ALL ON FUNCTION public.prepare_mpesa_deposit(uuid,uuid,numeric,text),public.apply_mpesa_status(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_mpesa_deposit(uuid,uuid,numeric,text),public.apply_mpesa_status(uuid,jsonb) TO service_role;
GRANT SELECT ON public.ops_members TO service_role;
GRANT ALL ON public.payment_attempts,public.deposit_receipts,public.payment_status_events TO service_role;
COMMIT;
