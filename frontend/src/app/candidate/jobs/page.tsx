'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MapPin,
  Filter,
  Briefcase,
  Building2,
  Clock,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  Star,
  Sparkles,
  Bell,
  LayoutList,
  LayoutGrid,
  Users,
  Navigation,
  Map as MapIcon,
  Flame,
  Zap,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Send,
  GitCompareArrows,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useMutation, useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tag from '@/components/ui/Tag';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import SearchBar from '@/components/ui/SearchBar';
import AutoSuggest from '@/components/ui/AutoSuggest';
import AdvancedFilters, {
  ActiveFilterTags,
  type FilterSection,
  type FacetBucket,
} from '@/components/ui/AdvancedFilters';
import { showToast } from '@/components/ui/Toast';
import { useJobSearch, useToggleSaveJob, useSavedJobs, useApplyJob } from '@/hooks/use-jobs';
import { useSuggestLocations, useDidYouMean } from '@/hooks/use-search';
import { useSuggest, useStaticSuggestions } from '@/hooks/use-suggestions';
import { useFieldHistory, useAddToFieldHistory, useClearFieldHistory } from '@/hooks/use-field-history';
import { useAuthStore } from '@/store/auth.store';
import { savedSearchService } from '@/services/saved-search.service';
import { candidateService } from '@/services/candidate.service';
import { recommendationService } from '@/services/recommendation.service';
import { ROUTES } from '@/constants/routes';
import {
  JOB_TYPE_LABELS,
  WORK_MODE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  SHIFT_TYPE_LABELS,
  COMPANY_TYPE_LABELS,
  URGENCY_LEVEL_LABELS,
  EDUCATION_LEVEL_LABELS,
  FUNCTIONAL_AREA_LABELS,
} from '@/constants/enums';
import { formatSalaryRange, formatRelativeDate, truncate } from '@/lib/utils';
import { formatSalaryAsLPA, haversineKm } from '@/utils/format';
import RadiusSlider from '@/components/jobs/RadiusSlider';
import CompareBar from '@/components/jobs/CompareBar';
import CompareModal from '@/components/jobs/CompareModal';
import SwipeableCard from '@/components/jobs/SwipeableCard';
const MapView = dynamic(() => import('@/components/jobs/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl bg-[var(--bg-secondary)]">
      <Skeleton className="h-full w-full" />
    </div>
  ),
});
import { cn } from '@/lib/utils';
import HighlightText from '@/components/ui/HighlightText';
import { PAGINATION, QUERY_KEYS } from '@/constants/config';
import type { JobSearchFilters, Job } from '@/types/job';
import type { ApiError } from '@/types/api';
import type { AutocompleteResult } from '@/types/search';
import type { SearchFacets } from '@/types/search';

/* ─────────────────────── constants ─────────────────────── */

const DATE_POSTED_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: '1', label: 'Last 24h' },
  { value: '3', label: 'Last 3 days' },
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
] as const;

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Best Match' },
  { value: 'date', label: 'Most Recent' },
  { value: 'salary', label: 'Salary: High to Low' },
  { value: 'salary_asc', label: 'Salary: Low to High' },
];

type ViewMode = 'list' | 'compact' | 'map';

/* ─────────────────────── helpers ─────────────────────── */

/** Convert a "days ago" value to an ISO date string for postedAfter. */
function daysToPostedAfter(days: string): string | undefined {
  if (!days) return undefined;
  const d = new Date();
  d.setDate(d.getDate() - Number(days));
  return d.toISOString();
}

/** Check if a job was posted less than N hours ago. */
function isPostedWithin(createdAt: string, hours: number): boolean {
  return Date.now() - new Date(createdAt).getTime() < hours * 3600000;
}

/** Salary range bucket key → { salaryMin, salaryMax } filter values. */
const SALARY_BUCKET_MAP: Record<string, { min: string; max?: string }> = {
  '0-3L': { min: '0', max: '300000' },
  '3-6L': { min: '300000', max: '600000' },
  '6-10L': { min: '600000', max: '1000000' },
  '10-15L': { min: '1000000', max: '1500000' },
  '15-25L': { min: '1500000', max: '2500000' },
  '25-50L': { min: '2500000', max: '5000000' },
  '50L+': { min: '5000000' },
};

/** Experience range bucket key → { min, max } filter values. */
const EXPERIENCE_BUCKET_MAP: Record<string, { min: string; max?: string }> = {
  Fresher: { min: '0', max: '1' },
  '1-3 years': { min: '1', max: '3' },
  '3-5 years': { min: '3', max: '5' },
  '5-8 years': { min: '5', max: '8' },
  '8-12 years': { min: '8', max: '12' },
  '12+ years': { min: '12' },
};

/** Build dynamic options map from facet buckets (e.g. industry, locations). */
function facetToOptions(buckets?: FacetBucket[]): Record<string, string> {
  if (!buckets?.length) return {};
  return Object.fromEntries(buckets.map((b) => [b.key, b.key]));
}

