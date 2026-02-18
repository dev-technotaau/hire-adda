'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    MapPin, Filter, Briefcase,
    Building2, Clock, Bookmark, BookmarkCheck,
    ShieldCheck, Star, Sparkles, Bell,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
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
import { showToast } from '@/components/ui/Toast';
import { useJobSearch, useToggleSaveJob, useSavedJobs } from '@/hooks/use-jobs';
import { useSuggestLocations, useDidYouMean } from '@/hooks/use-search';
import { savedSearchService } from '@/services/saved-search.service';
import { candidateService } from '@/services/candidate.service';
import { ROUTES } from '@/constants/routes';
import {
    JOB_TYPE_LABELS, WORK_MODE_LABELS, EXPERIENCE_LEVEL_LABELS,
    SHIFT_TYPE_LABELS, COMPANY_TYPE_LABELS, URGENCY_LEVEL_LABELS,
    EDUCATION_LEVEL_LABELS,
} from '@/constants/enums';
import { formatSalaryRange, formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import HighlightText from '@/components/ui/HighlightText';
import { PAGINATION } from '@/constants/config';
import type { JobSearchFilters, Job } from '@/types/job';
import type { ApiError } from '@/types/api';
import type { AutocompleteResult, SuggestionType } from '@/types/search';

const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date', label: 'Most Recent' },
    { value: 'salary', label: 'Salary (High to Low)' },
];

const JOB_FILTER_SECTIONS: FilterSection[] = [
    { key: 'type', label: 'Job Type', type: 'select', options: JOB_TYPE_LABELS },
    { key: 'workMode', label: 'Work Mode', type: 'select', options: WORK_MODE_LABELS },
    { key: 'experienceLevel', label: 'Experience', type: 'select', options: EXPERIENCE_LEVEL_LABELS },
    { key: 'shiftType', label: 'Shift', type: 'select', options: SHIFT_TYPE_LABELS },
    { key: 'companyType', label: 'Company Type', type: 'select', options: COMPANY_TYPE_LABELS },
    { key: 'urgencyLevel', label: 'Urgency', type: 'select', options: URGENCY_LEVEL_LABELS },
    { key: 'educationRequired', label: 'Education', type: 'select', options: EDUCATION_LEVEL_LABELS },
    {
        key: 'salary',
        label: 'Salary Range',
        type: 'range',
        rangePlaceholderMin: 'e.g. 500000',
        rangePlaceholderMax: 'e.g. 2000000',
        rangePrefix: '₹',
    },
];

