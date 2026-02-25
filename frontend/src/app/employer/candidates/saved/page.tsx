'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    User, MapPin, Briefcase, Building2, Mail, Phone,
    BookmarkX, Clock, Activity, FileText, CheckCircle,
    XCircle, Search, Bookmark, MessageCircle, Pencil,
    Star, UserCheck, ChevronDown, X,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tag from '@/components/ui/Tag';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import PresenceIndicator from '@/components/ui/PresenceIndicator';
import { showToast } from '@/components/ui/Toast';
import { employerService } from '@/services/employer.service';
import { jobService } from '@/services/job.service';
import { QUERY_KEYS, PAGINATION } from '@/constants/config';
import { ROUTES } from '@/constants/routes';
import {
    WORK_STATUS_LABELS, NOTICE_PERIOD_LABELS,
    WORK_MODE_LABELS,
} from '@/constants/enums';
import { formatRelativeDate } from '@/lib/utils';
import { formatSalaryAsLPA } from '@/utils/format';
import type { CandidateProfile } from '@/types/candidate';
import type { ApiError } from '@/types/api';

export default function SavedCandidatesPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [jobPickerOpen, setJobPickerOpen] = useState(false);
    const [jobPickerAction, setJobPickerAction] = useState<'shortlist' | 'select'>('shortlist');
    const [jobPickerCandidateId, setJobPickerCandidateId] = useState('');
    const [jobSearch, setJobSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: [...QUERY_KEYS.EMPLOYERS.SAVED_CANDIDATES, page],
        queryFn: () => employerService.getSavedCandidates(page, PAGINATION.CANDIDATES_PER_PAGE),
    });

    const toggleSaveMutation = useMutation({
        mutationFn: (id: string) => employerService.toggleSavedCandidate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYERS.SAVED_CANDIDATES });
            showToast.success('Candidate removed from saved');
        },
        onError: () => {
            showToast.error('Failed to update list');
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

    const candidates = data?.data?.items || [];
    const pagination = data?.data;

    return (
        <DashboardLayout requiredRole={['EMPLOYER']}>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text)]">Saved Candidates</h1>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Manage your shortlisted candidates
                        </p>
                    </div>
                    <Link href={ROUTES.EMPLOYER.CANDIDATES}>
                        <Button variant="outline" leftIcon={<Search className="h-4 w-4" />}>
                            Search Candidates
                        </Button>
                    </Link>
                </div>

                <div className="space-y-3">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <Card key={i}><Skeleton variant="card" /></Card>
                        ))
                    ) : candidates.length > 0 ? (
                        candidates.map((candidate) => (
                            <SavedCandidateCard
                                key={candidate.id}
                                candidate={candidate}
                                onRemove={() => toggleSaveMutation.mutate(candidate.id)}
                                isRemoving={toggleSaveMutation.isPending && toggleSaveMutation.variables === candidate.id}
                                onShortlist={() => openJobPicker(candidate.id, 'shortlist')}
                                onSelect={() => openJobPicker(candidate.id, 'select')}
                            />
                        ))
                    ) : (
                        <EmptyState
                            icon={Bookmark}
                            title="No saved candidates"
                            description="Save candidates from search results to review them later."
                            action={
                                <Link href={ROUTES.EMPLOYER.CANDIDATES}>
                                    <Button size="sm">Browse Candidates</Button>
                                </Link>
                            }
                        />
                    )}
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <Pagination
                        currentPage={page}
                        totalPages={pagination.totalPages}
                        onPageChange={setPage}
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
            </div>
        </DashboardLayout>
    );
}

function SavedCandidateCard({ candidate, onRemove, isRemoving, onShortlist, onSelect }: {
    candidate: CandidateProfile;
    onRemove: () => void;
    isRemoving: boolean;
    onShortlist: () => void;
    onSelect: () => void;
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

    return (
        <Card className="hover:border-primary/20 hover:shadow-sm transition-all">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4 min-w-0 flex-1">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-light">
                        {candidate.user?.avatar ? (
                            <img src={candidate.user.avatar} alt={name} className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                            <User className="h-6 w-6 text-primary" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="flex items-center gap-2 font-semibold text-[var(--text)]">
                            <Link
                                href={ROUTES.EMPLOYER.CANDIDATE_DETAIL(candidate.id)}
                                className="hover:text-primary transition-colors"
                            >
                                {name}
                            </Link>
                            <PresenceIndicator userId={candidate.userId} />
                        </p>
                        {candidate.headline && (
                            <p className="text-sm text-[var(--text-secondary)] line-clamp-1">{candidate.headline}</p>
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
                                <span>{candidate.currentRole}</span>
                            )}
                            <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> Updated {formatRelativeDate(candidate.updatedAt)}
                            </span>
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

                        {(candidate.skills?.length ?? 0) > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {candidate.skills.slice(0, 6).map(skill => (
                                    <Tag key={skill} label={skill} size="sm" variant="primary" />
                                ))}
                                {candidate.skills.length > 6 && (
                                    <Tag label={`+${candidate.skills.length - 6}`} size="sm" />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                        <button type="button" onClick={onShortlist} title="Shortlist for a job"
                            className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-primary hover:text-primary hover:bg-primary-light">
                            <Star className="h-3.5 w-3.5" /> Shortlist
                        </button>
                        <button type="button" onClick={onSelect} title="Select for a job"
                            className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-primary hover:text-primary hover:bg-primary-light">
                            <UserCheck className="h-3.5 w-3.5" /> Select
                        </button>
                        <div className="relative">
                            <button type="button" onClick={() => setContactOpen(!contactOpen)} title="Contact candidate"
                                className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-primary hover:text-primary hover:bg-primary-light">
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
                        <Link href={ROUTES.EMPLOYER.CANDIDATE_DETAIL(candidate.id)}>
                            <Button size="sm">View Profile</Button>
                        </Link>
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
                        <button
                            type="button"
                            onClick={onRemove}
                            disabled={isRemoving}
                            title="Remove from saved"
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--error)] hover:text-[var(--error)] hover:bg-red-50 disabled:opacity-50"
                        >
                            <BookmarkX className="h-4 w-4" />
                        </button>
                    </div>

                    {candidate.expectedSalaryMin && (
                        <p className="text-sm font-semibold text-[var(--text)]">
                            {(candidate.salaryCurrency || 'INR').toUpperCase() === 'INR'
                                ? formatSalaryAsLPA(candidate.expectedSalaryMin, candidate.expectedSalaryMax)
                                : <>
                                    {candidate.expectedSalaryMin.toLocaleString()}
                                    {candidate.expectedSalaryMax ? ` - ${candidate.expectedSalaryMax.toLocaleString()}` : '+'}
                                    <span className="text-xs font-normal text-[var(--text-muted)]"> {candidate.salaryCurrency}/yr</span>
                                </>
                            }
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
                </div>
            </div>
        </Card>
    );
}
