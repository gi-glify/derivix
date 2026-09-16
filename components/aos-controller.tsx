import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AOS from 'aos';

let initialized = false;
const selector = 'main > section, main > div:not(.reference-terminal), main article, .auth-story, .auth-content, .access-card, .page-heading, .metric, .overview-grid > .panel';
export function AOSController() {
  const { pathname } = useLocation();
  useEffect(() => {
    let frame = 0;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
          if (element.hasAttribute('data-aos') || element.closest('dialog, aside, .trading-chart, .reference-terminal, [data-aos]')) return;
          element.dataset.aos = 'fade-up';
        });
        if (!initialized) {
          AOS.init({ duration: 550, easing: 'ease-out-cubic', once: true, mirror: false, offset: 20, disableMutationObserver: true });
          initialized = true;
        }
        AOS.refreshHard();
      });
    };
    refresh();
    // Only refresh for mounted sections, not live price text, clocks or table cell updates.
    const observer = new MutationObserver((records) => {
      if (records.some(record => [...record.addedNodes].some(node => node instanceof HTMLElement && (node.matches(selector + ', [data-aos]') || node.querySelector(selector + ', [data-aos]'))))) refresh();
    });
    observer.observe(document.getElementById('root')!, { childList: true, subtree: true });
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    preference.addEventListener('change', refresh);
    document.fonts?.ready.then(() => { if (!disposed) refresh(); });
    let disposed = false;
    return () => { disposed = true; observer.disconnect(); cancelAnimationFrame(frame); preference.removeEventListener('change', refresh); };
  }, [pathname]);
  return null;
}
