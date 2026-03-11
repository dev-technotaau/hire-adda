'use client';

import { forwardRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-dark shadow-sm',
        secondary:
          'bg-[var(--bg-tertiary)] text-[var(--text)] hover:bg-[var(--border)] active:bg-[var(--border-hover)]',
        outline:
          'border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-[var(--bg-secondary)] active:bg-[var(--bg-tertiary)]',
        ghost:
          'bg-transparent text-[var(--text)] hover:bg-[var(--bg-secondary)] active:bg-[var(--bg-tertiary)]',
        destructive: 'bg-error text-white hover:bg-error-dark active:bg-[#B91C1C] shadow-sm',
        link: 'bg-transparent text-primary hover:text-primary-hover underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
        md: 'h-10 px-4 text-sm gap-2 rounded-lg',
        lg: 'h-12 px-6 text-base gap-2.5 rounded-lg',
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

const tooltipPositionStyles: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const tooltipArrowStyles: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--text)] border-x-transparent border-b-transparent',
  bottom:
    'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--text)] border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--text)] border-y-transparent border-r-transparent',
  right:
    'right-full top-1/2 -translate-y-1/2 border-r-[var(--text)] border-y-transparent border-l-transparent',
};

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  tooltip?: string;
  tooltipPosition?: TooltipPosition;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading,
      leftIcon,
      rightIcon,
      disabled,
      children,
      tooltip,
      tooltipPosition = 'top',
      ...props
    },
    ref,
  ) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const button = (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={disabled || isLoading}
        onMouseEnter={(e) => {
          setShowTooltip(true);
          props.onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setShowTooltip(false);
          props.onMouseLeave?.(e);
        }}
        onFocus={(e) => {
          setShowTooltip(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setShowTooltip(false);
          props.onBlur?.(e);
        }}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !isLoading && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );

    if (!tooltip) return button;

    return (
      <div className="relative inline-flex">
        {button}
        {showTooltip && (
          <div
            role="tooltip"
            className={cn(
              'animate-fade-in pointer-events-none absolute z-50 rounded-md bg-[var(--text)] px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-[var(--shadow-md)]',
              tooltipPositionStyles[tooltipPosition],
            )}
          >
            {tooltip}
            <span className={cn('absolute border-4', tooltipArrowStyles[tooltipPosition])} />
          </div>
        )}
      </div>
    );
  },
);

Button.displayName = 'Button';

export default Button;
