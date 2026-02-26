'use client';

import { openCookieSettings } from '@/components/common/CookieConsent';

export default function ManageCookiesButton() {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="hover:text-primary text-sm text-[var(--text-secondary)] transition-colors"
    >
      Manage Cookies
    </button>
  );
}
