'use client';

import { forwardRef, type InputHTMLAttributes, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  error?: string;
  helperText?: string;
  inputSize?: 'sm' | 'md' | 'lg';
  countryCode?: string;
  /** The full phone number including country code (e.g., "+919876543210") */
  value?: string;
  /** Called with the full number including country code */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Called with the full number including country code */
  onValueChange?: (fullNumber: string) => void;
}

const sizeStyles = {
  sm: 'h-8 text-sm',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
};

const prefixSizeStyles = {
  sm: 'text-sm px-2',
  md: 'text-sm px-3',
  lg: 'text-base px-3',
};

/** Strip country code prefix for display */
function stripCode(number: string, code: string): string {
  const cleaned = number.replace(/\s+/g, '');
  if (cleaned.startsWith(code)) return cleaned.slice(code.length);
  // Handle without + (e.g., "919876543210" with code "+91")
  const codeDigits = code.slice(1);
  if (cleaned.startsWith(codeDigits)) return cleaned.slice(codeDigits.length);
  return cleaned;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      inputSize = 'md',
      countryCode = '+91',
      value,
      onChange,
      onValueChange,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const localValue = value ? stripCode(value, countryCode) : '';

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const local = e.target.value.replace(/[^\d]/g, '');
      const fullNumber = local ? `${countryCode}${local}` : '';

      // Create a synthetic event with fullNumber as the value
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: fullNumber },
      } as ChangeEvent<HTMLInputElement>;

      onChange?.(syntheticEvent);
      onValueChange?.(fullNumber);
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[var(--text)]">
            {label}
            {props.required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <div
          className={cn(
            'flex w-full overflow-hidden rounded-lg border border-[var(--border)] bg-white transition-colors duration-200',
            'focus-within:border-primary focus-within:ring-primary/20 focus-within:ring-2',
            error && 'border-error focus-within:border-error focus-within:ring-error/20',
            props.disabled && 'cursor-not-allowed bg-[var(--bg-secondary)] opacity-60',
          )}
        >
          <span
            className={cn(
              'flex shrink-0 select-none items-center border-r border-[var(--border)] bg-[var(--bg-secondary)] font-medium text-[var(--text-secondary)]',
              prefixSizeStyles[inputSize],
            )}
          >
            {countryCode}
          </span>
          <input
            ref={ref}
            id={inputId}
            type="tel"
            value={localValue}
            onChange={handleChange}
            className={cn(
              'w-full bg-transparent px-3 text-[var(--text)] placeholder:text-[var(--text-muted)]',
              'focus:outline-none',
              'disabled:cursor-not-allowed',
              sizeStyles[inputSize],
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-error mt-1 text-sm">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{helperText}</p>
        )}
      </div>
    );
  },
);

PhoneInput.displayName = 'PhoneInput';

export default PhoneInput;
