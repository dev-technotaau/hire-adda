'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Briefcase, MapPin, Eye, Users,
    Clock, Pencil, Power, AlertCircle, UserCheck,
    UserX, Calendar, ChevronRight, Sparkles,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import { showToast } from '@/components/ui/Toast';
import { jobService } from '@/services/job.service';
import { useRecommendedCandidates } from '@/hooks/use-recommendations';
import { ROUTES } from '@/constants/routes';
import { QUERY_KEYS, PAGINATION } from '@/constants/config';
import {
    JOB_STATUS_LABELS, JOB_TYPE_LABELS, WORK_MODE_LABELS,
    APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS,
} from '@/constants/enums';
import { formatRelativeDate, formatDate, formatSalaryRange } from '@/lib/utils';
import type { ApiError } from '@/types/api';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const statusBadgeMap: Record<string, BadgeVariant> = {
    OPEN: 'success',
    CLOSED: 'neutral',
    DRAFT: 'warning',
    EXPIRED: 'error',
};

const statusColorMap: Record<string, BadgeVariant> = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'error',
    neutral: 'neutral',
};

export default function JobDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const queryClient = useQueryClient();
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);

    const { data: jobData, isLoading: jobLoading } = useQuery({
        queryKey: QUERY_KEYS.JOBS.DETAIL(id),
        queryFn: () => jobService.getJob(id),
        enabled: !!id,
    });

    const { data: applicationsData, isLoading: appsLoading } = useQuery({
        queryKey: [...QUERY_KEYS.JOBS.APPLICATIONS(id), 1, 5],
        queryFn: () => jobService.getJobApplications(id, 1, 5),
        enabled: !!id,
    });

    const { data: aiCandidatesData } = useRecommendedCandidates(id);
    const aiCandidates = aiCandidatesData?.data || [];

    const deactivateMutation = useMutation({
        mutationFn: () => jobService.deactivateJob(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.DETAIL(id) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.MY_JOBS });
            showToast.success('Job deactivated successfully');
            setShowDeactivateModal(false);
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to deactivate job');
        },
    });

    const job = jobData?.data;
    const applications = applicationsData?.data?.items || [];
    const applicationsPagination = applicationsData?.data;

    // Use statusCounts from API response if available, otherwise estimate from visible applications
    const statusCounts = (applicationsData?.data as unknown as Record<string, unknown>)?.statusCounts as Record<string, number> | undefined;
    const shortlistedCount = statusCounts?.SHORTLISTED ?? applications.filter(a => a.status === 'SHORTLISTED').length;
    const rejectedCount = statusCounts?.REJECTED ?? applications.filter(a => a.status === 'REJECTED').length;

    if (jobLoading) {
        return (
            <DashboardLayout requiredRole={['EMPLOYER']}>
                <div className="space-y-6">
                    <Skeleton variant="line" width="200px" height="32px" />
                    <Skeleton variant="rect" height="200px" />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} variant="rect" height="100px" />
                        ))}
                    </div>
                    <Skeleton variant="rect" height="300px" />
                </div>
            </DashboardLayout>
        );
    }

    if (!job) {
        return (
            <DashboardLayout requiredRole={['EMPLOYER']}>
                <div className="flex flex-col items-center justify-center py-20">
                    <Briefcase className="h-12 w-12 text-[var(--text-muted)]" />
                    <h2 className="mt-4 text-lg font-semibold text-[var(--text)]">Job not found</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">The job you are looking for does not exist.</p>
                    <Link href={ROUTES.EMPLOYER.MY_JOBS} className="mt-4">
                        <Button variant="outline" size="sm">Back to My Jobs</Button>
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout requiredRole={['EMPLOYER']}>
            <div className="space-y-6">
                {/* Breadcrumb */}
                <Breadcrumb items={[
                    { label: 'Dashboard', href: ROUTES.EMPLOYER.DASHBOARD },
                    { label: 'My Jobs', href: ROUTES.EMPLOYER.MY_JOBS },
                    { label: job.title },
                ]} />

                {/* Job Header */}
                <Card>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-xl font-bold text-[var(--text)]">{job.title}</h1>
                                <Badge variant={statusBadgeMap[job.status] || 'neutral'}>
                                    {JOB_STATUS_LABELS[job.status] || job.status}
                                </Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--text-muted)]">
                                {job.location && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4" /> {job.location}
                                    </span>
                                )}
                                {job.type && (
                                    <span className="flex items-center gap-1.5">
                                        <Briefcase className="h-4 w-4" /> {JOB_TYPE_LABELS[job.type] || job.type}
                                    </span>
                                )}
                                {job.workMode && (
                                    <span className="flex items-center gap-1.5">
                                        {WORK_MODE_LABELS[job.workMode] || job.workMode}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Eye className="h-4 w-4" /> {job.views} views
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Users className="h-4 w-4" /> {job._applicationCount ?? 0} applications
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" /> Posted {formatRelativeDate(job.createdAt)}
                                </span>
                            </div>
                            {job.salaryMin || job.salaryMax ? (
                                <p className="mt-2 text-sm font-medium text-[var(--text)]">
                                    {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
                                    {job.salaryType === 'ANNUAL' ? ' / year' : job.salaryType === 'MONTHLY' ? ' / month' : job.salaryType === 'HOURLY' ? ' / hour' : ''}
                                </p>
                            ) : null}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Tooltip content={job.status === 'CLOSED' || job.status === 'EXPIRED' ? 'Cannot edit a closed or expired job' : 'Edit job details'}>
                                <Link href={ROUTES.EMPLOYER.JOB_EDIT(job.id)}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={<Pencil className="h-4 w-4" />}
                                        disabled={job.status === 'CLOSED' || job.status === 'EXPIRED'}
                                    >
                                        Edit
                                    </Button>
                                </Link>
                            </Tooltip>
                            <Tooltip content={job.status !== 'OPEN' ? 'Only open jobs can be deactivated' : 'Close this job listing'}>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    leftIcon={<Power className="h-4 w-4" />}
                                    onClick={() => setShowDeactivateModal(true)}
                                    disabled={job.status !== 'OPEN'}
                                >
                                    Deactivate
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </Card>

                {/* Quick Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--info-light)]">
                                <Eye className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[var(--text)]">{job.views}</p>
                                <p className="text-xs text-[var(--text-muted)]">Total Views</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--info-light)]">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[var(--text)]">{applicationsPagination?.total ?? job._applicationCount ?? 0}</p>
                                <p className="text-xs text-[var(--text-muted)]">Total Applications</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-light)]">
                                <UserCheck className="h-5 w-5 text-[var(--success-dark)]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[var(--text)]">{shortlistedCount}</p>
                                <p className="text-xs text-[var(--text-muted)]">Shortlisted</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--error-light)]">
                                <UserX className="h-5 w-5 text-[var(--error-dark)]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[var(--text)]">{rejectedCount}</p>
                                <p className="text-xs text-[var(--text-muted)]">Rejected</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Job Details */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        {job.description && (
                            <Card>
                                <h2 className="text-base font-semibold text-[var(--text)] mb-3">Description</h2>
                                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{job.description}</p>
                            </Card>
                        )}

                        {/* Key Responsibilities */}
                        {job.keyResponsibilities && (
                            <Card>
                                <h2 className="text-base font-semibold text-[var(--text)] mb-3">Key Responsibilities</h2>
                                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{job.keyResponsibilities}</p>
                            </Card>
                        )}

                        {/* Requirements */}
                        {job.requirements && (
                            <Card>
                                <h2 className="text-base font-semibold text-[var(--text)] mb-3">Requirements</h2>
                                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{job.requirements}</p>
                            </Card>
                        )}

                        {/* Benefits */}
                        {job.benefits && (
                            <Card>
                                <h2 className="text-base font-semibold text-[var(--text)] mb-3">Benefits</h2>
                                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{job.benefits}</p>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        {/* Skills */}
                        {(job.skillsRequired?.length ?? 0) > 0 && (
                            <Card>
                                <h2 className="text-base font-semibold text-[var(--text)] mb-3">Required Skills</h2>
                                <div className="flex flex-wrap gap-1.5">
                                    {job.skillsRequired.map((skill) => (
                                        <Tag key={skill} label={skill} size="sm" variant="primary" />
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Tags */}
                        {job.tags.length > 0 && (
                            <Card>
                                <h2 className="text-base font-semibold text-[var(--text)] mb-3">Tags</h2>
                                <div className="flex flex-wrap gap-1.5">
                                    {job.tags.map((tag) => (
                                        <Tag key={tag} label={tag} size="sm" />
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Job Info */}
                        <Card>
                            <h2 className="text-base font-semibold text-[var(--text)] mb-3">Job Information</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-muted)]">Experience</span>
                                    <span className="text-[var(--text)]">
                                        {job.experienceMin}-{job.experienceMax || job.experienceMin}+ years
                                    </span>
                                </div>
                                {job.numberOfOpenings && (
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-muted)]">Openings</span>
                                        <span className="text-[var(--text)]">{job.numberOfOpenings}</span>
                                    </div>
                                )}
                                {job.applicationDeadline && (
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-muted)]">Deadline</span>
                                        <span className="text-[var(--text)]">{formatDate(job.applicationDeadline)}</span>
                                    </div>
                                )}
                                {job.expiresAt && (
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-muted)]">Expires</span>
                                        <span className="text-[var(--text)]">{formatDate(job.expiresAt)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-muted)]">Created</span>
                                    <span className="text-[var(--text)]">{formatDate(job.createdAt)}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* AI Recommended Candidates */}
                {aiCandidates.length > 0 && (
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <h2 className="text-base font-semibold text-[var(--text)]">AI Recommended Candidates</h2>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {aiCandidates.slice(0, 4).map((candidate: Record<string, unknown>, i: number) => {
                                const cUser = candidate.user as Record<string, string> | undefined;
                                const name = [cUser?.firstName, cUser?.lastName].filter(Boolean).join(' ') || 'Candidate';
                                return (
                                    <div
                                        key={(candidate.id as string) || i}
                                        className="rounded-lg border border-primary/20 bg-primary-50/20 p-4"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0">
                                                <p className="font-medium text-[var(--text)]">{name}</p>
                                                {candidate.headline ? (
                                                    <p className="text-sm text-[var(--text-muted)] truncate">{String(candidate.headline)}</p>
                                                ) : null}
                                                {candidate.experienceYears !== undefined ? (
                                                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                        {Number(candidate.experienceYears)} yrs experience
                                                    </p>
                                                ) : null}
                                            </div>
                                            {candidate.matchScore ? (
                                                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                    {Math.round(candidate.matchScore as number)}% match
                                                </span>
                                            ) : null}
                                        </div>
                                        {(candidate.skills as string[] | undefined)?.length ? (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {(candidate.skills as string[]).slice(0, 4).map((skill) => (
                                                    <span key={skill} className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-xs text-[var(--text-muted)]">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {(candidate.skills as string[]).length > 4 && (
                                                    <span className="text-xs text-[var(--text-muted)]">
                                                        +{(candidate.skills as string[]).length - 4} more
                                                    </span>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {/* Recent Applications */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-[var(--text)]">Recent Applications</h2>
                        <Link href={ROUTES.EMPLOYER.JOB_APPLICATIONS(job.id)}>
                            <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                                View All
                            </Button>
                        </Link>
                    </div>

                    {appsLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} variant="card" />
                            ))}
                        </div>
                    ) : applications.length > 0 ? (
                        <div className="space-y-3">
                            {applications.map((app) => {
                                const candidate = app.candidate;
                                const user = candidate?.user;
                                const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Unknown';
                                const badgeColor = statusColorMap[APPLICATION_STATUS_COLORS[app.status] || 'neutral'] || 'neutral';

                                return (
                                    <div
                                        key={app.id}
                                        className="flex flex-col gap-3 rounded-lg border border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium text-[var(--text)]">{name}</p>
                                            {candidate?.headline && (
                                                <p className="text-sm text-[var(--text-muted)]">{candidate.headline}</p>
                                            )}
                                            <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                                                {candidate?.experienceYears !== undefined && (
                                                    <span>{candidate.experienceYears} yrs exp</span>
                                                )}
                                                <span>Applied {formatRelativeDate(app.appliedAt)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {app.matchScore !== null && (
                                                <span className="text-xs font-medium text-primary">
                                                    {Math.round(app.matchScore)}% match
                                                </span>
                                            )}
                                            <Badge variant={badgeColor} size="sm">
                                                {APPLICATION_STATUS_LABELS[app.status] || app.status}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="py-8 text-center text-sm text-[var(--text-muted)]">
                            No applications received yet.
                        </p>
                    )}
                </Card>

                {/* Deactivate Modal */}
                <Modal
                    isOpen={showDeactivateModal}
                    onClose={() => setShowDeactivateModal(false)}
                    title="Deactivate Job"
                    size="sm"
                    footer={
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowDeactivateModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => deactivateMutation.mutate()}
                                isLoading={deactivateMutation.isPending}
                            >
                                Deactivate
                            </Button>
                        </div>
                    }
                >
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 shrink-0 text-[var(--warning)]" />
                        <p className="text-sm text-[var(--text-secondary)]">
                            Are you sure you want to deactivate this job? It will no longer be visible to candidates and no new applications will be accepted.
                        </p>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
