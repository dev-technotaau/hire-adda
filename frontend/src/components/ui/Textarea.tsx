'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    showCount?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, helperText, showCount, maxLength, id, value, ...props }, ref) => {
        const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
        const charCount = typeof value === 'string' ? value.length : 0;

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                        {label}
                        {props.required && <span className="ml-0.5 text-error">*</span>}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    value={value}
                    maxLength={maxLength}
                    className={cn(
                        'w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] transition-colors duration-200 resize-vertical',
                        'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                        'disabled:cursor-not-allowed disabled:bg-[var(--bg-secondary)] disabled:opacity-60',
                        error && 'border-error focus:border-error focus:ring-error/20',
                        className
                    )}
                    rows={props.rows || 4}
                    {...props}
                />
                <div className="mt-1 flex items-center justify-between">
                    <div>
                        {error && <p className="text-sm text-error">{error}</p>}
                        {helperText && !error && <p className="text-sm text-[var(--text-muted)]">{helperText}</p>}
                    </div>
                    {showCount && maxLength && (
                        <p className={cn(
                            'text-xs text-[var(--text-muted)] ml-auto',
                            charCount >= maxLength && 'text-error'
                        )}>
                            {charCount}/{maxLength}
                        </p>
                    )}
                </div>
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

export default Textarea;
