import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AOS from "aos";

export function AOSController() {
  const location = useLocation();
  useEffect(() => {
    AOS.init({ duration: 700, easing: "ease-out-cubic", once: false, mirror: true, offset: 24, anchorPlacement: "top-bottom" });
    const frame = window.requestAnimationFrame(() => AOS.refreshHard());
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);
  return null;
}
