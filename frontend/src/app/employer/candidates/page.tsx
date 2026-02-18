'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Search, Filter, MapPin, Briefcase,
    Clock, Mail, Phone, FileText,
    User, Building2, CheckCircle,
    XCircle, Activity, Bookmark, Star, Sparkles,
    Locate, Loader2,
} from 'lucide-react';
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
import AdvancedFilters, { ActiveFilterTags, type FilterSection } from '@/components/ui/AdvancedFilters';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employerService } from '@/services/employer.service';
import { savedSearchService } from '@/services/saved-search.service';
import { showToast } from '@/components/ui/Toast';
import { QUERY_KEYS, PAGINATION } from '@/constants/config';
import { useSuggestLocations, useSuggestSkills, useSuggestCompanies, useDidYouMean } from '@/hooks/use-search';
import {
    WORK_MODE_LABELS, WORK_STATUS_LABELS, NOTICE_PERIOD_LABELS,
    GENDER_LABELS, DISABILITY_TYPE_LABELS, JOB_TYPE_LABELS,
    LAST_ACTIVE_LABELS, YES_NO_LABELS, SALARY_CURRENCY_LABELS,
    OPEN_TO_WORK_LABELS, RESERVATION_CATEGORY_LABELS, CAREER_BREAK_TYPE_LABELS,
    EDUCATION_LEVEL_SEARCH_LABELS, KEYWORD_OPERATOR_LABELS,
    BROAD_REGION_PRESETS, INDIAN_REGION_PRESETS,
} from '@/constants/enums';
import { formatRelativeDate } from '@/lib/utils';
import HighlightText from '@/components/ui/HighlightText';
import PresenceIndicator from '@/components/ui/PresenceIndicator';
import type { CandidateSearchFilters, CandidateProfile } from '@/types/candidate';
import type { ApiError } from '@/types/api';

const CANDIDATE_FILTER_SECTIONS: FilterSection[] = [
    // Row 1: Employment status
    { key: 'workStatus', label: 'Work Status', type: 'select', options: WORK_STATUS_LABELS },
    { key: 'noticePeriod', label: 'Notice Period', type: 'select', options: NOTICE_PERIOD_LABELS },
    { key: 'servingNoticePeriod', label: 'Serving Notice', type: 'select', options: YES_NO_LABELS },
    { key: 'preferredWorkMode', label: 'Work Mode', type: 'select', options: WORK_MODE_LABELS },
    // Row 2: Preferences
    { key: 'preferredJobType', label: 'Job Type', type: 'select', options: JOB_TYPE_LABELS },
    { key: 'willingToRelocate', label: 'Willing to Relocate', type: 'select', options: YES_NO_LABELS },
    { key: 'lastActiveWithin', label: 'Last Active', type: 'select', options: LAST_ACTIVE_LABELS },
    { key: 'hasResume', label: 'Has Resume', type: 'select', options: YES_NO_LABELS },
    // Row 3: Ranges
    {
        key: 'experience',
        label: 'Experience (years)',
        type: 'range',
        rangePlaceholderMin: '0',
        rangePlaceholderMax: '30',
        rangeSuffix: 'yrs',
    },
    {
        key: 'salary',
        label: 'Salary Range',
        type: 'range',
        rangePlaceholderMin: 'e.g. 300000',
        rangePlaceholderMax: 'e.g. 2000000',
        rangePrefix: '₹',
    },
    { key: 'salaryCurrency', label: 'Salary Currency', type: 'select', options: SALARY_CURRENCY_LABELS },
    { key: 'includeSalaryNotDisclosed', label: 'Undisclosed Salary', type: 'select', options: YES_NO_LABELS },
    // Row 4: Demographics & verification
    {
        key: 'age',
        label: 'Age Range',
        type: 'range',
        rangePlaceholderMin: '18',
        rangePlaceholderMax: '60',
        rangeSuffix: 'yrs',
    },
    { key: 'gender', label: 'Gender', type: 'select', options: GENDER_LABELS },
    { key: 'disabilityType', label: 'Disability', type: 'select', options: DISABILITY_TYPE_LABELS },
    { key: 'hasCareerBreak', label: 'Career Break', type: 'select', options: YES_NO_LABELS },
    // Row 5: Profile details
    { key: 'openToWork', label: 'Open to Work', type: 'select', options: OPEN_TO_WORK_LABELS },
    { key: 'careerBreakType', label: 'Break Reason', type: 'select', options: CAREER_BREAK_TYPE_LABELS },
    { key: 'category', label: 'Category', type: 'select', options: RESERVATION_CATEGORY_LABELS },
    { key: 'isVeteran', label: 'Veteran', type: 'select', options: YES_NO_LABELS },
    // Row 6: Verification
    { key: 'verifiedEmail', label: 'Email Verified', type: 'select', options: YES_NO_LABELS },
    { key: 'verifiedMobile', label: 'Mobile Verified', type: 'select', options: YES_NO_LABELS },
];

