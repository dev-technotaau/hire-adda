'use client';

import Logo from '@/components/common/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex flex-1 flex-col bg-[var(--bg-secondary)]">
      {/* Minimal header */}
      <header className="flex h-16 items-center px-4 sm:px-6">
        <Logo />
      </header>

      {/* Centered content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Minimal footer */}
      <footer className="py-4 text-center text-sm text-[var(--text-muted)]">
        &copy; {new Date().getFullYear()} TalentBridge. All rights reserved.
      </footer>
    </div>
  );
}
