'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

/**
 * Global smooth scroll provider using Lenis.
 * - Disabled on touch devices (native momentum scroll is better)
 * - Doesn't affect overflow:auto/scroll containers (modals, sidebars, dropdowns)
 * - Pauses during hash navigation for instant jumps
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Skip on touch devices — native momentum scroll is smoother
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 0, // Disable Lenis on touch (handled by guard above)
      infinite: false,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Override native scrollIntoView to use Lenis
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (arg?: boolean | ScrollIntoViewOptions) {
      // If called with { behavior: 'instant' } or boolean, use native
      if (typeof arg === 'boolean' || (arg && arg.behavior === 'instant')) {
        originalScrollIntoView.call(this, arg);
        return;
      }
      // Use Lenis for smooth scrolling
      lenis.scrollTo(this as HTMLElement, {
        offset: 0,
        duration: 0.8,
      });
    };

    return () => {
      lenis.destroy();
      lenisRef.current = null;
      Element.prototype.scrollIntoView = originalScrollIntoView;
    };
  }, []);

  return <>{children}</>;
}
