import { db, fields, provider, ProviderError, reconcile, uuid } from '../_shared/palpluss.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const allowed = (Deno.env.get('APP_ORIGINS') || '').split(',').map(v => v.trim()).filter(Boolean);
  const headers: Record<string,string> = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowed.includes(origin)) return reply({ error: 'This site is not allowed to request payments.' },403);
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers });
  if (req.method !== 'POST') return reply({ error:'Method not allowed' },405);
  try {
    const client = db();
    const token = req.headers.get('authorization')?.replace(/^Bearer /i,'');
    if (!token) return reply({ error:'Please sign in.' },401);
    const { data:{ user },error:authError } = await client.auth.getUser(token);
    if (authError || !user) return reply({ error:'Please sign in again.' },401);
    const body = await req.json();
    const enabled = Deno.env.get('PALPLUSS_COLLECTION_ENABLED') === 'true' && !!Deno.env.get('PALPLUSS_API_KEY') && !!Deno.env.get('PALPLUSS_DEPOSIT_PURPOSE');
    if (body.action === 'history') {
      const { data, error } = await client.from('payment_attempts').select(fields).eq('user_id',user.id).not('client_request_id','is',null).order('created_at',{ ascending:false }).limit(20);
      if (error) throw error;
      return reply({ payments:data, enabled, purpose: Deno.env.get('PALPLUSS_DEPOSIT_PURPOSE') || null });
    }
    if (body.action === 'reconcile') {
      const { data:member } = await client.from('ops_members').select('role').eq('user_id',user.id).maybeSingle();
      if (!member || !['owner','finance'].includes(member.role)) return reply({error:'Finance access required.'},403);
      if (!uuid.test(body.id || '') || !uuid.test(body.providerId || '')) return reply({error:'Enter valid payment and provider transaction IDs.'},400);
      await reconcile(body.id,body.providerId);
      const { data,error } = await client.from('payment_attempts').select(fields).eq('id',body.id).single();
      if (error) throw error;
      return reply({payment:data});
    }
    if (body.action === 'status') {
      if (!uuid.test(body.id || '')) return reply({ error:'Invalid payment ID.' },400);
      const { data:item } = await client.from('payment_attempts').select('id').eq('id',body.id).eq('user_id',user.id).not('client_request_id','is',null).maybeSingle();
      if (!item) return reply({ error:'Payment not found.' },404);
      let warning: string | undefined;
      try { await reconcile(item.id); } catch { warning = 'Provider status is temporarily unavailable. Your existing payment is still tracked; do not pay again.'; }
      const { data, error } = await client.from('payment_attempts').select(fields).eq('id',item.id).single();
      if (error) throw error;
      return reply({ payment:data, warning });
    }
    if (body.action !== 'create') return reply({ error:'Unknown action.' },400);
    if (!enabled) return reply({ error:'M-Pesa collection is not enabled yet.' },503);
    const amount = body.amount;
    let phone = String(body.phone || '').replace(/[\s()+-]/g,'');
    if (/^0[17]\d{8}$/.test(phone)) phone = `254${phone.slice(1)}`;
    if (!uuid.test(body.requestId || '') || !Number.isSafeInteger(amount) || amount<100 || amount>150000 || !/^254[17]\d{8}$/.test(phone) || body.consent !== true) return reply({ error:'Confirm consent, a valid Kenyan mobile number and a whole amount between KES 100 and 150,000.' },400);
    const { data:item,error:prepareError } = await client.rpc('prepare_mpesa_deposit',{ p_user:user.id,p_key:body.requestId,p_amount:amount,p_phone:phone });
    if (prepareError) return reply({ error:prepareError.message },409);
    const { data:claim,error:claimError } = await client.from('payment_attempts').update({ submitted_at:new Date().toISOString() }).eq('id',item.id).is('submitted_at',null).eq('status','PENDING').select('id').maybeSingle();
    if (claimError) throw claimError;
    let warning: string | undefined;
    if (claim) {
      try {
        const result = await provider('/payments/stk',{
          amount,phone,accountReference:item.reference,
          transactionDesc: Deno.env.get('PALPLUSS_DEPOSIT_PURPOSE')!.slice(0,255),
          callbackUrl:`${Deno.env.get('SUPABASE_URL')}/functions/v1/palpluss-webhook`,
          ...(Deno.env.get('PALPLUSS_CHANNEL_ID') ? { channelId:Deno.env.get('PALPLUSS_CHANNEL_ID') } : {}),
        });
        if (!uuid.test(result.transactionId || '')) throw new Error('Missing provider transaction ID');
        // A callback may already have settled this record. Never overwrite a terminal result.
        const { error:linkError } = await client.from('payment_attempts').update({ provider_reference:result.transactionId,status:'PROCESSING',updated_at:new Date().toISOString() }).eq('id',item.id).in('status',['PENDING','PROCESSING']);
        if (linkError) throw linkError;
      } catch (error) {
        if (error instanceof ProviderError && [400,401,403,404,422].includes(error.status)) {
          const { error:failedError } = await client.from('payment_attempts').update({status:'FAILED',failure_reason:'The provider declined this request before a payment could be started. Check the details or contact support.',updated_at:new Date().toISOString()}).eq('id',item.id).eq('status','PENDING');
          if (failedError) throw failedError;
        } else warning = 'The provider response is unconfirmed. Keep this TUID; do not start another payment. We will reconcile the existing request.';
      }
    }
    const { data,error } = await client.from('payment_attempts').select(fields).eq('id',item.id).single();
    if (error) throw error;
    return reply({ payment:data,warning });
  } catch {
    return reply({ error:'Payment service is temporarily unavailable. Check payment history before trying again.' },503);
  }
});
