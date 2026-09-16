import { db, reconcile, uuid } from '../_shared/palpluss.ts';
Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed',{ status:405 });
  try {
    if (Number(req.headers.get('content-length') || 0)>16384) return new Response('Too large',{ status:413 });
    const text = await req.text();
    if (text.length>16384) return new Response('Too large',{ status:413 });
    const payload = JSON.parse(text);
    const transaction = payload.transaction;
    if (!transaction || !uuid.test(transaction.id || '') || typeof transaction.external_reference !== 'string') return new Response('Invalid event',{ status:400 });
    const { data:item,error } = await db().from('payment_attempts').select('id').eq('reference',transaction.external_reference).not('client_request_id','is',null).maybeSingle();
    if (error) throw error;
    if (item) await reconcile(item.id,transaction.id);
    return new Response('Accepted',{ status:200 });
  } catch {
    // Non-2xx lets the provider retry. Never log API keys or full phone/callback payloads.
    return new Response('Reconciliation unavailable',{ status:503 });
  }
});
