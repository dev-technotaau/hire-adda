'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Search, Filter, MapPin, Briefcase,
    Clock, Mail, Phone, FileText,
    User, Building2, CheckCircle,
    XCircle, Activity, Bookmark, Star, Sparkles,
    Locate, Loader2, MessageCircle, Pencil,
    UserCheck, ChevronDown, X, LayoutList, LayoutGrid,
    Download, CheckSquare, Square, GitCompareArrows, Map, Bell,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tag from '@/components/ui/Tag';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import DatePicker from '@/components/ui/DatePicker';
import EmptyState from '@/components/ui/EmptyState';
import SearchBar from '@/components/ui/SearchBar';
import AutoSuggest from '@/components/ui/AutoSuggest';
import AdvancedFilters, { ActiveFilterTags, type FilterSection } from '@/components/ui/AdvancedFilters';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '@/services/candidate.service';
import { employerService } from '@/services/employer.service';
import { jobService } from '@/services/job.service';
import { savedSearchService } from '@/services/saved-search.service';
import { searchService } from '@/services/search.service';
import { recommendationService } from '@/services/recommendation.service';
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
    EXPERIENCE_LEVEL_LABELS, EDUCATION_LEVEL_LABELS, FUNCTIONAL_AREA_LABELS,
    DRIVING_LICENSE_TYPE_LABELS,
} from '@/constants/enums';
import { formatRelativeDate, cn } from '@/lib/utils';
import HighlightText from '@/components/ui/HighlightText';
import PresenceIndicator from '@/components/ui/PresenceIndicator';
import SwipeableCard from '@/components/jobs/SwipeableCard';
import RadiusSlider from '@/components/jobs/RadiusSlider';
import CompareBar from '@/components/candidates/CompareBar';
import CompareModal from '@/components/candidates/CompareModal';
import type { CandidateSearchFilters, CandidateProfile } from '@/types/candidate';
import type { ApiError, SearchFacets } from '@/types/api';
import dynamic from 'next/dynamic';

const CandidateMapView = dynamic(() => import('@/components/candidates/MapView'), { ssr: false });

