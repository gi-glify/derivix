BEGIN;

-- Keep the settlement engine private; all customer calls pass assignment checks.
ALTER FUNCTION public.practice_api(text,text,jsonb) RENAME TO practice_engine;
REVOKE ALL ON FUNCTION public.practice_engine(text,text,jsonb) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.practice_api(p_action text, p_mode text, p_payload jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  uid uuid := auth.uid();
  assigned_mode text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in to use practice markets' USING ERRCODE='42501'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text, 0));
  SELECT CASE WHEN coalesce((SELECT winning_enabled FROM public.practice_access WHERE user_id=uid),false)
    THEN 'win' ELSE 'loss' END INTO assigned_mode;
  IF p_mode IS NOT NULL AND p_mode IS DISTINCT FROM assigned_mode THEN
    RAISE EXCEPTION 'Your administrator assigned a different practice scenario. Refresh to continue.' USING ERRCODE='42501';
  END IF;
  -- Mutations must acknowledge the disclosed scenario shown to the user.
  IF p_action IS DISTINCT FROM 'state' AND p_mode IS NULL THEN
    RAISE EXCEPTION 'Refresh your assigned practice scenario before continuing' USING ERRCODE='42501';
  END IF;
  RETURN public.practice_engine(p_action,assigned_mode,p_payload);
END; $$;
REVOKE ALL ON FUNCTION public.practice_api(text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.practice_api(text,text,jsonb) TO authenticated;

CREATE FUNCTION public.guard_practice_assignment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(NEW.user_id::text, 0));
  IF (TG_OP='INSERT' AND NEW.winning_enabled) OR
     (TG_OP='UPDATE' AND OLD.winning_enabled IS DISTINCT FROM NEW.winning_enabled) THEN
    IF EXISTS (SELECT 1 FROM public.practice_orders WHERE user_id=NEW.user_id AND status='OPEN') THEN
      RAISE EXCEPTION 'Settle all open practice orders before changing the assigned scenario';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_practice_assignment() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER practice_assignment_guard BEFORE INSERT OR UPDATE ON public.practice_access
FOR EACH ROW EXECUTE FUNCTION public.guard_practice_assignment();

-- Deploy after existing orders settle; never strand orders in an old scenario.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.practice_orders WHERE status='OPEN') THEN
    RAISE EXCEPTION 'Settle existing practice orders before applying scenario assignment';
  END IF;
END; $$;

COMMIT;
