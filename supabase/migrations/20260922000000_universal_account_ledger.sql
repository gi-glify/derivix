-- Universal account ledger and reservations.
-- Additive migration: existing wallets, practice records and payment receipts remain intact.
BEGIN;

CREATE TABLE IF NOT EXISTS public.account_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'KES',
  balance numeric(20,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  reserved_balance numeric(20,2) NOT NULL DEFAULT 0 CHECK (reserved_balance >= 0 AND reserved_balance <= balance),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.account_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(20,2) NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  entry_type text NOT NULL CHECK (entry_type IN ('DEMO_CREDIT','DEPOSIT','STAKE_RESERVE','STAKE_RELEASE','TRADE_PROFIT','TRADE_LOSS','FEE','WITHDRAWAL','REFUND','REVERSAL')),
  mode text NOT NULL DEFAULT 'demo' CHECK (mode IN ('demo','real')),
  idempotency_key uuid NOT NULL,
  reference_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.account_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(20,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'KES',
  mode text NOT NULL DEFAULT 'demo' CHECK (mode IN ('demo','real')),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','RELEASED','SETTLED','CANCELLED')),
  idempotency_key uuid NOT NULL,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS account_ledger_user_created ON public.account_ledger_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS account_reservations_user_status ON public.account_reservations(user_id, status, created_at DESC);

ALTER TABLE public.account_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_wallets, public.account_ledger_entries, public.account_reservations FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.account_api(p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid := auth.uid();
  wallet public.account_wallets;
  reservation public.account_reservations;
  existing jsonb;
  amount numeric := (p_payload->>'amount')::numeric;
  key uuid := (p_payload->>'idempotencyKey')::uuid;
  reason text := left(trim(coalesce(p_payload->>'reason','')), 500);
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  INSERT INTO public.account_wallets(user_id) VALUES(uid) ON CONFLICT(user_id) DO NOTHING;

  IF p_action = 'summary' THEN
    SELECT * INTO wallet FROM public.account_wallets WHERE user_id=uid;
    RETURN jsonb_build_object('summary', jsonb_build_object(
      'total', wallet.balance, 'reserved', wallet.reserved_balance,
      'available', wallet.balance-wallet.reserved_balance,
      'currency', wallet.currency, 'mode', 'demo'));
  END IF;

  IF p_action = 'ledger' THEN
    RETURN jsonb_build_object('entries', coalesce((SELECT jsonb_agg(to_jsonb(item) ORDER BY item.created_at DESC)
      FROM (SELECT * FROM public.account_ledger_entries WHERE user_id=uid ORDER BY created_at DESC LIMIT 100) item),'[]'::jsonb));
  END IF;

  IF p_action = 'reservations' THEN
    RETURN jsonb_build_object('reservations', coalesce((SELECT jsonb_agg(to_jsonb(item) ORDER BY item.created_at DESC)
      FROM (SELECT * FROM public.account_reservations WHERE user_id=uid ORDER BY created_at DESC LIMIT 100) item),'[]'::jsonb));
  END IF;

  IF p_action = 'grant_demo_credit' THEN
    IF amount IS NULL OR amount <= 0 OR amount > 1000000 OR reason = '' OR key IS NULL THEN
      RAISE EXCEPTION 'A positive amount, reason and idempotency key are required';
    END IF;
    SELECT to_jsonb(item) INTO existing FROM public.account_ledger_entries item WHERE item.user_id=uid AND item.idempotency_key=key;
    IF existing IS NOT NULL THEN RETURN jsonb_build_object('entry', existing); END IF;
    SELECT * INTO wallet FROM public.account_wallets WHERE user_id=uid FOR UPDATE;
    UPDATE public.account_wallets SET balance=balance+amount, updated_at=now() WHERE user_id=uid;
    INSERT INTO public.account_ledger_entries(user_id,amount,entry_type,mode,idempotency_key,metadata)
      VALUES(uid,amount,'DEMO_CREDIT','demo',key,jsonb_build_object('reason',reason)) RETURNING to_jsonb(account_ledger_entries.*) INTO existing;
    RETURN jsonb_build_object('entry', existing);
  END IF;

  IF p_action = 'reserve' THEN
    IF amount IS NULL OR amount <= 0 OR key IS NULL THEN RAISE EXCEPTION 'A positive amount and idempotency key are required'; END IF;
    SELECT to_jsonb(item) INTO existing FROM public.account_reservations item WHERE item.user_id=uid AND item.idempotency_key=key;
    IF existing IS NOT NULL THEN RETURN jsonb_build_object('reservation', existing); END IF;
    SELECT * INTO wallet FROM public.account_wallets WHERE user_id=uid FOR UPDATE;
    IF wallet.balance-wallet.reserved_balance < amount THEN RAISE EXCEPTION 'Insufficient available balance'; END IF;
    INSERT INTO public.account_reservations(user_id,amount,mode,idempotency_key,reference_id)
      VALUES(uid,amount,coalesce(nullif(p_payload->>'mode',''),'demo'),key,nullif(p_payload->>'referenceId','')::uuid) RETURNING * INTO reservation;
    UPDATE public.account_wallets SET reserved_balance=reserved_balance+amount, updated_at=now() WHERE user_id=uid;
    INSERT INTO public.account_ledger_entries(user_id,amount,entry_type,mode,idempotency_key,reference_id,metadata)
      VALUES(uid,0,'STAKE_RESERVE',reservation.mode,key,reservation.reference_id,jsonb_build_object('reservation_id',reservation.id));
    RETURN jsonb_build_object('reservation',to_jsonb(reservation));
  END IF;

  IF p_action = 'release' THEN
    IF key IS NULL THEN RAISE EXCEPTION 'An idempotency key is required'; END IF;
    SELECT * INTO reservation FROM public.account_reservations WHERE id=nullif(p_payload->>'reservationId','')::uuid AND user_id=uid FOR UPDATE;
    IF reservation.id IS NULL THEN RAISE EXCEPTION 'Reservation not found'; END IF;
    IF reservation.status IN ('RELEASED','SETTLED','CANCELLED') THEN RETURN jsonb_build_object('reservation',to_jsonb(reservation)); END IF;
    SELECT * INTO wallet FROM public.account_wallets WHERE user_id=uid FOR UPDATE;
    UPDATE public.account_wallets SET reserved_balance=reserved_balance-reservation.amount, updated_at=now() WHERE user_id=uid;
    UPDATE public.account_reservations SET status=coalesce(nullif(p_payload->>'status',''),'RELEASED'),closed_at=now() WHERE id=reservation.id;
    INSERT INTO public.account_ledger_entries(user_id,amount,entry_type,mode,idempotency_key,reference_id,metadata)
      VALUES(uid,0,'STAKE_RELEASE',reservation.mode,key,reservation.reference_id,jsonb_build_object('reservation_id',reservation.id));
    SELECT * INTO reservation FROM public.account_reservations WHERE id=reservation.id;
    RETURN jsonb_build_object('reservation',to_jsonb(reservation));
  END IF;

  RAISE EXCEPTION 'Unknown account action';
END;
$$;

REVOKE ALL ON FUNCTION public.account_api(text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.account_api(text,jsonb) TO authenticated;

COMMIT;
