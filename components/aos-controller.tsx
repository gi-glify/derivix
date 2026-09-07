import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AOS from "aos";

export function AOSController() {
  const location = useLocation();
  useEffect(() => {
    AOS.init({ duration: 700, easing: "ease-out-cubic", once: false, mirror: true, offset: 24, anchorPlacement: "top-bottom" });
    const frame = window.requestAnimationFrame(() => {
      const animatedElements = document.querySelectorAll("main > *, main section, main article, main header, main footer, main h1, main h2, main h3, main p, main button, main a, main label, main table");
      animatedElements.forEach((element, index) => {
        if (!element.hasAttribute("data-aos")) {
          element.setAttribute("data-aos", index % 3 === 0 ? "fade-up" : index % 3 === 1 ? "fade-left" : "fade-right");
          element.setAttribute("data-aos-delay", String(Math.min(index * 70, 280)));
        }
      });
      AOS.refreshHard();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);
  return null;
}