/** Build filter sections from static config + live facets. */
function buildFilterSections(facets: SearchFacets): FilterSection[] {
  return [
    {
      key: 'workMode',
      label: 'Work Mode',
      type: 'multiselect' as const,
      options: WORK_MODE_LABELS,
      facets: facets.workMode,
      collapsible: true,
      defaultOpen: true,
    },
    {
      key: 'type',
      label: 'Job Type',
      type: 'multiselect' as const,
      options: JOB_TYPE_LABELS,
      facets: facets.type,
      collapsible: true,
      defaultOpen: true,
    },
    {
      key: 'experienceLevel',
      label: 'Experience Level',
      type: 'multiselect' as const,
      options: EXPERIENCE_LEVEL_LABELS,
      facets: facets.experienceLevel,
      collapsible: true,
      defaultOpen: true,
    },
    // Salary range buckets from ES (clickable) — falls back to manual range input
    ...(facets.salaryRange?.length
      ? [
          {
            key: 'salaryBucket',
            label: 'Salary Range',
            type: 'radio' as const,
            options: Object.fromEntries(facets.salaryRange.map((b) => [b.key, b.key])),
            facets: facets.salaryRange,
            collapsible: true,
            defaultOpen: true,
          },
        ]
      : [
          {
            key: 'salary',
            label: 'Salary Range',
            type: 'range' as const,
            rangePlaceholderMin: 'e.g. 500000',
            rangePlaceholderMax: 'e.g. 2000000',
            rangePrefix: '₹',
            collapsible: true,
            defaultOpen: false,
          },
        ]),
    // Experience range buckets from ES (clickable)
    ...(facets.experienceRange?.length
      ? [
          {
            key: 'experienceBucket',
            label: 'Experience',
            type: 'radio' as const,
            options: Object.fromEntries(facets.experienceRange.map((b) => [b.key, b.key])),
            facets: facets.experienceRange,
            collapsible: true,
            defaultOpen: false,
          },
        ]
      : []),
    {
      key: 'companyType',
      label: 'Company Type',
      type: 'multiselect' as const,
      options: COMPANY_TYPE_LABELS,
      facets: facets.companyType,
      collapsible: true,
      defaultOpen: false,
    },
    // Industry (dynamic from ES facets)
    ...(facets.industry?.length
      ? [
          {
            key: 'industry',
            label: 'Industry',
            type: 'multiselect' as const,
            options: facetToOptions(facets.industry),
            facets: facets.industry,
            collapsible: true,
            defaultOpen: false,
          },
        ]
      : []),
    // Top Locations (dynamic from ES facets)
    ...(facets.topLocations?.length
      ? [
          {
            key: 'locationFacet',
            label: 'Location',
            type: 'radio' as const,
            options: facetToOptions(facets.topLocations),
            facets: facets.topLocations,
            collapsible: true,
            defaultOpen: false,
          },
        ]
      : []),
    {
      key: 'educationRequired',
      label: 'Education',
      type: 'multiselect' as const,
      options: EDUCATION_LEVEL_LABELS,
      facets: facets.educationRequired,
      collapsible: true,
      defaultOpen: false,
    },
    {
      key: 'shiftType',
      label: 'Shift Type',
      type: 'multiselect' as const,
      options: SHIFT_TYPE_LABELS,
      facets: facets.shiftType,
      collapsible: true,
      defaultOpen: false,
    },
    {
      key: 'urgencyLevel',
      label: 'Urgency',
      type: 'select' as const,
      options: URGENCY_LEVEL_LABELS,
      facets: facets.urgencyLevel,
      collapsible: true,
      defaultOpen: false,
    },
    {
      key: 'functionalArea',
      label: 'Functional Area',
      type: 'multiselect' as const,
      options: FUNCTIONAL_AREA_LABELS,
      facets: facets.functionalArea,
      collapsible: true,
      defaultOpen: false,
    },
    {
      key: 'isPwdFriendly',
      label: 'PwD Friendly',
      type: 'select' as const,
      options: { '': 'All', true: 'PwD Friendly Only', false: 'Not PwD Friendly' },
      collapsible: true,
      defaultOpen: false,
    },
    {
      key: 'isWalkIn',
      label: 'Walk-in Interview',
      type: 'select' as const,
      options: { '': 'All', true: 'Walk-in Available', false: 'No Walk-in' },
      collapsible: true,
      defaultOpen: false,
    },
    {
      key: 'visaSponsorshipAvailable',
      label: 'Visa Sponsorship',
      type: 'select' as const,
      options: { '': 'All', true: 'Visa Sponsored', false: 'No Visa Sponsorship' },
      collapsible: true,
      defaultOpen: false,
    },
    {
      key: 'genderPreference',
      label: 'Gender Preference',
      type: 'select' as const,
      options: {
        '': 'All',
        ANY: 'Any Gender',
        MALE: 'Male',
        FEMALE: 'Female',
        OTHER: 'Other',
      },
      collapsible: true,
      defaultOpen: false,
    },
    {
      key: 'diversityTags',
      label: 'Diversity Tags',
      type: 'multiselect' as const,
      facets: facets.diversityTags,
      collapsible: true,
      defaultOpen: false,
    },
    {
      key: 'noticePeriodPreference',
      label: 'Notice Period',
      type: 'multiselect' as const,
      options: {
        IMMEDIATE: 'Immediate',
        FIFTEEN_DAYS: '15 Days',
        ONE_MONTH: '1 Month',
        TWO_MONTHS: '2 Months',
        THREE_MONTHS: '3 Months',
        NEGOTIABLE: 'Negotiable',
      },
      collapsible: true,
      defaultOpen: false,
    },
  ];
}

/** Flat filter sections (used for ActiveFilterTags). */
const FLAT_FILTER_SECTIONS: FilterSection[] = [
  { key: 'workMode', label: 'Work Mode', type: 'multiselect', options: WORK_MODE_LABELS },
  { key: 'type', label: 'Job Type', type: 'multiselect', options: JOB_TYPE_LABELS },
  {
    key: 'experienceLevel',
    label: 'Experience Level',
    type: 'multiselect',
    options: EXPERIENCE_LEVEL_LABELS,
  },
  {
    key: 'salaryBucket',
    label: 'Salary Range',
    type: 'radio',
    options: Object.fromEntries(Object.keys(SALARY_BUCKET_MAP).map((k) => [k, k])),
  },
  { key: 'salary', label: 'Salary Range', type: 'range', rangePrefix: '₹' },
  {
    key: 'experienceBucket',
    label: 'Experience',
    type: 'radio',
    options: Object.fromEntries(Object.keys(EXPERIENCE_BUCKET_MAP).map((k) => [k, k])),
  },
  { key: 'companyType', label: 'Company Type', type: 'multiselect', options: COMPANY_TYPE_LABELS },
  { key: 'industry', label: 'Industry', type: 'multiselect' },
  {
    key: 'educationRequired',
    label: 'Education',
    type: 'multiselect',
    options: EDUCATION_LEVEL_LABELS,
  },
  { key: 'shiftType', label: 'Shift Type', type: 'multiselect', options: SHIFT_TYPE_LABELS },
  { key: 'urgencyLevel', label: 'Urgency', type: 'select', options: URGENCY_LEVEL_LABELS },
  {
    key: 'functionalArea',
    label: 'Functional Area',
    type: 'multiselect',
    options: FUNCTIONAL_AREA_LABELS,
  },
  { key: 'isPwdFriendly', label: 'PwD Friendly', type: 'select' },
  { key: 'isWalkIn', label: 'Walk-in Interview', type: 'select' },
  { key: 'visaSponsorshipAvailable', label: 'Visa Sponsorship', type: 'select' },
  { key: 'genderPreference', label: 'Gender Preference', type: 'select' },
  { key: 'diversityTags', label: 'Diversity Tags', type: 'multiselect' },
  {
    key: 'noticePeriodPreference',
    label: 'Notice Period',
    type: 'multiselect',
  },
];

/* ───────────────────── URL state sync helpers ─────────────────────── */

const FILTER_URL_KEYS = [
  'keyword',
  'location',
  'type',
  'workMode',
  'experience',
  'experienceLevel',
  'shiftType',
  'companyType',
  'urgencyLevel',
  'educationRequired',
  'functionalArea',
  'salaryMin',
  'salaryMax',
  'industry',
  'department',
  'isFeatured',
  'isWalkIn',
  'isPwdFriendly',
  'visaSponsorshipAvailable',
  'genderPreference',
  'diversityTags',
  'noticePeriodPreference',
  'latitude',
  'longitude',
  'radiusKm',
  'sortBy',
  'page',
] as const;

function filtersFromSearchParams(params: URLSearchParams): JobSearchFilters {
  const filters: JobSearchFilters = {
    page: '1',
    limit: String(PAGINATION.JOBS_PER_PAGE),
    sortBy: 'relevance',
  };
  for (const key of FILTER_URL_KEYS) {
    const val = params.get(key);
    if (val) (filters as Record<string, string>)[key] = val;
  }
  // Handle postedAfter from "days" shorthand
  const postedDays = params.get('postedAfter');
  if (postedDays && /^\d+$/.test(postedDays)) {
    filters.postedAfter = daysToPostedAfter(postedDays);
  } else if (postedDays) {
    filters.postedAfter = postedDays;
  }
  return filters;
}

