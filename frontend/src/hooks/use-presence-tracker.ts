'use client';

import { useEffect } from 'react';
import { getFirebaseDatabase, signInToFirebase, signOutFirebase } from '@/lib/firebase';
import { ref, set, onValue, onDisconnect, serverTimestamp } from 'firebase/database';
import { useAuthStore } from '@/store/auth.store';

const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Tracks the current user's online presence in Firebase RTDB.
 *
 * - Signs into Firebase Auth (custom token) before writing presence
 * - Uses `.info/connected` to detect connection state
 * - Sets `onDisconnect` handler so Firebase automatically marks user offline
 *   when browser closes / network drops (no explicit logout needed)
 * - Heartbeats every 5 min to keep `lastSeen` fresh while online
 */
export function usePresenceTracker() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const db = getFirebaseDatabase();
    if (!db) return;

    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    // Sign into Firebase Auth first, then start presence tracking
    signInToFirebase()
      .then(() => {
        if (cancelled) return;

        const presenceRef = ref(db, `presence/${userId}`);
        const connectedRef = ref(db, '.info/connected');

        unsubscribe = onValue(connectedRef, (snapshot) => {
          if (!snapshot.val()) {
            if (heartbeatTimer) {
              clearInterval(heartbeatTimer);
              heartbeatTimer = null;
            }
            return;
          }

          // Set up onDisconnect handler — Firebase server writes this when connection drops
          onDisconnect(presenceRef).set({
            online: false,
            lastSeen: serverTimestamp(),
          });

          // Mark as online
          set(presenceRef, {
            online: true,
            lastSeen: serverTimestamp(),
          });

          // Start heartbeat to keep lastSeen fresh
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          heartbeatTimer = setInterval(() => {
            set(presenceRef, {
              online: true,
              lastSeen: serverTimestamp(),
            });
          }, HEARTBEAT_INTERVAL);
        });
      })
      .catch(() => {
        // Firebase sign-in failed — presence tracking disabled for this session
      });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      // Set offline on unmount (explicit logout / auth change)
      const presenceRef = ref(db, `presence/${userId}`);
      set(presenceRef, {
        online: false,
        lastSeen: serverTimestamp(),
      }).catch(() => {});
    };
  }, [isAuthenticated, userId]);
}
