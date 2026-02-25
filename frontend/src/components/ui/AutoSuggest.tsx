'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Tag from '@/components/ui/Tag';
import Spinner from '@/components/ui/Spinner';

/* ---------- types ---------- */

export interface SuggestOption {
  label: string;
  value: string;
  count?: number;
  description?: string;
}

export interface AutoSuggestRef {
  focus: () => void;
  clear: () => void;
}

interface AutoSuggestProps {
  /** Label above the input */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Whether multiple values can be selected */
  multiple?: boolean;
  /** Currently selected value(s) — for controlled mode */
  value?: string | string[];
  /** Callback on value change */
  onChange?: (value: string | string[]) => void;
  /** Suggestions to display */
  suggestions?: SuggestOption[];
  /** Whether suggestions are loading */
  isLoading?: boolean;
  /** Called when input value changes (for fetching suggestions) */
  onInputChange?: (query: string) => void;
  /** Allow creating new values not in the list */
  allowCreate?: boolean;
  /** Create label (e.g., 'Add "{query}"') */
  createLabel?: (query: string) => string;
  /** Max number of selections in multi-mode */
  maxSelections?: number;
  /** Minimum characters before showing suggestions */
  minChars?: number;
  /** Size */
  inputSize?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
  /** Debounce delay in ms */
  debounceMs?: number;
}

/* ---------- size styles ---------- */

const SIZE_STYLES = {
  sm: 'min-h-[32px] text-sm px-2.5 py-1',
  md: 'min-h-[40px] text-sm px-3 py-1.5',
  lg: 'min-h-[48px] text-base px-4 py-2',
};

/* ---------- component ---------- */

