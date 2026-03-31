'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, SkipForward, Check, CornerDownLeft } from 'lucide-react';
import Logo from '@/components/common/Logo';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
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
  editFromReview?: boolean;
  onReturnToReview?: () => void;
  highestVisitedStep?: number;
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
  editFromReview,
  onReturnToReview,
  highestVisitedStep,
}: OnboardingShellProps) {
  const progress = steps.length > 1 ? Math.round((currentStep / (steps.length - 1)) * 100) : 0;
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to active tab
  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentStep]);

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
            <Tooltip content="Skip onboarding and go to dashboard">
              <button
                onClick={onSkip}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Skip for now
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span>{progress}% complete</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Navigator (Scrollable) */}
        <div ref={scrollRef} className="scrollbar-hide mb-6 overflow-x-auto">
          <div className="flex min-w-max gap-1">
            {steps.map((step, i) => {
              const isCompleted = i < currentStep;
              const isCurrent = i === currentStep;
              const maxVisited = highestVisitedStep ?? currentStep;
              const isClickable = i <= maxVisited;

              return (
                <button
                  key={step.key}
                  ref={isCurrent ? activeTabRef : undefined}
                  onClick={() => isClickable && onGoToStep?.(i)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-all',
                    isCurrent && 'bg-secondary text-white shadow-sm',
                    isCompleted &&
                      'bg-success-light hover:bg-success/20 cursor-pointer text-[var(--success-dark)]',
                    !isCurrent &&
                      !isCompleted &&
                      'bg-[var(--bg-tertiary)] text-[var(--text-muted)]',
                    !isClickable && 'cursor-default opacity-60',
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold',
                        isCurrent
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--border)] text-[var(--text-muted)]',
                      )}
                    >
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
          {subtitle && <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>}
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
                tooltip="Go to previous step"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {editFromReview && onReturnToReview && (
              <Button
                variant="outline"
                onClick={onReturnToReview}
                leftIcon={<CornerDownLeft className="h-4 w-4" />}
                tooltip="Save changes and go back to review"
              >
                Save & Return to Review
              </Button>
            )}
            {!editFromReview && steps[currentStep]?.optional && (
              <Button
                variant="ghost"
                onClick={onNext}
                disabled={isSubmitting}
                tooltip="Skip this optional step"
              >
                Skip this step
              </Button>
            )}
            {!editFromReview && !isFirstStep && (
              <Button
                onClick={onNext}
                isLoading={isSubmitting}
                disabled={nextDisabled}
                rightIcon={!isLastStep ? <ArrowRight className="h-4 w-4" /> : undefined}
                tooltip={isLastStep ? 'Complete your profile setup' : 'Proceed to next step'}
              >
                {nextLabel || (isLastStep ? 'Complete Setup' : 'Continue')}
              </Button>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          Your progress is automatically saved. You can{' '}
          <Tooltip content="Go to your dashboard now">
            <Link href={dashboardPath} className="text-primary hover:underline">
              skip to dashboard
            </Link>
          </Tooltip>{' '}
          and complete later.
        </p>
      </div>
    </div>
  );
}