function filtersToSearchParams(filters: JobSearchFilters, postedDays: string): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of FILTER_URL_KEYS) {
    const val = (filters as Record<string, string | undefined>)[key];
    if (
      val &&
      val !== '' &&
      !(key === 'page' && val === '1') &&
      !(key === 'sortBy' && val === 'relevance')
    ) {
      params.set(key, val);
    }
  }
  if (postedDays) params.set('postedAfter', postedDays);
  return params;
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export default function JobSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── State ──
  const [filters, setFilters] = useState<JobSearchFilters>(() =>
    filtersFromSearchParams(searchParams),
  );
  const [keyword, setKeyword] = useState(
    searchParams.get('keyword') || searchParams.get('q') || '',
  );
  const [locationQuery, setLocationQuery] = useState(filters.location || '');
  const [showSidebar, setShowSidebar] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('job-search-view') as ViewMode) || 'list';
    }
    return 'list';
  });
  const [postedDays, setPostedDays] = useState(searchParams.get('postedAfter') || '');
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('dismissed-jobs');
        return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
      } catch {
        return new Set();
      }
    }
    return new Set();
  });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const isFirstRender = useRef(true);

  // ── Queries ──
  const { data, isLoading } = useJobSearch(filters);
  const { data: savedJobsData } = useSavedJobs(1, 200);
  const toggleSave = useToggleSaveJob();
  const applyJob = useApplyJob();
  const { data: didYouMeanData } = useDidYouMean(keyword, 'jobs');
  const { data: locationSuggestions, isLoading: isLoadingLocations } =
    useSuggestLocations(locationQuery);
  const { suggestions: esLocationSuggestions, isLoading: isLoadingEsLocations } = useSuggest({
    category: 'location',
    query: locationQuery,
    limit: 10,
    minChars: 2,
  });

  const jobs: Job[] = data?.data?.items || [];
  const pagination = data?.data;
  const facets: SearchFacets = (data?.data as unknown as { facets?: SearchFacets })?.facets || {};

  // Candidate skills (for skill match indicators on cards) — 1 cached query, no per-card fetch
  const { data: profileData } = useQuery({
    queryKey: QUERY_KEYS.CANDIDATES.PROFILE,
    queryFn: () => candidateService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 min — skills don't change often
  });
  const candidateSkills = useMemo(() => {
    const skills = profileData?.data?.skills;
    return skills?.length ? new Set(skills.map((s: string) => s.toLowerCase())) : new Set<string>();
  }, [profileData]);

  // Recommendations for sparse results
  const showRecommendations = !isLoading && jobs.length < 5;
  const { data: recommendedData } = useQuery({
    queryKey: QUERY_KEYS.RECOMMENDATIONS.JOBS,
    queryFn: () => recommendationService.getRecommendedJobs(),
    enabled: showRecommendations,
  });
  const recommendedJobs: Job[] = showRecommendations
    ? (recommendedData?.data?.items || [])
        .filter((rj: Job) => !jobs.some((j) => j.id === rj.id))
        .slice(0, 5)
    : [];

  const saveSearchMutation = useMutation({
    mutationFn: (name: string) =>
      savedSearchService.create({
        name,
        searchType: 'JOB_SEARCH',
        filters: filters as Record<string, unknown>,
      }),
    onSuccess: () => {
      showToast.success('Search saved successfully');
      setShowSaveSearch(false);
      setSaveSearchName('');
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to save search');
    },
  });

  // ── Saved job IDs ──
  useEffect(() => {
    const savedItems = savedJobsData?.data?.items;
    if (savedItems && savedItems.length > 0) {
      queueMicrotask(() => setSavedJobIds(new Set(savedItems.map((j: Job) => j.id))));
    }
  }, [savedJobsData]);

  // ── Sync filters → URL (skip first render) ──
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = filtersToSearchParams(filters, postedDays);
    const qs = params.toString();
    const newUrl = qs ? `?${qs}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [filters, postedDays, router]);

  // ── Persist view mode ──
  useEffect(() => {
    localStorage.setItem('job-search-view', viewMode);
  }, [viewMode]);

  // ── Touch detection ──
  useEffect(() => {
    queueMicrotask(() =>
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0),
    );
  }, []);

  // ── Persist dismissed jobs ──
  useEffect(() => {
    if (dismissedIds.size > 0) {
      sessionStorage.setItem('dismissed-jobs', JSON.stringify([...dismissedIds]));
    }
  }, [dismissedIds]);

  // ── Derived ──
  const filterSections = useMemo(() => buildFilterSections(facets), [facets]);

  const activeFilterCount =
    Object.entries(filters).filter(
      ([key, val]) =>
        val &&
        !['page', 'limit', 'sortBy', 'keyword', 'location', 'postedAfter', 'postedBefore'].includes(
          key,
        ),
    ).length + (postedDays ? 1 : 0);

  const filterValues = useMemo(() => {
    // Reverse-map salaryMin/salaryMax → salaryBucket key for sidebar active state
    let salaryBucket: string | undefined;
    if (filters.salaryMin || filters.salaryMax) {
      salaryBucket = Object.entries(SALARY_BUCKET_MAP).find(
        ([, v]) => v.min === filters.salaryMin && v.max === filters.salaryMax,
      )?.[0];
    }
    // Reverse-map experience → experienceBucket key
    let experienceBucket: string | undefined;
    if (filters.experience) {
      experienceBucket = Object.entries(EXPERIENCE_BUCKET_MAP).find(([, v]) => {
        const expected = v.max ? `${v.min}-${v.max}` : `${v.min}+`;
        return expected === filters.experience;
      })?.[0];
    }
    return {
      type: filters.type,
      workMode: filters.workMode,
      experienceLevel: filters.experienceLevel,
      shiftType: filters.shiftType,
      companyType: filters.companyType,
      urgencyLevel: filters.urgencyLevel,
      educationRequired: filters.educationRequired,
      functionalArea: filters.functionalArea,
      industry: filters.industry,
      salaryMin: filters.salaryMin,
      salaryMax: filters.salaryMax,
      salaryBucket,
      experienceBucket,
      locationFacet: filters.location,
    };
  }, [filters]);

  const locationOptions = useMemo(
    () =>
      (locationSuggestions?.data?.suggestions ?? []).map((s) => ({
        label: s.text,
        value: s.text,
        count: s.count,
      })),
    [locationSuggestions],
  );

  const locationAdditionalSections = useMemo(
    () =>
      locationQuery.length >= 2
        ? [
            {
              label: 'Suggestions',
              options: esLocationSuggestions.map((s) => ({ label: s, value: s })),
              isLoading: isLoadingEsLocations,
            },
          ]
        : [],
    [locationQuery, esLocationSuggestions, isLoadingEsLocations],
  );

  // ── Focus sections: Recent Locations + Popular Locations ──
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: locationHistory } = useFieldHistory('location');
  const addLocationHistory = useAddToFieldHistory('location');
  const clearLocationHistory = useClearFieldHistory('location');
  const { suggestions: popularLocations, isLoading: isLoadingPopular } =
    useStaticSuggestions('location', 8);

  const locationFocusSections = useMemo(() => {
    const sections: import('@/components/ui/AutoSuggest').AdditionalSuggestSection[] = [];
    const historyItems = locationHistory?.data?.history ?? [];
    if (isAuthenticated && historyItems.length > 0) {
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
  }, [isAuthenticated, locationHistory, popularLocations, isLoadingPopular, clearLocationHistory]);

  const didYouMean = didYouMeanData?.data?.suggestion;
  const userLat = filters.latitude ? Number(filters.latitude) : undefined;
  const userLng = filters.longitude ? Number(filters.longitude) : undefined;

  // Sort: add "distance" when location is present
  const sortOptions = useMemo(() => {
    const base = [...SORT_OPTIONS];
    if (filters.location) {
      base.push({ value: 'distance', label: 'Nearest First' });
    }
    return base;
  }, [filters.location]);

  // Visible jobs (excluding dismissed)
  const visibleJobs = useMemo(
    () => (dismissedIds.size > 0 ? jobs.filter((j) => !dismissedIds.has(j.id)) : jobs),
    [jobs, dismissedIds],
  );
  const dismissedCount = jobs.length - visibleJobs.length;

  // Jobs selected for comparison
  const compareJobs = useMemo(
    () =>
      compareIds
        .map((id) => jobs.find((j) => j.id === id) || recommendedJobs.find((j) => j.id === id))
        .filter(Boolean) as Job[],
    [compareIds, jobs, recommendedJobs],
  );

  // ── Handlers ──
  const handleKeywordSearch = useCallback((query: string) => {
    setKeyword(query);
    setFilters((prev) => ({ ...prev, keyword: query || undefined, page: '1' }));
  }, []);

  const handleKeywordSelect = useCallback((item: AutocompleteResult) => {
    setKeyword(item.text);
    setFilters((prev) => ({ ...prev, keyword: item.text || undefined, page: '1' }));
  }, []);

  const handleLocationChange = useCallback(
    (value: string | string[]) => {
      const loc = typeof value === 'string' ? value : value[0] || '';
      setFilters((prev) => ({ ...prev, location: loc || undefined, page: '1' }));
      if (loc) addLocationHistory.mutate(loc);
    },
    [addLocationHistory],
  );

  const handleGeoLocation = useCallback((lat: string, lng: string, cityName?: string) => {
    setFilters((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      radiusKm: prev.radiusKm || '25',
      location: cityName || prev.location,
      page: '1',
    }));
    if (cityName) setLocationQuery(cityName);
  }, []);

  const handleRadiusChange = useCallback((radiusKm: string) => {
    setFilters((prev) => ({ ...prev, radiusKm, page: '1' }));
  }, []);

  const handleClearGeo = useCallback(() => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next.latitude;
      delete next.longitude;
      delete next.radiusKm;
      next.page = '1';
      return next;
    });
  }, []);

  const handleToggleCompare = useCallback((jobId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(jobId)) return prev.filter((id) => id !== jobId);
      if (prev.length >= 3) {
        showToast.error('You can compare up to 3 jobs at a time.');
        return prev;
      }
      return [...prev, jobId];
    });
  }, []);

  const handleDismissJob = useCallback((jobId: string) => {
    setDismissedIds((prev) => new Set(prev).add(jobId));
  }, []);

  const handleShowAllDismissed = useCallback(() => {
    setDismissedIds(new Set());
    sessionStorage.removeItem('dismissed-jobs');
  }, []);

  const handleFilterChange = useCallback((key: string, value: string | undefined) => {
    // Virtual key: salary bucket → translate to salaryMin/salaryMax
    if (key === 'salaryBucket') {
      const bucket = value ? SALARY_BUCKET_MAP[value] : undefined;
      setFilters((prev) => ({
        ...prev,
        salaryMin: bucket?.min,
        salaryMax: bucket?.max,
        page: '1',
      }));
      return;
    }
    // Virtual key: experience bucket → translate to experience range param
    if (key === 'experienceBucket') {
      const bucket = value ? EXPERIENCE_BUCKET_MAP[value] : undefined;
      setFilters((prev) => ({
        ...prev,
        experience: bucket
          ? bucket.max
            ? `${bucket.min}-${bucket.max}`
            : `${bucket.min}+`
          : undefined,
        page: '1',
      }));
      return;
    }
    // Virtual key: location facet → set the location filter
    if (key === 'locationFacet') {
      setFilters((prev) => ({ ...prev, location: value, page: '1' }));
      if (value) setLocationQuery(value);
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: value, page: '1' }));
  }, []);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page: String(page) }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDatePosted = useCallback((days: string) => {
    setPostedDays(days);
    setFilters((prev) => ({
      ...prev,
      postedAfter: daysToPostedAfter(days),
      page: '1',
    }));
  }, []);

  const handleSaveJob = async (jobId: string) => {
    try {
      const res = await toggleSave.mutateAsync(jobId);
      const saved = (res as { data?: { saved?: boolean } })?.data?.saved;
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (saved) next.add(jobId);
        else next.delete(jobId);
        return next;
      });
    } catch {
      showToast.error('Failed to save job');
    }
  };

  const handleQuickApply = async (jobId: string) => {
    try {
      await applyJob.mutateAsync({ jobId });
      showToast.success('Application submitted successfully!');
    } catch (err) {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to apply');
    }
  };

  const clearFilters = () => {
    setFilters({
      page: '1',
      limit: String(PAGINATION.JOBS_PER_PAGE),
      sortBy: 'relevance',
    });
    setKeyword('');
    setLocationQuery('');
    setPostedDays('');
  };

  // ── Result summary text ──
  const resultSummary = useMemo(() => {
    if (!pagination || isLoading) return '';
    const page = pagination.page;
    const limit = pagination.limit;
    const total = pagination.total;
    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    let text = `Showing ${from.toLocaleString()}-${to.toLocaleString()} of ${total.toLocaleString()} jobs`;
    if (keyword) text += ` for "${keyword}"`;
    if (filters.location) text += ` in ${filters.location}`;
    return text;
  }, [pagination, isLoading, keyword, filters.location]);

  return (
    <DashboardLayout requiredRole={['CANDIDATE']}>
      <div className="space-y-4">
        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Find Jobs</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Discover opportunities that match your skills and career goals
          </p>
        </div>

        {/* ── Search Bar ── */}
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <SearchBar
              placeholder="Job title, skills, or company..."
              searchType="jobs"
              defaultValue={keyword}
              onSearch={handleKeywordSearch}
              onSelect={handleKeywordSelect}
              size="md"
              fullWidth
              className="flex-1"
            />
            <div className="flex-1 sm:max-w-xs">
              <AutoSuggest
                placeholder="City or remote"
                value={filters.location || ''}
                onChange={handleLocationChange}
                suggestions={locationOptions}
                isLoading={isLoadingLocations}
                onInputChange={setLocationQuery}
                allowCreate
                createLabel={(q) => `Search in "${q}"`}
                minChars={2}
                inputSize="md"
                additionalSections={locationAdditionalSections}
                focusSections={locationFocusSections}
              />
            </div>
          </div>

          {/* Boolean search tip + geo radius */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="hidden items-center gap-1.5 text-[10px] text-[var(--text-muted)] sm:flex">
              <span>Pro tip:</span>
              <span className="rounded bg-[var(--bg-secondary)] px-1 py-0.5 font-mono">AND</span>
              <span className="rounded bg-[var(--bg-secondary)] px-1 py-0.5 font-mono">OR</span>
              <span className="rounded bg-[var(--bg-secondary)] px-1 py-0.5 font-mono">NOT</span>
              <span>operators supported</span>
            </div>
            <RadiusSlider
              latitude={filters.latitude}
              longitude={filters.longitude}
              radiusKm={filters.radiusKm}
              onLocationChange={handleGeoLocation}
              onRadiusChange={handleRadiusChange}
              onClear={handleClearGeo}
            />
          </div>

          {/* Did you mean? */}
          {didYouMean && didYouMean !== keyword && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-[var(--warning)]" />
              <span className="text-[var(--text-secondary)]">Did you mean:</span>
              <button
                type="button"
                onClick={() => handleKeywordSearch(didYouMean)}
                className="text-primary font-medium hover:underline"
              >
                {didYouMean}
              </button>
            </div>
          )}
        </Card>

        {/* ── Date Posted Pills ── */}
        <div className="flex flex-wrap items-center gap-2">
          {DATE_POSTED_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleDatePosted(opt.value)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                postedDays === opt.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ── Active Filter Tags ── */}
        <ActiveFilterTags
          sections={FLAT_FILTER_SECTIONS}
          values={filterValues}
          onChange={handleFilterChange}
          onClear={clearFilters}
        />

        {/* ── Main Layout: Sidebar + Results ── */}
        <div className="flex gap-6">
          {/* Sidebar (desktop) */}
          <aside className="hidden w-[280px] shrink-0 lg:block">
            <AdvancedFilters
              sections={filterSections}
              values={filterValues}
              onChange={handleFilterChange}
              onClear={clearFilters}
              activeCount={activeFilterCount}
              isOpen
              layout="sidebar"
              title="Filters"
            />
          </aside>

          {/* Results Column */}
          <div className="min-w-0 flex-1 space-y-4">
            {/* ── Toolbar: Filters (mobile) + Summary + Sort + View Toggle ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {/* Mobile filter toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSidebar(true)}
                  className="relative lg:hidden"
                >
                  <Filter className="mr-1.5 h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-primary ml-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>

                {/* Save search / Create alert */}
                {activeFilterCount > 0 && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setShowSaveSearch(true)}>
                      <Star className="mr-1.5 h-4 w-4" />
                      <span className="hidden sm:inline">Save Search</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const name = keyword || 'Job Alert';
                          await candidateService.createJobAlert({
                            name,
                            filters: filters as Record<string, unknown>,
                            frequency: 'DAILY',
                          });
                          showToast.success(
                            "Job alert created! You'll be notified of new matches.",
                          );
                        } catch (err) {
                          const error = err as unknown as ApiError;
                          showToast.error(error.message || 'Failed to create alert');
                        }
                      }}
                    >
                      <Bell className="mr-1.5 h-4 w-4" />
                      <span className="hidden sm:inline">Create Alert</span>
                    </Button>
                  </>
                )}

                {/* Result summary */}
                {resultSummary && (
                  <span className="hidden text-sm text-[var(--text-muted)] xl:inline">
                    {resultSummary}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex rounded-lg border border-[var(--border)] bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'rounded-md p-1.5 transition-colors',
                      viewMode === 'list'
                        ? 'bg-primary text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]',
                    )}
                    title="List view"
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('compact')}
                    className={cn(
                      'rounded-md p-1.5 transition-colors',
                      viewMode === 'compact'
                        ? 'bg-primary text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]',
                    )}
                    title="Compact view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('map')}
                    className={cn(
                      'rounded-md p-1.5 transition-colors',
                      viewMode === 'map'
                        ? 'bg-primary text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]',
                    )}
                    title="Map view"
                  >
                    <MapIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Sort */}
                <select
                  value={filters.sortBy || 'relevance'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="focus:border-primary focus:ring-primary/20 h-9 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] focus:ring-2 focus:outline-none"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Result summary (mobile) */}
            {resultSummary && (
              <p className="text-sm text-[var(--text-muted)] xl:hidden">{resultSummary}</p>
            )}

            {/* ── Save Search Dialog ── */}
            {showSaveSearch && (
              <Card>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                      Save this search
                    </label>
                    <input
                      type="text"
                      placeholder="Name your search, e.g. 'React jobs in Mumbai'"
                      value={saveSearchName}
                      onChange={(e) => setSaveSearchName(e.target.value)}
                      className="focus:border-primary focus:ring-primary/20 h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && saveSearchName.trim()) {
                          saveSearchMutation.mutate(saveSearchName.trim());
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={() => saveSearchMutation.mutate(saveSearchName.trim())}
                    disabled={!saveSearchName.trim()}
                    isLoading={saveSearchMutation.isPending}
                    size="sm"
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowSaveSearch(false);
                      setSaveSearchName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {/* ── Map View ── */}
            {viewMode === 'map' && (
              <div className="space-y-3">
                {/* Desktop: side list + map */}
                <div className="hidden h-[calc(100vh-320px)] min-h-[400px] gap-4 lg:flex">
                  <div className="w-[340px] shrink-0 space-y-2 overflow-y-auto pr-1">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)}
                        className={cn(
                          'cursor-pointer rounded-xl transition-all',
                          selectedJobId === job.id && 'ring-primary ring-2',
                        )}
                      >
                        <CompactJobCard
                          job={job}
                          candidateSkills={candidateSkills}
                          userLat={userLat}
                          userLng={userLng}
                          isSaved={savedJobIds.has(job.id)}
                          onSave={() => handleSaveJob(job.id)}
                          isSaving={toggleSave.isPending && toggleSave.variables === job.id}
                        />
                      </div>
                    ))}
                    {jobs.length === 0 && !isLoading && (
                      <p className="py-8 text-center text-sm text-[var(--text-muted)]">
                        No jobs with location data
                      </p>
                    )}
                  </div>
                  <div className="relative flex-1 overflow-hidden rounded-xl">
                    <MapView
                      jobs={jobs}
                      selectedJobId={selectedJobId}
                      savedJobIds={savedJobIds}
                      onSaveJob={handleSaveJob}
                      onSelectJob={setSelectedJobId}
                      onSearchArea={(lat, lng, radiusKm) => {
                        setFilters((prev) => ({
                          ...prev,
                          latitude: String(lat),
                          longitude: String(lng),
                          radiusKm: String(radiusKm),
                          page: '1',
                        }));
                      }}
                      userLat={userLat}
                      userLng={userLng}
                    />
                  </div>
                </div>
                {/* Mobile: full map + bottom sheet */}
                <div className="relative h-[calc(100vh-260px)] min-h-[350px] overflow-hidden rounded-xl lg:hidden">
                  <MapView
                    jobs={jobs}
                    selectedJobId={selectedJobId}
                    savedJobIds={savedJobIds}
                    onSaveJob={handleSaveJob}
                    onSelectJob={setSelectedJobId}
                    onSearchArea={(lat, lng, radiusKm) => {
                      setFilters((prev) => ({
                        ...prev,
                        latitude: String(lat),
                        longitude: String(lng),
                        radiusKm: String(radiusKm),
                        page: '1',
                      }));
                    }}
                    userLat={userLat}
                    userLng={userLng}
                  />
                  <div className="absolute right-0 bottom-0 left-0 max-h-[40vh] space-y-2 overflow-y-auto rounded-t-2xl bg-white p-3 shadow-xl">
                    {jobs.slice(0, 5).map((job) => (
                      <div
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)}
                        className="cursor-pointer"
                      >
                        <CompactJobCard
                          job={job}
                          candidateSkills={candidateSkills}
                          userLat={userLat}
                          userLng={userLng}
                          isSaved={savedJobIds.has(job.id)}
                          onSave={() => handleSaveJob(job.id)}
                          isSaving={toggleSave.isPending && toggleSave.variables === job.id}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Job Results (list/compact) ── */}
            {viewMode !== 'map' && (
              <>
                <div className="space-y-3">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i}>
                        <Skeleton variant="card" />
                      </Card>
                    ))
                  ) : visibleJobs.length > 0 ? (
                    visibleJobs.map((job) => {
                      const card =
                        viewMode === 'compact' ? (
                          <CompactJobCard
                            key={job.id}
                            job={job}
                            searchKeyword={keyword}
                            candidateSkills={candidateSkills}
                            userLat={userLat}
                            userLng={userLng}
                            isSaved={savedJobIds.has(job.id)}
                            onSave={() => handleSaveJob(job.id)}
                            isSaving={toggleSave.isPending && toggleSave.variables === job.id}
                            isComparing={compareIds.includes(job.id)}
                            onToggleCompare={() => handleToggleCompare(job.id)}
                          />
                        ) : (
                          <JobCard
                            key={job.id}
                            job={job}
                            searchKeyword={keyword}
                            candidateSkills={candidateSkills}
                            userLat={userLat}
                            userLng={userLng}
                            isSaved={savedJobIds.has(job.id)}
                            onSave={() => handleSaveJob(job.id)}
                            isSaving={toggleSave.isPending && toggleSave.variables === job.id}
                            onQuickApply={() => handleQuickApply(job.id)}
                            isApplying={applyJob.isPending && applyJob.variables?.jobId === job.id}
                            isComparing={compareIds.includes(job.id)}
                            onToggleCompare={() => handleToggleCompare(job.id)}
                          />
                        );
                      return isTouchDevice ? (
                        <SwipeableCard
                          key={job.id}
                          onSave={() => handleSaveJob(job.id)}
                          onDismiss={() => handleDismissJob(job.id)}
                        >
                          {card}
                        </SwipeableCard>
                      ) : (
                        <div key={job.id}>{card}</div>
                      );
                    })
                  ) : (
                    <EmptyState
                      icon={Briefcase}
                      title="No jobs found"
                      description="Try adjusting your search or filters to find more jobs."
                      action={
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      }
                    />
                  )}

                  {/* Dismissed jobs notice */}
                  {dismissedCount > 0 && (
                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        onClick={handleShowAllDismissed}
                        className="hover:text-primary text-xs text-[var(--text-muted)] transition-colors"
                      >
                        {dismissedCount} job{dismissedCount > 1 ? 's' : ''} hidden &mdash; Show all
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Recommendations for sparse results ── */}
                {recommendedJobs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pt-4">
                      <Sparkles className="text-primary h-4 w-4" />
                      <h3 className="text-sm font-semibold text-[var(--text)]">
                        Recommended for You
                      </h3>
                    </div>
                    {recommendedJobs.map((job) =>
                      viewMode === 'compact' ? (
                        <CompactJobCard
                          key={job.id}
                          job={job}
                          candidateSkills={candidateSkills}
                          userLat={userLat}
                          userLng={userLng}
                          isSaved={savedJobIds.has(job.id)}
                          onSave={() => handleSaveJob(job.id)}
                          isSaving={toggleSave.isPending && toggleSave.variables === job.id}
                          isComparing={compareIds.includes(job.id)}
                          onToggleCompare={() => handleToggleCompare(job.id)}
                        />
                      ) : (
                        <JobCard
                          key={job.id}
                          job={job}
                          candidateSkills={candidateSkills}
                          userLat={userLat}
                          userLng={userLng}
                          isSaved={savedJobIds.has(job.id)}
                          onSave={() => handleSaveJob(job.id)}
                          isSaving={toggleSave.isPending && toggleSave.variables === job.id}
                          onQuickApply={() => handleQuickApply(job.id)}
                          isApplying={applyJob.isPending && applyJob.variables?.jobId === job.id}
                          isComparing={compareIds.includes(job.id)}
                          onToggleCompare={() => handleToggleCompare(job.id)}
                        />
                      ),
                    )}
                  </div>
                )}

                {/* ── Pagination ── */}
                {pagination && pagination.totalPages > 1 && (
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    totalItems={pagination.total}
                    pageSize={pagination.limit}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ── */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSidebar(false)} />
          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 w-[320px] max-w-[85vw] overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--text)]">Filters</h3>
              <button
                type="button"
                onClick={() => setShowSidebar(false)}
                className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdvancedFilters
              sections={filterSections}
              values={filterValues}
              onChange={handleFilterChange}
              onClear={clearFilters}
              activeCount={activeFilterCount}
              isOpen
              layout="sidebar"
              title="Filters"
              className="rounded-none border-0"
            />
            <div className="sticky bottom-0 border-t border-[var(--border)] bg-white p-4">
              <Button className="w-full" onClick={() => setShowSidebar(false)}>
                Show Results {pagination ? `(${pagination.total.toLocaleString()})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Compare Bar (sticky bottom) ── */}
      <CompareBar
        jobs={compareJobs}
        onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
        onClear={() => setCompareIds([])}
        onCompare={() => setShowCompare(true)}
      />

      {/* ── Compare Modal ── */}
      <CompareModal
        isOpen={showCompare}
        onClose={() => setShowCompare(false)}
        jobs={compareJobs}
        onRemove={(id) => {
          setCompareIds((prev) => prev.filter((x) => x !== id));
          if (compareJobs.length <= 1) setShowCompare(false);
        }}
      />
    </DashboardLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   JOB CARD — Full List View
   ═══════════════════════════════════════════════════════════════════════ */

