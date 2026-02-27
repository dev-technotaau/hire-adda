'use client';

import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  type InputHTMLAttributes,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COUNTRY_CODES, type CountryCode } from '@/constants/country-codes';

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

// Pre-sort by code length descending for detection
const SORTED_CODES = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);

/** Detect country code from a full phone number */
function detectCode(number: string): string | null {
  if (!number) return null;
  const cleaned = number.replace(/\s+/g, '');
  if (!cleaned.startsWith('+')) return null;
  for (const c of SORTED_CODES) {
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
    const [search, setSearch] = useState('');
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const phoneInputRef = useRef<HTMLInputElement | null>(null);

    // Sync selectedCode when value changes externally
    useEffect(() => {
      if (value) {
        const code = detectCode(value);
        if (code && code !== selectedCode) setSelectedCode(code);
      }
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    // Focus search input when dropdown opens
    useEffect(() => {
      if (dropdownOpen) {
        setSearch('');
        setHighlightIndex(-1);
        // Small delay so the dropdown renders first
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
    }, [dropdownOpen]);

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

    // Filter countries by search query
    const filtered = useMemo(() => {
      if (!search.trim()) return COUNTRY_CODES;
      const q = search.trim().toLowerCase();
      return COUNTRY_CODES.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.includes(q) ||
          c.iso.toLowerCase().includes(q),
      );
    }, [search]);

    // Scroll highlighted item into view
    useEffect(() => {
      if (highlightIndex < 0 || !listRef.current) return;
      const items = listRef.current.querySelectorAll('[data-country-item]');
      items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    }, [highlightIndex]);

    const localValue = value ? stripCode(value, selectedCode) : '';
    const currentCountry = COUNTRY_CODES.find((c) => c.code === selectedCode) || COUNTRY_CODES[0];

    const emitChange = useCallback(
      (local: string, code: string) => {
        const fullNumber = local ? `${code}${local}` : '';
        onValueChange?.(fullNumber);
      },
      [onValueChange],
    );

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

    const handleCodeSelect = useCallback(
      (c: CountryCode) => {
        setSelectedCode(c.code);
        setDropdownOpen(false);
        setSearch('');
        // Re-focus the phone number input after selection
        requestAnimationFrame(() => phoneInputRef.current?.focus());
        emitChange(localValue, c.code);
      },
      [emitChange, localValue],
    );

    const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < filtered.length) {
            handleCodeSelect(filtered[highlightIndex]);
          } else if (filtered.length === 1) {
            handleCodeSelect(filtered[0]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setDropdownOpen(false);
          phoneInputRef.current?.focus();
          break;
        case 'Tab':
          setDropdownOpen(false);
          break;
      }
    };

    // Merge refs
    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        phoneInputRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref],
    );

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
                inputSize === 'sm'
                  ? 'h-8 px-2 text-sm'
                  : inputSize === 'lg'
                    ? 'h-12 px-3 text-base'
                    : 'h-10 px-2.5 text-sm',
                props.disabled && 'pointer-events-none',
              )}
              aria-label={`Select country code, current: ${currentCountry.name} ${selectedCode}`}
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
              tabIndex={-1}
            >
              <span>{currentCountry.flag}</span>
              <span>{selectedCode}</span>
              <ChevronDown
                className={cn('h-3 w-3 opacity-50 transition-transform', dropdownOpen && 'rotate-180')}
              />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 z-50 mt-1 w-72 rounded-lg border border-[var(--border)] bg-[var(--bg)] shadow-lg">
                {/* Search input */}
                <div className="border-b border-[var(--border)] p-2">
                  <div className="flex items-center gap-2 rounded-md bg-[var(--bg-secondary)] px-2.5">
                    <Search className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setHighlightIndex(-1);
                      }}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search country or code..."
                      className="w-full bg-transparent py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
                      aria-label="Search countries"
                    />
                  </div>
                </div>
                {/* Country list */}
                <div
                  ref={listRef}
                  className="max-h-60 overflow-y-auto py-1"
                  role="listbox"
                  aria-label="Country codes"
                >
                  {filtered.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-[var(--text-muted)]">
                      No countries found
                    </p>
                  ) : (
                    filtered.map((c, idx) => (
                      <button
                        key={`${c.iso}-${c.code}`}
                        type="button"
                        data-country-item
                        role="option"
                        aria-selected={c.code === selectedCode}
                        onClick={() => handleCodeSelect(c)}
                        onMouseEnter={() => setHighlightIndex(idx)}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                          idx === highlightIndex && 'bg-[var(--bg-secondary)]',
                          c.code === selectedCode && 'text-primary font-medium',
                          idx !== highlightIndex && 'hover:bg-[var(--bg-secondary)]',
                        )}
                      >
                        <span className="shrink-0">{c.flag}</span>
                        <span className="flex-1 truncate">{c.name}</span>
                        <span className="shrink-0 text-[var(--text-muted)]">{c.code}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <input
            ref={setRefs}
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
