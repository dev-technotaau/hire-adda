'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, SkipForward, Check } from 'lucide-react';
import Logo from '@/components/common/Logo';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface OnboardingStep {
    key: string;
    label: string;
    icon?: React.ElementType;
    optional?: boolean;
}

interface OnboardingShellProps {
    children: ReactNode;
    steps: OnboardingStep[];
    currentStep: number;
    onNext: () => void;
    onPrev: () => void;
    onSkip: () => void;
    onGoToStep?: (step: number) => void;
    isSubmitting?: boolean;
    isLastStep?: boolean;
    isFirstStep?: boolean;
    nextLabel?: string;
    nextDisabled?: boolean;
    dashboardPath: string;
    title?: string;
    subtitle?: string;
}

export default function OnboardingShell({
    children,
    steps,
    currentStep,
    onNext,
    onPrev,
    onSkip,
    onGoToStep,
    isSubmitting,
    isLastStep,
    isFirstStep,
    nextLabel,
    nextDisabled,
    dashboardPath,
    title = 'Complete Your Profile',
    subtitle,
}: OnboardingShellProps) {
    const progress = steps.length > 1 ? Math.round((currentStep / (steps.length - 1)) * 100) : 0;

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)]">
            {/* Top Bar */}
            <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/90 backdrop-blur-sm">
                <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
                    <Logo size="md" />
                    <div className="flex items-center gap-3">
                        <span className="hidden text-xs text-[var(--text-muted)] sm:block">
                            Ctrl+S to save &middot; Esc to go back
                        </span>
                        <button
                            onClick={onSkip}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
                        >
                            <SkipForward className="h-3.5 w-3.5" />
                            Skip for now
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span>Step {currentStep + 1} of {steps.length}</span>
                        <span>{progress}% complete</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                        <div
                            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Step Navigator (Scrollable on mobile) */}
                <div className="mb-6 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-1 min-w-max">
                        {steps.map((step, i) => {
                            const isCompleted = i < currentStep;
                            const isCurrent = i === currentStep;
                            const isClickable = i <= currentStep;

                            return (
                                <button
                                    key={step.key}
                                    onClick={() => isClickable && onGoToStep?.(i)}
                                    disabled={!isClickable}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all whitespace-nowrap',
                                        isCurrent && 'bg-primary text-white shadow-sm',
                                        isCompleted && 'bg-success-light text-[var(--success-dark)] hover:bg-success/20 cursor-pointer',
                                        !isCurrent && !isCompleted && 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]',
                                        !isClickable && 'cursor-default opacity-60',
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="h-3 w-3" />
                                    ) : (
                                        <span className={cn(
                                            'flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold',
                                            isCurrent ? 'bg-white/20 text-white' : 'bg-[var(--border)] text-[var(--text-muted)]',
                                        )}>
                                            {i + 1}
                                        </span>
                                    )}
                                    <span className="hidden sm:inline">{step.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Title */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-[var(--text)] sm:text-2xl">{title}</h1>
                    {subtitle && (
                        <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
                    )}
                </div>

                {/* Step Content */}
                <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-8">
                    {children}
                </div>

                {/* Navigation */}
                <div className="mt-6 flex items-center justify-between">
                    <div>
                        {!isFirstStep && (
                            <Button
                                variant="ghost"
                                onClick={onPrev}
                                disabled={isSubmitting}
                            >
                                <ArrowLeft className="mr-1.5 h-4 w-4" />
                                Back
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {steps[currentStep]?.optional && (
                            <Button
                                variant="ghost"
                                onClick={onNext}
                                disabled={isSubmitting}
                            >
                                Skip this step
                            </Button>
                        )}
                        <Button
                            onClick={onNext}
                            isLoading={isSubmitting}
                            disabled={nextDisabled}
                            rightIcon={!isLastStep ? <ArrowRight className="h-4 w-4" /> : undefined}
                        >
                            {nextLabel || (isLastStep ? 'Complete Setup' : 'Continue')}
                        </Button>
                    </div>
                </div>

                {/* Footer hint */}
                <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
                    Your progress is automatically saved. You can{' '}
                    <Link href={dashboardPath} className="text-primary hover:underline">
                        skip to dashboard
                    </Link>{' '}
                    and complete later.
                </p>
            </div>
        </div>
    );
}
