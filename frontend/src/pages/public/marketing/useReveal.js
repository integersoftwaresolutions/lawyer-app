import { useEffect, useRef, useState } from "react";

/**
 * IntersectionObserver scroll reveal.
 * Replays every time the element enters the viewport (scroll down again).
 * Resets instantly when it leaves so the next enter feels like the first time.
 */
export const REVEAL_OPTIONS = {
  threshold: 0.12,
  rootMargin: "0px 0px -8% 0px",
};

export function useReveal() {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsResetting(false);
        setIsVisible(true);
        return;
      }

      // Leave viewport: snap back to hidden (no reverse fade), ready to replay.
      setIsResetting(true);
      setIsVisible(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsResetting(false));
      });
    }, REVEAL_OPTIONS);

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible, isResetting };
}
