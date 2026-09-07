import React from "react";
import { Helmet } from "react-helmet-async";

export default function Terms() {
  return (
    <div className="min-h-screen bg-brand-canvas py-20 px-6">
      <Helmet>
        <title>Terms of Service | Derivix</title>
      </Helmet>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-brand-ink mb-8">Terms of Service</h1>
        <div className="prose prose-brand text-brand-muted space-y-6">
          <p>Last updated: September 7, 2026</p>
          <section>
            <h2 className="text-2xl font-semibold text-brand-ink mt-8 mb-4">1. Agreement</h2>
            <p>By using Derivix, you agree to these terms and all applicable laws.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-brand-ink mt-8 mb-4">2. Use Case</h2>
            <p>Derivix is a trading platform. All trades are simulated and no real money is involved unless explicitly stated in a live account transition.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
