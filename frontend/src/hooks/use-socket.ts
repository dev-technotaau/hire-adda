'use client';

import { useEffect, useSyncExternalStore, useCallback, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { QUERY_KEYS } from '@/constants/config';
import { APP_CONFIG } from '@/constants/config';
import { showToast } from '@/components/ui/Toast';

let globalSocket: Socket | null = null;
let socketState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return globalSocket;
}

function getServerSnapshot() {
  return null;
}

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

/** Fetch socket token from BFF (reads httpOnly cookie server-side) */
async function fetchSocketToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/socket-token', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.socketToken || null;
  } catch {
    return null;
  }
}

export function useSocket() {
  const queryClient = useQueryClient();
  const socket = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        socketState = 'disconnected';
        tokenRef.current = null;
        notifyListeners();
      }
      return;
    }

    // Return existing socket if already connecting or connected
    if (globalSocket && (socketState === 'connecting' || socketState === 'connected')) {
      return;
    }

    let cancelled = false;

    (async () => {
      const token = await fetchSocketToken();
      if (cancelled || !token) return;

      tokenRef.current = token;
      socketState = 'connecting';

      const newSocket = io(APP_CONFIG.socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        socketState = 'connected';
      });

      newSocket.on('disconnect', () => {
        socketState = 'disconnected';
      });

      newSocket.on('connect_error', async () => {
        socketState = 'disconnected';
        // Token may have expired — refetch on reconnect attempt
        const freshToken = await fetchSocketToken();
        if (freshToken && newSocket) {
          tokenRef.current = freshToken;
          newSocket.auth = { token: freshToken };
        }
      });

      newSocket.on('notification', (data: { title: string; message: string }) => {
        showToast.info(`${data.title}: ${data.message}`);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.UNREAD_COUNT });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.LIST });
      });

      newSocket.on('application_update', () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.APPLIED });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.LIST });
      });

      globalSocket = newSocket;
      notifyListeners();
    })();

    return () => {
      cancelled = true;
      // Don't disconnect on unmount — keep alive for app lifecycle
    };
  }, [isAuthenticated, queryClient]);

  const emit = useCallback((event: string, data?: unknown) => {
    globalSocket?.emit(event, data);
  }, []);

  return { socket, emit };
}
