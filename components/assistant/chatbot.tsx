import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUp, ChevronDown, MessageCircle, X } from "lucide-react";
import SiriOrb from "@/components/smoothui/siri-orb";
import TypewriterText from "@/components/smoothui/typewriter-text";

type Message = { id: string; role: "assistant" | "user"; text: string; complete: boolean };

function demoAnswer(input: string) {
  const question = input.toLowerCase();
  if (question.includes("loss") || question.includes("risk")) return "Trading can result in losses. Use the Trading Policy to understand the simulation and its limits. You can review open positions and their current profit or loss under Positions.";
  if (question.includes("withdraw")) return "Open Wallet, then Withdraw. Enter your amount and review the available balance. The app will show the request’s status under Transactions.";
  if (question.includes("deposit") || question.includes("fund")) return "Open Wallet from the navigation to review the deposit flow. Your available balance updates after a completed payment confirmation. You can follow its status under Transactions.";
  if (question.includes("password") || question.includes("verify") || question.includes("otp") || question.includes("account")) return "Use Forgot password on the sign-in page to request a reset email. After signup, check your inbox for the verification link. If the email includes a code, enter it on the verification screen. You can resend the email after the countdown.";
  if (question.includes("chart") || question.includes("candle") || question.includes("market")) return "Open Markets and select Live to see a new simulated tick every 1.5 seconds. Drag the chart to explore history, scroll to zoom, or select 1H, 4H, or 1D to group candles. Fullscreen expands the chart; Escape returns to the page. The theme button switches between light and dark.";
  return "I can help you use charts, manage simulated positions, navigate the wallet, or access your account. What would you like help with?";
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ id: "welcome", role: "assistant", text: "Hi, I’m your Derivix assistant. Ask me about the charts, your account, or finding your way around.", complete: true }]);
  const reducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const openRef = useRef(false);
  const followRef = useRef(true);
  const busy = pending || typingId !== null;
  const orbState = pending ? "thinking" : typingId ? "streaming" : "idle";

  const finishTyping = useCallback((id: string) => {
    setMessages(current => current.map(message => message.id === id ? { ...message, complete: true } : message));
    setTypingId(null);
    busyRef.current = false;
  }, []);
  const close = useCallback(() => {
    openRef.current = false;
    setOpen(false);
    setMessages(current => current.map(message => ({ ...message, complete: true })));
    setTypingId(null);
    busyRef.current = requestRef.current !== null;
    launcherRef.current?.focus();
  }, []);
  const show = useCallback(() => { openRef.current = true; followRef.current = true; setOpen(true); }, []);

  useEffect(() => {
    window.addEventListener("derivix-open-assistant", show);
    return () => { window.removeEventListener("derivix-open-assistant", show); requestRef.current?.abort(); };
  }, [show]);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => { inputRef.current?.focus(); if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", escape);
    const observer = new ResizeObserver(() => {
      if (followRef.current && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
    if (contentRef.current) observer.observe(contentRef.current);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("keydown", escape); };
  }, [open, close]);

  async function send(text = input.trim()) {
    if (!text || busyRef.current) return;
    busyRef.current = true;
    followRef.current = true;
    setPending(true); setInput(""); setNotice("");
    setMessages(current => [...current, { id: crypto.randomUUID(), role: "user", text, complete: true }]);
    const endpoint = import.meta.env.VITE_AI_ASSISTANT_URL;
    let reply = demoAnswer(text);
    if (endpoint) {
      const controller = new AbortController();
      requestRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }), signal: controller.signal });
        if (!response.ok) throw new Error("Assistant service unavailable");
        const data: { message?: unknown; reply?: unknown } = await response.json();
        const answer = data.reply ?? data.message;
        if (typeof answer !== "string" || !answer.trim()) throw new Error("Empty assistant response");
        reply = answer.trim().slice(0, 12000);
      } catch { setNotice("The live assistant is unavailable. Here’s help from the platform guide."); }
      finally { clearTimeout(timeout); requestRef.current = null; }
    }
    const id = crypto.randomUUID();
    const animate = openRef.current && !reducedMotion;
    setMessages(current => [...current, { id, role: "assistant", text: reply, complete: !animate }]);
    setPending(false);
    setTypingId(animate ? id : null);
    if (!animate) busyRef.current = false;
  }
  function submit(event: FormEvent) { event.preventDefault(); void send(); }

  return <div className="assistant-widget">
    <button ref={launcherRef} type="button" aria-label={open ? "Close Derivix assistant" : "Open Derivix assistant"} aria-expanded={open} aria-controls="derivix-chat" onClick={() => open ? close() : show()} className="assistant-launcher">{open ? <ChevronDown size={23} /> : <span aria-hidden="true"><SiriOrb size="42px" state="idle" /></span>}</button>
    <AnimatePresence>{open && <motion.section id="derivix-chat" role="dialog" aria-label="Derivix assistant" className="assistant-panel" initial={reducedMotion ? false : { opacity: 0, y: 16, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .98 }} transition={{ duration: reducedMotion ? 0 : .2 }}>
      <header className="assistant-header"><span aria-hidden="true"><SiriOrb size="38px" state={orbState} /></span><div><h2>Derivix assistant</h2><p>{pending ? "Thinking…" : typingId ? "Writing a reply…" : "Your platform companion"}</p></div><button type="button" onClick={close} aria-label="Close chat"><X size={18} /></button></header>
      <div ref={scrollRef} className="assistant-messages" onScroll={event => { const node = event.currentTarget; followRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 60; }}>
        <div ref={contentRef} className="assistant-message-content" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions">
          <div className="assistant-intro"><span aria-hidden="true"><MessageCircle size={15} /></span> A little clarity goes a long way.</div>
          {messages.map(message => <div key={message.id} className={`assistant-message assistant-message--${message.role}`}><span className="sr-only">{message.role === "user" ? "You: " : "Derivix: "}</span>{message.complete ? message.text : <><span className="sr-only">{message.text}</span><span aria-hidden="true"><TypewriterText speed={Math.max(2, Math.min(14, 4500 / message.text.length))} onComplete={() => finishTyping(message.id)}>{message.text}</TypewriterText><span className="assistant-caret" /></span></>}</div>)}
          {pending && <div className="assistant-thinking" role="status"><span /><span /><span /><span className="sr-only">Thinking about your message</span></div>}
          {messages.length === 1 && <div className="assistant-suggestions">{["How do I use the chart?", "Help with my account", "How do I add funds?"].map(question => <button key={question} type="button" onClick={() => void send(question)} disabled={busy}>{question}</button>)}</div>}
        </div>
      </div>
      <footer className="assistant-footer">{notice && <p className="assistant-notice" role="status">{notice}</p>}<form onSubmit={submit}><label htmlFor="assistant-input" className="sr-only">Message Derivix assistant</label><input ref={inputRef} id="assistant-input" value={input} onChange={event => setInput(event.target.value)} placeholder="Ask about Derivix…" maxLength={2000} autoComplete="off" /><button type="submit" disabled={busy || !input.trim()} aria-label="Send message"><ArrowUp size={18} /></button></form><p>Platform guidance · Not financial advice</p></footer>
    </motion.section>}</AnimatePresence>
  </div>;
}
