'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    inputSize?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
    sm: 'h-8 text-sm px-3',
    md: 'h-10 text-sm px-3',
    lg: 'h-12 text-base px-4',
};

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, leftIcon, rightIcon, inputSize = 'md', id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                        {label}
                        {props.required && <span className="ml-0.5 text-error">*</span>}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            'w-full rounded-lg border border-[var(--border)] bg-white text-[var(--text)] placeholder:text-[var(--text-muted)] transition-colors duration-200',
                            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                            'disabled:cursor-not-allowed disabled:bg-[var(--bg-secondary)] disabled:opacity-60',
                            error && 'border-error focus:border-error focus:ring-error/20',
                            sizeStyles[inputSize],
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            className
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && <p className="mt-1 text-sm text-error">{error}</p>}
                {helperText && !error && <p className="mt-1 text-sm text-[var(--text-muted)]">{helperText}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