/** Build filter sections from static config + live facets. */
function buildCandidateFilterSections(facets: SearchFacets): FilterSection[] {
    return [
        // Row 1: Employment status
        { key: 'workStatus', label: 'Work Status', type: 'select', options: WORK_STATUS_LABELS, facets: facets.workStatus },
        { key: 'noticePeriod', label: 'Notice Period', type: 'select', options: NOTICE_PERIOD_LABELS, facets: facets.noticePeriod },
        { key: 'servingNoticePeriod', label: 'Serving Notice', type: 'select', options: YES_NO_LABELS },
        { key: 'preferredWorkMode', label: 'Work Mode', type: 'select', options: WORK_MODE_LABELS, facets: facets.preferredWorkMode },
        // Row 2: Preferences
        { key: 'preferredJobType', label: 'Job Type', type: 'select', options: JOB_TYPE_LABELS },
        { key: 'willingToRelocate', label: 'Willing to Relocate', type: 'select', options: YES_NO_LABELS },
        { key: 'lastActiveWithin', label: 'Last Active', type: 'select', options: LAST_ACTIVE_LABELS, facets: facets.lastActive },
        { key: 'hasResume', label: 'Has Resume', type: 'select', options: YES_NO_LABELS },
        // Row 3: Ranges (with dynamic buckets from ES)
        ...(facets.experienceRange?.length ? [{
            key: 'experienceBucket',
            label: 'Experience',
            type: 'radio' as const,
            options: Object.fromEntries(facets.experienceRange.map(b => [b.key, b.key])),
            facets: facets.experienceRange,
        }] : [{
            key: 'experience',
            label: 'Experience (years)',
            type: 'range' as const,
            rangePlaceholderMin: '0',
            rangePlaceholderMax: '30',
            rangeSuffix: 'yrs',
        }]),
        ...(facets.salaryRange?.length ? [{
            key: 'salaryBucket',
            label: 'Salary Range',
            type: 'radio' as const,
            options: Object.fromEntries(facets.salaryRange.map(b => [b.key, b.key])),
            facets: facets.salaryRange,
        }] : [{
            key: 'salary',
            label: 'Salary Range',
            type: 'range' as const,
            rangePlaceholderMin: 'e.g. 300000',
            rangePlaceholderMax: 'e.g. 2000000',
            rangePrefix: '₹',
        }]),
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
        { key: 'gender', label: 'Gender', type: 'select', options: GENDER_LABELS, facets: facets.gender },
        { key: 'disabilityType', label: 'Disability', type: 'select', options: DISABILITY_TYPE_LABELS },
        { key: 'hasCareerBreak', label: 'Career Break', type: 'select', options: YES_NO_LABELS },
        // Row 5: Profile details
        { key: 'openToWork', label: 'Open to Work', type: 'select', options: OPEN_TO_WORK_LABELS, facets: facets.openToWork },
        { key: 'careerBreakType', label: 'Break Reason', type: 'select', options: CAREER_BREAK_TYPE_LABELS },
        { key: 'category', label: 'Category', type: 'select', options: RESERVATION_CATEGORY_LABELS, facets: facets.category },
        { key: 'isVeteran', label: 'Veteran', type: 'select', options: YES_NO_LABELS },
        // Row 6: Verification
        { key: 'verifiedEmail', label: 'Email Verified', type: 'select', options: YES_NO_LABELS },
        { key: 'verifiedMobile', label: 'Mobile Verified', type: 'select', options: YES_NO_LABELS },

        // Row 7: Professional Details (NEW - with facets)
        { key: 'experienceLevel', label: 'Experience Level', type: 'select', options: EXPERIENCE_LEVEL_LABELS, facets: facets.experienceLevel },
        { key: 'highestEducationLevel', label: 'Education Level', type: 'select', options: EDUCATION_LEVEL_LABELS, facets: facets.highestEducationLevel },
        { key: 'drivingLicenseType', label: 'Driving License', type: 'select', options: DRIVING_LICENSE_TYPE_LABELS, facets: facets.drivingLicenseType },

        // Dynamic facets from ES aggregations
        ...(facets.currentIndustry?.length ? [{
            key: 'currentIndustry',
            label: 'Industry',
            type: 'multiselect' as const,
            options: Object.fromEntries(facets.currentIndustry.map(b => [b.key, b.key])),
            facets: facets.currentIndustry,
            collapsible: true,
            defaultOpen: false,
        }] : []),
        ...(facets.currentDepartment?.length ? [{
            key: 'currentDepartment',
            label: 'Department',
            type: 'multiselect' as const,
            options: Object.fromEntries(facets.currentDepartment.map(b => [b.key, b.key])),
            facets: facets.currentDepartment,
            collapsible: true,
            defaultOpen: false,
        }] : []),
        ...(facets.functionalArea?.length ? [{
            key: 'functionalArea',
            label: 'Functional Area',
            type: 'multiselect' as const,
            options: Object.fromEntries(facets.functionalArea.map(b => [b.key, b.key])),
            facets: facets.functionalArea,
            collapsible: true,
            defaultOpen: false,
        }] : []),
        ...(facets.topSkills?.length ? [{
            key: 'skillsFacet',
            label: 'Popular Skills',
            type: 'multiselect' as const,
            options: Object.fromEntries(facets.topSkills.map(b => [b.key, b.key])),
            facets: facets.topSkills,
            collapsible: true,
            defaultOpen: true,
        }] : []),
        ...(facets.topLocations?.length ? [{
            key: 'locationFacet',
            label: 'Top Locations',
            type: 'radio' as const,
            options: Object.fromEntries(facets.topLocations.map(b => [b.key, b.key])),
            facets: facets.topLocations,
            collapsible: true,
            defaultOpen: false,
        }] : []),
        ...(facets.topCompanies?.length ? [{
            key: 'companyFacet',
            label: 'Top Companies',
            type: 'multiselect' as const,
            options: Object.fromEntries(facets.topCompanies.map(b => [b.key, b.key])),
            facets: facets.topCompanies,
            collapsible: true,
            defaultOpen: false,
        }] : []),
    ];
}

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
    const [jobPickerOpen, setJobPickerOpen] = useState(false);
    const [jobPickerAction, setJobPickerAction] = useState<'shortlist' | 'select'>('shortlist');
    const [jobPickerCandidateId, setJobPickerCandidateId] = useState('');
    const [jobSearch, setJobSearch] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'compact' | 'map'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('candidate-search-view') as 'list' | 'compact' | 'map') || 'list';
        }
        return 'list';
    });
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkActionOpen, setBulkActionOpen] = useState(false);
    const [compareIds, setCompareIds] = useState<string[]>([]);
    const [showCompare, setShowCompare] = useState(false);

    // Persist view mode to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('candidate-search-view', viewMode);
        }
    }, [viewMode]);

    // Detect touch device
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
        }
    }, []);

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

    const { data: myJobsData } = useQuery({
        queryKey: [...QUERY_KEYS.JOBS.MY_JOBS, 'picker'],
        queryFn: () => jobService.getMyJobs(1, 100),
        enabled: jobPickerOpen,
    });

    const shortlistMutation = useMutation({
        mutationFn: ({ candidateId, jobId }: { candidateId: string; jobId: string }) =>
            employerService.shortlistCandidateForJob(candidateId, jobId),
        onSuccess: () => {
            setJobPickerOpen(false);
            showToast.success('Candidate shortlisted!');
        },
        onError: (err) => {
            const e = err as unknown as ApiError;
            showToast.error(e.message || 'Failed to shortlist');
        },
    });

    const selectMutation = useMutation({
        mutationFn: ({ candidateId, jobId }: { candidateId: string; jobId: string }) =>
            employerService.selectCandidateForJob(candidateId, jobId),
        onSuccess: () => {
            setJobPickerOpen(false);
            showToast.success('Candidate selected!');
        },
        onError: (err) => {
            const e = err as unknown as ApiError;
            showToast.error(e.message || 'Failed to select');
        },
    });

    const openJobPicker = (candidateId: string, action: 'shortlist' | 'select') => {
        setJobPickerCandidateId(candidateId);
        setJobPickerAction(action);
        setJobSearch('');
        setJobPickerOpen(true);
    };

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

    const bulkExportMutation = useMutation({
        mutationFn: (candidateIds: string[]) =>
            employerService.bulkExportCandidates({ candidateIds, format: 'xlsx' }),
        onSuccess: () => {
            showToast.success('Export queued! You\'ll receive an email when ready.');
            clearSelection();
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to queue export');
        },
    });

    const bulkSaveMutation = useMutation({
        mutationFn: async (candidateIds: string[]) => {
            const promises = candidateIds.map(id => employerService.toggleSavedCandidate(id));
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYERS.SAVED_CANDIDATES });
            showToast.success('Candidates saved!');
            clearSelection();
        },
        onError: () => {
            showToast.error('Failed to save some candidates');
        },
    });

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const handleToggleCompare = useCallback((candidateId: string) => {
        setCompareIds((prev) => {
            if (prev.includes(candidateId)) {
                return prev.filter((id) => id !== candidateId);
            }
            if (prev.length >= 3) {
                showToast.error('You can compare up to 3 candidates');
                return prev;
            }
            return [...prev, candidateId];
        });
    }, []);

    const { data, isLoading } = useQuery({
        queryKey: QUERY_KEYS.CANDIDATES.SEARCH(filters as unknown as Record<string, unknown>),
        queryFn: () => employerService.searchCandidates(filters),
    });

    // Fetch employer's open jobs to calculate skill match %
    const { data: activeJobsData } = useQuery({
        queryKey: [...QUERY_KEYS.JOBS.MY_JOBS, 'active-skills'],
        queryFn: () => jobService.getMyJobs(1, 100, 'OPEN'),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    // Calculate aggregated required skills from all open jobs
    const requiredSkills = useMemo(() => {
        const jobs = activeJobsData?.data?.items || [];
        const allSkills = jobs.flatMap((j) => j.skillsRequired || []);
        return new Set(allSkills.map((s) => s.toLowerCase()));
    }, [activeJobsData]);

    // Fetch search history
    const { data: historyData } = useQuery({
        queryKey: ['search-history', 'candidates'],
        queryFn: () => searchService.getSearchHistory(10),
        staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    });

    const searchHistory = useMemo(() => {
        const history = historyData?.data?.history || [];
        return history.filter((h) => h.type === 'candidate');
    }, [historyData]);

    const candidates = data?.data?.items || [];
    const pagination = data?.data;
    const facets: SearchFacets = (data?.data as unknown as { facets?: SearchFacets })?.facets || {};

    const filterSections = useMemo(() => buildCandidateFilterSections(facets), [facets]);

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(candidates.map((c) => c.id)));
    }, [candidates]);

    const compareCandidates = useMemo(
        () => compareIds.map((id) => candidates.find((c) => c.id === id)).filter((c): c is CandidateProfile => c !== undefined),
        [compareIds, candidates]
    );

    // Fetch AI recommendations when results are sparse
    const showRecommendations = !isLoading && candidates.length < 5;
    const { data: recommendedData } = useQuery({
        queryKey: ['recommended-candidates-for-employer'],
        queryFn: () => recommendationService.getRecommendedCandidatesForEmployer(10),
        enabled: showRecommendations,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const recommendedCandidates = useMemo(() => {
        return (recommendedData?.data || []).filter(
            (rc) => !candidates.some((c) => c.id === rc.id)
        );
    }, [recommendedData, candidates]);

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

    const handleSearchArea = useCallback((lat: number, lng: number, radiusKm: number) => {
        setFilters(prev => ({
            ...prev,
            latitude: String(lat),
            longitude: String(lng),
            radiusKm: String(radiusKm),
            page: '1',
        }));
    }, []);

    const handleRadiusLocationChange = useCallback((lat: string, lng: string, cityName?: string) => {
        setFilters(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            radiusKm: prev.radiusKm || '25',
            page: '1',
        }));
        if (cityName) {
            setGeoLocationName(cityName);
        }
    }, []);

    const handleRadiusChange = useCallback((radiusKm: string) => {
        setFilters(prev => ({ ...prev, radiusKm, page: '1' }));
    }, []);

    const handleClearGeoLocation = useCallback(() => {
        setFilters(prev => ({
            ...prev,
            latitude: undefined,
            longitude: undefined,
            radiusKm: undefined,
            page: '1',
        }));
        setGeoLocationName('');
        setNearbyCities([]);
    }, []);

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

    const handleResumeDownload = useCallback(async (candidateUserId: string) => {
        try {
            const res = await candidateService.getResumeDownloadUrl(candidateUserId);
            if (res.data?.url) {
                window.open(res.data.url, '_blank', 'noopener,noreferrer');
            }
        } catch {
            showToast.error('Failed to download resume');
        }
    }, []);

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

                    {/* Radius Slider for Geo-Search */}
                    <div className="mt-3">
                        <RadiusSlider
                            latitude={filters.latitude}
                            longitude={filters.longitude}
                            radiusKm={filters.radiusKm}
                            onLocationChange={handleRadiusLocationChange}
                            onRadiusChange={handleRadiusChange}
                            onClear={handleClearGeoLocation}
                        />
                        {geoLocationName && (
                            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                                📍 Searching near {geoLocationName}
                            </p>
                        )}
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
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Registration Date Presets</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {[
                            { label: 'Last 24h', days: 1 },
                            { label: 'Last 7 days', days: 7 },
                            { label: 'Last 30 days', days: 30 },
                            { label: 'Last 90 days', days: 90 },
                        ].map(({ label, days }) => {
                            const targetDate = new Date();
                            targetDate.setDate(targetDate.getDate() - days);
                            const dateStr = targetDate.toISOString().split('T')[0];
                            const isActive = filters.registeredAfter === dateStr;
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => handleFilterChange('registeredAfter', isActive ? undefined : dateStr)}
                                    className={cn(
                                        'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary text-white'
                                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                                    )}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <DatePicker
                            label="Registered After"
                            value={filters.registeredAfter || ''}
                            onChange={v => handleFilterChange('registeredAfter', v || undefined)}
                            inputSize="sm"
                            placeholder="Select date"
                            maxDate={new Date()}
                        />
                        <DatePicker
                            label="Profile Modified After"
                            value={filters.modifiedAfter || ''}
                            onChange={v => handleFilterChange('modifiedAfter', v || undefined)}
                            inputSize="sm"
                            placeholder="Select date"
                            maxDate={new Date()}
                        />
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
                    sections={filterSections}
                    values={filterValues}
                    onChange={handleFilterChange}
                    onClear={clearFilters}
                />

                {/* Search History */}
                {searchHistory.length > 0 && !keyword && activeFilterCount === 0 && (
                    <Card>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-[var(--text)]">Recent Searches</h3>
                            <button
                                onClick={async () => {
                                    await searchService.clearSearchHistory();
                                    queryClient.invalidateQueries({ queryKey: ['search-history'] });
                                }}
                                className="text-xs text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                            >
                                Clear all
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {searchHistory.slice(0, 8).map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (item.query) {
                                            setKeyword(item.query);
                                            setFilters((prev) => ({
                                                ...prev,
                                                keyword: item.query,
                                                page: '1',
                                            }));
                                        }
                                    }}
                                    className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
                                >
                                    <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                                    <span>{item.query || 'Previous search'}</span>
                                </button>
                            ))}
                        </div>
                    </Card>
                )}

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
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowSaveSearch(true)}
                                    title="Get notified when new candidates match your search criteria"
                                >
                                    <Bell className="mr-1.5 h-4 w-4" />
                                    Create Alert
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowSaveSearch(true)}
                                >
                                    <Star className="mr-1.5 h-4 w-4" />
                                    Save Search
                                </Button>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* View Mode Toggle */}
                        <div className="flex rounded-lg border border-[var(--border)] bg-white p-0.5">
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    'rounded-md p-1.5 transition-colors',
                                    viewMode === 'list'
                                        ? 'bg-primary text-white'
                                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
                                )}
                                aria-label="List view"
                            >
                                <LayoutList className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('compact')}
                                className={cn(
                                    'rounded-md p-1.5 transition-colors',
                                    viewMode === 'compact'
                                        ? 'bg-primary text-white'
                                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
                                )}
                                aria-label="Compact view"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={cn(
                                    'rounded-md p-1.5 transition-colors',
                                    viewMode === 'map'
                                        ? 'bg-primary text-white'
                                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
                                )}
                                aria-label="Map view"
                            >
                                <Map className="h-4 w-4" />
                            </button>
                        </div>
                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-[var(--text-muted)] hidden sm:inline">Sort by:</label>
                            <select
                                value={filters.sortBy || 'relevance'}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value || undefined)}
                                className="h-9 rounded-lg border border-[var(--border)] bg-white px-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="relevance">Best Match</option>
                                <option value="profileUpdated">Recently Updated</option>
                                <option value="lastActive">Recently Active</option>
                                <option value="experience">Experience: High to Low</option>
                                <option value="experience_asc">Experience: Low to High</option>
                                <option value="salary">Salary: High to Low</option>
                                <option value="salary_asc">Salary: Low to High</option>
                                {filters.latitude && <option value="distance">Nearest First</option>}
                            </select>
                        </div>
                        {pagination && (
                            <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">
                                {pagination.total.toLocaleString()} candidates found
                            </span>
                        )}
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                <AdvancedFilters
                    sections={filterSections}
                    values={filterValues}
                    onChange={handleFilterChange}
                    onClear={clearFilters}
                    activeCount={activeFilterCount}
                    isOpen={showAdvanced}
                    onClose={() => setShowAdvanced(false)}
                    layout="panel"
                    title="Advanced Filters"
                />

                {/* Quick Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Quick filters:</span>
                    <button
                        onClick={() => handleFilterChange('lastActiveWithin', filters.lastActiveWithin === '7d' ? undefined : '7d')}
                        className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                            filters.lastActiveWithin === '7d'
                                ? 'bg-primary text-white'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                        )}
                    >
                        Active last 7 days
                    </button>
                    <button
                        onClick={() => handleFilterChange('noticePeriod', filters.noticePeriod === 'IMMEDIATE' ? undefined : 'IMMEDIATE')}
                        className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                            filters.noticePeriod === 'IMMEDIATE'
                                ? 'bg-primary text-white'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                        )}
                    >
                        Immediate joiners
                    </button>
                    <button
                        onClick={() => handleFilterChange('openToWork', filters.openToWork === 'ACTIVELY_LOOKING' ? undefined : 'ACTIVELY_LOOKING')}
                        className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                            filters.openToWork === 'ACTIVELY_LOOKING'
                                ? 'bg-primary text-white'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                        )}
                    >
                        Open to work
                    </button>
                </div>

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

                {/* Bulk Actions Toolbar */}
                {selectedIds.size > 0 && (
                    <Card className="border-primary bg-primary/5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        if (selectedIds.size === candidates.length) {
                                            clearSelection();
                                        } else {
                                            selectAll();
                                        }
                                    }}
                                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark"
                                >
                                    {selectedIds.size === candidates.length ? (
                                        <CheckSquare className="h-4 w-4" />
                                    ) : (
                                        <Square className="h-4 w-4" />
                                    )}
                                    {selectedIds.size === candidates.length ? 'Deselect' : 'Select'} all on page
                                </button>
                                <span className="text-sm font-medium text-[var(--text)]">
                                    {selectedIds.size} candidate{selectedIds.size !== 1 ? 's' : ''} selected
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => bulkSaveMutation.mutate(Array.from(selectedIds))}
                                    disabled={bulkSaveMutation.isPending}
                                >
                                    <Bookmark className="mr-1.5 h-4 w-4" />
                                    Save All
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setBulkActionOpen(true)}
                                >
                                    <UserCheck className="mr-1.5 h-4 w-4" />
                                    Shortlist
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => bulkExportMutation.mutate(Array.from(selectedIds))}
                                    disabled={bulkExportMutation.isPending}
                                    isLoading={bulkExportMutation.isPending}
                                >
                                    <Download className="mr-1.5 h-4 w-4" />
                                    Export
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearSelection}
                                >
                                    <X className="mr-1.5 h-4 w-4" />
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Results */}
                {viewMode === 'map' ? (
                    <div className="h-[calc(100vh-350px)] min-h-[600px]">
                        <CandidateMapView
                            candidates={candidates}
                            savedCandidateIds={savedCandidateIds}
                            onSaveCandidate={(id) => toggleSaveMutation.mutate(id)}
                            onSearchArea={handleSearchArea}
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <Card key={i}><Skeleton variant="card" /></Card>
                            ))
                        ) : candidates.length > 0 ? (
                            candidates.map((candidate) => {
                            const card = viewMode === 'compact' ? (
                                <CompactCandidateCard
                                    key={candidate.id}
                                    candidate={candidate}
                                    searchKeyword={keyword}
                                    requiredSkills={requiredSkills}
                                    isSaved={savedCandidateIds.has(candidate.id)}
                                    onToggleSave={() => toggleSaveMutation.mutate(candidate.id)}
                                    isSaving={toggleSaveMutation.isPending && toggleSaveMutation.variables === candidate.id}
                                    isSelected={selectedIds.has(candidate.id)}
                                    onToggleSelect={() => toggleSelect(candidate.id)}
                                    isComparing={compareIds.includes(candidate.id)}
                                    onToggleCompare={() => handleToggleCompare(candidate.id)}
                                />
                            ) : (
                                <CandidateCard
                                    key={candidate.id}
                                    candidate={candidate}
                                    searchKeyword={keyword}
                                    requiredSkills={requiredSkills}
                                    isSaved={savedCandidateIds.has(candidate.id)}
                                    onToggleSave={() => toggleSaveMutation.mutate(candidate.id)}
                                    isSaving={toggleSaveMutation.isPending && toggleSaveMutation.variables === candidate.id}
                                    onShortlist={() => openJobPicker(candidate.id, 'shortlist')}
                                    onSelect={() => openJobPicker(candidate.id, 'select')}
                                    onResumeDownload={() => handleResumeDownload(candidate.userId)}
                                    isSelected={selectedIds.has(candidate.id)}
                                    onToggleSelect={() => toggleSelect(candidate.id)}
                                    isComparing={compareIds.includes(candidate.id)}
                                    onToggleCompare={() => handleToggleCompare(candidate.id)}
                                />
                            );

                            return isTouchDevice ? (
                                <SwipeableCard
                                    key={candidate.id}
                                    enabled={true}
                                    onSave={() => toggleSaveMutation.mutate(candidate.id)}
                                    onDismiss={() => {
                                        // Track dismissed candidate (optional analytics)
                                    }}
                                >
                                    {card}
                                </SwipeableCard>
                            ) : (
                                <div key={candidate.id}>{card}</div>
                            );
                        })
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
                )}

                {/* AI Recommendations */}
                {recommendedCandidates.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 pt-4">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold text-[var(--text)]">
                                Recommended for You
                            </h3>
                            <Badge variant="info" size="sm">AI-Powered</Badge>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                            Based on your recent open job postings and hiring patterns
                        </p>
                        <div className="space-y-4">
                            {recommendedCandidates.slice(0, 5).map((candidate) => {
                                const card = viewMode === 'compact' ? (
                                    <CompactCandidateCard
                                        key={candidate.id}
                                        candidate={candidate as CandidateProfile}
                                        searchKeyword={keyword}
                                        requiredSkills={requiredSkills}
                                        isSaved={savedCandidateIds.has(candidate.id)}
                                        onToggleSave={() => toggleSaveMutation.mutate(candidate.id)}
                                        isSaving={toggleSaveMutation.isPending && toggleSaveMutation.variables === candidate.id}
                                        isSelected={selectedIds.has(candidate.id)}
                                        onToggleSelect={() => toggleSelect(candidate.id)}
                                        isComparing={compareIds.includes(candidate.id)}
                                        onToggleCompare={() => handleToggleCompare(candidate.id)}
                                    />
                                ) : (
                                    <CandidateCard
                                        key={candidate.id}
                                        candidate={candidate as CandidateProfile}
                                        searchKeyword={keyword}
                                        requiredSkills={requiredSkills}
                                        isSaved={savedCandidateIds.has(candidate.id)}
                                        onToggleSave={() => toggleSaveMutation.mutate(candidate.id)}
                                        isSaving={toggleSaveMutation.isPending && toggleSaveMutation.variables === candidate.id}
                                        onShortlist={() => openJobPicker(candidate.id, 'shortlist')}
                                        onSelect={() => openJobPicker(candidate.id, 'select')}
                                        onResumeDownload={() => handleResumeDownload(candidate.userId)}
                                        isSelected={selectedIds.has(candidate.id)}
                                        onToggleSelect={() => toggleSelect(candidate.id)}
                                        isComparing={compareIds.includes(candidate.id)}
                                        onToggleCompare={() => handleToggleCompare(candidate.id)}
                                    />
                                );
                                return <div key={candidate.id}>{card}</div>;
                            })}
                        </div>
                    </div>
                )}

                {pagination && pagination.totalPages > 1 && (
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={handlePageChange}
                        totalItems={pagination.total}
                        pageSize={pagination.limit}
                    />
                )}
                {/* Job Picker Modal */}
                {jobPickerOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-lg rounded-xl bg-[var(--bg)] shadow-xl">
                            <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
                                <h3 className="text-lg font-semibold text-[var(--text)]">
                                    {jobPickerAction === 'shortlist' ? 'Shortlist' : 'Select'} for Job
                                </h3>
                                <button onClick={() => setJobPickerOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                                    <input
                                        type="text"
                                        placeholder="Search your jobs..."
                                        value={jobSearch}
                                        onChange={e => setJobSearch(e.target.value)}
                                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] py-2 pl-10 pr-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div className="max-h-72 space-y-1 overflow-y-auto">
                                    {(myJobsData?.data?.items || [])
                                        .filter((job: { title: string; status: string }) =>
                                            job.status === 'OPEN' && job.title.toLowerCase().includes(jobSearch.toLowerCase()))
                                        .map((job: { id: string; title: string; location: string }) => (
                                            <button
                                                key={job.id}
                                                type="button"
                                                onClick={() => {
                                                    if (jobPickerAction === 'shortlist') {
                                                        shortlistMutation.mutate({ candidateId: jobPickerCandidateId, jobId: job.id });
                                                    } else {
                                                        selectMutation.mutate({ candidateId: jobPickerCandidateId, jobId: job.id });
                                                    }
                                                }}
                                                disabled={shortlistMutation.isPending || selectMutation.isPending}
                                                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                                            >
                                                <div>
                                                    <p className="font-medium text-[var(--text)]">{job.title}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">{job.location}</p>
                                                </div>
                                            </button>
                                        ))}
                                    {(myJobsData?.data?.items || []).filter((job: { status: string; title: string }) =>
                                        job.status === 'OPEN' && job.title.toLowerCase().includes(jobSearch.toLowerCase())
                                    ).length === 0 && (
                                        <p className="py-8 text-center text-sm text-[var(--text-muted)]">No open jobs found.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Comparison Features */}
                <CompareBar
                    candidates={compareCandidates}
                    onRemove={(id) => setCompareIds((prev) => prev.filter((cid) => cid !== id))}
                    onClear={() => setCompareIds([])}
                    onCompare={() => setShowCompare(true)}
                />

                <CompareModal
                    isOpen={showCompare}
                    onClose={() => setShowCompare(false)}
                    candidates={compareCandidates}
                    onRemove={(id) => {
                        setCompareIds((prev) => prev.filter((cid) => cid !== id));
                        if (compareCandidates.length <= 1) {
                            setShowCompare(false);
                        }
                    }}
                />
            </div>
        </DashboardLayout>
    );
}

