import React, { useState, useEffect } from "react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    window.dispatchEvent(new Event("derivix-cookie-consent"));
    setIsVisible(false);
  };

  const rejectCookies = () => {
    localStorage.setItem("cookie-consent", "essential");
    window.dispatchEvent(new Event("derivix-cookie-consent"));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6">
      <div className="mx-auto max-w-5xl rounded-2xl bg-brand-ink p-6 text-white shadow-2xl md:flex md:items-center md:justify-between">
        <p className="mb-4 text-sm text-gray-300 md:mb-0 md:max-w-2xl">
          We use essential cookies for account sessions and optional analytics cookies to understand platform usage. See our
          <a href="/privacy" className="ml-1 underline hover:text-brand-lime">Privacy Policy</a>.
        </p>
        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
          <button onClick={rejectCookies} className="rounded-full border border-white/25 px-6 py-2 text-sm font-bold text-white transition hover:border-white">Essential only</button>
          <button onClick={acceptCookies} className="rounded-full bg-brand-lime px-6 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-limeDeep">Accept analytics</button>
        </div>
      </div>
    </div>
  );
}
