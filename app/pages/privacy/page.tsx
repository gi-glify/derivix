import React from "react";
import { Helmet } from "react-helmet-async";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-brand-canvas py-20 px-6">
      <Helmet>
        <title>Privacy Policy | Derivix</title>
      </Helmet>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-brand-ink mb-8">Privacy Policy</h1>
        <div className="prose prose-brand text-brand-muted space-y-6">
          <p>Last updated: September 7, 2026</p>
          <section>
            <h2 className="text-2xl font-semibold text-brand-ink mt-8 mb-4">1. Information We Collect</h2>
            <p>We collect information you provide directly to us when you create an account, such as your name, email address, and KYC documentation.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-brand-ink mt-8 mb-4">2. How We Use Your Information</h2>
            <p>Your information is used to provide our services, verify your identity, and ensure the security of our platform.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-brand-ink mt-8 mb-4">3. Data Protection</h2>
            <p>We implement industry-standard security measures to protect your personal data from unauthorized access.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
