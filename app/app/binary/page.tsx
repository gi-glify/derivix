"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ChevronDown, Grid2X2, RefreshCw, Activity, Wallet, Radio } from 'lucide-react';
import { Link } from '@/components/router-link';
import { useAuth } from '@/lib/auth/store';
import { advanceBinaryTicks, binaryRequest, loadBinarySnapshot } from '@/lib/binary/api';
import { digitFrequencies, displayQuote } from '@/lib/binary/snapshot';
import { binaryCandles, binaryChartPoints } from '@/lib/binary/candles';
import { InteractiveCandlestickChart } from '@/components/charts/interactive-candlestick';
import type { BinaryContractType } from '@/lib/binary/rules';
import type { BinaryState } from '@/lib/binary/types';
import './binary.css';

const families = [
  { label: 'Even / Odd', types: ['EVEN', 'ODD'], names: ['Even', 'Odd'] },
  { label: 'Over / Under', types: ['OVER', 'UNDER'], names: ['Over', 'Under'] },
  { label: 'Matches / Differs', types: ['MATCHES', 'DIFFERS'], names: ['Matches', 'Differs'] },
] as const;

export default function BinaryPage() {
  const { user } = useAuth();
  return <BinaryWorkspace key={user?.id ?? 'signed-out'} />;
}

