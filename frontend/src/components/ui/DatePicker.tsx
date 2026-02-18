'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
    format, parse, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, isAfter,
    addMonths, subMonths, setMonth, setYear, getYear, getMonth,
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DatePickerProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    mode?: 'date' | 'month';
    placeholder?: string;
    error?: string;
    helperText?: string;
    leftIcon?: ReactNode;
    inputSize?: 'sm' | 'md' | 'lg';
    required?: boolean;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
    className?: string;
    id?: string;
}

type ViewMode = 'days' | 'months' | 'years';

const sizeStyles = {
    sm: 'h-8 text-sm px-3',
    md: 'h-10 text-sm px-3',
    lg: 'h-12 text-base px-4',
};

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseValue(value: string, mode: 'date' | 'month'): Date | null {
    if (!value) return null;
    try {
        // Handle ISO datetime strings from API (e.g. "2024-01-15T00:00:00.000Z")
        if (value.includes('T')) {
            const d = new Date(value);
            return isNaN(d.getTime()) ? null : d;
        }
        if (mode === 'month') return parse(value, 'yyyy-MM', new Date());
        return parse(value, 'yyyy-MM-dd', new Date());
    } catch {
        return null;
    }
}

function formatDisplay(value: string, mode: 'date' | 'month'): string {
    const d = parseValue(value, mode);
    if (!d || isNaN(d.getTime())) return '';
    if (mode === 'month') return format(d, 'MMM yyyy');
    return format(d, 'dd MMM yyyy');
}

