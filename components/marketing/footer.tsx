import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/logo";
import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-canvas border-t border-brand-line pt-16 pb-8 px-6 lg:px-10">
      <div className="mx-auto max-w-7xl grid grid-cols-1 gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-6 max-w-sm text-brand-muted leading-relaxed">
            Derivix provides a sophisticated trading environment for traders to master 
            market execution and portfolio management without risk.
          </p>
        </div >
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-brand-ink mb-6">Platform</h4>
          <ul className="space-y-4 text-sm text-brand-muted">
            <li><a href="#platform" className="hover:text-brand-lime transition-colors">Markets</a></li>
            <li><a href="#features" className="hover:text-brand-lime transition-colors">Features</a></li>
            <li><a href="/privacy" className="hover:text-brand-lime transition-colors">Privacy</a></li>
            <li><a href="/terms" className="hover:text-brand-lime transition-colors">Terms</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-brand-ink mb-6">Contact</h4>
          <ul className="space-y-4 text-sm text-brand-muted">
            <li className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-brand-lime" />
              <span>123 Financial District, Nairobi, Kenya</span>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="h-4 w-4 mt-0.5 text-brand-lime" />
              <span>+254 700 000 000</span>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="h-4 w-4 mt-0.5 text-brand-lime" />
              <span>support@derivix.com</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-7xl mt-16 pt-8 border-t border-brand-line flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-brand-muted">
        <p>© 2026 Derivix Trading Ltd. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-brand-ink transition-colors">Twitter</a>
          <a href="#" className="hover:text-brand-ink transition-colors">Facebook</a>
          <a href="#" className="hover:text-brand-ink transition-colors">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
}