export default function JobSearchPage() {
    const searchParams = useSearchParams();
    const initialQ = searchParams.get('q') || '';
    const initialLocation = searchParams.get('location') || '';

    const [filters, setFilters] = useState<JobSearchFilters>({
        page: '1',
        limit: String(PAGINATION.JOBS_PER_PAGE),
        sortBy: 'relevance',
        ...(initialQ && { keyword: initialQ }),
        ...(initialLocation && { location: initialLocation }),
    });
    const [keyword, setKeyword] = useState(initialQ);
    const [locationQuery, setLocationQuery] = useState(initialLocation);
    const [showFilters, setShowFilters] = useState(false);
    const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
    const [showSaveSearch, setShowSaveSearch] = useState(false);
    const [saveSearchName, setSaveSearchName] = useState('');

    const { data, isLoading } = useJobSearch(filters);
    const { data: savedJobsData } = useSavedJobs(1, 200);
    const toggleSave = useToggleSaveJob();
    const { data: didYouMeanData } = useDidYouMean(keyword, 'jobs');
    const { data: locationSuggestions, isLoading: isLoadingLocations } = useSuggestLocations(locationQuery);

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

    const jobs = data?.data?.items || [];

    // Pre-populate savedJobIds from the saved jobs query
    useEffect(() => {
        const savedItems = savedJobsData?.data?.items;
        if (savedItems && savedItems.length > 0) {
            setSavedJobIds(new Set(savedItems.map((j: Job) => j.id)));
        }
    }, [savedJobsData]);
    const pagination = data?.data;

    const handleKeywordSearch = useCallback((query: string) => {
        setKeyword(query);
        setFilters(prev => ({
            ...prev,
            keyword: query || undefined,
            page: '1',
        }));
    }, []);

    const handleKeywordSelect = useCallback((item: AutocompleteResult) => {
        setKeyword(item.text);
        setFilters(prev => ({
            ...prev,
            keyword: item.text || undefined,
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
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: '1',
        }));
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page: String(page) }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSaveJob = async (jobId: string) => {
        try {
            const res = await toggleSave.mutateAsync(jobId);
            const saved = (res as { data?: { saved?: boolean } })?.data?.saved;
            setSavedJobIds(prev => {
                const next = new Set(prev);
                if (saved) next.add(jobId); else next.delete(jobId);
                return next;
            });
        } catch {
            showToast.error('Failed to save job');
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
    };

    const activeFilterCount = Object.entries(filters).filter(
        ([key, val]) => val && !['page', 'limit', 'sortBy', 'keyword', 'location'].includes(key)
    ).length;

    const filterValues = useMemo(() => ({
        type: filters.type,
        workMode: filters.workMode,
        experienceLevel: filters.experienceLevel,
        shiftType: filters.shiftType,
        companyType: filters.companyType,
        urgencyLevel: filters.urgencyLevel,
        educationRequired: filters.educationRequired,
        salaryMin: filters.salaryMin,
        salaryMax: filters.salaryMax,
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

    const didYouMean = didYouMeanData?.data?.suggestion;

    return (
        <DashboardLayout requiredRole={['CANDIDATE']}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Search Jobs</h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Find opportunities that match your skills and preferences
                    </p>
                </div>

                {/* Search Bar */}
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
                            />
                        </div>
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

                {/* Active filter tags */}
                <ActiveFilterTags
                    sections={JOB_FILTER_SECTIONS}
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
                            onClick={() => setShowFilters(!showFilters)}
                            className="relative"
                        >
                            <Filter className="mr-1.5 h-4 w-4" />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                        {activeFilterCount > 0 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowSaveSearch(true)}
                                >
                                    <Star className="mr-1.5 h-4 w-4" />
                                    Save Search
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
                                            showToast.success('Job alert created! You\'ll be notified of new matches.');
                                        } catch (err) {
                                            const error = err as unknown as ApiError;
                                            showToast.error(error.message || 'Failed to create alert');
                                        }
                                    }}
                                >
                                    <Bell className="mr-1.5 h-4 w-4" />
                                    Create Alert
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {pagination && (
                            <span className="text-sm text-[var(--text-muted)]">
                                {pagination.total.toLocaleString()} jobs found
                            </span>
                        )}
                        <select
                            value={filters.sortBy || 'relevance'}
                            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                            className="h-9 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            {sortOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                <AdvancedFilters
                    sections={JOB_FILTER_SECTIONS}
                    values={filterValues}
                    onChange={handleFilterChange}
                    onClear={clearFilters}
                    activeCount={activeFilterCount}
                    isOpen={showFilters}
                    onClose={() => setShowFilters(false)}
                    layout="panel"
                />

                {/* Save Search Dialog */}
                {showSaveSearch && (
                    <Card>
                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Save this search</label>
                                <input
                                    type="text"
                                    placeholder="Name your search, e.g. 'React jobs in Mumbai'"
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

                {/* Job List */}
                <div className="space-y-4">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <Card key={i}>
                                <Skeleton variant="card" />
                            </Card>
                        ))
                    ) : jobs.length > 0 ? (
                        jobs.map((job) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                searchKeyword={keyword}
                                isSaved={savedJobIds.has(job.id)}
                                onSave={() => handleSaveJob(job.id)}
                                isSaving={toggleSave.isPending && toggleSave.variables === job.id}
                            />
                        ))
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
                </div>

                {/* Pagination */}
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

function JobCard({ job, searchKeyword, isSaved, onSave, isSaving }: { job: Job; searchKeyword?: string; isSaved: boolean; onSave: () => void; isSaving: boolean }) {
    return (
        <Card className="hover:border-primary/20 hover:shadow-sm transition-all">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4 min-w-0 flex-1">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-tertiary)]">
                        {job.company?.logo ? (
                            <img src={job.company.logo} alt={job.company.companyName} className="h-10 w-10 rounded-lg object-contain" />
                        ) : (
                            <Building2 className="h-6 w-6 text-[var(--text-muted)]" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <Link
                            href={ROUTES.CANDIDATE.JOB_DETAIL(job.id)}
                            className="text-base font-semibold text-[var(--text)] hover:text-primary transition-colors"
                        >
                            <HighlightText text={job.title} highlight={searchKeyword} />
                        </Link>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                            <HighlightText text={job.company?.companyName || ''} highlight={searchKeyword} />
                            {job.company?.isVerified && (
                                <span
                                    className="inline-flex items-center gap-0.5 rounded-full bg-[var(--success-light)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--success-dark)]"
                                    title="This company has been verified via GST registration"
                                >
                                    <ShieldCheck className="h-3 w-3" />
                                    GST Verified
                                </span>
                            )}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5" /> {job.experienceMin}-{job.experienceMax || job.experienceMin}+ yrs
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> {formatRelativeDate(job.createdAt)}
                            </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {job.type && <Badge variant="info" size="sm">{JOB_TYPE_LABELS[job.type] || job.type}</Badge>}
                            {job.workMode && <Badge variant="neutral" size="sm">{WORK_MODE_LABELS[job.workMode] || job.workMode}</Badge>}
                            {job.urgencyLevel === 'URGENT' && <Badge variant="warning" size="sm">Urgent</Badge>}
                            {job.urgencyLevel === 'IMMEDIATE' && <Badge variant="error" size="sm">Immediate</Badge>}
                        </div>
                        {(job.skillsRequired?.length ?? 0) > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {job.skillsRequired.slice(0, 5).map((skill) => {
                                    const isMatch = searchKeyword && searchKeyword.toLowerCase().split(/[\s,]+/).some(t => t.length > 1 && skill.toLowerCase().includes(t));
                                    return (
                                        <Tag key={skill} label={skill} size="sm" variant={isMatch ? 'success' : 'primary'} />
                                    );
                                })}
                                {job.skillsRequired.length > 5 && (
                                    <Tag label={`+${job.skillsRequired.length - 5}`} size="sm" />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                    <p className="text-sm font-semibold text-[var(--text)]">
                        {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
                    </p>
                    {job.salaryType && (
                        <span className="text-xs text-[var(--text-muted)]">
                            {job.salaryType === 'ANNUAL' ? '/yr' : job.salaryType === 'MONTHLY' ? '/mo' : '/hr'}
                        </span>
                    )}
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className={cn(
                            'rounded-lg p-2 transition-colors disabled:opacity-50',
                            isSaved
                                ? 'text-primary bg-primary-light'
                                : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-primary'
                        )}
                        title={isSaved ? 'Unsave job' : 'Save job'}
                        aria-label={isSaved ? 'Unsave job' : 'Save job'}
                    >
                        {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                    </button>
                </div>
            </div>
        </Card>
    );
}
