import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AOS from "aos";

export function AOSController() {
  const location = useLocation();
  useEffect(() => {
    AOS.init({ duration: 700, easing: "ease-out-cubic", once: false, mirror: true, offset: 24, anchorPlacement: "top-bottom" });
    const frame = window.requestAnimationFrame(() => {
      document.querySelectorAll("main > *").forEach((element, index) => {
        if (!element.hasAttribute("data-aos")) {
          element.setAttribute("data-aos", index % 2 === 0 ? "fade-up" : "fade-left");
          element.setAttribute("data-aos-delay", String(Math.min(index * 70, 280)));
        }
      });
      AOS.refreshHard();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);
  return null;
}
