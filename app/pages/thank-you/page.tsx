import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function ThankYou() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-canvas px-4 text-center">
      <Helmet>
        <title>Thank You | Derivix</title>
      </Helmet>
      <div className="max-w-md">
        <div className="w-20 h-20 bg-brand-lime rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-brand-ink mb-4">Thank You!</h1>
        <p className="text-brand-muted mb-8">Your request has been successfully submitted. Our team will get back to you shortly.</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 text-white bg-brand-ink rounded-full font-semibold hover:bg-brand-limeDeep transition-all"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
