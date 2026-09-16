-- Transparent practice credits are separate from wallets, payments and transactions.
BEGIN;
CREATE TABLE public.ops_members (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','reviewer','finance','support')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.practice_access (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  winning_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.practice_accounts (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('loss','win')),
  credits numeric(16,2) NOT NULL DEFAULT 10000 CHECK (credits >= 0),
  PRIMARY KEY(user_id,mode)
);
CREATE TABLE public.practice_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('loss','win')),
  symbol text NOT NULL CHECK (symbol IN ('EUR/USD','GBP/USD','XAU/USD')),
  side text NOT NULL CHECK (side IN ('BUY','SELL')),
  stake numeric(12,2) NOT NULL CHECK (stake BETWEEN 10 AND 1000),
  entry_price numeric(20,8) NOT NULL CHECK (entry_price > 0),
  exit_price numeric(20,8) NOT NULL CHECK (exit_price > 0),
  pnl numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
  opened_at timestamptz NOT NULL DEFAULT now(),
  settles_at timestamptz NOT NULL DEFAULT now() + interval '12 seconds',
  closed_at timestamptz
);
CREATE UNIQUE INDEX practice_one_open ON public.practice_orders(user_id, mode) WHERE status = 'OPEN';
CREATE INDEX practice_order_history ON public.practice_orders(user_id,mode,opened_at DESC);
CREATE TABLE public.ops_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('verification','payment','support','content')),
  subject_id uuid REFERENCES public.profiles(id),
  related_id uuid,
  title text NOT NULL CHECK (length(title) BETWEEN 3 AND 160),
  summary text NOT NULL DEFAULT '' CHECK (length(summary) <= 8000),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','approved','rejected','returned','resolved')),
  version integer NOT NULL DEFAULT 1,
  evidence_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ops_payment_evidence (
  payment_id uuid PRIMARY KEY REFERENCES public.payment_attempts(id),
  provider_reference text NOT NULL,
  reconciled_at timestamptz NOT NULL,
  -- Written only by a trusted provider reconciliation process, never by admin UI.
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ops_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_id uuid,
  reason text NOT NULL,
  before_data jsonb,
  after_data jsonb,
  request_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ops_cases_queue ON public.ops_cases(kind,status,created_at DESC);
CREATE INDEX ops_audit_date ON public.ops_audit(created_at DESC);

ALTER TABLE public.ops_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_payment_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ops_members, public.practice_access, public.practice_accounts, public.practice_orders,
 public.ops_cases, public.ops_payment_evidence, public.ops_audit FROM anon, authenticated;

CREATE FUNCTION public.ops_role() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT role FROM public.ops_members WHERE user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.ops_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ops_role() TO authenticated;

CREATE FUNCTION public.practice_api(p_action text, p_mode text, p_payload jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  uid uuid := auth.uid(); account public.practice_accounts; item public.practice_orders;
  stake numeric; entry numeric; direction numeric; result jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in to use practice markets' USING ERRCODE='42501'; END IF;
  IF p_mode IS NULL OR p_mode NOT IN ('loss','win') THEN RAISE EXCEPTION 'Invalid practice mode'; END IF;
  IF p_mode = 'win' AND NOT (coalesce(public.ops_role() = 'owner',false) OR EXISTS(SELECT 1 FROM public.practice_access WHERE user_id=uid AND winning_enabled))
    THEN RAISE EXCEPTION 'Winning practice mode requires an administrator invitation' USING ERRCODE='42501'; END IF;
  INSERT INTO public.practice_accounts(user_id,mode) VALUES(uid,p_mode) ON CONFLICT DO NOTHING;
  SELECT * INTO account FROM public.practice_accounts WHERE user_id=uid AND mode=p_mode FOR UPDATE;
  -- The account row serializes opening and closing, including concurrent tabs.
  IF p_action = 'open' THEN
    IF p_payload->>'side' IS NULL OR p_payload->>'side' NOT IN ('BUY','SELL') THEN RAISE EXCEPTION 'Choose BUY or SELL'; END IF;
    IF p_payload->>'symbol' IS NULL OR p_payload->>'symbol' NOT IN ('EUR/USD','GBP/USD','XAU/USD') THEN RAISE EXCEPTION 'Unknown practice instrument'; END IF;
    stake := (p_payload->>'stake')::numeric;
    IF stake IS NULL OR stake::text IN ('NaN','Infinity','-Infinity') OR stake < 10 OR stake > 1000 OR stake != round(stake,2) THEN RAISE EXCEPTION 'Use 10–1,000 virtual credits, with at most two decimals'; END IF;
    IF EXISTS(SELECT 1 FROM public.practice_orders WHERE user_id=uid AND mode=p_mode AND status='OPEN') THEN RAISE EXCEPTION 'Wait for your open practice order to settle'; END IF;
    IF account.credits < stake THEN RAISE EXCEPTION 'Not enough virtual credits'; END IF;
    SELECT exit_price INTO entry FROM public.practice_orders WHERE user_id=uid AND mode=p_mode AND symbol=p_payload->>'symbol' ORDER BY opened_at DESC LIMIT 1;
    entry := coalesce(entry, CASE p_payload->>'symbol' WHEN 'EUR/USD' THEN 1.1724 WHEN 'GBP/USD' THEN 1.3452 ELSE 3492.5 END);
    direction := (CASE WHEN p_payload->>'side'='BUY' THEN 1 ELSE -1 END) * (CASE WHEN p_mode='win' THEN 1 ELSE -1 END);
    INSERT INTO public.practice_orders(user_id,mode,symbol,side,stake,entry_price,exit_price,pnl)
    VALUES(uid,p_mode,p_payload->>'symbol',p_payload->>'side',stake,entry,entry*(1+direction*0.003),round(stake*0.1*(CASE WHEN p_mode='win' THEN 1 ELSE -1 END),2));
    UPDATE public.practice_accounts SET credits=credits-stake WHERE user_id=uid AND mode=p_mode;
  ELSIF p_action = 'settle' THEN
    SELECT * INTO item FROM public.practice_orders WHERE id=(p_payload->>'id')::uuid AND user_id=uid AND mode=p_mode FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Practice order not found'; END IF;
    IF item.status='OPEN' THEN
      IF now() < item.settles_at THEN RAISE EXCEPTION 'Practice order is still running'; END IF;
      UPDATE public.practice_orders SET status='CLOSED',closed_at=now() WHERE id=item.id;
      UPDATE public.practice_accounts SET credits=credits+item.stake+item.pnl WHERE user_id=uid AND mode=p_mode;
    END IF;
  ELSIF p_action = 'reset' THEN
    IF EXISTS(SELECT 1 FROM public.practice_orders WHERE user_id=uid AND mode=p_mode AND status='OPEN') THEN RAISE EXCEPTION 'Settle the open practice order before resetting credits'; END IF;
    UPDATE public.practice_accounts SET credits=10000 WHERE user_id=uid AND mode=p_mode;
  ELSIF p_action != 'state' OR p_action IS NULL THEN RAISE EXCEPTION 'Unknown practice action';
  END IF;
  IF p_action != 'state' THEN
    INSERT INTO public.ops_audit(actor_id,action,entity_id,reason,after_data)
      VALUES(uid,'practice.'||p_action,item.id,'Disclosed virtual-credit '||p_mode||' scenario',jsonb_build_object('mode',p_mode));
  END IF;
  SELECT jsonb_build_object('mode',p_mode,'credits',credits,'serverTime',now(),'orders',
    coalesce((SELECT jsonb_agg(to_jsonb(o) ORDER BY opened_at DESC) FROM
      (SELECT p.id,p.symbol,p.side,p.stake,p.entry_price,p.exit_price,p.pnl,p.status,p.opened_at,p.settles_at,p.closed_at FROM public.practice_orders p WHERE p.user_id=uid AND p.mode=p_mode ORDER BY p.opened_at DESC LIMIT 50) o),'[]'::jsonb))
  INTO result FROM public.practice_accounts WHERE user_id=uid AND mode=p_mode;
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.practice_api(text,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.practice_api(text,text,jsonb) TO authenticated;

CREATE FUNCTION public.ops_api(p_action text, p_payload jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  uid uuid := auth.uid(); role_name text := public.ops_role(); queue_kind text := p_payload->>'kind';
  search_text text := left(coalesce(p_payload->>'search',''),200); status_filter text := coalesce(p_payload->>'status','');
  page_no integer := greatest(1,least(10000,coalesce((p_payload->>'page')::integer,1))); rows_json jsonb; total bigint;
  item public.ops_cases; old_data jsonb; decision text := p_payload->>'decision'; reason text := trim(coalesce(p_payload->>'reason',''));
  target uuid; allowed boolean; since_date timestamptz := now() - interval '30 days';
BEGIN
  IF uid IS NULL OR role_name IS NULL THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
  IF p_action='session' THEN RETURN jsonb_build_object('role',role_name,'userId',uid); END IF;
  IF p_action='overview' THEN
    since_date := now() - make_interval(days => CASE WHEN p_payload->>'days'='7' THEN 7 WHEN p_payload->>'days'='90' THEN 90 ELSE 30 END);
    RETURN jsonb_build_object('updatedAt',now(),'since',since_date,
      'openCases',(SELECT count(*) FROM public.ops_cases WHERE status IN ('submitted','under_review','returned') AND (role_name='owner' OR kind=CASE role_name WHEN 'reviewer' THEN 'verification' WHEN 'finance' THEN 'payment' ELSE 'support' END OR (role_name='reviewer' AND kind='content'))),
      'users',(SELECT count(*) FROM public.profiles),
      'decisions',(SELECT count(*) FROM public.ops_audit WHERE action='case.decide' AND created_at>=since_date AND (role_name='owner' OR actor_id=uid)),
      'practiceOrders',CASE WHEN role_name='owner' THEN (SELECT count(*) FROM public.practice_orders WHERE opened_at>=since_date) ELSE NULL END,
      'queues',(SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb) FROM (SELECT kind,status,count(*) AS count FROM public.ops_cases WHERE role_name='owner' OR kind=CASE role_name WHEN 'reviewer' THEN 'verification' WHEN 'finance' THEN 'payment' ELSE 'support' END OR (role_name='reviewer' AND kind='content') GROUP BY kind,status) q));
  END IF;
  IF p_action='users' THEN
    SELECT count(*) INTO total FROM public.profiles p WHERE (p.full_name ILIKE '%'||search_text||'%' OR p.email ILIKE '%'||search_text||'%');
    SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) INTO rows_json FROM
      (SELECT p.id,p.full_name,p.email,p.country,p.kyc_status,p.created_at,coalesce(a.winning_enabled,false) AS winning_enabled FROM public.profiles p LEFT JOIN public.practice_access a ON a.user_id=p.id WHERE p.full_name ILIKE '%'||search_text||'%' OR p.email ILIKE '%'||search_text||'%' ORDER BY p.created_at DESC,p.id LIMIT 20 OFFSET (page_no-1)*20) r;
    RETURN jsonb_build_object('records',rows_json,'total',total,'page',page_no);
  END IF;
  IF p_action='grant_demo' THEN
    IF role_name!='owner' THEN RAISE EXCEPTION 'Owner role required' USING ERRCODE='42501'; END IF;
    IF length(reason)<5 THEN RAISE EXCEPTION 'Provide a reason of at least five characters'; END IF;
    target := (p_payload->>'userId')::uuid;
    PERFORM 1 FROM public.profiles WHERE id=target FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
    IF jsonb_typeof(p_payload->'enabled') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Enabled must be a boolean'; END IF;
    SELECT to_jsonb(a) INTO old_data FROM public.practice_access a WHERE user_id=target;
    INSERT INTO public.practice_access(user_id,winning_enabled) VALUES(target,(p_payload->>'enabled')::boolean)
      ON CONFLICT(user_id) DO UPDATE SET winning_enabled=excluded.winning_enabled,updated_at=now();
    INSERT INTO public.ops_audit(actor_id,action,entity_id,reason,before_data,after_data) VALUES(uid,'practice.access',target,reason,old_data,jsonb_build_object('winning_enabled',(p_payload->>'enabled')::boolean));
    RETURN jsonb_build_object('ok',true);
  END IF;
  IF p_action='payments' THEN
    IF role_name NOT IN ('owner','finance') THEN RAISE EXCEPTION 'Finance access required' USING ERRCODE='42501'; END IF;
    SELECT count(*) INTO total FROM public.payment_attempts p WHERE (status_filter='' OR p.status=status_filter) AND (p.reference ILIKE '%'||search_text||'%');
    SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) INTO rows_json FROM
      (SELECT p.id,p.user_id,p.provider,p.direction,p.amount,p.currency,p.reference,p.status,p.created_at,(e.payment_id IS NOT NULL) AS reconciled FROM public.payment_attempts p LEFT JOIN public.ops_payment_evidence e ON e.payment_id=p.id WHERE (status_filter='' OR p.status=status_filter) AND p.reference ILIKE '%'||search_text||'%' ORDER BY p.created_at DESC,p.id LIMIT 20 OFFSET (page_no-1)*20) r;
    RETURN jsonb_build_object('records',rows_json,'total',total,'page',page_no);
  END IF;
  IF p_action='audit' THEN
    SELECT count(*) INTO total FROM public.ops_audit a WHERE (role_name='owner' OR a.actor_id=uid) AND a.action ILIKE '%'||search_text||'%';
    SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) INTO rows_json FROM
      (SELECT * FROM public.ops_audit a WHERE (role_name='owner' OR a.actor_id=uid) AND a.action ILIKE '%'||search_text||'%' ORDER BY a.created_at DESC,a.id LIMIT 20 OFFSET (page_no-1)*20) r;
    RETURN jsonb_build_object('records',rows_json,'total',total,'page',page_no);
  END IF;
  IF p_action IN ('detail','decide') THEN
    SELECT * INTO item FROM public.ops_cases WHERE id=(p_payload->>'id')::uuid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Case not found'; END IF;
    queue_kind := item.kind;
  END IF;
  allowed := role_name='owner' OR (role_name='reviewer' AND queue_kind IN ('verification','content')) OR (role_name='finance' AND queue_kind='payment') OR (role_name='support' AND queue_kind='support');
  IF NOT coalesce(allowed,false) THEN RAISE EXCEPTION 'You do not have access to this queue' USING ERRCODE='42501'; END IF;
  IF p_action='cases' THEN
    SELECT count(*) INTO total FROM public.ops_cases c WHERE c.kind=queue_kind AND (status_filter='' OR c.status=status_filter) AND (c.title ILIKE '%'||search_text||'%');
    SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) INTO rows_json FROM
      (SELECT * FROM public.ops_cases c WHERE c.kind=queue_kind AND (status_filter='' OR c.status=status_filter) AND c.title ILIKE '%'||search_text||'%' ORDER BY c.created_at DESC,c.id LIMIT 20 OFFSET (page_no-1)*20) r;
    RETURN jsonb_build_object('records',rows_json,'total',total,'page',page_no);
  ELSIF p_action='detail' THEN
    RETURN jsonb_build_object('case',to_jsonb(item),'history',(SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY created_at DESC),'[]'::jsonb) FROM public.ops_audit a WHERE entity_id=item.id));
  ELSIF p_action='create_case' THEN
    IF length(trim(coalesce(p_payload->>'title','')))<3 THEN RAISE EXCEPTION 'Enter a case title'; END IF;
    target := nullif(p_payload->>'subjectId','')::uuid;
    IF queue_kind='verification' AND target IS NULL THEN RAISE EXCEPTION 'Verification requires an account'; END IF;
    IF queue_kind='payment' THEN
      PERFORM 1 FROM public.payment_attempts WHERE id=nullif(p_payload->>'relatedId','')::uuid;
      IF NOT FOUND THEN RAISE EXCEPTION 'Select an existing payment record'; END IF;
    END IF;
    IF nullif(p_payload->>'evidencePath','') IS NOT NULL AND
      (split_part(p_payload->>'evidencePath','/',1) != uid::text OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='ops-evidence' AND name=p_payload->>'evidencePath')) THEN
      RAISE EXCEPTION 'Attach a document uploaded by your administrator account';
    END IF;
    INSERT INTO public.ops_cases(kind,subject_id,related_id,title,summary,evidence_path)
      VALUES(queue_kind,target,nullif(p_payload->>'relatedId','')::uuid,trim(p_payload->>'title'),coalesce(p_payload->>'summary',''),nullif(p_payload->>'evidencePath','')) RETURNING * INTO item;
    INSERT INTO public.ops_audit(actor_id,action,entity_id,reason,after_data) VALUES(uid,'case.create',item.id,'Opened for review',to_jsonb(item));
    RETURN to_jsonb(item);
  ELSIF p_action='decide' THEN
    IF (p_payload->>'version')::integer IS DISTINCT FROM item.version THEN RAISE EXCEPTION 'This case changed. Refresh before making a decision' USING ERRCODE='40001'; END IF;
    IF item.status NOT IN ('submitted','under_review','returned') THEN RAISE EXCEPTION 'This case has already been decided' USING ERRCODE='40001'; END IF;
    IF length(reason)<5 OR length(reason)>2000 THEN RAISE EXCEPTION 'Provide a decision reason between 5 and 2,000 characters'; END IF;
    IF decision IS NULL OR decision NOT IN ('under_review','approved','rejected','returned','resolved') OR decision=item.status THEN RAISE EXCEPTION 'Invalid decision'; END IF;
    IF (queue_kind='support' AND decision IN ('approved','rejected')) OR (queue_kind!='support' AND decision='resolved') THEN RAISE EXCEPTION 'Invalid decision for this queue'; END IF;
    IF queue_kind='payment' AND decision='approved' AND NOT EXISTS(SELECT 1 FROM public.ops_payment_evidence WHERE payment_id=item.related_id) THEN RAISE EXCEPTION 'Provider reconciliation evidence is required. This console cannot mark money as paid'; END IF;
    IF queue_kind='verification' AND decision='approved' AND (item.evidence_path IS NULL OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='ops-evidence' AND name=item.evidence_path)) THEN RAISE EXCEPTION 'Private verification evidence is required'; END IF;
    old_data := to_jsonb(item);
    UPDATE public.ops_cases SET status=decision,version=version+1,updated_at=now() WHERE id=item.id RETURNING * INTO item;
    IF queue_kind='verification' AND decision IN ('approved','rejected','returned') THEN
      UPDATE public.profiles SET kyc_status=CASE decision WHEN 'approved' THEN 'APPROVED' WHEN 'rejected' THEN 'REJECTED' ELSE 'REQUIRES_REVIEW' END,updated_at=now() WHERE id=item.subject_id;
    END IF;
    INSERT INTO public.ops_audit(actor_id,action,entity_id,reason,before_data,after_data) VALUES(uid,'case.decide',item.id,reason,old_data,to_jsonb(item));
    RETURN to_jsonb(item);
  END IF;
  RAISE EXCEPTION 'Unknown operations action';
