import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-canvas px-4 text-center">
      <Helmet>
        <title>404 - Page Not Found | Derivix</title>
      </Helmet>
      <div>
        <h1 className="text-9xl font-extrabold text-brand-lime mb-4">404</h1>
        <p className="text-xl text-brand-muted mb-8 max-w-md mx-auto">
          Oops! The page you're looking for has drifted off the charts.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 text-white bg-brand-ink rounded-full font-semibold hover:bg-brand-limeDeep transition-all hover:scale-105"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
