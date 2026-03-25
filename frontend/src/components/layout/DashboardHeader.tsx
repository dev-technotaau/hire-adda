'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, ChevronDown, LogOut, ExternalLink, Keyboard, Home, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useUIStore } from '@/store/ui.store';
import { ROUTES, ROLE_DASHBOARDS } from '@/constants/routes';
import { ROLE_LABELS } from '@/constants/enums';
import { QUERY_KEYS } from '@/constants/config';
import { employerService } from '@/services/employer.service';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
import Logo from '@/components/common/Logo';
import NotificationBell from '@/components/notifications/NotificationBell';
import SearchBar from '@/components/ui/SearchBar';
import AutoSuggest from '@/components/ui/AutoSuggest';
import ExperienceSelect, { type ExperienceValue } from '@/components/ui/ExperienceSelect';
import { useSuggestLocations } from '@/hooks/use-search';
import { useSuggest, useStaticSuggestions } from '@/hooks/use-suggestions';
import {
  useFieldHistory,
  useAddToFieldHistory,
  useClearFieldHistory,
} from '@/hooks/use-field-history';
import type { Role } from '@/types/auth';
import type { AutocompleteResult } from '@/types/search';

const ROLE_BADGE_VARIANT: Record<
  string,
  'info' | 'success' | 'warning' | 'error' | 'secondary' | 'accent'