function BinaryWorkspace() {
  const [state, setState] = useState<BinaryState | null>(null);
  const [symbol, setSymbol] = useState('');
  const [family, setFamily] = useState(0);
  const [prediction, setPrediction] = useState(4);
  const [stake, setStake] = useState('');
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [now, setNow] = useState(Date.now());
  const mounted = useRef(false);
  const reading = useRef<Promise<boolean> | null>(null);
  const mutation = useRef(false);
  const settling = useRef(false);
  const latestState = useRef<BinaryState | null>(null);
  const pending = useRef<Record<string, unknown> | null>(null);
  const [uncertain, setUncertain] = useState(false);

  const refresh = useCallback((): Promise<boolean> => {
    if (reading.current) return reading.current;
    reading.current = (async () => {
      try {
        const snapshot = await loadBinarySnapshot();
        if (mounted.current) {
          latestState.current = snapshot;
          setState(snapshot);
          setSymbol(current => snapshot.indices.some(index => index.symbol === current) ? current : snapshot.indices[0]?.symbol ?? '');
          setError('');
        }
        return true;
      } catch (failure) {
        if (mounted.current) setError(failure instanceof Error ? failure.message : 'Unable to load Binary Demo.');
        return false;
      } finally { reading.current = null; if (mounted.current) setLoading(false); }
    })();
    return reading.current;
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    const pulse = async () => {
      if (document.visibilityState !== 'visible' || mutation.current) return;
      try {
        await advanceBinaryTicks();
        await refresh();
        const expired = latestState.current?.contracts.filter(contract => contract.status === 'OPEN' && Date.parse(contract.settles_at) <= Date.now()) ?? [];
        if (expired.length && !settling.current) {
          settling.current = true;
          try { await Promise.all(expired.map(contract => binaryRequest('settle', { id: contract.id }))); } finally { settling.current = false; await refresh(); }
        }
      } catch (failure) { if (mounted.current) setError(failure instanceof Error ? failure.message : 'Unable to update the simulated market.'); }
    };
    const poll = window.setInterval(() => void pulse(), 1000);
    void pulse();
    const resume = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', resume);
    return () => { mounted.current = false; clearInterval(clock); clearInterval(poll); document.removeEventListener('visibilitychange', resume); };
  }, [refresh]);

  const shownSymbol = symbol;
  const active = state?.contracts.find(contract => contract.status === 'OPEN' && contract.symbol === shownSymbol);
  const index = state?.indices.find(item => item.symbol === shownSymbol);
  const history = state?.ticks[shownSymbol] ?? [];
  const latest = history.at(-1);
  const recent = state?.contracts.find(contract => contract.symbol === shownSymbol);
  const settled = state?.contracts.find(contract => contract.symbol === shownSymbol && contract.status !== 'OPEN');
  const value = latest?.value ?? recent?.final_value ?? recent?.opening_value ?? index?.base_price ?? null;
  const quote = displayQuote(value, index?.precision ?? 2);
  const finalDigit = latest?.digit ?? settled?.final_digit ?? null;
  const frequencies = digitFrequencies(history.map(tick => tick.digit));
  const chartPoints = binaryChartPoints(binaryCandles(history, Math.max(1000, (index?.tick_interval_ms ?? 1000) * 5)));
  const max = Math.max(...frequencies.filter((value): value is number => value !== null));
  const min = Math.min(...frequencies.filter((value): value is number => value !== null));
  const remaining = active ? Math.max(0, Math.ceil((Date.parse(active.settles_at) - now) / 1000)) : 0;
  const balance = state?.balance;
  const selected = families[family];
  const amount = Number(stake);
  const validStake = stake.trim() !== '' && Number.isFinite(amount) && amount >= 0.01 && amount <= (balance?.available ?? 0) && Math.abs(amount * 100 - Math.round(amount * 100)) < 1e-7;
  const locked = loading || working || !!active || uncertain;
  const canPlace = !locked && !error && !!index && validStake;
  const money = (value: number) => (balance?.currency ?? '') + ' ' + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function place(type: BinaryContractType) {
    if (mutation.current || (!pending.current && !canPlace)) return;
    mutation.current = true; setWorking(true); setActionError('');
    const payload = pending.current ?? { symbol: shownSymbol, contractType: type, prediction: family === 0 ? null : prediction, stake: amount, durationTicks: duration, idempotencyKey: crypto.randomUUID() };
    pending.current = payload;
    try {
      await binaryRequest('create', payload);
      if (!mounted.current) return;
      pending.current = null; setUncertain(false);
      await reading.current;
      await refresh();
    } catch (failure) {
      if (mounted.current) {
        setUncertain(true);
        setActionError((failure instanceof Error ? failure.message : 'Unable to confirm the contract.') + ' Retry reuses this request.');
      }
    } finally { mutation.current = false; if (mounted.current) setWorking(false); }
  }

  return <main className="binary-terminal"><div className="binary-shell">
    <header className="binary-toolbar">
      <Link href="/app" aria-label="Back to workspace"><ArrowLeft size={18} /></Link>
      <div className="binary-title">Binary <span>DEMO</span></div>
      <div className="binary-wallet"><Wallet size={17} /><div><small>Available balance</small><strong>{balance ? money(balance.available) : '—'}</strong></div></div>
      <button type="button" aria-label="Refresh Binary data" onClick={() => void refresh()} disabled={working}><RefreshCw size={17} /></button>
    </header>
    <p className="binary-disclosure"><span />Simulated market stream · virtual funds only{state && state.scenario !== 'neutral' && <> · assigned {state.scenario === 'always_win' ? 'win' : 'loss'} demonstration</>}</p>
    {error && <div className="binary-error" role="alert">{error} <button type="button" onClick={() => void refresh()}>Retry connection</button>{state && <span>Showing the last loaded data. New contracts are paused.</span>}</div>}
    <section className="binary-market" aria-label="Selected index">
      <Activity size={26} className="binary-market-icon" />
      <div className="binary-market-details"><label className="binary-index-picker"><span className="sr-only">Index</span>
        <select aria-label="Index" value={shownSymbol} disabled={locked || !state?.indices.length} onChange={event => setSymbol(event.target.value)}>
          {!state?.indices.length && <option value="">{loading ? 'Loading indices…' : 'No indices available'}</option>}
          <optgroup label="Standard / 2-second">{state?.indices.filter(item => item.tick_interval_ms === 2000).map(item => <option key={item.symbol} value={item.symbol}>{item.name}</option>)}</optgroup>
          <optgroup label="1-second">{state?.indices.filter(item => item.tick_interval_ms !== 2000).map(item => <option key={item.symbol} value={item.symbol}>{item.name}</option>)}</optgroup>
        </select><ChevronDown size={18} /></label>
        <p className="binary-quote">{quote !== '—' ? <>{quote.slice(0,-1)}<strong>{quote.slice(-1)}</strong></> : '—'} <span>{latest ? 'Live simulated tick' : value !== null ? 'Simulated reference value' : 'Awaiting index data'}</span></p>
      </div>
    </section>
    <section className="binary-chart" aria-label="Recorded simulated price chart">
      <div className="binary-chart-heading"><div><Radio size={15} /><span>Index movement</span></div><small>{latest ? `${index?.tick_interval_ms === 2000 ? '2-second' : '1-second'} simulated ticks` : 'Waiting for recorded ticks'}</small></div>
      <InteractiveCandlestickChart points={chartPoints} symbol={index?.name ?? 'Binary index'} compact disclosure="Recorded simulated prices only" />
    </section>
    <section className="binary-digit-stage" aria-label="Last digit statistics" aria-busy={loading}>
      <div className="binary-stage-label"><span>Last digit frequency</span><span>{history.length ? history.length + ' recorded ticks' : 'No recorded ticks yet'}</span></div>
      <div className="binary-digit-grid">{frequencies.map((frequency, digit) => <div key={digit} className={'binary-digit ' + (digit === finalDigit ? 'is-current' : '')} aria-label={'Digit ' + digit + ': ' + (frequency === null ? 'no data' : frequency.toFixed(1) + ' percent') + (digit === finalDigit ? ', latest digit' : '')}>
        <div className="binary-digit-ring" style={{ '--arc': ((frequency ?? 0) * 3.6) + 'deg', '--ring': frequency !== null && max !== min ? frequency === max ? '#26b5bf' : frequency === min ? '#ef5750' : '#737979' : '#737979' } as CSSProperties}>
          <div><strong>{digit}</strong><span>{frequency === null ? '—' : frequency.toFixed(1) + '%'}</span></div>
        </div><span className="binary-digit-marker" aria-hidden="true">▲</span>
      </div>)}</div>
      <div className="binary-tick-strip" aria-label="Recent digits">{history.length ? history.slice(-12).map((tick, position) => <span key={position + '-' + tick.sequence} className={position === Math.min(history.length, 12)-1 ? 'is-latest' : ''}>{tick.digit}</span>) : <p>Your recorded ticks will appear here.</p>}</div>
      <p className="binary-frequency-note">Past digit frequency is not a prediction of the next tick.</p>
    </section>
    <section className="binary-ticket" aria-label="Binary contract ticket">
      <label className="binary-family"><Grid2X2 size={22} /><span className="sr-only">Trade type</span><select aria-label="Trade type" value={family} disabled={locked} onChange={event => setFamily(Number(event.target.value))}>{families.map((item,i) => <option key={item.label} value={i}>{item.label}</option>)}</select><ChevronDown size={19} /></label>
      {family !== 0 && <fieldset className="binary-prediction" disabled={locked}><legend>{family === 1 ? 'Barrier · equality loses on both sides' : 'Predicted digit'}</legend><div>{Array.from({length:10}, (_, digit) => <button type="button" key={digit} aria-pressed={prediction === digit} onClick={() => setPrediction(digit)}>{digit}</button>)}</div></fieldset>}
      <div className="binary-input-row">
        <label><span>Duration</span><select aria-label="Duration in ticks" value={duration} disabled={locked} onChange={event => setDuration(Number(event.target.value))}>{[1,5,10,20].map(ticks => <option key={ticks} value={ticks}>{ticks} tick{ticks === 1 ? '' : 's'}</option>)}</select></label>
        <label className="binary-stake"><span>Stake {balance ? '(' + balance.currency + ')' : ''}</span><input aria-label="Stake" type="number" min="0.01" step="0.01" placeholder="Enter amount" value={stake} disabled={locked} onChange={event => setStake(event.target.value)} /></label>
      </div>
      <div className="binary-contract-pair">{selected.types.map((type, i) => <button type="button" className={i === 0 ? 'binary-buy teal' : 'binary-buy coral'} key={type} disabled={!canPlace || (type === 'OVER' && prediction === 9) || (type === 'UNDER' && prediction === 0)} onClick={() => void place(type)}>
        <span className="binary-buy-title"><Grid2X2 size={22} />{selected.names[i]}</span><span className="binary-buy-payout"><span>Est. demo payout</span><strong>{validStake && !uncertain ? money(Math.round(amount * 196) / 100) : '—'}</strong></span>
      </button>)}</div>
      <p className="binary-ticket-note">Payout includes the stake. The confirmed contract records the final payout.</p>
      {balance && <p className="binary-reserved">Reserved {money(balance.reserved)}{balance.available === 0 && ' · No available funds'} <Link href="/app/transactions">Account history</Link></p>}
      {actionError && <div className="binary-error" role="alert">{actionError}</div>}
      {uncertain && <button type="button" className="binary-retry" disabled={working} onClick={() => void place(pending.current?.contractType as BinaryContractType)}>Retry same contract request</button>}
      {active && <div className="binary-contract-status" role="status"><strong>{active.contract_type} · {active.duration_ticks} ticks</strong><span>{remaining ? remaining + 's until expiry' : 'Expired · awaiting server settlement'}</span><small>The server confirms the final digit and result.</small></div>}
      {settled && !active && <div className="binary-contract-status" role="status"><strong>{settled.status === 'WON' ? 'Condition met' : settled.status === 'LOST' ? 'Condition not met' : 'Contract cancelled'}{settled.final_digit !== null && ' · Final digit ' + settled.final_digit}</strong><span>{settled.status === 'WON' ? 'Payout ' + money(settled.payout) : settled.status === 'LOST' ? 'Loss ' + money(settled.stake) : 'See account history'}</span></div>}
    </section>
    <details className="binary-history"><summary>Contract history <span>{state?.contracts.length ?? 0}</span></summary>
      {state?.contracts.length ? state.contracts.map(contract => <article key={contract.id}><div><strong>{contract.contract_type}{contract.prediction !== null ? ' ' + contract.prediction : ''}</strong><small>{contract.symbol} · {contract.duration_ticks} ticks</small></div><div><strong>{contract.status}</strong><small>{contract.status === 'WON' ? 'Payout ' + money(contract.payout) : contract.status === 'LOST' ? 'Loss ' + money(contract.stake) : 'Stake ' + money(contract.stake)}</small></div></article>) : <p>{loading ? 'Loading contracts…' : error ? 'History is unavailable.' : 'No contracts yet.'}</p>}
    </details>
  </div></main>;
}
