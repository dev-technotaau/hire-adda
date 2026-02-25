'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { Toaster } from '@/components/ui/Toast';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useAuthStore } from '@/store/auth.store';
import { useMaintenanceStore } from '@/store/maintenance.store';
import { useSocket } from '@/hooks/use-socket';
import { pageView } from '@/lib/analytics';
import { pushService } from '@/services/push.service';
import { useFeatureFlags, useFeatureFlag } from '@/hooks/use-feature-flags';
import { onFCMMessage } from '@/lib/firebase';
import { showToast } from '@/components/ui/Toast';
import MaintenancePage from '@/components/common/MaintenancePage';

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

const BYPASS_STORAGE_KEY = 'tb_maintenance_bypass';

function MaintenanceGate({ children }: { children: ReactNode }) {
    const maintenanceFlag = useFeatureFlag('maintenanceMode', false);
    const apiTriggered = useMaintenanceStore((s) => s.isMaintenanceMode);
    const user = useAuthStore((s) => s.user);

    // Admin bypass: ADMIN/SUPER_ADMIN users skip maintenance
    const isAdminRole = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    // URL param bypass: ?bypass_maintenance=<key> persisted in sessionStorage
    const [hasBypassKey, setHasBypassKey] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const key = params.get('bypass_maintenance');
        const bypassSecret = process.env.NEXT_PUBLIC_MAINTENANCE_BYPASS_KEY;
        if (key && bypassSecret && key === bypassSecret) {
            sessionStorage.setItem(BYPASS_STORAGE_KEY, '1');
            queueMicrotask(() => setHasBypassKey(true));
        } else if (sessionStorage.getItem(BYPASS_STORAGE_KEY) === '1') {
            queueMicrotask(() => setHasBypassKey(true));
        }
    }, []);

    const isActive = maintenanceFlag || apiTriggered;
    const isBypassed = isAdminRole || hasBypassKey;

    if (isActive && !isBypassed) {
        return <MaintenancePage />;
    }

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

    // Listen for foreground FCM messages and show toast
    useEffect(() => {
        if (!isAuthenticated) return;

        const unsubscribe = onFCMMessage((payload) => {
            showToast.info(payload.title || 'New Notification', {
                description: payload.body,
            });
        });

        return () => { if (unsubscribe) unsubscribe(); };
    }, [isAuthenticated]);

    // Send Firebase config to service worker for background messages
    useEffect(() => {
        if (typeof window === 'undefined' || !navigator.serviceWorker) return;

        navigator.serviceWorker.ready.then((registration) => {
            registration.active?.postMessage({
                type: 'FIREBASE_CONFIG',
                config: {
                    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
                    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
                    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
                    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
                    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
                },
            });
        }).catch(() => {});
    }, []);

    return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
    const queryClient = getQueryClient();

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <FeatureFlagPrefetcher>
                    <AuthHydrator>
                        <MaintenanceGate>
                            <AnalyticsTracker>
                                <SocketInitializer>
                                    <PushNotificationRegistrar>
                                        {children}
                                    </PushNotificationRegistrar>
                                </SocketInitializer>
                            </AnalyticsTracker>
                        </MaintenanceGate>
                    </AuthHydrator>
                </FeatureFlagPrefetcher>
                <Toaster />
            </QueryClientProvider>
        </ErrorBoundary>
    );
}