export default function CandidateSearchPage() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const initialQ = searchParams.get('q') || '';
    const initialLocation = searchParams.get('location') || '';

    const [filters, setFilters] = useState<CandidateSearchFilters>({
        page: '1',
        limit: String(PAGINATION.CANDIDATES_PER_PAGE),
        ...(initialQ && { keyword: initialQ }),
        ...(initialLocation && { location: initialLocation }),
    });
    const [keyword, setKeyword] = useState(initialQ);
    const [locationQuery, setLocationQuery] = useState(initialLocation);
    const [skillsQuery, setSkillsQuery] = useState('');
    const [companyQuery, setCompanyQuery] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [savedCandidateIds, setSavedCandidateIds] = useState<Set<string>>(new Set());
    const [showSaveSearch, setShowSaveSearch] = useState(false);
    const [saveSearchName, setSaveSearchName] = useState('');
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [geoLocationName, setGeoLocationName] = useState('');
    const [nearbyCities, setNearbyCities] = useState<string[]>([]);

    const { data: didYouMeanData } = useDidYouMean(keyword, 'candidates');
    const { data: locationSuggestions, isLoading: isLoadingLocations } = useSuggestLocations(locationQuery);
    const { data: skillSuggestions, isLoading: isLoadingSkills } = useSuggestSkills(skillsQuery);
    const { data: companySuggestions, isLoading: isLoadingCompanies } = useSuggestCompanies(companyQuery);

    // Pre-populate saved candidate IDs on mount
    const { data: savedCandidatesData } = useQuery({
        queryKey: QUERY_KEYS.EMPLOYERS.SAVED_CANDIDATES,
        queryFn: () => employerService.getSavedCandidates(1, 200),
    });
    useEffect(() => {
        const items = savedCandidatesData?.data?.items;
        if (items && items.length > 0) {
            setSavedCandidateIds(new Set(items.map((c: CandidateProfile) => c.id)));
        }
    }, [savedCandidatesData]);

    const toggleSaveMutation = useMutation({
        mutationFn: (candidateId: string) => employerService.toggleSavedCandidate(candidateId),
        onSuccess: (data, candidateId) => {
            const saved = data.data?.saved ?? false;
            setSavedCandidateIds(prev => {
                const next = new Set(prev);
                if (saved) {
                    next.add(candidateId);
                } else {
                    next.delete(candidateId);
                }
                return next;
            });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYERS.SAVED_CANDIDATES });
            showToast.success(saved ? 'Candidate saved!' : 'Candidate unsaved');
        },
        onError: () => {
            showToast.error('Failed to save candidate');
        },
    });

    const saveSearchMutation = useMutation({
        mutationFn: (name: string) =>
            savedSearchService.create({
                name,
                searchType: 'CANDIDATE_SEARCH',
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

    const { data, isLoading } = useQuery({
        queryKey: QUERY_KEYS.CANDIDATES.SEARCH(filters as unknown as Record<string, unknown>),
        queryFn: () => employerService.searchCandidates(filters),
    });

    const candidates = data?.data?.items || [];
    const pagination = data?.data;

    const handleKeywordSearch = useCallback((query: string) => {
        setKeyword(query);
        setFilters(prev => ({
            ...prev,
            keyword: query || undefined,
            page: '1',
        }));
    }, []);

    const handleLocationChange = useCallback((value: string | string[]) => {
        const loc = typeof value === 'string' ? value : value[0] || '';
        setFilters(prev => ({
            ...prev,
            location: loc || undefined,
            page: '1',
        }));
    }, []);

    const handleFilterChange = (key: string, value: string | undefined) => {
        setFilters(prev => ({ ...prev, [key]: value, page: '1' }));
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page: String(page) }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        setFilters({ page: '1', limit: String(PAGINATION.CANDIDATES_PER_PAGE) });
        setKeyword('');
        setLocationQuery('');
        setGeoLocationName('');
        setNearbyCities([]);
    };

    const fetchNearbyCities = useCallback(async (lat: number, lon: number, currentCity?: string) => {
        try {
            // Use Nominatim to find cities/towns near the coordinates
            const radiusDeg = 1.5; // ~150km bounding box
            const viewbox = `${lon - radiusDeg},${lat + radiusDeg},${lon + radiusDeg},${lat - radiusDeg}`;
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&viewbox=${viewbox}&bounded=1&featuretype=city&limit=15&addressdetails=0`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const results = await res.json();
            const cities = (results as Array<{ display_name: string; type: string; class: string }>)
                .map(r => r.display_name.split(',')[0].trim())
                .filter((name, i, arr) => {
                    if (!name) return false;
                    // Deduplicate and exclude the current city
                    if (arr.indexOf(name) !== i) return false;
                    if (currentCity && name.toLowerCase() === currentCity.toLowerCase()) return false;
                    return true;
                })
                .slice(0, 8);
            setNearbyCities(cities);
        } catch {
            setNearbyCities([]);
        }
    }, []);

    const handleGetLocation = useCallback(() => {
        if (!navigator.geolocation) {
            showToast.error('Geolocation is not supported by your browser');
            return;
        }
        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                setFilters(prev => ({
                    ...prev,
                    latitude: String(lat),
                    longitude: String(lon),
                    radiusKm: prev.radiusKm || '25',
                    page: '1',
                }));
                // Reverse geocode via Nominatim (free, no API key)
                let detectedCity = '';
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const data = await res.json();
                    const parts = (data.display_name || '').split(',').map((s: string) => s.trim());
                    detectedCity = parts[0] || '';
                    setGeoLocationName(parts.slice(0, 2).join(', ') || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                } catch {
                    setGeoLocationName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                }
                // Fetch nearby cities after a short delay (Nominatim rate limit: 1 req/sec)
                setTimeout(() => fetchNearbyCities(lat, lon, detectedCity), 1100);
                setIsGettingLocation(false);
                showToast.success('Location detected');
            },
            (error) => {
                setIsGettingLocation(false);
                if (error.code === error.PERMISSION_DENIED) {
                    showToast.error('Location access denied. Please enable it in browser settings.');
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    showToast.error('Location information unavailable');
                } else {
                    showToast.error('Failed to get your location');
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    }, [fetchNearbyCities]);

    const clearGeoLocation = useCallback(() => {
        setFilters(prev => {
            const next = { ...prev, page: '1' };
            delete next.latitude;
            delete next.longitude;
            delete next.radiusKm;
            return next;
        });
        setGeoLocationName('');
        setNearbyCities([]);
    }, []);

    const activeFilterCount = Object.entries(filters).filter(
        ([key, val]) => val && !['page', 'limit', 'sortBy', 'keyword', 'location'].includes(key)
    ).length;

    const filterValues = useMemo(() => ({
        workStatus: filters.workStatus,
        noticePeriod: filters.noticePeriod,
        servingNoticePeriod: filters.servingNoticePeriod,
        preferredWorkMode: filters.preferredWorkMode,
        preferredJobType: filters.preferredJobType,
        willingToRelocate: filters.willingToRelocate,
        lastActiveWithin: filters.lastActiveWithin,
        hasResume: filters.hasResume,
        experienceMin: filters.experienceMin,
        experienceMax: filters.experienceMax,
        salaryMin: filters.salaryMin,
        salaryMax: filters.salaryMax,
        salaryCurrency: filters.salaryCurrency,
        includeSalaryNotDisclosed: filters.includeSalaryNotDisclosed,
        ageMin: filters.ageMin,
        ageMax: filters.ageMax,
        gender: filters.gender,
        disabilityType: filters.disabilityType,
        hasCareerBreak: filters.hasCareerBreak,
        openToWork: filters.openToWork,
        careerBreakType: filters.careerBreakType,
        category: filters.category,
        isVeteran: filters.isVeteran,
        verifiedEmail: filters.verifiedEmail,
        verifiedMobile: filters.verifiedMobile,
        keywordOperator: filters.keywordOperator,
        educationLevel: filters.educationLevel,
        itSkill: filters.itSkill,
        workPermit: filters.workPermit,
    }), [filters]);

    const locationOptions = useMemo(
        () =>
            (locationSuggestions?.data?.suggestions ?? []).map((s) => ({
                label: s.text,
                value: s.text,
                count: s.count,
            })),
        [locationSuggestions]
    );

    const skillOptions = useMemo(
        () =>
            (skillSuggestions?.data?.suggestions ?? []).map((s) => ({
                label: s.text,
                value: s.text,
                count: s.count,
            })),
        [skillSuggestions]
    );

    const companyOptions = useMemo(
        () =>
            (companySuggestions?.data?.suggestions ?? []).map((s) => ({
                label: s.text,
                value: s.text,
                count: s.count,
            })),
        [companySuggestions]
    );

    const didYouMean = didYouMeanData?.data?.suggestion;

    return (
        <DashboardLayout requiredRole={['EMPLOYER']}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Search Candidates</h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Find the right talent for your openings
                    </p>
                </div>

                {/* Search Bar */}
                <Card>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <SearchBar
                            placeholder="Skills, designation, or company..."
                            searchType="candidates"
                            defaultValue={keyword}
                            onSearch={handleKeywordSearch}
                            size="md"
                            fullWidth
                            className="flex-1"
                        />
                        <div className="flex-1 sm:max-w-xs">
                            <AutoSuggest
                                placeholder="City or location"
                                value={filters.location || ''}
                                onChange={handleLocationChange}
                                suggestions={locationOptions}
                                isLoading={isLoadingLocations}
                                onInputChange={setLocationQuery}
                                allowCreate
                                createLabel={(q) => `Search in "${q}"`}
                                minChars={2}
                                inputSize="md"
                            />
                        </div>
                    </div>

                    {/* Keyword Scope + Operator */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[var(--text-muted)]">Search in:</span>
                        {(['all', 'title', 'skills', 'designation', 'company'] as const).map(scope => (
                            <button
                                key={scope}
                                type="button"
                                onClick={() => handleFilterChange('keywordScope', scope === 'all' ? undefined : scope)}
                                className={`rounded-full px-2.5 py-1 transition-colors ${
                                    (filters.keywordScope || 'all') === scope
                                        ? 'bg-primary text-white'
                                        : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'
                                }`}
                            >
                                {scope.charAt(0).toUpperCase() + scope.slice(1)}
                            </button>
                        ))}
                        <span className="mx-1 h-4 w-px bg-[var(--border)]" />
                        <span className="text-[var(--text-muted)]">Match:</span>
                        {(['or', 'and'] as const).map(op => (
                            <button
                                key={op}
                                type="button"
                                onClick={() => handleFilterChange('keywordOperator', op === 'or' ? undefined : op)}
                                className={`rounded-full px-2.5 py-1 transition-colors ${
                                    (filters.keywordOperator || 'or') === op
                                        ? 'bg-primary text-white'
                                        : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'
                                }`}
                            >
                                {KEYWORD_OPERATOR_LABELS[op]}
                            </button>
                        ))}
                    </div>

                    {/* Did you mean? */}
                    {didYouMean && didYouMean !== keyword && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                            <Sparkles className="h-4 w-4 text-[var(--warning)]" />
                            <span className="text-[var(--text-secondary)]">Did you mean:</span>
                            <button
                                type="button"
                                onClick={() => handleKeywordSearch(didYouMean)}
                                className="font-medium text-primary hover:underline"
                            >
                                {didYouMean}
                            </button>
                        </div>
                    )}
                </Card>

                {/* Inline skill/company/designation/IT skill autosuggests */}
                <Card>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <AutoSuggest
                            label="Skills"
                            placeholder="e.g. React, Node.js"
                            value={filters.skills?.split(',').filter(Boolean) ?? []}
                            onChange={(val) => {
                                const str = Array.isArray(val) ? val.join(',') : val;
                                handleFilterChange('skills', str || undefined);
                            }}
                            suggestions={skillOptions}
                            isLoading={isLoadingSkills}
                            onInputChange={setSkillsQuery}
                            multiple
                            allowCreate
                            createLabel={(q) => `Add "${q}"`}
                            maxSelections={15}
                            minChars={1}
                            inputSize="sm"
                        />
                        <AutoSuggest
                            label="Current Company"
                            placeholder="e.g. Google"
                            value={filters.currentCompany || ''}
                            onChange={(val) => handleFilterChange('currentCompany', (typeof val === 'string' ? val : val[0]) || undefined)}
                            suggestions={companyOptions}
                            isLoading={isLoadingCompanies}
                            onInputChange={setCompanyQuery}
                            allowCreate
                            createLabel={(q) => `Search "${q}"`}
                            minChars={2}
                            inputSize="sm"
                        />
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Designation</label>
                            <input
                                type="text"
                                placeholder="e.g. Senior Developer"
                                value={filters.designation || ''}
                                onChange={e => handleFilterChange('designation', e.target.value || undefined)}
                                className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">IT Skill / Technology</label>
                            <input
                                type="text"
                                placeholder="e.g. Docker, AWS"
                                value={filters.itSkill || ''}
                                onChange={e => handleFilterChange('itSkill', e.target.value || undefined)}
                                className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </Card>

                {/* Exclusion filters */}
                <Card>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Exclude from results</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Exclude Keywords</label>
                            <input
                                type="text"
                                placeholder="e.g. intern, fresher"
                                value={filters.excludeKeywords || ''}
                                onChange={e => handleFilterChange('excludeKeywords', e.target.value || undefined)}
                                className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Exclude Company</label>
                            <input
                                type="text"
                                placeholder="e.g. CompetitorCo"
                                value={filters.excludeCompany || ''}
                                onChange={e => handleFilterChange('excludeCompany', e.target.value || undefined)}
                                className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Exclude Location</label>
                            <input
                                type="text"
                                placeholder="e.g. City to exclude"
                                value={filters.excludeLocation || ''}
                                onChange={e => handleFilterChange('excludeLocation', e.target.value || undefined)}
                                className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </Card>

                {/* Region Presets */}
                <Card>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Quick Location Presets</p>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(BROAD_REGION_PRESETS).map(([key, preset]) => {
                            const isActive = preset.special === 'clear'
                                ? !filters.location
                                : preset.cities?.some(c => filters.location === c) ?? false;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                        if (preset.special === 'clear') {
                                            handleFilterChange('location', undefined);
                                            setLocationQuery('');
                                        } else if (preset.special === 'international') {
                                            handleFilterChange('location', 'International');
                                            setLocationQuery('International');
                                        } else if (preset.cities) {
                                            if (isActive) {
                                                handleFilterChange('location', undefined);
                                                setLocationQuery('');
                                            } else {
                                                handleFilterChange('location', preset.cities[0]);
                                                setLocationQuery(preset.cities[0]);
                                            }
                                        }
                                    }}
                                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                        isActive
                                            ? 'bg-primary text-white'
                                            : 'border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(INDIAN_REGION_PRESETS).map(([region, cities]) => {
                            const isActive = cities.some(c => filters.location === c);
                            return (
                                <button
                                    key={region}
                                    type="button"
                                    onClick={() => {
                                        if (isActive) {
                                            handleFilterChange('location', undefined);
                                            setLocationQuery('');
                                        } else {
                                            handleFilterChange('location', cities[0]);
                                            setLocationQuery(cities[0]);
                                        }
                                    }}
                                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                        isActive
                                            ? 'bg-primary text-white'
                                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                                    }`}
                                >
                                    {region}
                                </button>
                            );
                        })}
                    </div>
                </Card>

                {/* Education, certifications, department, industry, work permit */}
                <Card>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Education</label>
                            <input
                                type="text"
                                placeholder="e.g. B.Tech, MBA"
                                value={filters.education || ''}
                                onChange={e => handleFilterChange('education', e.target.value || undefined)}
                                className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Education Level</label>
                            <select
                                value={filters.educationLevel || ''}
                                onChange={e => handleFilterChange('educationLevel', e.target.value || undefined)}
                                className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--text)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Any level</option>
                                {Object.entries(EDUCATION_LEVEL_SEARCH_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Certifications</label>
                            <input
                                type="text"
                                placeholder="e.g. AWS, PMP"
                                value={filters.certifications || ''}
                                onChange={e => handleFilterChange('certifications', e.target.value || undefined)}
                                className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Department</label>
                            <input
                                type="text"
                                placeholder="e.g. Engineering"
                                value={filters.department || ''}
                                onChange={e => handleFilterChange('department', e.target.value || undefined)}
                                className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Industry</label>
                            <input
                                type="text"
                                placeholder="e.g. IT, Finance"
                                value={filters.currentIndustry || ''}
                                onChange={e => handleFilterChange('currentIndustry', e.target.value || undefined)}
                                className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Work Permit / Visa</label>
                            <input
                                type="text"
                                placeholder="e.g. US, H1B, EU"
                                value={filters.workPermit || ''}
                                onChange={e => handleFilterChange('workPermit', e.target.value || undefined)}
                                className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </Card>

                {/* Profile freshness date filters */}
                <Card>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Registered After</label>
                            <input
                                type="date"
                                value={filters.registeredAfter || ''}
                                onChange={e => handleFilterChange('registeredAfter', e.target.value || undefined)}
                                className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Profile Modified After</label>
                            <input
                                type="date"
                                value={filters.modifiedAfter || ''}
                                onChange={e => handleFilterChange('modifiedAfter', e.target.value || undefined)}
                                className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </Card>

                {/* Proximity search (geo) */}
                <Card>
                    <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-[var(--text-secondary)]" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Proximity Search</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Search near location</label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleGetLocation}
                                    disabled={isGettingLocation}
                                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-primary hover:text-primary hover:bg-primary-light disabled:opacity-50"
                                >
                                    {isGettingLocation ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Locate className="h-4 w-4" />
                                    )}
                                    {filters.latitude ? 'Update location' : 'Use my location'}
                                </button>
                                {filters.latitude && (
                                    <button
                                        type="button"
                                        onClick={clearGeoLocation}
                                        className="text-xs text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            {geoLocationName && filters.latitude && (
                                <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                                    Detected: {geoLocationName}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Radius</label>
                            <select
                                value={filters.radiusKm || ''}
                                onChange={e => handleFilterChange('radiusKm', e.target.value || undefined)}
                                disabled={!filters.latitude}
                                className="h-8 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--text)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                            >
                                <option value="">Select radius</option>
                                <option value="5">5 km</option>
                                <option value="10">10 km</option>
                                <option value="25">25 km</option>
                                <option value="50">50 km</option>
                                <option value="100">100 km</option>
                                <option value="200">200 km</option>
                            </select>
                        </div>
                    </div>
                    {nearbyCities.length > 0 && (
                        <div className="mt-4 border-t border-[var(--border)] pt-3">
                            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Nearby Cities</p>
                            <div className="flex flex-wrap gap-1.5">
                                {nearbyCities.map(city => (
                                    <button
                                        key={city}
                                        type="button"
                                        onClick={() => {
                                            handleFilterChange('location', city);
                                            setLocationQuery(city);
                                        }}
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                            filters.location === city
                                                ? 'bg-primary text-white'
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-primary-light hover:text-primary'
                                        }`}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Active filter tags */}
                <ActiveFilterTags
                    sections={CANDIDATE_FILTER_SECTIONS}
                    values={filterValues}
                    onChange={handleFilterChange}
                    onClear={clearFilters}
                />

                {/* Toolbar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            <Filter className="mr-1.5 h-4 w-4" />
                            Advanced Filters
                            {activeFilterCount > 0 && (
                                <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                        {activeFilterCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowSaveSearch(true)}
                            >
                                <Star className="mr-1.5 h-4 w-4" />
                                Save Search
                            </Button>
                        )}
                    </div>
                    {pagination && (
                        <span className="text-sm text-[var(--text-muted)]">
                            {pagination.total.toLocaleString()} candidates found
                        </span>
                    )}
                </div>

                {/* Advanced Filters Panel */}
                <AdvancedFilters
                    sections={CANDIDATE_FILTER_SECTIONS}
                    values={filterValues}
                    onChange={handleFilterChange}
                    onClear={clearFilters}
                    activeCount={activeFilterCount}
                    isOpen={showAdvanced}
                    onClose={() => setShowAdvanced(false)}
                    layout="panel"
                    title="Advanced Filters"
                />

                {/* Save Search Dialog */}
                {showSaveSearch && (
                    <Card>
                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Save this search</label>
                                <input
                                    type="text"
                                    placeholder="Name your search, e.g. 'Senior React developers'"
                                    value={saveSearchName}
                                    onChange={(e) => setSaveSearchName(e.target.value)}
                                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                            <Button variant="ghost" size="sm" onClick={() => { setShowSaveSearch(false); setSaveSearchName(''); }}>
                                Cancel
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Results */}
                <div className="space-y-4">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <Card key={i}><Skeleton variant="card" /></Card>
                        ))
                    ) : candidates.length > 0 ? (
                        candidates.map((candidate) => (
                            <CandidateCard
                                key={candidate.id}
                                candidate={candidate}
                                searchKeyword={keyword}
                                isSaved={savedCandidateIds.has(candidate.id)}
                                onToggleSave={() => toggleSaveMutation.mutate(candidate.id)}
                                isSaving={toggleSaveMutation.isPending && toggleSaveMutation.variables === candidate.id}
                            />
                        ))
                    ) : (
                        <EmptyState
                            icon={Search}
                            title="No candidates found"
                            description="Try adjusting your search criteria or filters."
                            action={
                                <Button variant="outline" size="sm" onClick={clearFilters}>
                                    Clear Filters
                                </Button>
                            }
                        />
                    )}
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={handlePageChange}
                        totalItems={pagination.total}
                        pageSize={pagination.limit}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}

function CandidateCard({ candidate, searchKeyword, isSaved, onToggleSave, isSaving }: {
    candidate: CandidateProfile;
    searchKeyword?: string;
    isSaved: boolean;
    onToggleSave: () => void;
    isSaving: boolean;
}) {
    const name = candidate.user
        ? `${candidate.user.firstName || ''} ${candidate.user.lastName || ''}`.trim()
        : 'Anonymous';

    // Consider candidate "active" if their profile was updated within the last 14 days
    const isRecentlyActive = (() => {
        const updatedAt = new Date(candidate.updatedAt);
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        return updatedAt >= fourteenDaysAgo;
    })();

    return (
        <Card className="hover:border-primary/20 hover:shadow-sm transition-all">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4 min-w-0 flex-1">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-light">
                        {candidate.user?.avatar ? (
                            <img src={candidate.user.avatar} alt={candidate.user?.firstName ? `${candidate.user.firstName}'s photo` : 'Candidate photo'} className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                            <User className="h-6 w-6 text-primary" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="flex items-center gap-2 font-semibold text-[var(--text)]">
                            <HighlightText text={name} highlight={searchKeyword} />
                            <PresenceIndicator userId={candidate.userId} />
                        </p>
                        {candidate.headline && (
                            <p className="text-sm text-[var(--text-secondary)]">
                                <HighlightText text={candidate.headline} highlight={searchKeyword} />
                            </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                            {candidate.currentLocation && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" /> {candidate.currentLocation}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5" /> {candidate.experienceYears} yrs exp
                            </span>
                            {candidate.currentCompany && (
                                <span className="flex items-center gap-1">
                                    <Building2 className="h-3.5 w-3.5" /> {candidate.currentCompany}
                                </span>
                            )}
                            {candidate.currentRole && (
                                <span className="flex items-center gap-1">
                                    {candidate.currentRole}
                                </span>
                            )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {candidate.workStatus && (
                                <Badge variant={candidate.workStatus === 'ACTIVELY_LOOKING' ? 'success' : 'neutral'} size="sm">
                                    {WORK_STATUS_LABELS[candidate.workStatus]}
                                </Badge>
                            )}
                            {candidate.noticePeriod && (
                                <Badge variant="info" size="sm">
                                    {NOTICE_PERIOD_LABELS[candidate.noticePeriod]}
                                </Badge>
                            )}
                            {candidate.preferredWorkMode?.map(mode => (
                                <Badge key={mode} variant="neutral" size="sm">
                                    {WORK_MODE_LABELS[mode]}
                                </Badge>
                            ))}
                            <Badge variant={isRecentlyActive ? 'success' : 'neutral'} size="sm">
                                <Activity className="mr-0.5 h-3 w-3" />
                                {isRecentlyActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>

                        {(candidate.skills?.length ?? 0) > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {candidate.skills.slice(0, 6).map(skill => {
                                    const isMatch = searchKeyword && searchKeyword.toLowerCase().split(/[\s,]+/).some(t => t.length > 1 && skill.toLowerCase().includes(t));
                                    return (
                                        <Tag key={skill} label={skill} size="sm" variant={isMatch ? 'success' : 'primary'} />
                                    );
                                })}
                                {candidate.skills.length > 6 && (
                                    <Tag label={`+${candidate.skills.length - 6}`} size="sm" />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onToggleSave}
                            disabled={isSaving}
                            title={isSaved ? 'Unsave candidate' : 'Save candidate'}
                            aria-label={isSaved ? 'Unsave candidate' : 'Save candidate'}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                                isSaved
                                    ? 'border-primary bg-primary-light text-primary'
                                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-primary hover:text-primary hover:bg-primary-light'
                            }`}
                        >
                            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                            {isSaved ? 'Saved' : 'Save'}
                        </button>
                        {candidate.resume && (
                            <a
                                href={candidate.resume}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Download resume"
                                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-primary hover:text-primary hover:bg-primary-light"
                            >
                                <FileText className="h-4 w-4" />
                                Resume
                            </a>
                        )}
                    </div>
                    {candidate.expectedSalaryMin && (
                        <p className="text-sm font-semibold text-[var(--text)]">
                            {candidate.expectedSalaryMin.toLocaleString()}
                            {candidate.expectedSalaryMax ? ` - ${candidate.expectedSalaryMax.toLocaleString()}` : '+'}
                            <span className="text-xs font-normal text-[var(--text-muted)]"> {candidate.salaryCurrency}/yr</span>
                        </p>
                    )}

                    {/* Verification Status */}
                    <div className="flex items-center gap-2">
                        <span
                            className="flex items-center gap-0.5 text-xs"
                            title={candidate.user?.isEmailVerified ? 'Email verified' : 'Email not verified'}
                        >
                            <Mail className="h-3 w-3 text-[var(--text-muted)]" />
                            {candidate.user?.isEmailVerified ? (
                                <CheckCircle className="h-3 w-3 text-[var(--success)]" />
                            ) : (
                                <XCircle className="h-3 w-3 text-[var(--text-muted)]" />
                            )}
                        </span>
                        <span
                            className="flex items-center gap-0.5 text-xs"
                            title={candidate.user?.isMobileVerified ? 'Mobile verified' : 'Mobile not verified'}
                        >
                            <Phone className="h-3 w-3 text-[var(--text-muted)]" />
                            {candidate.user?.isMobileVerified ? (
                                <CheckCircle className="h-3 w-3 text-[var(--success)]" />
                            ) : (
                                <XCircle className="h-3 w-3 text-[var(--text-muted)]" />
                            )}
                        </span>
                    </div>

                    {candidate.user?.email && (
                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <Mail className="h-3 w-3" /> {candidate.user.email}
                        </span>
                    )}
                    {candidate.phone && (
                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <Phone className="h-3 w-3" /> {candidate.phone}
                        </span>
                    )}

                    {/* Profile Completeness */}
                    <div className="flex items-center gap-1.5" title={`Profile ${candidate.profileCompleteness}% complete`}>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    candidate.profileCompleteness >= 80
                                        ? 'bg-[var(--success)]'
                                        : candidate.profileCompleteness >= 50
                                            ? 'bg-[var(--warning)]'
                                            : 'bg-[var(--error)]'
                                }`}
                                style={{ width: `${candidate.profileCompleteness}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-medium text-[var(--text-muted)]">
                            {candidate.profileCompleteness}%
                        </span>
                    </div>

                    <span className="text-xs text-[var(--text-muted)]">
                        Updated {formatRelativeDate(candidate.updatedAt)}
                    </span>
                </div>
            </div>
        </Card>
    );
}