function isDateDisabled(date: Date, minDate?: Date, maxDate?: Date): boolean {
    if (minDate && isBefore(date, startOfMonth(minDate)) && !isSameDay(date, minDate)) {
        if (isBefore(date, minDate)) return true;
    }
    if (minDate && isBefore(date, minDate)) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return false;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DatePicker({
    label,
    value,
    onChange,
    mode = 'date',
    placeholder,
    error,
    helperText,
    leftIcon,
    inputSize = 'md',
    required,
    disabled,
    minDate,
    maxDate,
    className,
    id,
}: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => parseValue(value, mode) || new Date());
    const [viewMode, setViewMode] = useState<ViewMode>(mode === 'month' ? 'months' : 'days');
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    // Sync viewDate when value changes externally
    useEffect(() => {
        const parsed = parseValue(value, mode);
        if (parsed && !isNaN(parsed.getTime())) setViewDate(parsed);
    }, [value, mode]);

    // Reset viewMode when opening
    useEffect(() => {
        if (isOpen) setViewMode(mode === 'month' ? 'months' : 'days');
    }, [isOpen, mode]);

    // Position the popover
    const updatePosition = useCallback(() => {
        if (!inputRef.current) return;
        const rect = inputRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const popoverHeight = 340;
        const top = spaceBelow >= popoverHeight ? rect.bottom + 4 : rect.top - popoverHeight - 4;
        setPopoverStyle({
            position: 'fixed',
            top: `${top}px`,
            left: `${rect.left}px`,
            width: `${Math.max(rect.width, 300)}px`,
            zIndex: 9999,
        });
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, updatePosition]);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    // Keyboard handler
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { setIsOpen(false); return; }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabled) setIsOpen(o => !o); }
    };

    // Select handlers
    const selectDate = (date: Date) => {
        if (isDateDisabled(date, minDate, maxDate)) return;
        onChange(format(date, 'yyyy-MM-dd'));
        setIsOpen(false);
    };

    const selectMonth = (monthIdx: number) => {
        const newDate = setMonth(viewDate, monthIdx);
        if (mode === 'month') {
            // Check min/max for month mode
            const monthStart = startOfMonth(newDate);
            if (minDate && isBefore(endOfMonth(newDate), minDate)) return;
            if (maxDate && isAfter(monthStart, maxDate)) return;
            onChange(format(newDate, 'yyyy-MM'));
            setIsOpen(false);
        } else {
            setViewDate(newDate);
            setViewMode('days');
        }
    };

    const selectYear = (year: number) => {
        setViewDate(setYear(viewDate, year));
        setViewMode('months');
    };

    const selectToday = () => {
        const today = new Date();
        if (mode === 'month') {
            onChange(format(today, 'yyyy-MM'));
        } else {
            onChange(format(today, 'yyyy-MM-dd'));
        }
        setIsOpen(false);
    };

    // Calendar grid
    const renderDays = () => {
        const monthStart = startOfMonth(viewDate);
        const monthEnd = endOfMonth(viewDate);
        const calStart = startOfWeek(monthStart);
        const calEnd = endOfWeek(monthEnd);
        const days = eachDayOfInterval({ start: calStart, end: calEnd });
        const selected = parseValue(value, mode);

        return (
            <>
                {/* Header */}
                <div className="mb-2 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setViewDate(subMonths(viewDate, 1))}
                        className="rounded-lg p-1.5 hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('months')}
                        className="rounded-lg px-2 py-1 text-sm font-semibold text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                        {format(viewDate, 'MMMM yyyy')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewDate(addMonths(viewDate, 1))}
                        className="rounded-lg p-1.5 hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Day labels */}
                <div className="mb-1 grid grid-cols-7 gap-0">
                    {DAY_LABELS.map(d => (
                        <div key={d} className="py-1 text-center text-xs font-medium text-[var(--text-muted)]">{d}</div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-0">
                    {days.map(day => {
                        const inMonth = isSameMonth(day, viewDate);
                        const isSelected = selected && isSameDay(day, selected);
                        const today = isToday(day);
                        const isDisabled = isDateDisabled(day, minDate, maxDate);

                        return (
                            <button
                                key={day.toISOString()}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => selectDate(day)}
                                className={cn(
                                    'relative mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors',
                                    !inMonth && 'text-[var(--text-muted)] opacity-40',
                                    inMonth && !isSelected && !isDisabled && 'text-[var(--text)] hover:bg-[var(--bg-secondary)]',
                                    isSelected && 'bg-primary text-white font-semibold',
                                    today && !isSelected && 'ring-2 ring-primary/30 font-bold',
                                    isDisabled && 'opacity-30 cursor-not-allowed',
                                )}
                            >
                                {format(day, 'd')}
                            </button>
                        );
                    })}
                </div>
            </>
        );
    };

    // Month grid
    const renderMonths = () => {
        const selected = parseValue(value, mode);
        const selectedMonth = selected ? getMonth(selected) : -1;
        const selectedYear = selected ? getYear(selected) : -1;
        const currentYear = getYear(viewDate);

        return (
            <>
                <div className="mb-3 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setViewDate(setYear(viewDate, currentYear - 1))}
                        className="rounded-lg p-1.5 hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('years')}
                        className="rounded-lg px-2 py-1 text-sm font-semibold text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                        {currentYear}
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewDate(setYear(viewDate, currentYear + 1))}
                        className="rounded-lg p-1.5 hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {MONTH_LABELS.map((m, i) => {
                        const isSelected = currentYear === selectedYear && i === selectedMonth;
                        const monthDate = setMonth(setYear(new Date(), currentYear), i);
                        const isDisabled =
                            (minDate && isAfter(minDate, endOfMonth(monthDate))) ||
                            (maxDate && isBefore(maxDate, startOfMonth(monthDate)));

                        return (
                            <button
                                key={m}
                                type="button"
                                disabled={!!isDisabled}
                                onClick={() => selectMonth(i)}
                                className={cn(
                                    'rounded-lg py-2 text-sm transition-colors',
                                    isSelected && 'bg-primary text-white font-semibold',
                                    !isSelected && !isDisabled && 'text-[var(--text)] hover:bg-[var(--bg-secondary)]',
                                    isDisabled && 'opacity-30 cursor-not-allowed',
                                )}
                            >
                                {m}
                            </button>
                        );
                    })}
                </div>
            </>
        );
    };

    // Year grid
    const renderYears = () => {
        const currentYear = getYear(viewDate);
        const startYear = currentYear - 6;
        const years = Array.from({ length: 12 }, (_, i) => startYear + i);
        const selected = parseValue(value, mode);
        const selectedYear = selected ? getYear(selected) : -1;

        return (
            <>
                <div className="mb-3 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setViewDate(setYear(viewDate, currentYear - 12))}
                        className="rounded-lg p-1.5 hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold text-[var(--text)]">
                        {startYear} &ndash; {startYear + 11}
                    </span>
                    <button
                        type="button"
                        onClick={() => setViewDate(setYear(viewDate, currentYear + 12))}
                        className="rounded-lg p-1.5 hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {years.map(y => {
                        const isSelected = y === selectedYear;
                        const isCurrent = y === new Date().getFullYear();
                        const isDisabled =
                            (minDate && y < getYear(minDate)) ||
                            (maxDate && y > getYear(maxDate));

                        return (
                            <button
                                key={y}
                                type="button"
                                disabled={!!isDisabled}
                                onClick={() => selectYear(y)}
                                className={cn(
                                    'rounded-lg py-2 text-sm transition-colors',
                                    isSelected && 'bg-primary text-white font-semibold',
                                    !isSelected && isCurrent && 'ring-2 ring-primary/30 font-bold',
                                    !isSelected && !isDisabled && 'text-[var(--text)] hover:bg-[var(--bg-secondary)]',
                                    isDisabled && 'opacity-30 cursor-not-allowed',
                                )}
                            >
                                {y}
                            </button>
                        );
                    })}
                </div>
            </>
        );
    };

    // Popover content
    const popover = isOpen && typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                style={popoverStyle}
                className="rounded-xl border border-[var(--border)] bg-white p-3 shadow-lg"
            >
                {viewMode === 'days' && renderDays()}
                {viewMode === 'months' && renderMonths()}
                {viewMode === 'years' && renderYears()}

                {/* Today / This Month button */}
                <div className="mt-2 border-t border-[var(--border)] pt-2">
                    <button
                        type="button"
                        onClick={selectToday}
                        className="w-full rounded-lg py-1.5 text-xs font-medium text-primary hover:bg-primary-light transition-colors"
                    >
                        {mode === 'month' ? 'This Month' : 'Today'}
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body,
    );

    const displayValue = formatDisplay(value, mode);
    const defaultPlaceholder = mode === 'month' ? 'Select month' : 'Select date';

    return (
        <div className="w-full" ref={containerRef}>
            {label && (
                <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                    {label}
                    {required && <span className="ml-0.5 text-error">*</span>}
                </label>
            )}
            <div
                ref={inputRef}
                role="button"
                tabIndex={disabled ? -1 : 0}
                id={inputId}
                onClick={() => !disabled && setIsOpen(o => !o)}
                onKeyDown={handleKeyDown}
                className={cn(
                    'relative flex w-full cursor-pointer items-center rounded-lg border border-[var(--border)] bg-white text-[var(--text)] transition-colors duration-200',
                    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                    'disabled:cursor-not-allowed disabled:bg-[var(--bg-secondary)] disabled:opacity-60',
                    error && 'border-error focus:border-error focus:ring-error/20',
                    disabled && 'cursor-not-allowed bg-[var(--bg-secondary)] opacity-60',
                    sizeStyles[inputSize],
                    leftIcon && 'pl-10',
                    className,
                )}
            >
                {leftIcon && (
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                        {leftIcon}
                    </div>
                )}
                <span className={cn('flex-1 truncate', !displayValue && 'text-[var(--text-muted)]')}>
                    {displayValue || placeholder || defaultPlaceholder}
                </span>
                <Calendar className="ml-2 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            </div>

            {error && <p className="mt-1 text-sm text-error">{error}</p>}
            {helperText && !error && <p className="mt-1 text-sm text-[var(--text-muted)]">{helperText}</p>}

            {popover}
        </div>
    );
}
