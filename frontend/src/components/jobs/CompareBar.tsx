'use client';

import { X, GitCompareArrows } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { Job } from '@/types/job';

interface CompareBarProps {
    jobs: Job[];
    onRemove: (jobId: string) => void;
    onClear: () => void;
    onCompare: () => void;
}

export default function CompareBar({ jobs, onRemove, onClear, onCompare }: CompareBarProps) {
    if (jobs.length === 0) return null;

    return (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border)] bg-white/95 backdrop-blur-sm shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
            <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
                <GitCompareArrows className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-[var(--text-secondary)] shrink-0">
                    Compare ({jobs.length}/3)
                </span>

                <div className="flex flex-1 items-center gap-2 overflow-x-auto">
                    {jobs.map((job) => (
                        <span
                            key={job.id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1 text-xs text-[var(--text)] whitespace-nowrap"
                        >
                            {job.title}
                            <button
                                type="button"
                                onClick={() => onRemove(job.id)}
                                className="rounded-full p-0.5 hover:bg-[var(--bg-tertiary)] transition-colors"
                                aria-label={`Remove ${job.title} from comparison`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={onClear} className="text-xs">
                        Clear
                    </Button>
                    <Button size="sm" onClick={onCompare} disabled={jobs.length < 2} className="text-xs">
                        Compare
                    </Button>
                </div>
            </div>
        </div>
    );
}
