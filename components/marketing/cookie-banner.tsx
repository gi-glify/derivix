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
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6">
      <div className="mx-auto max-w-5xl rounded-2xl bg-brand-ink p-6 text-white shadow-2xl md:flex md:items-center md:justify-between">
        <p className="text-sm text-gray-300 mb-4 md:mb-0 md:max-w-2xl">
          We use cookies to enhance your experience and analyze our traffic. By continuing to use our site, you agree to our 
          <a href="/privacy" className="ml-1 underline hover:text-brand-lime">Privacy Policy</a>.
        </p>
        <button
          onClick={acceptCookies}
          className="w-full rounded-full bg-brand-lime px-6 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-limeDeep md:w-auto"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
