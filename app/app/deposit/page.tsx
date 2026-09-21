"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, Copy, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react';
import { Link } from '@/components/router-link';
import { MpesaMark } from '@/components/brand/payment-icons';
import { useAuth } from '@/lib/auth/store';
import { supabase } from '@/lib/supabase';
import { paymentRequest } from '@/lib/payments/api';
import { normalizePhone, paymentLabel, pendingPayment, validateAmount, type Payment } from '@/lib/payments/payment';

export default function DepositPage() {
  const { user } = useAuth();
  const [amount,setAmount] = useState('');
  const [phone,setPhone] = useState('');
  const [consent,setConsent] = useState(false);
  const [payments,setPayments] = useState<Payment[]>([]);
  const [selected,setSelected] = useState<string | null>(null);
  const [enabled,setEnabled] = useState(false);
  const [purpose,setPurpose] = useState('');
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [warning,setWarning] = useState('');
  const [copied,setCopied] = useState(false);
  const [now,setNow] = useState(Date.now());
  const requestKey = useRef<string | null>(null);
  const mounted = useRef(true);
  const submitting = useRef(false);
  const checking = useRef(false);
  const active = payments.find(p => p.id === selected) || payments.find(p => pendingPayment(p.status)) || payments[0];
  const unresolved = payments.some(p => pendingPayment(p.status));
  const elapsed = active ? Math.max(0,Math.floor((now-Date.parse(active.created_at))/1000)) : 0;
  const merge = useCallback((payment: Payment) => setPayments(previous => [payment,...previous.filter(p=>p.id!==payment.id)].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at))),[]);
  const load = useCallback(async () => {
    try {
      const result = await paymentRequest({ action:'history' });
      if (!mounted.current) return;
      const key = user ? `derivix-deposit-request:${user.id}` : null;
      const saved = key ? sessionStorage.getItem(key) : null;
      if (saved && result.payments?.some(payment => payment.client_request_id === saved)) { sessionStorage.removeItem(key!); requestKey.current = null; }
      setPayments(result.payments || []);setEnabled(!!result.enabled);setPurpose(result.purpose || '');setError('');
    } catch(err) { if(mounted.current)setError(err instanceof Error ? err.message : 'Unable to load payment history.'); }
    finally { if(mounted.current)setLoading(false); }
  },[user?.id]);
  useEffect(()=>{mounted.current=true;void load();return()=>{mounted.current=false;};},[load,user?.id]);
  useEffect(()=>{
    if (!supabase || !user?.id || phone) return;
    let active = true;
    void supabase.from('profiles').select('phone').eq('id',user.id).maybeSingle().then(({data})=>{
      if (active && data?.phone) setPhone(String(data.phone));
    });
    return ()=>{active=false;};
  },[user?.id,phone]);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  const refresh = useCallback(async (id: string) => {
    if(checking.current)return;checking.current=true;
    try { const result=await paymentRequest({ action:'status',id });if(mounted.current){if(result.payment)merge(result.payment);setWarning(result.warning || '');setError('');} }
    catch(err){if(mounted.current)setWarning(err instanceof Error ? err.message : 'Status unavailable. Your payment remains tracked.');}
    finally {checking.current=false;}
  },[merge]);
  const pendingId=payments.find(p=>pendingPayment(p.status))?.id;
  useEffect(()=>{
    if(!pendingId)return;
    void refresh(pendingId);
    const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh(pendingId);},15000);
    const visible=()=>{if(document.visibilityState==='visible')void refresh(pendingId);};
    document.addEventListener('visibilitychange',visible);
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
  },[pendingId,refresh]);
  async function start(event: React.FormEvent) {
    event.preventDefault();if(submitting.current)return;
    setError('');setWarning('');
    try {
      const value=validateAmount(Number(amount));const mobile=normalizePhone(phone);
      if(!consent)throw new Error('Confirm that you authorize this M-Pesa request.');
      submitting.current=true;setBusy(true);
      // Keep the key across uncertain network retries and page refreshes for this account.
      const storageKey=`derivix-deposit-request:${user!.id}`;
      requestKey.current=requestKey.current || sessionStorage.getItem(storageKey) || crypto.randomUUID();
      sessionStorage.setItem(storageKey,requestKey.current);
      const result=await paymentRequest({action:'create',amount:value,phone:mobile,requestId:requestKey.current,consent});
      if(mounted.current&&result.payment){merge(result.payment);setSelected(result.payment.id);setWarning(result.warning || '');sessionStorage.removeItem(storageKey);requestKey.current=null;}
    } catch(err){if(mounted.current){await load();setError(err instanceof Error?err.message:'Payment could not be started.');}}
    finally {submitting.current=false;if(mounted.current)setBusy(false);}
  }
  const card='rounded-3xl border border-brand-line bg-white p-6 sm:p-8';
  return <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
    <Link href="/app" className="text-sm font-semibold text-brand-muted"><ArrowLeft className="mr-2 inline h-4 w-4"/>Back to dashboard</Link>
    <div className="mb-8 mt-9"><p className="text-xs font-bold uppercase tracking-[.16em] text-brand-limeDeep">M-Pesa · Palpluss</p><h1 className="mt-3 text-3xl font-bold tracking-tight">Deposit payments</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-brand-muted">Every request has a unique TUID linked to your account. Track its progress here, even after refreshing or returning later.</p></div>
    {error&&<p role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm">{error}</p>}
    {!loading&&!enabled&&<p className="mb-5 rounded-xl border border-brand-line bg-brand-lime/10 p-4 text-sm">M-Pesa collection is not enabled yet. Your existing payment history remains available.</p>}
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <section className={card}><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">New payment</h2><MpesaMark/></div>
        <p className="mt-4 text-sm leading-6 text-brand-muted">{purpose || 'The payment purpose will appear here when collection is configured.'} Real payments do not fund or change virtual live credits.</p>
        <form onSubmit={start} className="mt-6 space-y-5"><fieldset disabled={loading||busy||!enabled||unresolved} className="space-y-5 disabled:opacity-60">
          <label className="block text-sm font-semibold">Amount (KES)<input aria-label="Amount (KES)" aria-describedby="deposit-amount-help" required type="number" min="100" max="150000" step="1" value={amount} onChange={e=>setAmount(e.target.value)} className="mt-2 block w-full rounded-xl border border-brand-line bg-transparent px-4 py-3 text-lg"/><span id="deposit-amount-help" className="mt-2 block text-xs font-normal text-brand-muted">KES 100–150,000 · Whole shillings</span></label>
          <label className="block text-sm font-semibold">M-Pesa phone number<input required type="tel" autoComplete="tel" placeholder="0712 345 678" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-2 block w-full rounded-xl border border-brand-line bg-transparent px-4 py-3"/></label>
          <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1.5 accent-[#83b92d]"/><span>I authorize an M-Pesa payment request for this amount to this phone number.</span></label>
          <button disabled={!consent} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-lime px-5 py-3.5 text-sm font-bold text-[#24300f] disabled:opacity-50"><Smartphone size={17}/>{busy?'Sending request…':'Send M-Pesa prompt'}</button>
        </fieldset></form>
        {unresolved&&<p className="mt-4 text-sm text-brand-muted">A payment is awaiting confirmation. Resolve that request before starting another.</p>}
        <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-brand-muted"><ShieldCheck size={16} className="shrink-0"/>Enter your PIN only in the M-Pesa prompt on your phone. We never ask for it here.</p>
      </section>
      <section className={card}><h2 className="text-xl font-semibold">Payment progress</h2>{active?<>
        <div className="mt-6 flex items-center gap-3">{active.status==='COMPLETED'?<CheckCircle2 className="text-brand-limeDeep"/>:<Clock3 className="text-brand-muted"/>}<p role="status" className="font-semibold">{paymentLabel(active.status,elapsed)}</p></div>
        <p className="mt-4 text-3xl font-semibold">KES {Number(active.amount).toLocaleString()}</p><p className="mt-2 text-sm text-brand-muted">{active.phone} · {new Date(active.created_at).toLocaleString()}</p>
        <div className="mt-5 rounded-xl border border-brand-line bg-brand-canvas p-4"><span className="text-xs font-bold uppercase text-brand-muted">Transaction unique ID (TUID)</span><p className="mt-2 break-all text-sm font-medium">{active.reference}</p><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(active.reference);setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{setWarning('Copy the TUID displayed above.');}}} className="mt-3 flex items-center gap-2 text-xs font-semibold text-brand-limeDeep"><Copy size={14}/>{copied?'Copied':'Copy TUID'}</button></div>
        <ol className="mt-5 space-y-3 text-sm"><li>1. Request created and linked to your account</li><li className={active.provider_reference?'':'text-brand-muted'}>2. {active.provider_reference?'Provider request received':'Waiting for provider acknowledgement'}</li><li className={active.status==='COMPLETED'?'text-brand-limeDeep':'text-brand-muted'}>3. {active.status==='COMPLETED'?'Receipt confirmed by Palpluss':'Provider confirmation'}</li></ol>
        {pendingPayment(active.status)&&<p className="mt-5 text-xs leading-5 text-brand-muted">Elapsed {Math.floor(elapsed/60)}m {elapsed%60}s. {elapsed>120?'Confirmation is taking longer than usual. Keep your TUID and do not pay again.':'Approve the prompt when it arrives. Status checks run automatically.'}</p>}
        {active.failure_reason&&<p className="mt-4 text-sm">{active.failure_reason}</p>}
        {active.status==='COMPLETED'&&<p className="mt-4 text-sm text-brand-muted">Your payment receipt is recorded against your account. Virtual live balances are unchanged.</p>}
        {warning&&<p role="status" className="mt-4 rounded-xl bg-brand-lime/10 p-3 text-sm">{warning}</p>}
        <button type="button" onClick={()=>void refresh(active.id)} className="mt-5 flex items-center gap-2 text-sm font-semibold text-brand-limeDeep"><RefreshCw size={15}/>Check latest status</button>
      </>:<p className="mt-6 text-sm text-brand-muted">{loading?'Loading your payment history…':'Your TUID and payment status will appear here.'}</p>}</section>
    </div>
    <section className={`${card} mt-6`}><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">Recent payments</h2><button onClick={()=>void load()} className="text-sm font-semibold text-brand-limeDeep">Refresh</button></div><div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-brand-muted"><tr><th className="pb-3">TUID / date</th><th className="pb-3">Amount</th><th className="pb-3">Status</th></tr></thead><tbody>{payments.map(payment=><tr key={payment.id} className="border-t border-brand-line"><td className="py-4 pr-4"><button onClick={()=>setSelected(payment.id)} className="max-w-[270px] break-all text-left text-xs font-semibold text-brand-limeDeep">{payment.reference}</button><p className="mt-1 text-xs text-brand-muted">{new Date(payment.created_at).toLocaleString()}</p></td><td className="whitespace-nowrap py-4 pr-4">KES {Number(payment.amount).toLocaleString()}</td><td className="py-4 text-xs">{payment.status}</td></tr>)}</tbody></table>{!payments.length&&<p className="py-5 text-sm text-brand-muted">{loading?'Loading…':'No payment requests yet.'}</p>}</div></section>
  </main>;
}