> = {
  CANDIDATE: 'info',
  EMPLOYER: 'accent',
  ADMIN: 'secondary',
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
  const { setSidebarOpen } = useUIStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [experience, setExperience] = useState<ExperienceValue | null>(null);

  const { data: companyData } = useQuery({
    queryKey: QUERY_KEYS.EMPLOYERS.COMPANY,
    queryFn: () => employerService.getCompany(),
    enabled: user?.role === 'EMPLOYER',
    staleTime: 10 * 60 * 1000,
  });
  // Use query data when available, fall back to auth store (available immediately after login)
  const companyLogo = companyData?.data?.logo ?? user?.companyProfile?.logo;

  const dashboardPath = user?.role ? ROLE_DASHBOARDS[user.role as Role] : '/';
  const hasSearchPage = user?.role === 'CANDIDATE' || user?.role === 'EMPLOYER';
  const searchType = user?.role === 'EMPLOYER' ? ('candidates' as const) : ('jobs' as const);
  const searchPlaceholder =
    user?.role === 'EMPLOYER' ? 'Search candidates, skills...' : 'Job title, skills, company...';

  const { data: locationSuggestions, isLoading: isLoadingLocations } =
    useSuggestLocations(locationInput);

  const locationOptions = useMemo(
    () =>
      (locationSuggestions?.data?.suggestions ?? []).map((s) => ({
        label: s.text,
        value: s.text,
        count: s.count,
      })),
    [locationSuggestions],
  );

  const { suggestions: esSuggestions, isLoading: isLoadingEsSuggestions } = useSuggest({
    category: 'location',
    query: locationInput,
    limit: 10,
    minChars: 2,
  });
  const locationAdditionalSections = useMemo(
    () =>
      locationInput.length >= 2
        ? [
            {
              label: 'Suggestions',
              options: esSuggestions.map((s) => ({ label: s, value: s })),
              isLoading: isLoadingEsSuggestions,
            },
          ]
        : [],
    [locationInput, esSuggestions, isLoadingEsSuggestions],
  );

  // ── Focus sections: Recent Locations + Popular Locations ──
  const { data: locationHistory } = useFieldHistory('location');
  const addLocationHistory = useAddToFieldHistory('location');
  const clearLocationHistory = useClearFieldHistory('location');
  const { suggestions: popularLocations, isLoading: isLoadingPopular } = useStaticSuggestions(
    'location',
    8,
  );

  const locationFocusSections = useMemo(() => {
    const sections: import('@/components/ui/AutoSuggest').AdditionalSuggestSection[] = [];
    const historyItems = locationHistory?.data?.history ?? [];
    if (user && historyItems.length > 0) {
      sections.push({
        label: 'Recent Locations',
        options: historyItems.map((h) => ({ label: h.value, value: h.value })),
        onClear: () => clearLocationHistory.mutate(),
      });
    }
    sections.push({
      label: 'Popular Locations',
      options: popularLocations.map((loc) => ({ label: loc, value: loc })),
      isLoading: isLoadingPopular,
    });
    return sections;
  }, [user, locationHistory, popularLocations, isLoadingPopular, clearLocationHistory]);

  // Close user menu on route change (adjust-state-during-render pattern)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setUserMenuOpen(false);
  }

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

  const navigateToSearch = useCallback(
    (query: string) => {
      if (!user?.role) return;
      const basePath = SEARCH_ROUTES[user.role];
      if (!basePath) return;
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (location) params.set('location', location);
      if (experience) {
        if (user.role === 'CANDIDATE') {
          // Job search uses single "experience" string like "3-5" or "12+"
          params.set(
            'experience',
            experience.max != null ? `${experience.min}-${experience.max}` : `${experience.min}+`,
          );
        } else {
          // Candidate search uses separate experienceMin/experienceMax
          params.set('experienceMin', String(experience.min));
          if (experience.max != null) params.set('experienceMax', String(experience.max));
        }
      }
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    },
    [user, location, experience, router],
  );

  const handleSearch = useCallback(
    (query: string) => {
      navigateToSearch(query);
    },
    [navigateToSearch],
  );

  const handleSelect = useCallback(
    (item: AutocompleteResult) => {
      navigateToSearch(item.text);
    },
    [navigateToSearch],
  );

  const handleLocationChange = useCallback(
    (value: string | string[]) => {
      const loc = typeof value === 'string' ? value : value[0] || '';
      setLocation(loc);
      if (loc) addLocationHistory.mutate(loc);
    },
    [addLocationHistory],
  );

  const openCommandPalette = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }),
    );
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-white">
      <div className="flex h-16 items-center gap-3 px-4">
        {/* Left section */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Mobile sidebar toggle */}
          <Tooltip content="Open sidebar">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          </Tooltip>

          <Logo size="md" href={dashboardPath} />
        </div>

        {/* Center — Search section */}
        {hasSearchPage ? (
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 px-6 md:flex">
            <div className="w-full max-w-sm">
              <SearchBar
                placeholder={searchPlaceholder}
                searchType={searchType}
                onSearch={handleSearch}
                onSelect={handleSelect}
                fullWidth
              />
            </div>
            <div className="hidden w-36 shrink-0 lg:block">
              <ExperienceSelect
                value={experience}
                onChange={setExperience}
                size="sm"
                className="w-full"
              />
            </div>
            <div className="hidden w-full max-w-[220px] lg:block">
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
                additionalSections={locationAdditionalSections}
                focusSections={locationFocusSections}
              />
            </div>
          </div>
        ) : (
          <div className="hidden min-w-0 flex-1 px-6 md:block">
            {/* Ctrl+K trigger for admin/super-admin */}
            <Tooltip content="Open command palette (Ctrl+K)">
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
            </Tooltip>
          </div>
        )}

        {/* Spacer for mobile */}
        <div className="flex-1 md:hidden" />

        {/* Right section */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Mobile search icon — navigates to search page */}
          {hasSearchPage && (
            <Tooltip content="Search">
              <button
                onClick={() => router.push(SEARCH_ROUTES[user.role] || '/')}
                className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] md:hidden"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            </Tooltip>
          )}

          <NotificationBell />

          {/* User menu */}
          <div className="relative">
            <Tooltip content="Open user menu">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-[var(--bg-secondary)]"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                {companyLogo && (
                  <img
                    src={companyLogo}
                    alt="Company"
                    loading="lazy"
                    className="h-8 w-8 rounded-md border border-[var(--border)] object-contain"
                  />
                )}
                <Avatar
                  src={user.avatar}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  size="sm"
                />
                <div className="hidden items-center gap-2 xl:flex">
                  <span className="text-sm font-medium text-[var(--text)]">{user.firstName}</span>
                  <Badge variant={ROLE_BADGE_VARIANT[user.role] || 'info'} size="sm">
                    {ROLE_LABELS[user.role] || user.role}
                  </Badge>
                </div>
                <ChevronDown
                  className={cn(
                    'hidden h-4 w-4 text-[var(--text-muted)] transition-transform sm:block',
                    userMenuOpen && 'rotate-180',
                  )}
                />
              </button>
            </Tooltip>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="animate-scale-in absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-lg">
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
                      href={
                        user.role === 'CANDIDATE'
                          ? ROUTES.CANDIDATE.PROFILE_PREVIEW
                          : ROUTES.EMPLOYER.PROFILE
                      }
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Public Profile
                    </Link>
                  )}

                  {/* Keyboard Shortcuts */}
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      openCommandPalette();
                    }}
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
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="text-error hover:bg-error-light flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors"
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
