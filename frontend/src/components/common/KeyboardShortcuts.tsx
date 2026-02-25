'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';

const shortcuts: { label: string; path: string; roles: string[] }[] = [
  { label: 'Search Jobs', path: ROUTES.CANDIDATE.JOBS, roles: ['CANDIDATE'] },
  { label: 'My Applications', path: ROUTES.CANDIDATE.APPLICATIONS, roles: ['CANDIDATE'] },
  { label: 'My Profile', path: ROUTES.CANDIDATE.PROFILE, roles: ['CANDIDATE'] },
  { label: 'Saved Jobs', path: ROUTES.CANDIDATE.SAVED_JOBS, roles: ['CANDIDATE'] },
  { label: 'Post a Job', path: ROUTES.EMPLOYER.POST_JOB, roles: ['EMPLOYER'] },
  { label: 'My Jobs', path: ROUTES.EMPLOYER.MY_JOBS, roles: ['EMPLOYER'] },
  { label: 'Search Candidates', path: ROUTES.EMPLOYER.CANDIDATES, roles: ['EMPLOYER'] },
  { label: 'Company Profile', path: ROUTES.EMPLOYER.PROFILE, roles: ['EMPLOYER'] },
  { label: 'Admin Dashboard', path: ROUTES.ADMIN.DASHBOARD, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { label: 'Manage Users', path: ROUTES.ADMIN.USERS, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { label: 'Notifications', path: ROUTES.NOTIFICATIONS, roles: [] },
  { label: 'Home', path: '/', roles: [] },
  { label: 'Help', path: ROUTES.PUBLIC.HELP, roles: [] },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      queueMicrotask(() => setQuery(''));
    }
  }, [open]);

  const filteredShortcuts = shortcuts.filter((s) => {
    // Filter by role
    if (s.roles.length > 0 && (!user || !s.roles.includes(user.role))) return false;
    // Filter by query
    if (query && !s.label.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const handleSelect = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="animate-scale-in relative z-10 w-full max-w-lg rounded-2xl border border-[var(--border)] bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Search className="h-5 w-5 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
              if (e.key === 'Enter' && filteredShortcuts.length > 0) {
                handleSelect(filteredShortcuts[0].path);
              }
            }}
            className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <button
            onClick={() => setOpen(false)}
            className="text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto p-2">
          {filteredShortcuts.length > 0 ? (
            filteredShortcuts.map((s) => (
              <button
                key={s.path}
                onClick={() => handleSelect(s.path)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
              >
                {s.label}
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-center text-sm text-[var(--text-muted)]">
              No results found
            </p>
          )}
        </div>

        <div className="border-t border-[var(--border)] px-4 py-2">
          <p className="text-xs text-[var(--text-muted)]">
            <kbd className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 font-mono text-xs">
              Ctrl
            </kbd>
            {' + '}
            <kbd className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 font-mono text-xs">K</kbd>
            {' to toggle'}
          </p>
        </div>
      </div>
    </div>
  );
}