function CandidateCard({ candidate, searchKeyword, requiredSkills, isSaved, onToggleSave, isSaving, onShortlist, onSelect, onResumeDownload, isSelected, onToggleSelect, isComparing, onToggleCompare }: {
    candidate: CandidateProfile;
    searchKeyword?: string;
    requiredSkills?: Set<string>;
    isSaved: boolean;
    onToggleSave: () => void;
    isSaving: boolean;
    onShortlist: () => void;
    onSelect: () => void;
    onResumeDownload: () => void;
    isSelected?: boolean;
    onToggleSelect?: () => void;
    isComparing?: boolean;
    onToggleCompare?: () => void;
}) {
    const [contactOpen, setContactOpen] = useState(false);
    const name = candidate.user
        ? `${candidate.user.firstName || ''} ${candidate.user.lastName || ''}`.trim()
        : 'Anonymous';

    const lastActive = candidate.user?.lastActiveAt;
    const isRecentlyActive = (() => {
        const ts = lastActive ? new Date(lastActive) : new Date(candidate.updatedAt);
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        return ts >= fourteenDaysAgo;
    })();

    // Calculate skill match percentage
    const skillMatchCount = requiredSkills && requiredSkills.size && candidate.skills?.length
        ? candidate.skills.filter((s) => requiredSkills.has(s.toLowerCase())).length
        : 0;
    const skillMatchPct = requiredSkills && requiredSkills.size
        ? Math.round((skillMatchCount / requiredSkills.size) * 100)
        : 0;

    return (
        <Card className={cn(
            "hover:border-primary/20 hover:shadow-sm transition-all",
            isSelected && "border-primary bg-primary/5"
        )}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3 min-w-0 flex-1">
                    {onToggleSelect && (
                        <button
                            onClick={onToggleSelect}
                            className="mt-1 shrink-0"
                            aria-label={isSelected ? "Deselect candidate" : "Select candidate"}
                        >
                            {isSelected ? (
                                <CheckSquare className="h-5 w-5 text-primary" />
                            ) : (
                                <Square className="h-5 w-5 text-[var(--text-muted)] hover:text-primary" />
                            )}
                        </button>
                    )}
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
                        {/* Special Badges */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {candidate.noticePeriod === 'IMMEDIATE' && (
                                <Badge variant="success" size="sm">⚡ Immediate Joiner</Badge>
                            )}
                            {candidate.workStatus === 'ACTIVELY_LOOKING' && (
                                <Badge variant="info" size="sm">🔍 Actively Looking</Badge>
                            )}
                            {candidate.openToWork === 'OPEN_TO_OFFERS' && (
                                <Badge variant="info" size="sm">💼 Open to Offers</Badge>
                            )}
                            {candidate.user?.lastActiveAt && new Date(candidate.user.lastActiveAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                                <Badge variant="warning" size="sm">🕒 Recently Active</Badge>
                            )}
                            {candidate.willingToRelocate && (
                                <Badge variant="neutral" size="sm">📍 Open to Relocation</Badge>
                            )}
                        </div>
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
                                {lastActive ? `Active ${formatRelativeDate(lastActive)}` : isRecentlyActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>

                        {/* Activity timestamps */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-[var(--text-muted)]">
                            {candidate.updatedAt && (
                                <span className="flex items-center gap-0.5">
                                    <Pencil className="h-2.5 w-2.5" /> Modified {formatRelativeDate(candidate.updatedAt)}
                                </span>
                            )}
                        </div>

                        {/* Skill Match Badge */}
                        {skillMatchCount > 0 && requiredSkills && requiredSkills.size > 0 && (
                            <div className="mt-2">
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                        skillMatchPct >= 70
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : skillMatchPct >= 40
                                            ? 'bg-amber-50 text-amber-700'
                                            : 'bg-slate-100 text-slate-600'
                                    )}
                                >
                                    <CheckCircle className="h-3 w-3" />
                                    {skillMatchCount}/{requiredSkills.size} skills match ({skillMatchPct}%)
                                </span>
                            </div>
                        )}

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
                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                        <button
                            type="button"
                            onClick={onShortlist}
                            title="Shortlist for a job"
                            className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-primary hover:text-primary hover:bg-primary-light"
                        >
                            <Star className="h-3.5 w-3.5" /> Shortlist
                        </button>
                        <button
                            type="button"
                            onClick={onSelect}
                            title="Select for a job"
                            className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-primary hover:text-primary hover:bg-primary-light"
                        >
                            <UserCheck className="h-3.5 w-3.5" /> Select
                        </button>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setContactOpen(!contactOpen)}
                                title="Contact candidate"
                                className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-primary hover:text-primary hover:bg-primary-light"
                            >
                                <Phone className="h-3.5 w-3.5" /> Contact <ChevronDown className="h-3 w-3" />
                            </button>
                            {contactOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setContactOpen(false)} />
                                    <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-1 shadow-lg">
                                        {candidate.user?.email && (
                                            <a href={`mailto:${candidate.user.email}`} onClick={() => setContactOpen(false)}
                                                className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
                                                <Mail className="h-3.5 w-3.5" /> Email
                                            </a>
                                        )}
                                        {candidate.phone && (
                                            <a href={`tel:${candidate.phone}`} onClick={() => setContactOpen(false)}
                                                className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
                                                <Phone className="h-3.5 w-3.5" /> Call
                                            </a>
                                        )}
                                        {(candidate.phone || candidate.alternatePhone) && (
                                            <a href={`https://wa.me/${(candidate.phone || candidate.alternatePhone || '').replace(/\D/g, '')}`}
                                                target="_blank" rel="noopener noreferrer" onClick={() => setContactOpen(false)}
                                                className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
                                                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                                            </a>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
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
                        {onToggleCompare && (
                            <button
                                type="button"
                                onClick={onToggleCompare}
                                title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
                                aria-label={isComparing ? 'Remove from comparison' : 'Add to comparison'}
                                className={`rounded-lg border p-2 transition-colors ${
                                    isComparing
                                        ? 'border-primary bg-primary-light text-primary'
                                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-primary hover:text-primary hover:bg-primary-light'
                                }`}
                            >
                                <GitCompareArrows className="h-4 w-4" />
                            </button>
                        )}
                        {candidate.resume && (
                            <button
                                type="button"
                                onClick={onResumeDownload}
                                title="Download resume"
                                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-primary hover:text-primary hover:bg-primary-light"
                            >
                                <FileText className="h-4 w-4" />
                                Resume
                            </button>
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
                        <span
                            className="flex items-center gap-0.5 text-xs"
                            title={candidate.user?.isWhatsappVerified ? 'WhatsApp verified' : 'WhatsApp not verified'}
                        >
                            <MessageCircle className="h-3 w-3 text-[var(--text-muted)]" />
                            {candidate.user?.isWhatsappVerified ? (
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

function CompactCandidateCard({ candidate, searchKeyword, requiredSkills, isSaved, onToggleSave, isSaving, isSelected, onToggleSelect, isComparing, onToggleCompare }: {
    candidate: CandidateProfile;
    searchKeyword?: string;
    requiredSkills?: Set<string>;
    isSaved: boolean;
    onToggleSave: () => void;
    isSaving: boolean;
    isSelected?: boolean;
    onToggleSelect?: () => void;
    isComparing?: boolean;
    onToggleCompare?: () => void;
}) {
    const name = candidate.user
        ? `${candidate.user.firstName || ''} ${candidate.user.lastName || ''}`.trim()
        : 'Anonymous';

    // Calculate skill match percentage
    const skillMatchCount = requiredSkills && requiredSkills.size && candidate.skills?.length
        ? candidate.skills.filter((s) => requiredSkills.has(s.toLowerCase())).length
        : 0;
    const skillMatchPct = requiredSkills && requiredSkills.size
        ? Math.round((skillMatchCount / requiredSkills.size) * 100)
        : 0;

    return (
        <Card className={cn(
            "hover:border-primary/20 hover:shadow-sm transition-all",
            isSelected && "border-primary bg-primary/5"
        )}>
            <div className="flex items-center gap-3">
                {/* Checkbox */}
                {onToggleSelect && (
                    <button
                        onClick={onToggleSelect}
                        className="shrink-0"
                        aria-label={isSelected ? "Deselect candidate" : "Select candidate"}
                    >
                        {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                            <Square className="h-5 w-5 text-[var(--text-muted)] hover:text-primary" />
                        )}
                    </button>
                )}

                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light">
                    {candidate.user?.avatar ? (
                        <img
                            src={candidate.user.avatar}
                            alt={name}
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    ) : (
                        <User className="h-5 w-5 text-primary" />
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-1 items-center justify-between gap-4 min-w-0">
                    {/* Left: Name + metadata */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-[var(--text)] truncate">
                                <HighlightText text={name} highlight={searchKeyword} />
                            </p>
                            <PresenceIndicator userId={candidate.userId} />
                            {candidate.workStatus && (
                                <Badge
                                    variant={candidate.workStatus === 'ACTIVELY_LOOKING' ? 'success' : 'neutral'}
                                    size="sm"
                                >
                                    {WORK_STATUS_LABELS[candidate.workStatus]}
                                </Badge>
                            )}
                        </div>
                        {candidate.headline && (
                            <p className="text-xs text-[var(--text-secondary)] truncate">
                                <HighlightText text={candidate.headline} highlight={searchKeyword} />
                            </p>
                        )}
                        {/* Special Badges (Compact) */}
                        <div className="mt-1 flex flex-wrap gap-1">
                            {candidate.noticePeriod === 'IMMEDIATE' && (
                                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">⚡ Immediate</span>
                            )}
                            {candidate.workStatus === 'ACTIVELY_LOOKING' && (
                                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">🔍 Active</span>
                            )}
                            {candidate.openToWork === 'OPEN_TO_OFFERS' && (
                                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">💼 Open</span>
                            )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-[var(--text-muted)]">
                            {candidate.currentLocation && (
                                <span className="flex items-center gap-0.5">
                                    <MapPin className="h-3 w-3" /> {candidate.currentLocation}
                                </span>
                            )}
                            <span className="flex items-center gap-0.5">
                                <Briefcase className="h-3 w-3" /> {candidate.experienceYears} yrs
                            </span>
                            {candidate.currentCompany && (
                                <span className="flex items-center gap-0.5">
                                    <Building2 className="h-3 w-3" /> {candidate.currentCompany}
                                </span>
                            )}
                            {candidate.noticePeriod && (
                                <Badge variant="info" size="sm">
                                    {NOTICE_PERIOD_LABELS[candidate.noticePeriod]}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Center: Skills with match */}
                    <div className="hidden md:flex items-center gap-1.5 flex-wrap max-w-xs">
                        {skillMatchCount > 0 && requiredSkills && requiredSkills.size > 0 && (
                            <span
                                className={cn(
                                    'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap',
                                    skillMatchPct >= 70
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : skillMatchPct >= 40
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'bg-slate-100 text-slate-600'
                                )}
                            >
                                {skillMatchCount}/{requiredSkills.size} match
                            </span>
                        )}
                        {candidate.skills?.slice(0, 4).map((skill) => {
                            const isMatch =
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
                                    variant={isMatch ? 'success' : 'primary'}
                                />
                            );
                        })}
                        {(candidate.skills?.length || 0) > 4 && (
                            <span className="text-[10px] text-[var(--text-muted)]">
                                +{candidate.skills!.length - 4}
                            </span>
                        )}
                    </div>

                    {/* Right: Salary + Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                        {candidate.expectedSalaryMin && (
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-[var(--text)] whitespace-nowrap">
                                    {candidate.expectedSalaryMin.toLocaleString()}
                                    {candidate.expectedSalaryMax
                                        ? ` - ${candidate.expectedSalaryMax.toLocaleString()}`
                                        : '+'}
                                </p>
                                <p className="text-[10px] text-[var(--text-muted)]">
                                    {candidate.salaryCurrency}/yr
                                </p>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    window.location.href = `/employer/candidates/${candidate.userId}`;
                                }}
                            >
                                View
                            </Button>
                            <button
                                type="button"
                                onClick={onToggleSave}
                                disabled={isSaving}
                                aria-label={isSaved ? 'Unsave' : 'Save'}
                                className={cn(
                                    'rounded-lg p-2 transition-colors disabled:opacity-50',
                                    isSaved
                                        ? 'text-primary'
                                        : 'text-[var(--text-muted)] hover:text-primary'
                                )}
                            >
                                <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
                            </button>
                            {onToggleCompare && (
                                <button
                                    type="button"
                                    onClick={onToggleCompare}
                                    aria-label={isComparing ? 'Remove from comparison' : 'Add to comparison'}
                                    className={cn(
                                        'rounded-lg p-2 transition-colors',
                                        isComparing
                                            ? 'text-primary'
                                            : 'text-[var(--text-muted)] hover:text-primary'
                                    )}
                                >
                                    <GitCompareArrows className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
