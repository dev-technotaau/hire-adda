'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Menu, ChevronDown, LogOut, ExternalLink, Keyboard, Home,
    Search, PanelLeftClose, PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useUIStore } from '@/store/ui.store';
import { ROUTES, ROLE_DASHBOARDS } from '@/constants/routes';
import { ROLE_LABELS } from '@/constants/enums';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Logo from '@/components/common/Logo';
import NotificationBell from '@/components/notifications/NotificationBell';
import SearchBar from '@/components/ui/SearchBar';
import AutoSuggest from '@/components/ui/AutoSuggest';
import { useSuggestLocations } from '@/hooks/use-search';
import type { Role } from '@/types/auth';
import type { AutocompleteResult } from '@/types/search';

const ROLE_BADGE_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
    CANDIDATE: 'info',
    EMPLOYER: 'success',
    ADMIN: 'warning',
    SUPER_ADMIN: 'error',
};

const SEARCH_ROUTES: Record<string, string> = {
    CANDIDATE: ROUTES.CANDIDATE.JOBS,
    EMPLOYER: ROUTES.EMPLOYER.CANDIDATES,
};

export default function DashboardHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const { sidebarCollapsed, toggleSidebarCollapsed, setSidebarOpen } = useUIStore();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [location, setLocation] = useState('');
    const [locationInput, setLocationInput] = useState('');

    const dashboardPath = user?.role ? ROLE_DASHBOARDS[user.role as Role] : '/';
    const hasSearchPage = user?.role === 'CANDIDATE' || user?.role === 'EMPLOYER';
    const searchType = user?.role === 'EMPLOYER' ? 'candidates' as const : 'jobs' as const;
    const searchPlaceholder = user?.role === 'EMPLOYER'
        ? 'Search candidates, skills...'
        : 'Job title, skills, company...';

    const { data: locationSuggestions, isLoading: isLoadingLocations } = useSuggestLocations(locationInput);

    const locationOptions = useMemo(
        () =>
            (locationSuggestions?.data?.suggestions ?? []).map((s) => ({
                label: s.text,
                value: s.text,
                count: s.count,
            })),
        [locationSuggestions]
    );

    // Close user menu on route change
    useEffect(() => {
        setUserMenuOpen(false);
    }, [pathname]);

    // Close user menu on Escape key
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') setUserMenuOpen(false);
    }, []);

    useEffect(() => {
        if (userMenuOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [userMenuOpen, handleEscape]);

    const navigateToSearch = useCallback((query: string) => {
        if (!user?.role) return;
        const basePath = SEARCH_ROUTES[user.role];
        if (!basePath) return;
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (location) params.set('location', location);
        const qs = params.toString();
        router.push(qs ? `${basePath}?${qs}` : basePath);
    }, [user?.role, location, router]);

    const handleSearch = useCallback((query: string) => {
        navigateToSearch(query);
    }, [navigateToSearch]);

    const handleSelect = useCallback((item: AutocompleteResult) => {
        navigateToSearch(item.text);
    }, [navigateToSearch]);

    const handleLocationChange = useCallback((value: string | string[]) => {
        const loc = typeof value === 'string' ? value : value[0] || '';
        setLocation(loc);
    }, []);

    const openCommandPalette = () => {
        document.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
        );
    };

    if (!user) return null;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-white">
            <div className="flex h-16 items-center gap-3 px-4">
                {/* Left section */}
                <div className="flex shrink-0 items-center gap-2">
                    {/* Mobile sidebar toggle */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] lg:hidden"
                        aria-label="Open sidebar"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Desktop sidebar collapse toggle */}
                    <button
                        onClick={toggleSidebarCollapsed}
                        className="hidden rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] lg:flex"
                        aria-label="Toggle sidebar"
                    >
                        {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                    </button>

                    <Logo size="sm" href={dashboardPath} />
                </div>

                {/* Center — Search section */}
                {hasSearchPage ? (
                    <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
                        <div className="w-full max-w-sm">
                            <SearchBar
                                placeholder={searchPlaceholder}
                                searchType={searchType}
                                onSearch={handleSearch}
                                onSelect={handleSelect}
                                size="sm"
                                fullWidth
                            />
                        </div>
                        <div className="hidden w-full max-w-[200px] lg:block">
                            <AutoSuggest
                                placeholder="Location"
                                value={location}
                                onChange={handleLocationChange}
                                suggestions={locationOptions}
                                isLoading={isLoadingLocations}
                                onInputChange={setLocationInput}
                                allowCreate
                                createLabel={(q) => `Search in "${q}"`}
                                minChars={2}
                                inputSize="sm"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="hidden min-w-0 flex-1 md:block">
                        {/* Ctrl+K trigger for admin/super-admin */}
                        <button
                            onClick={openCommandPalette}
                            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--text-muted)] hover:bg-white"
                        >
                            <Search className="h-4 w-4" />
                            <span className="hidden lg:inline">Search...</span>
                            <kbd className="ml-4 hidden rounded border border-[var(--border)] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] lg:inline-flex">
                                Ctrl K
                            </kbd>
                        </button>
                    </div>
                )}

                {/* Spacer for mobile */}
                <div className="flex-1 md:hidden" />

                {/* Right section */}
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    {/* Mobile search icon — navigates to search page */}
                    {hasSearchPage && (
                        <button
                            onClick={() => router.push(SEARCH_ROUTES[user.role] || '/')}
                            className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] md:hidden"
                            aria-label="Search"
                        >
                            <Search className="h-5 w-5" />
                        </button>
                    )}

                    <NotificationBell />

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-[var(--bg-secondary)]"
                            aria-expanded={userMenuOpen}
                            aria-haspopup="true"
                        >
                            <Avatar
                                src={user.avatar}
                                firstName={user.firstName}
                                lastName={user.lastName}
                                size="sm"
                            />
                            <div className="hidden items-center gap-2 xl:flex">
                                <span className="text-sm font-medium text-[var(--text)]">
                                    {user.firstName}
                                </span>
                                <Badge variant={ROLE_BADGE_VARIANT[user.role] || 'info'} size="sm">
                                    {ROLE_LABELS[user.role] || user.role}
                                </Badge>
                            </div>
                            <ChevronDown
                                className={cn(
                                    'hidden h-4 w-4 text-[var(--text-muted)] transition-transform sm:block',
                                    userMenuOpen && 'rotate-180'
                                )}
                            />
                        </button>

                        {userMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                                <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-lg animate-scale-in">
                                    {/* User info */}
                                    <div className="border-b border-[var(--border)] px-4 py-3">
                                        <p className="text-sm font-medium text-[var(--text)]">
                                            {user.firstName} {user.lastName}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                                        <Badge
                                            variant={ROLE_BADGE_VARIANT[user.role] || 'info'}
                                            size="sm"
                                            className="mt-1.5"
                                        >
                                            {ROLE_LABELS[user.role] || user.role}
                                        </Badge>
                                    </div>

                                    {/* View Public Profile — candidates & employers only */}
                                    {(user.role === 'CANDIDATE' || user.role === 'EMPLOYER') && (
                                        <Link
                                            href={user.role === 'CANDIDATE' ? ROUTES.CANDIDATE.PROFILE_PREVIEW : ROUTES.EMPLOYER.PROFILE}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            View Public Profile
                                        </Link>
                                    )}

                                    {/* Keyboard Shortcuts */}
                                    <button
                                        onClick={() => { setUserMenuOpen(false); openCommandPalette(); }}
                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                                    >
                                        <Keyboard className="h-4 w-4" />
                                        <span className="flex-1 text-left">Keyboard Shortcuts</span>
                                        <kbd className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                                            Ctrl K
                                        </kbd>
                                    </button>

                                    {/* Visit Homepage */}
                                    <Link
                                        href={ROUTES.PUBLIC.HOME}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                                        onClick={() => setUserMenuOpen(false)}
                                    >
                                        <Home className="h-4 w-4" />
                                        Visit Homepage
                                    </Link>

                                    <div className="border-t border-[var(--border)]">
                                        <button
                                            onClick={() => { setUserMenuOpen(false); logout(); }}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-error transition-colors hover:bg-error-light"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
