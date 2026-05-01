'use client';

/**
 * Firebase-using side-effect components, isolated into one module so
 * `next/dynamic` can keep them out of the initial JS bundle.
 *
 * Why split this out:
 *   The Firebase SDKs we use (auth + messaging + database + firestore +
 *   app) sum to ~250 KiB minified gzipped, and Lighthouse measured 270 KiB
 *   of unused JavaScript on the home page — Firebase is the single biggest
 *   contributor because the previous `import { onFCMMessage } from
 *   '@/lib/firebase'` in providers.tsx pulled the entire SDK into the
 *   initial bundle on every page including unauthenticated visits.
 *
 *   This file is loaded by `providers.tsx` via `dynamic({ ssr: false })`
 *   only AFTER first paint. For unauthenticated home-page visitors,
 *   Firebase still doesn't load until they sign in (the components inside
 *   are no-ops when `isAuthenticated === false`).
 *
 *   No functionality changes — the same effects run, just slightly later
 *   than first render.
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { usePresenceTracker } from '@/hooks/use-presence-tracker';
import { onFCMMessage } from '@/lib/firebase';
import { pushService } from '@/services/push.service';
import { showToast } from '@/components/ui/Toast';

/** Tracks online presence in Firebase RTDB. No-op when not authenticated. */
function PresenceTracker() {
  usePresenceTracker();
  return null;
}

/**
 * Registers FCM tokens after sign-in, listens for foreground push messages,
 * and forwards Firebase config to the service worker so background pushes
 * can be handled when no tab is open.
 */
function PushNotificationRegistrar() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      pushService.requestPermissionAndSubscribe().catch(() => {
        // Silent failure — push notifications are optional
      });
    }
  }, [isAuthenticated]);

  // Listen for foreground FCM messages and surface as a toast
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = onFCMMessage((payload) => {
      showToast.info(payload.title || 'New Notification', {
        description: payload.body,
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated]);

  // Forward Firebase config to the service worker so background push
  // delivery works when the tab is closed. Runs once on mount.
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.serviceWorker) return;

    navigator.serviceWorker.ready
      .then((registration) => {
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
      })
      .catch(() => {});
  }, []);

  return null;
}

export default function FirebaseSideEffects() {
  return (
    <>
      <PresenceTracker />
      <PushNotificationRegistrar />
    </>
  );
}
