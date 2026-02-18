'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Bookmark, Building2, MapPin, Briefcase,
    Clock, BookmarkX,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Tag from '@/components/ui/Tag';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/Toast';
import { useSavedJobs, useToggleSaveJob } from '@/hooks/use-jobs';
import { ROUTES } from '@/constants/routes';
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from '@/constants/enums';
import { formatSalaryRange, formatRelativeDate } from '@/lib/utils';
import { PAGINATION } from '@/constants/config';

export default function SavedJobsPage() {
    const [page, setPage] = useState(1);
    const { data, isLoading } = useSavedJobs(page, PAGINATION.JOBS_PER_PAGE);
    const toggleSave = useToggleSaveJob();

    const jobs = data?.data?.items || [];
    const pagination = data?.data;

    const handleUnsave = async (jobId: string) => {
        try {
            await toggleSave.mutateAsync(jobId);
            showToast.success('Job removed from saved');
        } catch {
            showToast.error('Failed to remove job');
        }
    };

    return (
        <DashboardLayout requiredRole={['CANDIDATE']}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Saved Jobs</h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Jobs you&apos;ve bookmarked for later
                    </p>
                </div>

                <div className="space-y-3">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <Card key={i}><Skeleton variant="card" /></Card>
                        ))
                    ) : jobs.length > 0 ? (
                        jobs.map((job) => (
                            <Card key={job.id} className="hover:shadow-sm transition-shadow">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex gap-3 min-w-0 flex-1">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
                                            {job.company?.logo ? (
                                                <img src={job.company.logo} alt={job.company?.companyName || 'Company logo'} className="h-9 w-9 rounded-md object-contain" />
                                            ) : (
                                                <Building2 className="h-5 w-5 text-[var(--text-muted)]" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <Link
                                                href={ROUTES.CANDIDATE.JOB_DETAIL(job.id)}
                                                className="font-medium text-[var(--text)] hover:text-primary transition-colors"
                                            >
                                                {job.title}
                                            </Link>
                                            <p className="text-sm text-[var(--text-muted)]">{job.company?.companyName}</p>
                                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                                                <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {job.experienceMin}-{job.experienceMax || job.experienceMin}+ yrs</span>
                                                <span>{formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}</span>
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatRelativeDate(job.createdAt)}</span>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {job.type && <Badge variant="info" size="sm">{JOB_TYPE_LABELS[job.type]}</Badge>}
                                                {job.workMode && <Badge variant="neutral" size="sm">{WORK_MODE_LABELS[job.workMode]}</Badge>}
                                            </div>
                                            {(job.skillsRequired?.length ?? 0) > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {job.skillsRequired.slice(0, 4).map(s => (
                                                        <Tag key={s} label={s} size="sm" variant="primary" />
                                                    ))}
                                                    {job.skillsRequired.length > 4 && (
                                                        <Tag label={`+${job.skillsRequired.length - 4}`} size="sm" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Link href={ROUTES.CANDIDATE.JOB_DETAIL(job.id)}>
                                            <Button size="sm">View</Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleUnsave(job.id)}
                                            disabled={toggleSave.isPending}
                                            className="text-[var(--error)]"
                                        >
                                            <BookmarkX className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <EmptyState
                            icon={Bookmark}
                            title="No saved jobs"
                            description="Save jobs you're interested in to review them later."
                            action={
                                <Link href={ROUTES.CANDIDATE.JOBS}>
                                    <Button size="sm">Browse Jobs</Button>
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
            </div>
        </DashboardLayout>
    );
}
