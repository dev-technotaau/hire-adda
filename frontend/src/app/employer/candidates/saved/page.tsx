'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  MapPin,
  Briefcase,
  Building2,
  Mail,
  Phone,
  BookmarkX,
  Clock,
  Activity,
  FileText,
  CheckCircle,
  XCircle,
  Search,
  Bookmark,
  MessageCircle,
  Pencil,
  Star,
  UserCheck,
  ChevronDown,
  X,
  Download,
  FileDown,
  CheckSquare,
  Square,
  GitCompareArrows,
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
import CompareBar from '@/components/candidates/CompareBar';
import CompareModal from '@/components/candidates/CompareModal';
import { employerService } from '@/services/employer.service';
import { jobService } from '@/services/job.service';
import { QUERY_KEYS, PAGINATION } from '@/constants/config';
import { ROUTES } from '@/constants/routes';
import { WORK_STATUS_LABELS, NOTICE_PERIOD_LABELS, WORK_MODE_LABELS } from '@/constants/enums';
import { formatRelativeDate } from '@/lib/utils';
import { formatSalaryAsLPA } from '@/utils/format';
import type { CandidateProfile } from '@/types/candidate';
import type { ApiError } from '@/types/api';

export default function SavedCandidatesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
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

  const bulkExportMutation = useMutation({
    mutationFn: (candidateIds: string[]) =>
      employerService.bulkExportCandidates({ candidateIds, format: 'xlsx' }),
    onSuccess: () => {
      showToast.success("Export queued! You'll receive an email when ready.");
      clearSelection();
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to queue export');
    },
  });

  const bulkExportResumesMutation = useMutation({
    mutationFn: (candidateIds: string[]) => employerService.bulkExportResumes(candidateIds),
    onSuccess: () => {
      showToast.success("Resume export queued! You'll receive an email with a ZIP download link.");
      clearSelection();
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to queue resume export');
    },
  });

  const openJobPicker = (candidateId: string, action: 'shortlist' | 'select') => {
    setJobPickerCandidateId(candidateId);
    setJobPickerAction(action);
    setJobSearch('');
    setJobPickerOpen(true);
  };

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

  const candidates = data?.data?.items || [];
  const pagination = data?.data;

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(candidates.map((c) => c.id)));
  }, [candidates]);

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

  const compareCandidates = useMemo(
    () =>
      compareIds
        .map((id) => candidates.find((c) => c.id === id))
        .filter((c): c is CandidateProfile => c !== undefined),
    [compareIds, candidates],
  );

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
                  className="text-primary hover:text-primary-dark flex items-center gap-1.5 text-sm font-medium"
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
                  onClick={() => bulkExportMutation.mutate(Array.from(selectedIds))}
                  disabled={bulkExportMutation.isPending}
                  isLoading={bulkExportMutation.isPending}
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkExportResumesMutation.mutate(Array.from(selectedIds))}
                  disabled={bulkExportResumesMutation.isPending}
                  isLoading={bulkExportResumesMutation.isPending}
                >
                  <FileDown className="mr-1.5 h-4 w-4" />
                  Export Resumes
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  <X className="mr-1.5 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <Skeleton variant="card" />
              </Card>
            ))
          ) : candidates.length > 0 ? (
            candidates.map((candidate) => (
              <SavedCandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedIds.has(candidate.id)}
                onToggleSelect={() => toggleSelect(candidate.id)}
                onRemove={() => toggleSaveMutation.mutate(candidate.id)}
                isRemoving={
                  toggleSaveMutation.isPending && toggleSaveMutation.variables === candidate.id
                }
                onShortlist={() => openJobPicker(candidate.id, 'shortlist')}
                onSelect={() => openJobPicker(candidate.id, 'select')}
                isComparing={compareIds.includes(candidate.id)}
                onToggleCompare={() => handleToggleCompare(candidate.id)}
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
                <button
                  onClick={() => setJobPickerOpen(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <div className="relative mb-3">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search your jobs..."
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="focus:border-primary w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] py-2 pr-3 pl-10 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
                  />
                </div>
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {(myJobsData?.data?.items || [])
                    .filter(
                      (job: { title: string; status: string }) =>
                        job.status === 'OPEN' &&
                        job.title.toLowerCase().includes(jobSearch.toLowerCase()),
                    )
                    .map((job: { id: string; title: string; location: string }) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => {
                          if (jobPickerAction === 'shortlist') {
                            shortlistMutation.mutate({
                              candidateId: jobPickerCandidateId,
                              jobId: job.id,
                            });
                          } else {
                            selectMutation.mutate({
                              candidateId: jobPickerCandidateId,
                              jobId: job.id,
                            });
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
                  {(myJobsData?.data?.items || []).filter(
                    (job: { status: string; title: string }) =>
                      job.status === 'OPEN' &&
                      job.title.toLowerCase().includes(jobSearch.toLowerCase()),
                  ).length === 0 && (
                    <p className="py-8 text-center text-sm text-[var(--text-muted)]">
                      No open jobs found.
                    </p>
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

function SavedCandidateCard({
  candidate,
  isSelected,
  onToggleSelect,
  onRemove,
  isRemoving,
  onShortlist,
  onSelect,
  isComparing,
  onToggleCompare,
}: {
  candidate: CandidateProfile;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
  isRemoving: boolean;
  onShortlist: () => void;
  onSelect: () => void;
  isComparing: boolean;
  onToggleCompare: () => void;
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
    <Card className={`transition-all hover:shadow-sm ${isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/20'}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <button
            type="button"
            onClick={onToggleSelect}
            className="mt-1 shrink-0 text-[var(--text-muted)] hover:text-primary"
            title={isSelected ? 'Deselect' : 'Select'}
          >
            {isSelected ? (
              <CheckSquare className="text-primary h-5 w-5" />
            ) : (
              <Square className="h-5 w-5" />
            )}
          </button>
          <div className="bg-primary-light flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            {candidate.user?.avatar ? (
              <img
                src={candidate.user.avatar}
                alt={name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <User className="text-primary h-6 w-6" />
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
              <p className="line-clamp-1 text-sm text-[var(--text-secondary)]">
                {candidate.headline}
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
              {candidate.currentRole && <span>{candidate.currentRole}</span>}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Updated {formatRelativeDate(candidate.updatedAt)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {candidate.workStatus && (
                <Badge
                  variant={candidate.workStatus === 'ACTIVELY_LOOKING' ? 'success' : 'neutral'}
                  size="sm"
                >
                  {WORK_STATUS_LABELS[candidate.workStatus]}
                </Badge>
              )}
              {candidate.noticePeriod && (
                <Badge variant="info" size="sm">
                  {NOTICE_PERIOD_LABELS[candidate.noticePeriod]}
                </Badge>
              )}
              {candidate.preferredWorkMode?.map((mode) => (
                <Badge key={mode} variant="neutral" size="sm">
                  {WORK_MODE_LABELS[mode]}
                </Badge>
              ))}
              <Badge variant={isRecentlyActive ? 'success' : 'neutral'} size="sm">
                <Activity className="mr-0.5 h-3 w-3" />
                {lastActive
                  ? `Active ${formatRelativeDate(lastActive)}`
                  : isRecentlyActive
                    ? 'Active'
                    : 'Inactive'}
              </Badge>
            </div>

            {/* Special Badges */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {candidate.noticePeriod === 'IMMEDIATE' && (
                <Badge variant="success" size="sm">
                  ⚡ Immediate Joiner
                </Badge>
              )}
              {candidate.workStatus === 'ACTIVELY_LOOKING' && (
                <Badge variant="info" size="sm">
                  🔍 Actively Looking
                </Badge>
              )}
              {candidate.openToWork === 'OPEN_TO_OFFERS' && (
                <Badge variant="info" size="sm">
                  💼 Open to Offers
                </Badge>
              )}
              {candidate.willingToRelocate && (
                <Badge variant="neutral" size="sm">
                  📍 Open to Relocation
                </Badge>
              )}
            </div>

            {/* Activity timestamps */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-[var(--text-muted)]">
              {candidate.updatedAt && (
                <span className="flex items-center gap-0.5">
                  <Pencil className="h-2.5 w-2.5" /> Modified{' '}
                  {formatRelativeDate(candidate.updatedAt)}
                </span>
              )}
            </div>

            {(candidate.skills?.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {candidate.skills.slice(0, 6).map((skill) => (
                  <Tag key={skill} label={skill} size="sm" variant="primary" />
                ))}
                {candidate.skills.length > 6 && (
                  <Tag label={`+${candidate.skills.length - 6}`} size="sm" />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={onShortlist}
              title="Shortlist for a job"
              className="hover:border-primary hover:text-primary hover:bg-primary-light flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors"
            >
              <Star className="h-3.5 w-3.5" /> Shortlist
            </button>
            <button
              type="button"
              onClick={onSelect}
              title="Select for a job"
              className="hover:border-primary hover:text-primary hover:bg-primary-light flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5" /> Select
            </button>
            <button
              type="button"
              onClick={onToggleCompare}
              title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
              aria-label={isComparing ? 'Remove from comparison' : 'Add to comparison'}
              className={`rounded-lg border p-2 transition-colors ${
                isComparing
                  ? 'border-primary bg-primary-light text-primary'
                  : 'hover:border-primary hover:text-primary hover:bg-primary-light border-[var(--border)] text-[var(--text-secondary)]'
              }`}
            >
              <GitCompareArrows className="h-4 w-4" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setContactOpen(!contactOpen)}
                title="Contact candidate"
                className="hover:border-primary hover:text-primary hover:bg-primary-light flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors"
              >
                <Phone className="h-3.5 w-3.5" /> Contact <ChevronDown className="h-3 w-3" />
              </button>
              {contactOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setContactOpen(false)} />
                  <div className="absolute top-full right-0 z-50 mt-1 w-44 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-1 shadow-lg">
                    {candidate.user?.email && (
                      <a
                        href={`mailto:${candidate.user.email}`}
                        onClick={() => setContactOpen(false)}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                      >
                        <Mail className="h-3.5 w-3.5" /> Email
                      </a>
                    )}
                    {(candidate.user?.mobileNumber || candidate.phone) && (
                      <a
                        href={`tel:${candidate.user?.mobileNumber || candidate.phone}`}
                        onClick={() => setContactOpen(false)}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                      >
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                    )}
                    {(candidate.user?.whatsappNumber || candidate.user?.mobileNumber || candidate.phone) && (
                      <a
                        href={`https://wa.me/${(candidate.user?.whatsappNumber || candidate.user?.mobileNumber || candidate.phone || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setContactOpen(false)}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    )}
                    {!candidate.user?.email && !candidate.user?.mobileNumber && !candidate.user?.whatsappNumber && !candidate.phone && (
                      <p className="px-3 py-2 text-xs text-[var(--text-muted)]">No contact info available</p>
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
                className="hover:border-primary hover:text-primary hover:bg-primary-light flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors"
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
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--error)] hover:bg-red-50 hover:text-[var(--error)] disabled:opacity-50"
            >
              <BookmarkX className="h-4 w-4" />
            </button>
          </div>

          {candidate.expectedSalaryMin && (
            <p className="text-sm font-semibold text-[var(--text)]">
              {(candidate.salaryCurrency || 'INR').toUpperCase() === 'INR' ? (
                formatSalaryAsLPA(candidate.expectedSalaryMin, candidate.expectedSalaryMax)
              ) : (
                <>
                  {candidate.expectedSalaryMin.toLocaleString()}
                  {candidate.expectedSalaryMax
                    ? ` - ${candidate.expectedSalaryMax.toLocaleString()}`
                    : '+'}
                  <span className="text-xs font-normal text-[var(--text-muted)]">
                    {' '}
                    {candidate.salaryCurrency}/yr
                  </span>
                </>
              )}
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
              title={
                candidate.user?.isWhatsappVerified ? 'WhatsApp verified' : 'WhatsApp not verified'
              }
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
          <div
            className="flex items-center gap-1.5"
            title={`Profile ${candidate.profileCompleteness}% complete`}
          >
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
