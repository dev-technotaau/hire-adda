'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { Toaster } from '@/components/ui/Toast';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useAuthStore } from '@/store/auth.store';
import { useMaintenanceStore } from '@/store/maintenance.store';
import { useSocket } from '@/hooks/use-socket';
import { onAuthMessage } from '@/lib/auth-channel';
import { pageView, fbPageView } from '@/lib/analytics';
import { useFeatureFlags } from '@/hooks/use-feature-flags';
import { QUERY_KEYS } from '@/constants/config';

/**
 * Lazy-loaded modules — kept out of the initial bundle.
 *
 * `MaintenancePage` pulls framer-motion (~80 KiB) and only renders when
 * a feature flag or 503 fires; meanwhile `FirebaseSideEffects` pulls the
 * Firebase SDK (~250 KiB across auth/messaging/database/firestore) and
 * its work (presence tracking + FCM listener) is gated by an authenticated
 * session anyway. Keeping them eager was the largest contributor to
 * Lighthouse's "Reduce unused JavaScript" audit on the home page.
 *
 * `loading: () => null` is correct here — both render `null`/no-UI on the
 * first frame of work, so there's no skeleton to show.
 */
const MaintenancePage = dynamic(() => import('@/components/common/MaintenancePage'), {
  ssr: false,
  loading: () => null,
});
const FirebaseSideEffects = dynamic(() => import('./firebase-side-effects'), {
  ssr: false,
  loading: () => null,
});

/**
 * Lazy-import the Firebase signOut helper. Only the cross-tab logout path
 * needs it, so importing it eagerly would defeat the dynamic split above.
 */
async function lazySignOutFirebase(): Promise<void> {
  try {
    const { signOutFirebase } = await import('@/lib/firebase');
    await signOutFirebase();
  } catch {
    /* ignore — Firebase signOut is best-effort */
  }
}

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

const BYPASS_STORAGE_KEY = 'ha_maintenance_bypass';

function MaintenanceGate({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const { data: flags, isPending, dataUpdatedAt } = useFeatureFlags();
  const maintenanceFlag = flags?.maintenanceMode === true;
  const apiTriggered = useMaintenanceStore((s) => s.isMaintenanceMode);
  const clearMaintenance = useMaintenanceStore((s) => s.clearMaintenanceMode);
  const user = useAuthStore((s) => s.user);

  // One-shot state: once feature flags resolve, never show the spinner again
  // (setState during render — React's getDerivedStateFromProps pattern)
  const [resolved, setResolved] = useState(false);
  if (!isPending && !resolved) {
    setResolved(true);
  }

  // Track when the 503 trigger happened so we only trust flags fetched AFTER it
  const triggerTimestamp = useRef<number>(0);

  // When a 503 triggers maintenance, invalidate feature flags to force a fresh fetch
  useEffect(() => {
    if (apiTriggered) {
      triggerTimestamp.current = Date.now();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEATURE_FLAGS.CLIENT });
    }
  }, [apiTriggered, queryClient]);

  // Only clear apiTriggered if flags were fetched AFTER the 503 trigger and confirm maintenance is OFF
  useEffect(() => {
    if (
      !isPending &&
      !maintenanceFlag &&
      apiTriggered &&
      dataUpdatedAt > triggerTimestamp.current
    ) {
      clearMaintenance();
    }
  }, [isPending, maintenanceFlag, apiTriggered, clearMaintenance, dataUpdatedAt]);

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

  const isBypassed = isAdminRole || hasBypassKey;

  // If API triggered maintenance AND flags haven't resolved yet, show immediately
  // Once flags resolve, they become the source of truth (useEffect above clears stale state)
  if (apiTriggered && !resolved && !isBypassed) {
    return (
      <MaintenancePage
        message={flags?.maintenanceMessage as string}
        estimatedReturnTime={flags?.maintenanceReturnTime as string}
      />
    );
  }

  // Block rendering ONLY on initial load (state ensures this never re-triggers)
  if (!resolved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--primary)]" />
      </div>
    );
  }

  // Feature-flag path OR api-triggered (when flags also confirm maintenance)
  if ((maintenanceFlag || apiTriggered) && !isBypassed) {
    return (
      <MaintenancePage
        message={flags?.maintenanceMessage as string}
        estimatedReturnTime={flags?.maintenanceReturnTime as string}
      />
    );
  }

  return <>{children}</>;
}

function AuthSyncListener({ children }: { children: ReactNode }) {
  const storeLogin = useAuthStore((s) => s.login);
  const storeLogout = useAuthStore((s) => s.logout);

  useEffect(() => {
    return onAuthMessage((msg) => {
      if (msg.type === 'logout' || msg.type === 'session_expired') {
        // Lazy-import the Firebase signOut so this listener doesn't drag
        // the SDK into the initial bundle just to handle cross-tab logout.
        void lazySignOutFirebase();
        getQueryClient().clear();
        storeLogout();
      } else if (msg.type === 'login') {
        getQueryClient().clear();
        storeLogin(msg.user);
      }
    });
  }, [storeLogin, storeLogout]);

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
    fbPageView();
  }, [pathname]);

  return <>{children}</>;
}

// `PresenceTracker` and `PushNotificationRegistrar` previously lived here
// and ran their side effects via wrappers. They've been extracted to
// `firebase-side-effects.tsx` and are now mounted as a single sibling
// `<FirebaseSideEffects />` rendered alongside `children` in the tree
// below. This lets `next/dynamic` keep the Firebase SDK out of the
// initial bundle without changing what runs when.

function ServiceWorkerRegistrar({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ServiceWorkerRegistrar>
          <FeatureFlagPrefetcher>
            <AuthHydrator>
              <AuthSyncListener>
                <MaintenanceGate>
                  <AnalyticsTracker>
                    <SocketInitializer>
                      {/* Firebase-using effects are mounted as a sibling
                          (rather than a wrapper) so the Firebase SDK stays
                          dynamically imported. Functionally equivalent to
                          the previous wrapper chain. */}
                      <FirebaseSideEffects />
                      {children}
                    </SocketInitializer>
                  </AnalyticsTracker>
                </MaintenanceGate>
              </AuthSyncListener>
            </AuthHydrator>
          </FeatureFlagPrefetcher>
        </ServiceWorkerRegistrar>
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
