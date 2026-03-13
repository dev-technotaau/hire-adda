'use client';

import { useState, useRef, useLayoutEffect, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: string;
  children: ReactNode;
  /** Preferred position. Defaults to 'auto' which picks the best fit. */
  position?: TooltipPosition | 'auto';
  className?: string;
}

const positionStyles: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowStyles: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--text)] border-x-transparent border-b-transparent',
  bottom:
    'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--text)] border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--text)] border-y-transparent border-r-transparent',
  right:
    'right-full top-1/2 -translate-y-1/2 border-r-[var(--text)] border-y-transparent border-l-transparent',
};

const PADDING = 8; // min distance from viewport edge

function resolvePosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  preferred: TooltipPosition | 'auto',
): TooltipPosition {
  if (preferred !== 'auto') {
    // Check if preferred position fits
    if (fitsInViewport(triggerRect, tooltipRect, preferred)) return preferred;
  }

  // Try positions in order of preference: top → bottom → right → left
  const order: TooltipPosition[] = ['top', 'bottom', 'right', 'left'];
  for (const pos of order) {
    if (fitsInViewport(triggerRect, tooltipRect, pos)) return pos;
  }

  // Fallback: bottom (least likely to block content)
  return 'bottom';
}

function fitsInViewport(
  trigger: DOMRect,
  tooltip: DOMRect,
  pos: TooltipPosition,
): boolean {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = trigger.left + trigger.width / 2;
  const cy = trigger.top + trigger.height / 2;

  switch (pos) {
    case 'top':
      return (
        trigger.top - tooltip.height - PADDING > 0 &&
        cx - tooltip.width / 2 > PADDING &&
        cx + tooltip.width / 2 < vw - PADDING
      );
    case 'bottom':
      return (
        trigger.bottom + tooltip.height + PADDING < vh &&
        cx - tooltip.width / 2 > PADDING &&
        cx + tooltip.width / 2 < vw - PADDING
      );
    case 'left':
      return (
        trigger.left - tooltip.width - PADDING > 0 &&
        cy - tooltip.height / 2 > PADDING &&
        cy + tooltip.height / 2 < vh - PADDING
      );
    case 'right':
      return (
        trigger.right + tooltip.width + PADDING < vw &&
        cy - tooltip.height / 2 > PADDING &&
        cy + tooltip.height / 2 < vh - PADDING
      );
  }
}

function Tooltip({ content, children, position = 'auto', className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [resolved, setResolved] = useState<TooltipPosition>('top');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isVisible || !wrapperRef.current || !tooltipRef.current) return;
    const triggerRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    setResolved(resolvePosition(triggerRect, tooltipRect, position));
  }, [isVisible, position]);

  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && content && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            'animate-fade-in pointer-events-none absolute z-50 rounded-md bg-[var(--text)] px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-[var(--shadow-md)]',
            positionStyles[resolved],
            className,
          )}
        >
          {content}
          <span className={cn('absolute border-4', arrowStyles[resolved])} />
        </div>
      )}
    </div>
  );
}

Tooltip.displayName = 'Tooltip';

export default Tooltip;
