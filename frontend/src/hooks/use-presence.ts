'use client';

import { useEffect, useState } from 'react';
import { getFirebaseDatabase } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

interface PresenceData {
  online: boolean;
  lastSeen: Date | null;
}

export function usePresence(userId: string | null | undefined): PresenceData {
  const [presence, setPresence] = useState<PresenceData>({
    online: false,
    lastSeen: null,
  });

  useEffect(() => {
    if (!userId) return;

    const db = getFirebaseDatabase();
    if (!db) return;

    const presenceRef = ref(db, `presence/${userId}`);

    const unsubscribe = onValue(
      presenceRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setPresence({
            online: data.online ?? false,
            lastSeen: data.lastSeen ? new Date(data.lastSeen) : null,
          });
        } else {
          setPresence({ online: false, lastSeen: null });
        }
      },
      () => {
        // Silently handle errors (Firebase may not be configured)
        setPresence({ online: false, lastSeen: null });
      },
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return presence;
}
