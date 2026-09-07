import { useEffect } from "react";

const CONSENT_KEY = "cookie-consent";

export function Analytics() {
  const measurementId = String(import.meta.env.VITE_GA_MEASUREMENT_ID ?? "").trim();

  useEffect(() => {
    if (!measurementId) return;
    const load = () => {
      if (localStorage.getItem(CONSENT_KEY) !== "accepted") return;
      const scriptId = "derivix-google-analytics";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
        document.head.appendChild(script);
      }
      const windowWithAnalytics = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
      windowWithAnalytics.dataLayer = windowWithAnalytics.dataLayer ?? [];
      windowWithAnalytics.gtag = windowWithAnalytics.gtag ?? ((...args: unknown[]) => windowWithAnalytics.dataLayer?.push(args));
      windowWithAnalytics.gtag("js", new Date());
      windowWithAnalytics.gtag("config", measurementId, { anonymize_ip: true });
    };
    load();
    window.addEventListener("derivix-cookie-consent", load);
    return () => window.removeEventListener("derivix-cookie-consent", load);
  }, [measurementId]);

  return null;
}
