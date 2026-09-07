import { useEffect, useState } from "react";
import { Monitor, X } from "lucide-react";
import { useLocation } from "react-router-dom";

export function DesktopExperiencePrompt() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (pathname !== "/app/markets") return setVisible(false);
    const isSmallScreen = window.matchMedia("(max-width: 1023px)").matches;
    const hasSeenPrompt = window.sessionStorage.getItem("derivix-market-desktop-prompt") === "seen";
    setVisible(isSmallScreen && !hasSeenPrompt);
  }, [pathname]);
  if (!visible) return null;
  function dismiss() { window.sessionStorage.setItem("derivix-market-desktop-prompt", "seen"); setVisible(false); }
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="desktop-market-prompt-title"><div className="relative w-full max-w-sm rounded-3xl border border-brand-line bg-white p-6 shadow-2xl dark:bg-dark-ink"><button type="button" onClick={dismiss} aria-label="Close desktop experience message" className="absolute right-4 top-4 rounded-full bg-brand-canvas p-2 text-brand-muted"><X className="h-4 w-4" /></button><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-lime/20 text-brand-limeDeep"><Monitor className="h-6 w-6" /></div><h2 id="desktop-market-prompt-title" className="mt-5 text-xl font-bold text-brand-ink">Best on a larger screen</h2><p className="mt-3 text-sm leading-6 text-brand-muted">The Markets workspace has detailed charts, hover tools, zoom controls, and an order panel. Try it on desktop for the clearest trading experience.</p><button type="button" onClick={dismiss} className="mt-6 w-full rounded-xl bg-brand-lime px-4 py-3 text-sm font-bold text-brand-ink">Continue to Markets</button></div></div>;
}