END; $$;
REVOKE ALL ON FUNCTION public.ops_api(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ops_api(text,jsonb) TO authenticated;

-- Never allow profile owners to self-approve KYC through the existing UPDATE policy.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name,phone,country) ON public.profiles TO authenticated;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('ops-evidence','ops-evidence',false,10485760,ARRAY['application/pdf','image/jpeg','image/png','image/webp']) ON CONFLICT(id) DO NOTHING;
-- An authorized evidence lookup avoids exposing the cases table through direct SELECT grants.
CREATE FUNCTION public.ops_evidence_allowed(path text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.ops_role()='owner' OR EXISTS(SELECT 1 FROM public.ops_cases c WHERE c.evidence_path=path AND
 ((public.ops_role()='reviewer' AND c.kind IN ('verification','content')) OR (public.ops_role()='finance' AND c.kind='payment') OR (public.ops_role()='support' AND c.kind='support')));
$$;
REVOKE ALL ON FUNCTION public.ops_evidence_allowed(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ops_evidence_allowed(text) TO authenticated;
CREATE POLICY "Operations evidence read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='ops-evidence' AND public.ops_evidence_allowed(name));
CREATE POLICY "Operations evidence upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='ops-evidence' AND public.ops_role() IS NOT NULL AND (storage.foldername(name))[1]=auth.uid()::text);
COMMIT;
