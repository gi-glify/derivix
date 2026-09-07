import { useEffect, useState } from "react";
import { ArrowRight, Check, SkipForward, Sparkles, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/store";
import { onboardingSteps } from "@/lib/ui/onboarding";

const STORAGE_KEY = "derivix-onboarding-complete";

export function OnboardingTour() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (loading || !user || !location.pathname.startsWith("/app")) return setVisible(false);
    setVisible(window.localStorage.getItem(STORAGE_KEY) !== "complete");
  }, [loading, user, location.pathname]);
  if (!visible) return null;
  const current = onboardingSteps[step];
  function close() { window.localStorage.setItem(STORAGE_KEY, "complete"); setVisible(false); }
  function next() { if (step === onboardingSteps.length - 1) return close(); const nextStep = step + 1; setStep(nextStep); if (onboardingSteps[nextStep].href) navigate(onboardingSteps[nextStep].href!); }
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><div className="relative w-full max-w-md rounded-3xl border border-brand-line bg-white p-6 shadow-2xl dark:bg-dark-ink"><button type="button" aria-label="Close onboarding tour" onClick={close} className="absolute right-4 top-4 rounded-full bg-brand-canvas p-2 text-brand-muted"><X className="h-4 w-4" /></button><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-lime/20 text-brand-limeDeep"><Sparkles className="h-6 w-6" /></div><p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-limeDeep">Getting started · {step + 1}/{onboardingSteps.length}</p><h2 id="onboarding-title" className="mt-2 text-2xl font-bold text-brand-ink">{current.title}</h2><p className="mt-3 text-sm leading-6 text-brand-muted">{current.description}</p><div className="mt-6 flex gap-1.5">{onboardingSteps.map((item, index) => <span key={item.title} className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-brand-lime" : "bg-brand-line"}`} />)}</div><div className="mt-6 flex items-center justify-between gap-3"><button type="button" onClick={close} className="flex items-center gap-1 text-xs font-bold text-brand-muted"><SkipForward className="h-3.5 w-3.5" />Skip tour</button><button type="button" onClick={next} className="flex items-center gap-2 rounded-xl bg-brand-lime px-4 py-3 text-sm font-bold text-brand-ink">{step === onboardingSteps.length - 1 ? <><Check className="h-4 w-4" />Start exploring</> : <>Next <ArrowRight className="h-4 w-4" /></>}</button></div></div></div>;
}
