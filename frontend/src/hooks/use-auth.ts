'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { ROUTES, ROLE_DASHBOARDS } from '@/constants/routes';
import type { LoginRequest, RegisterRequest, Role, User } from '@/types/auth';

const ADMIN_ROLES: Role[] = ['ADMIN', 'SUPER_ADMIN'];

export function useAuth() {
    const router = useRouter();
    const {
        user,
        refreshToken: storedRefreshToken,
        isAuthenticated,
        isLoading,
        isHydrated,
        lastLoginAt,
        login: storeLogin,
        logout: storeLogout,
        setUser,
        setLoading,
        hydrate,
    } = useAuthStore();

    useEffect(() => {
        if (!isHydrated) {
            hydrate();
        }
    }, [isHydrated, hydrate]);

    // Verify token on mount by fetching current user.
    // Skip if login just happened (within 60s) — token is guaranteed fresh.
    useEffect(() => {
        if (isHydrated && isAuthenticated) {
            const freshLogin = lastLoginAt > 0 && Date.now() - lastLoginAt < 60_000;
            if (freshLogin) {
                setLoading(false);
                return;
            }
            authService.getMe()
                .then((res) => {
                    // Backend may wrap user in {user: ...} or return directly
                    const payload = res.data as unknown as Record<string, unknown>;
                    const userData = (payload?.user ?? res.data) as User;
                    setUser(userData);
                })
                .catch((err) => {
                    // Only logout on 401 (invalid/expired token), not on network errors
                    if (err?.statusCode === 401) {
                        storeLogout();
                    } else {
                        // For other errors (network, 500, etc), keep user logged in but stop loading
                        setLoading(false);
                    }
                })
                .finally(() => setLoading(false));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHydrated]);

    const login = useCallback(async (data: LoginRequest, turnstileToken?: string) => {
        const res = await authService.login(data, turnstileToken);
        // Handle MFA requirement — backend returns empty tokens with requireMfa flag
        if (res.data.requireMfa) {
            return res;
        }
        const { user: authUser, accessToken, refreshToken } = res.data;
        storeLogin(authUser, accessToken, refreshToken, data.rememberMe ?? true);
        return res;
    }, [storeLogin]);

    const register = useCallback(async (data: RegisterRequest, turnstileToken?: string) => {
        // Registration no longer returns tokens — user must verify email first
        const res = await authService.register(data, turnstileToken);
        return res;
    }, []);

    const logout = useCallback(async () => {
        const isAdmin = user?.role && ADMIN_ROLES.includes(user.role as Role);
        try {
            await authService.logout(storedRefreshToken || undefined);
        } catch {
            // Continue with local logout even if API fails
        }
        storeLogout();
        router.push(isAdmin ? ROUTES.PORTAL.LOGIN : '/auth/login');
    }, [storeLogout, router, storedRefreshToken, user]);

    const redirectToDashboard = useCallback(() => {
        if (user?.role) {
            const dashboard = ROLE_DASHBOARDS[user.role as Role];
            router.push(dashboard);
        }
    }, [user, router]);

    return {
        user,
        isAuthenticated,
        isLoading: isLoading || !isHydrated,
        login,
        register,
        logout,
        redirectToDashboard,
    };
}
