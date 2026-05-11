'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    setVisible(scrollTop > 400);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <Tooltip content={`Scroll to top · ${Math.round(progress * 100)}%`}>
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed right-6 bottom-6 z-50 flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        {/* Progress ring */}
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 44 44" fill="none">
          {/* Background track */}
          <circle
            cx="22"
            cy="22"
            r={RADIUS}
            stroke="var(--border)"
            strokeWidth="2.5"
            fill="var(--bg)"
          />
          {/* Progress arc */}
          <circle
            cx="22"
            cy="22"
            r={RADIUS}
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-none"
          />
        </svg>
        {/* Arrow icon */}
        <ArrowUp className="relative z-10 h-4.5 w-4.5 text-[var(--text)]" />
      </button>
    </Tooltip>
  );
}
