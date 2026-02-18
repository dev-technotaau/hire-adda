'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { Toaster } from '@/components/ui/Toast';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useAuthStore } from '@/store/auth.store';
import { useSocket } from '@/hooks/use-socket';
import { pageView } from '@/lib/analytics';
import { pushService } from '@/services/push.service';
import { useFeatureFlags } from '@/hooks/use-feature-flags';

function FeatureFlagPrefetcher({ children }: { children: ReactNode }) {
    // Pre-fetch feature flags on app init (cached for 5 min by React Query)
    useFeatureFlags();
    return <>{children}</>;
}

function AuthHydrator({ children }: { children: ReactNode }) {
    const hydrate = useAuthStore((s) => s.hydrate);
    const isHydrated = useAuthStore((s) => s.isHydrated);

    useEffect(() => {
        if (!isHydrated) {
            hydrate();
        }
    }, [hydrate, isHydrated]);

    return <>{children}</>;
}

function SocketInitializer({ children }: { children: ReactNode }) {
    useSocket();
    return <>{children}</>;
}

function AnalyticsTracker({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    useEffect(() => {
        pageView(pathname);
    }, [pathname]);

    return <>{children}</>;
}

function PushNotificationRegistrar({ children }: { children: ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    useEffect(() => {
        if (isAuthenticated) {
            pushService.requestPermissionAndSubscribe().catch(() => {
                // Silent failure - push notifications are optional
            });
        }
    }, [isAuthenticated]);

    return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
    const queryClient = getQueryClient();

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <FeatureFlagPrefetcher>
                    <AuthHydrator>
                        <AnalyticsTracker>
                            <SocketInitializer>
                                <PushNotificationRegistrar>
                                    {children}
                                </PushNotificationRegistrar>
                            </SocketInitializer>
                        </AnalyticsTracker>
                    </AuthHydrator>
                </FeatureFlagPrefetcher>
                <Toaster />
            </QueryClientProvider>
        </ErrorBoundary>
    );
}
