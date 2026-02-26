'use client';

import { forwardRef, useState, useRef, useEffect, type InputHTMLAttributes, type ChangeEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const COUNTRY_CODES = [
  { code: '+91', flag: '\u{1F1EE}\u{1F1F3}', label: 'India' },
  { code: '+1', flag: '\u{1F1FA}\u{1F1F8}', label: 'US/Canada' },
  { code: '+44', flag: '\u{1F1EC}\u{1F1E7}', label: 'UK' },
  { code: '+61', flag: '\u{1F1E6}\u{1F1FA}', label: 'Australia' },
  { code: '+971', flag: '\u{1F1E6}\u{1F1EA}', label: 'UAE' },
  { code: '+966', flag: '\u{1F1F8}\u{1F1E6}', label: 'Saudi Arabia' },
  { code: '+65', flag: '\u{1F1F8}\u{1F1EC}', label: 'Singapore' },
  { code: '+49', flag: '\u{1F1E9}\u{1F1EA}', label: 'Germany' },
  { code: '+33', flag: '\u{1F1EB}\u{1F1F7}', label: 'France' },
  { code: '+81', flag: '\u{1F1EF}\u{1F1F5}', label: 'Japan' },
  { code: '+86', flag: '\u{1F1E8}\u{1F1F3}', label: 'China' },
  { code: '+82', flag: '\u{1F1F0}\u{1F1F7}', label: 'South Korea' },
  { code: '+55', flag: '\u{1F1E7}\u{1F1F7}', label: 'Brazil' },
  { code: '+27', flag: '\u{1F1FF}\u{1F1E6}', label: 'South Africa' },
  { code: '+234', flag: '\u{1F1F3}\u{1F1EC}', label: 'Nigeria' },
  { code: '+254', flag: '\u{1F1F0}\u{1F1EA}', label: 'Kenya' },
  { code: '+60', flag: '\u{1F1F2}\u{1F1FE}', label: 'Malaysia' },
  { code: '+63', flag: '\u{1F1F5}\u{1F1ED}', label: 'Philippines' },
  { code: '+977', flag: '\u{1F1F3}\u{1F1F5}', label: 'Nepal' },
  { code: '+94', flag: '\u{1F1F1}\u{1F1F0}', label: 'Sri Lanka' },
  { code: '+880', flag: '\u{1F1E7}\u{1F1E9}', label: 'Bangladesh' },
  { code: '+92', flag: '\u{1F1F5}\u{1F1F0}', label: 'Pakistan' },
] as const;

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

/** Detect country code from a full phone number */
function detectCode(number: string): string | null {
  if (!number) return null;
  const cleaned = number.replace(/\s+/g, '');
  if (!cleaned.startsWith('+')) return null;
  // Match longest code first (e.g., +971 before +97 before +9)
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sorted) {
    if (cleaned.startsWith(c.code)) return c.code;
  }
  return null;
}

/** Strip country code prefix for display */
function stripCode(number: string, code: string): string {
  const cleaned = number.replace(/\s+/g, '');
  if (cleaned.startsWith(code)) return cleaned.slice(code.length);
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
      countryCode: defaultCode = '+91',
      value,
      onChange,
      onValueChange,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const detectedCode = value ? detectCode(value) : null;
    const [selectedCode, setSelectedCode] = useState(detectedCode || defaultCode);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync selectedCode when value changes externally
    useEffect(() => {
      if (value) {
        const code = detectCode(value);
        if (code && code !== selectedCode) setSelectedCode(code);
      }
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    // Close dropdown on outside click
    useEffect(() => {
      if (!dropdownOpen) return;
      const handler = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setDropdownOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [dropdownOpen]);

    const localValue = value ? stripCode(value, selectedCode) : '';
    const currentCountry = COUNTRY_CODES.find((c) => c.code === selectedCode) || COUNTRY_CODES[0];

    const emitChange = (local: string, code: string) => {
      const fullNumber = local ? `${code}${local}` : '';
      onValueChange?.(fullNumber);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const local = e.target.value.replace(/[^\d]/g, '');
      const fullNumber = local ? `${selectedCode}${local}` : '';

      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: fullNumber },
      } as ChangeEvent<HTMLInputElement>;

      onChange?.(syntheticEvent);
      onValueChange?.(fullNumber);
    };

    const handleCodeSelect = (code: string) => {
      setSelectedCode(code);
      setDropdownOpen(false);
      emitChange(localValue, code);
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
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => !props.disabled && setDropdownOpen(!dropdownOpen)}
              className={cn(
                'flex shrink-0 items-center gap-1 border-r border-[var(--border)] bg-[var(--bg-secondary)] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)]',
                inputSize === 'sm' ? 'h-8 px-2 text-sm' : inputSize === 'lg' ? 'h-12 px-3 text-base' : 'h-10 px-2.5 text-sm',
                props.disabled && 'pointer-events-none',
              )}
              aria-label="Select country code"
              tabIndex={-1}
            >
              <span>{currentCountry.flag}</span>
              <span>{selectedCode}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-56 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] py-1 shadow-lg">
                {COUNTRY_CODES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCodeSelect(c.code)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--bg-secondary)]',
                      c.code === selectedCode && 'bg-primary/5 text-primary font-medium',
                    )}
                  >
                    <span>{c.flag}</span>
                    <span className="flex-1 truncate">{c.label}</span>
                    <span className="text-[var(--text-muted)]">{c.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
