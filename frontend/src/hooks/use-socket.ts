'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { QUERY_KEYS } from '@/constants/config';
import { APP_CONFIG } from '@/constants/config';
import { showToast } from '@/components/ui/Toast';

let globalSocket: Socket | null = null;

export function useSocket() {
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);
    const accessToken = useAuthStore(s => s.accessToken);
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);

    useEffect(() => {
        if (!isAuthenticated || !accessToken) {
            if (globalSocket) {
                globalSocket.disconnect();
                globalSocket = null;
            }
            return;
        }

        if (globalSocket?.connected) {
            socketRef.current = globalSocket;
            return;
        }

        const socket = io(APP_CONFIG.socketUrl, {
            auth: { token: accessToken },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected');
        });

        socket.on('disconnect', (reason: string) => {
            console.log('[Socket] Disconnected:', reason);
        });

        socket.on('notification', (data: { title: string; message: string }) => {
            showToast.info(`${data.title}: ${data.message}`);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.UNREAD_COUNT });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.LIST });
        });

        socket.on('application_update', () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.APPLIED });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.LIST });
        });

        globalSocket = socket;
        socketRef.current = socket;

        return () => {
            // Don't disconnect on unmount — keep alive for app lifecycle
        };
    }, [isAuthenticated, accessToken, queryClient]);

    const emit = useCallback((event: string, data?: unknown) => {
        globalSocket?.emit(event, data);
    }, []);

    return { socket: socketRef.current, emit };
}
