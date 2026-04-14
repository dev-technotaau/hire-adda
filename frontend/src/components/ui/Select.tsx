'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { usePopoverPlacement } from '@/hooks/use-popover-placement';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectBaseProps {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
}

interface SingleSelectProps extends SelectBaseProps {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
}

interface MultiSelectProps extends SelectBaseProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

type SelectProps = SingleSelectProps | MultiSelectProps;

function Select({
  label,
  options,
  value,
  onChange,
  error,
  placeholder = 'Select an option',
  disabled = false,
  searchable = false,
  multiple = false,
  className,
  id,
  required,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  // Search bar (~48px if searchable) + list (max-h-60 = 240px) + borders
  const dropdownPlacement = usePopoverPlacement(containerRef, isOpen, searchable ? 320 : 280);

  const filteredOptions =
    searchable && search
      ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
      : options;

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
      setSearch('');
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const currentValues = value as string[];
      const multiOnChange = onChange as (value: string[]) => void;
      if (currentValues.includes(optionValue)) {
        multiOnChange(currentValues.filter((v) => v !== optionValue));
      } else {
        multiOnChange([...currentValues, optionValue]);
      }
    } else {
      (onChange as (value: string) => void)(optionValue);
      setIsOpen(false);
      setSearch('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      (onChange as (value: string[]) => void)([]);
    } else {
      (onChange as (value: string) => void)('');
    }
  };

  const getDisplayValue = (): ReactNode => {
    if (multiple) {
      const currentValues = value as string[];
      if (currentValues.length === 0)
        return <span className="text-[var(--text-muted)]">{placeholder}</span>;
      if (currentValues.length === 1) {
        return options.find((o) => o.value === currentValues[0])?.label || placeholder;
      }
      return `${currentValues.length} selected`;
    }
    const selected = options.find((o) => o.value === (value as string));
    return selected ? (
      selected.label
    ) : (
      <span className="text-[var(--text-muted)]">{placeholder}</span>
    );
  };

  const hasValue = multiple ? (value as string[]).length > 0 : !!(value as string);

  return (
    <div className={cn('w-full', className)} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-[var(--text)]">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          id={selectId}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] transition-colors duration-200',
            'focus:border-primary focus:ring-primary/20 focus:ring-2 focus:outline-none',
            'disabled:cursor-not-allowed disabled:bg-[var(--bg-secondary)] disabled:opacity-60',
            isOpen && 'border-primary ring-primary/20 ring-2',
            error && 'border-error focus:border-error focus:ring-error/20',
          )}
        >
          <span className="truncate text-left">{getDisplayValue()}</span>
          <div className="ml-2 flex shrink-0 items-center gap-1">
            {hasValue && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="cursor-pointer p-0.5 text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown
              className={cn(
                'h-4 w-4 text-[var(--text-muted)] transition-transform duration-200',
                isOpen && 'rotate-180',
              )}
            />
          </div>
        </button>

        {isOpen && (
          <div
            className={cn(
              'animate-slide-down absolute z-50 w-full rounded-lg border border-[var(--border)] bg-white shadow-lg',
              dropdownPlacement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
            )}
          >
            {searchable && (
              <div className="border-b border-[var(--border)] p-2">
                <div className="relative">
                  <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="focus:border-primary focus:ring-primary/20 w-full rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] py-1.5 pr-3 pl-8 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:outline-none"
                  />
                </div>
              </div>
            )}
            <div data-lenis-prevent className="max-h-60 overflow-y-auto overscroll-contain p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = multiple
                    ? (value as string[]).includes(option.value)
                    : (value as string) === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors duration-150',
                        'hover:bg-[var(--bg-secondary)]',
                        isSelected && 'text-primary bg-[var(--primary-light)] font-medium',
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && <Check className="text-primary h-4 w-4 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-error mt-1 text-sm">{error}</p>}
    </div>
  );
}

Select.displayName = 'Select';

export default Select;
