import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AOS from "aos";

export function AOSController() {
  const { pathname } = useLocation();
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Restore section reveals without transforming fixed navigation or the live canvas.
    const sections = document.querySelectorAll<HTMLElement>("main > section, main > div > section, main article, .auth-story, .auth-content");
    sections.forEach((element, index) => {
      if (element.hasAttribute("data-aos") || element.closest(".reference-terminal, .trading-chart")) return;
      element.dataset.aos = "fade-up";
      element.dataset.aosDelay = String((index % 3) * 70);
    });
    const initialize = () => {
      AOS.init({ duration: 650, easing: "ease-out-cubic", once: false, mirror: true, offset: 24, disable: preference.matches });
      AOS.refreshHard();
    };
    const frame = requestAnimationFrame(initialize);
    preference.addEventListener("change", initialize);
    return () => { cancelAnimationFrame(frame); preference.removeEventListener("change", initialize); };
  }, [pathname]);
  return null;
}