function JobCard({
  job,
  searchKeyword,
  isSaved,
  onSave,
  isSaving,
  onQuickApply,
  isApplying,
  candidateSkills,
  userLat,
  userLng,
  isComparing,
  onToggleCompare,
}: {
  job: Job;
  searchKeyword?: string;
  isSaved: boolean;
  onSave: () => void;
  isSaving: boolean;
  onQuickApply?: () => void;
  isApplying?: boolean;
  candidateSkills?: Set<string>;
  userLat?: number;
  userLng?: number;
  isComparing?: boolean;
  onToggleCompare?: () => void;
}) {
  const showLPA = (job.currency || 'INR').toUpperCase() === 'INR' && job.salaryType === 'ANNUAL';
  const distanceKm =
    userLat && userLng && job.latitude && job.longitude
      ? haversineKm(userLat, userLng, job.latitude, job.longitude)
      : undefined;
  const isNew = isPostedWithin(job.createdAt, 24);
  const isHot =
    (job.urgencyLevel === 'URGENT' || job.urgencyLevel === 'IMMEDIATE') &&
    isPostedWithin(job.createdAt, 72);
  const canQuickApply =
    job.applyMethod === 'IN_PLATFORM' &&
    (!job.screeningQuestions || job.screeningQuestions.length === 0);

  const skillMatchCount =
    candidateSkills?.size && job.skillsRequired?.length
      ? job.skillsRequired.filter((s) => candidateSkills.has(s.toLowerCase())).length
      : 0;
  const skillMatchPct = job.skillsRequired?.length
    ? Math.round((skillMatchCount / job.skillsRequired.length) * 100)
    : 0;

  return (
    <Card className="hover:border-primary/20 transition-all hover:shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-tertiary)]">
            {job.isConfidential ? (
              <Briefcase className="h-6 w-6 text-[var(--text-muted)]" />
            ) : job.company?.logo ? (
              <img
                src={job.company.logo}
                alt={job.company.companyName}
                className="h-10 w-10 rounded-lg object-contain"
              />
            ) : (
              <Building2 className="h-6 w-6 text-[var(--text-muted)]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={ROUTES.CANDIDATE.JOB_DETAIL(job.id)}
                className="hover:text-primary text-base font-semibold text-[var(--text)] transition-colors"
              >
                <HighlightText text={job.title} highlight={searchKeyword} />
              </Link>
              {isNew && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                  <Zap className="h-2.5 w-2.5" />
                  New
                </span>
              )}
              {isHot && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600">
                  <Flame className="h-2.5 w-2.5" />
                  Hot
                </span>
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
              {job.isConfidential ? (
                <span className="text-[var(--text-muted)]">Confidential Company</span>
              ) : (
                <>
                  <HighlightText text={job.company?.companyName || ''} highlight={searchKeyword} />
                  {job.company?.isVerified ? (
                    <span
                      className="inline-flex items-center gap-0.5 rounded-full bg-[var(--success-light)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--success-dark)]"
                      title="This company has been verified via GST registration"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      GST Verified
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-0.5 rounded-full bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]"
                      title="This company has not been verified"
                    >
                      Not Verified
                    </span>
                  )}
                </>
              )}
            </p>

            {/* Meta row */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {job.location}
                {job.additionalLocations.length > 0 && (
                  <span>+{job.additionalLocations.length}</span>
                )}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> {job.experienceMin}-
                {job.experienceMax || job.experienceMin}+ yrs
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatRelativeDate(job.createdAt)}
              </span>
              {typeof job._applicationCount === 'number' && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {job._applicationCount > 50
                    ? '50+ applicants'
                    : job._applicationCount < 10
                      ? '< 10 applicants'
                      : `${job._applicationCount} applicants`}
                </span>
              )}
              {distanceKm != null && (
                <span
                  className={cn(
                    'flex items-center gap-1',
                    distanceKm < 10 ? 'text-emerald-600' : distanceKm < 30 ? 'text-amber-600' : '',
                  )}
                >
                  <Navigation className="h-3.5 w-3.5" />
                  {distanceKm < 1 ? '<1 km' : `${distanceKm.toFixed(1)} km`}
                </span>
              )}
            </div>

            {/* Description snippet */}
            {job.description && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
                {truncate(job.description.replace(/<[^>]+>/g, ''), 200)}
              </p>
            )}

            {/* Badges */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {job.type && (
                <Badge variant="info" size="sm">
                  {JOB_TYPE_LABELS[job.type] || job.type}
                </Badge>
              )}
              {job.workMode && (
                <Badge variant="neutral" size="sm">
                  {WORK_MODE_LABELS[job.workMode] || job.workMode}
                </Badge>
              )}
              {job.urgencyLevel === 'URGENT' && (
                <Badge variant="warning" size="sm">
                  Urgent
                </Badge>
              )}
              {job.urgencyLevel === 'IMMEDIATE' && (
                <Badge variant="error" size="sm">
                  Immediate
                </Badge>
              )}
              {job.isFeatured && (
                <Badge variant="success" size="sm">
                  Featured
                </Badge>
              )}
              {job.isPwdFriendly && (
                <Badge variant="success" size="sm">
                  PwD Friendly
                </Badge>
              )}
              {job.visaSponsorshipAvailable && (
                <Badge variant="info" size="sm">
                  Visa Sponsorship
                </Badge>
              )}
              {job.functionalArea && (
                <Badge variant="neutral" size="sm">
                  {FUNCTIONAL_AREA_LABELS[job.functionalArea]}
                </Badge>
              )}
            </div>

            {/* Skills */}
            {(job.skillsRequired?.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {skillMatchCount > 0 && (
                  <span
                    className={cn(
                      'mr-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      skillMatchPct >= 70
                        ? 'bg-emerald-50 text-emerald-700'
                        : skillMatchPct >= 40
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {skillMatchCount}/{job.skillsRequired.length} skills match ({skillMatchPct}%)
                  </span>
                )}
                {job.skillsRequired.slice(0, 6).map((skill) => {
                  const isProfileMatch = candidateSkills?.has(skill.toLowerCase());
                  const isKeywordMatch =
                    !isProfileMatch &&
                    searchKeyword &&
                    searchKeyword
                      .toLowerCase()
                      .split(/[\s,]+/)
                      .some((t) => t.length > 1 && skill.toLowerCase().includes(t));
                  return (
                    <Tag
                      key={skill}
                      label={skill}
                      size="sm"
                      variant={isProfileMatch || isKeywordMatch ? 'success' : 'primary'}
                    />
                  );
                })}
                {job.skillsRequired.length > 6 && (
                  <Tag label={`+${job.skillsRequired.length - 6}`} size="sm" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column: salary + actions */}
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
          <div className="text-right">
            <p className="text-sm font-semibold text-[var(--text)]">
              {showLPA
                ? formatSalaryAsLPA(job.salaryMin, job.salaryMax)
                : formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
            </p>
            {job.salaryType && !showLPA && (
              <span className="text-xs text-[var(--text-muted)]">
                {job.salaryType === 'ANNUAL' ? '/yr' : job.salaryType === 'MONTHLY' ? '/mo' : '/hr'}
              </span>
            )}
            {job.salaryNegotiable && (
              <span className="block text-[10px] text-[var(--success)]">Negotiable</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Apply */}
            {canQuickApply && onQuickApply && (
              <Button size="sm" onClick={onQuickApply} isLoading={isApplying} className="text-xs">
                <Send className="mr-1 h-3 w-3" />
                Quick Apply
              </Button>
            )}

            {/* External apply indicator */}
            {job.applyMethod === 'EXTERNAL_URL' && (
              <Link
                href={ROUTES.CANDIDATE.JOB_DETAIL(job.id)}
                className="bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Apply
              </Link>
            )}

            {/* Compare button */}
            {onToggleCompare && (
              <button
                onClick={onToggleCompare}
                className={cn(
                  'rounded-lg p-2 transition-colors',
                  isComparing
                    ? 'text-primary bg-primary/10'
                    : 'hover:text-primary text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]',
                )}
                title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
                aria-label={isComparing ? 'Remove from comparison' : 'Add to comparison'}
              >
                <GitCompareArrows className="h-5 w-5" />
              </button>
            )}

            {/* Save button */}
            <button
              onClick={onSave}
              disabled={isSaving}
              className={cn(
                'rounded-lg p-2 transition-colors disabled:opacity-50',
                isSaved
                  ? 'text-primary bg-primary/10'
                  : 'hover:text-primary text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]',
              )}
              title={isSaved ? 'Unsave job' : 'Save job'}
              aria-label={isSaved ? 'Unsave job' : 'Save job'}
            >
              {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPACT JOB CARD — Condensed Row View
   ═══════════════════════════════════════════════════════════════════════ */

function CompactJobCard({
  job,
  searchKeyword,
  isSaved,
  onSave,
  isSaving,
  candidateSkills,
  userLat,
  userLng,
  isComparing,
  onToggleCompare,
}: {
  job: Job;
  searchKeyword?: string;
  isSaved: boolean;
  onSave: () => void;
  isSaving: boolean;
  candidateSkills?: Set<string>;
  userLat?: number;
  userLng?: number;
  isComparing?: boolean;
  onToggleCompare?: () => void;
}) {
  const showLPA = (job.currency || 'INR').toUpperCase() === 'INR' && job.salaryType === 'ANNUAL';
  const isNew = isPostedWithin(job.createdAt, 24);
  const distanceKm =
    userLat && userLng && job.latitude && job.longitude
      ? haversineKm(userLat, userLng, job.latitude, job.longitude)
      : undefined;

  const skillMatchCount =
    candidateSkills?.size && job.skillsRequired?.length
      ? job.skillsRequired.filter((s) => candidateSkills.has(s.toLowerCase())).length
      : 0;
  const skillMatchPct = job.skillsRequired?.length
    ? Math.round((skillMatchCount / job.skillsRequired.length) * 100)
    : 0;

  return (
    <div className="group hover:border-primary/20 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 transition-all hover:shadow-sm">
      {/* Logo */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
        {job.isConfidential ? (
          <Briefcase className="h-5 w-5 text-[var(--text-muted)]" />
        ) : job.company?.logo ? (
          <img
            src={job.company.logo}
            alt={job.company.companyName}
            className="h-8 w-8 rounded-md object-contain"
          />
        ) : (
          <Building2 className="h-5 w-5 text-[var(--text-muted)]" />
        )}
      </div>

      {/* Main info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.CANDIDATE.JOB_DETAIL(job.id)}
            className="hover:text-primary truncate text-sm font-semibold text-[var(--text)] transition-colors"
          >
            <HighlightText text={job.title} highlight={searchKeyword} />
          </Link>
          {isNew && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
              New
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span className="truncate">
            {job.isConfidential ? 'Confidential' : job.company?.companyName}
          </span>
          <span className="shrink-0">|</span>
          <span className="flex shrink-0 items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {job.location}
          </span>
          <span className="shrink-0">|</span>
          <span className="shrink-0">
            {showLPA
              ? formatSalaryAsLPA(job.salaryMin, job.salaryMax)
              : formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
          </span>
          <span className="shrink-0">|</span>
          <span className="shrink-0">{formatRelativeDate(job.createdAt)}</span>
          {distanceKm != null && (
            <>
              <span className="shrink-0">|</span>
              <span
                className={cn(
                  'flex shrink-0 items-center gap-0.5',
                  distanceKm < 10 ? 'text-emerald-600' : distanceKm < 30 ? 'text-amber-600' : '',
                )}
              >
                <Navigation className="h-3 w-3" />
                {distanceKm < 1 ? '<1 km' : `${distanceKm.toFixed(1)} km`}
              </span>
            </>
          )}
        </div>
        {/* Skills row */}
        {(job.skillsRequired?.length ?? 0) > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {skillMatchCount > 0 && (
              <span
                className={cn(
                  'mr-0.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  skillMatchPct >= 70
                    ? 'bg-emerald-50 text-emerald-700'
                    : skillMatchPct >= 40
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-600',
                )}
              >
                {skillMatchPct}%
              </span>
            )}
            {job.skillsRequired.slice(0, 4).map((skill) => {
              const isMatch = candidateSkills?.has(skill.toLowerCase());
              return (
                <span
                  key={skill}
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[10px]',
                    isMatch
                      ? 'bg-emerald-50 font-medium text-emerald-700'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
                  )}
                >
                  {skill}
                </span>
              );
            })}
            {job.skillsRequired.length > 4 && (
              <span className="text-[10px] text-[var(--text-muted)]">
                +{job.skillsRequired.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          href={ROUTES.CANDIDATE.JOB_DETAIL(job.id)}
          className="bg-primary/10 text-primary hover:bg-primary/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
        >
          View
        </Link>
        {onToggleCompare && (
          <button
            onClick={onToggleCompare}
            className={cn(
              'rounded-lg p-1.5 transition-colors',
              isComparing
                ? 'text-primary bg-primary/10'
                : 'hover:text-primary text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]',
            )}
            title={isComparing ? 'Remove from comparison' : 'Compare'}
            aria-label={isComparing ? 'Remove from comparison' : 'Add to comparison'}
          >
            <GitCompareArrows className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onSave}
          disabled={isSaving}
          className={cn(
            'rounded-lg p-1.5 transition-colors disabled:opacity-50',
            isSaved
              ? 'text-primary bg-primary/10'
              : 'hover:text-primary text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]',
          )}
          title={isSaved ? 'Unsave' : 'Save'}
          aria-label={isSaved ? 'Unsave job' : 'Save job'}
        >
          {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
