'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useUnreadCount } from '@/hooks/use-notifications';
import NotificationDropdown from './NotificationDropdown';

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { data } = useUnreadCount();
    const count = data?.data?.count || 0;

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="relative rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {count > 0 && (
                    <span
                        role="status"
                        aria-label={`${count} unread notification${count === 1 ? '' : 's'}`}
                        className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--error)] px-1 text-xs font-medium text-white"
                    >
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </button>

            {open && <NotificationDropdown onClose={() => setOpen(false)} />}
        </div>
    );
}
