'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { User } from '@/types/auth';

const ROLE_DASHBOARDS: Record<string, string> = {
  CANDIDATE: '/candidate',
  EMPLOYER: '/employer',
  ADMIN: '/admin',
  SUPER_ADMIN: '/super-admin',
};

/**
 * Client-side redirect for authenticated users landing on the public home page.
 * Covers edge cases where the browser serves a cached page (bypassing middleware).
 */
export default function AuthHomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!document.cookie.includes('tb_auth_session=1')) return;
    const user = storage.get<User>(STORAGE_KEYS.USER);
    const dashboard = user?.role && ROLE_DASHBOARDS[user.role];
    if (dashboard) {
      router.replace(dashboard);
    }
  }, [router]);

  return null;
}
