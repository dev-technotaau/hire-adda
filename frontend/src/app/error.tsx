'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
        trackEvent('page_error', 'error', error.message);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-error-light">
                    <AlertTriangle className="h-10 w-10 text-error" />
                </div>
                <h1 className="mb-2 text-2xl font-bold text-[var(--text)]">Something went wrong</h1>
                <p className="mb-8 max-w-md text-[var(--text-secondary)]">
                    An unexpected error occurred. Please try again or contact support if the problem persists.
                </p>
                {error.digest && (
                    <p className="mb-4 text-xs text-[var(--text-muted)]">
                        Error ID: {error.digest}
                    </p>
                )}
                <div className="flex items-center justify-center gap-3">
                    <Button onClick={reset} leftIcon={<RefreshCw className="h-4 w-4" />}>
                        Try Again
                    </Button>
                    <Button variant="outline" onClick={() => { window.location.href = '/'; }} leftIcon={<Home className="h-4 w-4" />}>
                        Go Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
