import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function MobileCTA() {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-6 md:hidden">
      <Link
        to="/app"
        className="flex items-center justify-center gap-2 rounded-full bg-brand-ink px-6 py-4 text-white font-bold shadow-2xl transition-transform active:scale-95"
      >
        Start Trading Now
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