const AutoSuggest = forwardRef<AutoSuggestRef, AutoSuggestProps>(
  (
    {
      label,
      placeholder = 'Type to search...',
      error,
      helperText,
      required,
      disabled,
      multiple = false,
      value,
      onChange,
      suggestions = [],
      isLoading = false,
      onInputChange,
      allowCreate = false,
      createLabel = (q) => `Add "${q}"`,
      maxSelections,
      minChars = 1,
      inputSize = 'md',
      className,
      debounceMs = 200,
    },
    ref,
  ) => {
    /* ---- state ---- */
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    /* ---- refs ---- */
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    /* ---- derived ---- */
    const selectedValues: string[] = Array.isArray(value) ? value : value ? [value] : [];

    const isMaxReached = maxSelections ? selectedValues.length >= maxSelections : false;

    /* ---- imperative handle ---- */
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => {
        setInputValue('');
        handleChange(multiple ? [] : '');
      },
    }));

    /* ---- helpers ---- */
    const handleChange = useCallback(
      (newValue: string | string[]) => {
        onChange?.(newValue);
      },
      [onChange],
    );

    const handleSelect = useCallback(
      (optionValue: string) => {
        if (multiple) {
          const current = [...selectedValues];
          const idx = current.indexOf(optionValue);
          if (idx >= 0) {
            current.splice(idx, 1);
          } else {
            if (isMaxReached) return;
            current.push(optionValue);
          }
          handleChange(current);
          setInputValue('');
        } else {
          handleChange(optionValue);
          const opt = suggestions.find((s) => s.value === optionValue);
          setInputValue(opt?.label ?? optionValue);
          setIsOpen(false);
        }
        setActiveIndex(-1);
        inputRef.current?.focus();
      },
      [multiple, selectedValues, isMaxReached, handleChange, suggestions],
    );

    const handleRemove = useCallback(
      (optionValue: string) => {
        if (multiple) {
          handleChange(selectedValues.filter((v) => v !== optionValue));
        } else {
          handleChange('');
          setInputValue('');
        }
        inputRef.current?.focus();
      },
      [multiple, selectedValues, handleChange],
    );

    const handleCreate = useCallback(
      (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        if (multiple) {
          if (!selectedValues.includes(trimmed) && !isMaxReached) {
            handleChange([...selectedValues, trimmed]);
          }
          setInputValue('');
        } else {
          handleChange(trimmed);
          setInputValue(trimmed);
          setIsOpen(false);
        }
        setActiveIndex(-1);
      },
      [multiple, selectedValues, isMaxReached, handleChange],
    );

    /* ---- input change with debounce ---- */
    const handleInputValueChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        setActiveIndex(-1);

        if (!isOpen) setIsOpen(true);

        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          onInputChange?.(val.trim());
        }, debounceMs);
      },
      [isOpen, onInputChange, debounceMs],
    );

    /* ---- build navigable items list ---- */
    const filteredSuggestions = suggestions.filter((s) => !selectedValues.includes(s.value));

    const showCreate =
      allowCreate &&
      inputValue.trim().length > 0 &&
      !suggestions.some(
        (s) =>
          s.label.toLowerCase() === inputValue.trim().toLowerCase() ||
          s.value.toLowerCase() === inputValue.trim().toLowerCase(),
      ) &&
      !selectedValues.includes(inputValue.trim());

    const totalItems = filteredSuggestions.length + (showCreate ? 1 : 0);

    /* ---- keyboard ---- */
    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
          case 'ArrowDown': {
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
              return;
            }
            setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
            break;
          }
          case 'ArrowUp': {
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
              return;
            }
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
            break;
          }
          case 'Enter': {
            e.preventDefault();
            if (activeIndex >= 0) {
              if (activeIndex < filteredSuggestions.length) {
                handleSelect(filteredSuggestions[activeIndex].value);
              } else if (showCreate) {
                handleCreate(inputValue);
              }
            } else if (allowCreate && inputValue.trim()) {
              handleCreate(inputValue);
            }
            break;
          }
          case 'Escape': {
            e.preventDefault();
            setIsOpen(false);
            setActiveIndex(-1);
            break;
          }
          case 'Backspace': {
            if (!inputValue && multiple && selectedValues.length > 0) {
              handleRemove(selectedValues[selectedValues.length - 1]);
            }
            break;
          }
          case 'Tab': {
            setIsOpen(false);
            setActiveIndex(-1);
            break;
          }
        }
      },
      [
        isOpen,
        totalItems,
        activeIndex,
        filteredSuggestions,
        showCreate,
        handleSelect,
        handleCreate,
        inputValue,
        allowCreate,
        multiple,
        selectedValues,
        handleRemove,
      ],
    );

    /* ---- scroll active item into view ---- */
    useEffect(() => {
      if (activeIndex >= 0) {
        itemRefs.current[activeIndex]?.scrollIntoView({
          block: 'nearest',
        });
      }
    }, [activeIndex]);

    /* ---- click outside ---- */
    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        const target = e.target as Node;
        if (containerRef.current && !containerRef.current.contains(target)) {
          setIsOpen(false);
          setActiveIndex(-1);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /* ---- cleanup ---- */
    useEffect(() => {
      return () => clearTimeout(debounceTimerRef.current);
    }, []);

    /* ---- reset item refs ---- */
    useEffect(() => {
      itemRefs.current = itemRefs.current.slice(0, totalItems);
    }, [totalItems]);

    const inputId = label?.toLowerCase().replace(/\s+/g, '-');
    const showDropdown =
      isOpen &&
      inputValue.length >= minChars &&
      (filteredSuggestions.length > 0 || showCreate || isLoading);

    return (
      <div className={cn('relative w-full', className)} ref={containerRef}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[var(--text)]">
            {label}
            {required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}

        {/* Input container */}
        <div
          className={cn(
            'relative flex flex-wrap items-center gap-1.5',
            'rounded-lg border bg-white transition-colors duration-200',
            'focus-within:border-primary focus-within:ring-primary/20 focus-within:ring-2',
            error
              ? 'border-error focus-within:border-error focus-within:ring-error/20'
              : 'border-[var(--border)]',
            disabled && 'cursor-not-allowed bg-[var(--bg-secondary)] opacity-60',
            SIZE_STYLES[inputSize],
          )}
          onClick={() => {
            if (!disabled) inputRef.current?.focus();
          }}
        >
          {/* Selected tags (multi-mode) */}
          {multiple &&
            selectedValues.map((val) => {
              const opt = suggestions.find((s) => s.value === val);
              return (
                <Tag
                  key={val}
                  label={opt?.label ?? val}
                  variant="primary"
                  size="sm"
                  onRemove={disabled ? undefined : () => handleRemove(val)}
                />
              );
            })}

          {/* Input */}
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={inputValue}
            onChange={handleInputValueChange}
            onFocus={() => {
              if (!disabled) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              multiple && selectedValues.length > 0
                ? isMaxReached
                  ? `Max ${maxSelections} selected`
                  : 'Add more...'
                : placeholder
            }
            disabled={disabled || isMaxReached}
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            aria-controls="autosuggest-listbox"
            aria-activedescendant={
              activeIndex >= 0 ? `autosuggest-option-${activeIndex}` : undefined
            }
            className={cn(
              'min-w-[80px] flex-1 border-none bg-transparent p-0 text-[var(--text)] placeholder:text-[var(--text-muted)]',
              'focus:ring-0 focus:outline-none',
              inputSize === 'sm' && 'text-sm',
              inputSize === 'lg' && 'text-base',
            )}
          />

          {/* Right side: loading / dropdown arrow */}
          <div className="flex shrink-0 items-center gap-1">
            {isLoading && <Spinner size="sm" />}
            {!multiple && !disabled && (
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-[var(--text-muted)] transition-transform duration-200',
                  isOpen && 'rotate-180',
                )}
              />
            )}
          </div>
        </div>

        {/* Error / helper */}
        {error && <p className="text-error mt-1 text-sm">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{helperText}</p>
        )}
        {multiple && maxSelections && (
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {selectedValues.length}/{maxSelections} selected
          </p>
        )}

        {/* Dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            id="autosuggest-listbox"
            role="listbox"
            aria-multiselectable={multiple}
            className={cn(
              'absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto overscroll-contain',
              'rounded-lg border border-[var(--border)] bg-white shadow-lg',
              'animate-in fade-in-0 slide-in-from-top-1 duration-150',
            )}
          >
            {/* Loading */}
            {isLoading && filteredSuggestions.length === 0 && !showCreate && (
              <div className="flex items-center justify-center gap-2 p-3 text-sm text-[var(--text-muted)]">
                <Spinner size="sm" />
                <span>Loading suggestions...</span>
              </div>
            )}

            {/* Suggestions */}
            {filteredSuggestions.map((option, i) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <button
                  key={option.value}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  id={`autosuggest-option-${i}`}
                  role="option"
                  aria-selected={isSelected || activeIndex === i}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                    activeIndex === i
                      ? 'text-primary bg-[var(--primary-light)]'
                      : 'text-[var(--text)] hover:bg-[var(--bg-secondary)]',
                  )}
                >
                  {multiple && (
                    <div
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        isSelected
                          ? 'border-primary bg-primary text-white'
                          : 'border-[var(--border)]',
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate">
                      <OptionHighlight text={option.label} query={inputValue} />
                    </div>
                    {option.description && (
                      <div className="truncate text-xs text-[var(--text-muted)]">
                        {option.description}
                      </div>
                    )}
                  </div>
                  {option.count !== undefined && (
                    <span className="shrink-0 text-xs text-[var(--text-muted)]">
                      {option.count.toLocaleString()}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Create option */}
            {showCreate && (
              <button
                ref={(el) => {
                  itemRefs.current[filteredSuggestions.length] = el;
                }}
                id={`autosuggest-option-${filteredSuggestions.length}`}
                role="option"
                aria-selected={activeIndex === filteredSuggestions.length}
                onClick={() => handleCreate(inputValue)}
                onMouseEnter={() => setActiveIndex(filteredSuggestions.length)}
                className={cn(
                  'flex w-full items-center gap-2 border-t border-[var(--border)] px-3 py-2 text-left text-sm transition-colors',
                  activeIndex === filteredSuggestions.length
                    ? 'text-primary bg-[var(--primary-light)]'
                    : 'text-primary hover:bg-[var(--bg-secondary)]',
                )}
              >
                <span className="bg-primary/10 text-primary flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                  +
                </span>
                <span>{createLabel(inputValue.trim())}</span>
              </button>
            )}

            {/* No results (non-loading, non-create) */}
            {!isLoading &&
              filteredSuggestions.length === 0 &&
              !showCreate &&
              inputValue.length >= minChars && (
                <div className="p-3 text-center text-sm text-[var(--text-muted)]">
                  No matches found
                </div>
              )}
          </div>
        )}
      </div>
    );
  },
);

AutoSuggest.displayName = 'AutoSuggest';

export default AutoSuggest;

/* ---------- helper: highlight match in option label ---------- */

function OptionHighlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return <>{text}</>;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <>
      {before}
      <span className="text-primary font-semibold">{match}</span>
      {after}
    </>
  );
}
