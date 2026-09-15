// SmoothUI registry component, MIT. Source: https://smoothui.dev/r/typewriter-text.json
import type React from "react";
import { useEffect, useRef, useState } from "react";

function useReducedMotion() {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldReduceMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setShouldReduceMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return shouldReduceMotion;
}

export interface TypewriterTextProps {
  onComplete?: () => void;
  onProgress?: () => void;
  children: string;
  className?: string;
  loop?: boolean;
  speed?: number;
}

const LOOP_RESTART_DELAY_MS = 1000;

const TypewriterText: React.FC<TypewriterTextProps> = ({
  children,
  onComplete,
  onProgress,
  speed = 50,
  loop = false,
  className = "",
}) => {
  const [displayed, setDisplayed] = useState("");
  const callbacks = useRef({ onComplete, onProgress });
  callbacks.current = { onComplete, onProgress };
  const index = useRef(0);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      // Show full text immediately when reduced motion is enabled
      setDisplayed(children);
      callbacks.current.onComplete?.();
      return;
    }

    setDisplayed("");
    index.current = 0;
    function type() {
      setDisplayed(children.slice(0, index.current + 1));
      callbacks.current.onProgress?.();
      if (index.current < children.length - 1) {
        index.current++;
        timeout.current = setTimeout(type, speed);
      } else if (loop) {
        timeout.current = setTimeout(() => {
          setDisplayed("");
          index.current = 0;
          type();
        }, LOOP_RESTART_DELAY_MS);
      } else {
        callbacks.current.onComplete?.();
      }
    }
    type();
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, [children, speed, loop, shouldReduceMotion]);

  return <span className={className}>{displayed}</span>;
};

export default TypewriterText;
