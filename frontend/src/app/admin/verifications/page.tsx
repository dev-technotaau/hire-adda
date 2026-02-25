'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ShieldCheck, CheckCircle, XCircle, Clock,
    AlertCircle, ChevronDown, Search, ExternalLink, Mail, AlertTriangle, CalendarClock,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import Pagination from '@/components/ui/Pagination';
import { showToast } from '@/components/ui/Toast';
import { verificationService } from '@/services/verification.service';
import { QUERY_KEYS, PAGINATION } from '@/constants/config';
import { formatDate } from '@/lib/utils';
import type { VerificationRequest, VerificationStatus, VerificationFilters } from '@/types/verification';
import type { ApiError } from '@/types/api';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const statusVariants: Record<VerificationStatus, BadgeVariant> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
    REQUESTED_CHANGES: 'info',
};

const statusLabels: Record<VerificationStatus, string> = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    REQUESTED_CHANGES: 'Changes Requested',
};

const typeLabels: Record<string, string> = {
    GST: 'GST',
    EMPLOYMENT: 'Employment',
    IDENTITY: 'Identity',
};

const statusFilterOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'REQUESTED_CHANGES', label: 'Changes Requested' },
];

const typeFilterOptions = [
    { value: '', label: 'All Types' },
    { value: 'GST', label: 'GST' },
    { value: 'EMPLOYMENT', label: 'Employment' },
    { value: 'IDENTITY', label: 'Identity' },
];

export default function AdminVerificationsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Review modal
    const [reviewTarget, setReviewTarget] = useState<VerificationRequest | null>(null);
    const [reviewAction, setReviewAction] = useState<VerificationStatus>('APPROVED');
    const [reviewComments, setReviewComments] = useState('');

    // Escalate modal
    const [escalateTarget, setEscalateTarget] = useState<VerificationRequest | null>(null);
    const [escalateReason, setEscalateReason] = useState('');

    // Employment contact modal
    const [contactTarget, setContactTarget] = useState<VerificationRequest | null>(null);
    const [contactForm, setContactForm] = useState({ contactName: '', contactEmail: '', companyName: '', candidateName: '', employmentPeriod: '', role: '' });

    // SLA modal
    const [slaTarget, setSlaTarget] = useState<VerificationRequest | null>(null);
    const [slaDeadline, setSlaDeadline] = useState('');

    const filters: VerificationFilters = {
        page,
        limit: PAGINATION.USERS_PER_PAGE,
        ...(statusFilter && { status: statusFilter as VerificationStatus }),
        ...(typeFilter && { type: typeFilter as VerificationFilters['type'] }),
    };

    const { data, isLoading } = useQuery({
        queryKey: QUERY_KEYS.VERIFICATIONS.ALL(filters as Record<string, unknown>),
        queryFn: () => verificationService.getAllVerifications(filters),
    });

    const { data: statsData } = useQuery({
        queryKey: QUERY_KEYS.VERIFICATIONS.STATS,
        queryFn: () => verificationService.getVerificationStats(),
    });

    const verifications = data?.data?.items || [];
    const pagination = data?.data;
    const stats = statsData?.data;

    const reviewMutation = useMutation({
        mutationFn: () =>
            verificationService.reviewVerification(reviewTarget!.id, {
                status: reviewAction,
                comments: reviewComments || undefined,
            }),
        onSuccess: () => {
            showToast.success('Verification reviewed successfully');
            queryClient.invalidateQueries({ queryKey: ['verifications'] });
            setReviewTarget(null);
            setReviewComments('');
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to review verification');
        },
    });

    const escalateMutation = useMutation({
        mutationFn: () =>
            verificationService.escalateVerification(escalateTarget!.id, { reason: escalateReason }),
        onSuccess: () => {
            showToast.success('Verification escalated');
            queryClient.invalidateQueries({ queryKey: ['verifications'] });
            setEscalateTarget(null);
            setEscalateReason('');
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to escalate');
        },
    });

    const contactMutation = useMutation({
        mutationFn: () =>
            verificationService.sendEmploymentContact(contactTarget!.id, contactForm),
        onSuccess: () => {
            showToast.success('Employment verification email sent');
            queryClient.invalidateQueries({ queryKey: ['verifications'] });
            setContactTarget(null);
            setContactForm({ contactName: '', contactEmail: '', companyName: '', candidateName: '', employmentPeriod: '', role: '' });
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to send verification email');
        },
    });

    const slaMutation = useMutation({
        mutationFn: () =>
            verificationService.setSlaDeadline(slaTarget!.id, slaDeadline),
        onSuccess: () => {
            showToast.success('SLA deadline set');
            queryClient.invalidateQueries({ queryKey: ['verifications'] });
            setSlaTarget(null);
            setSlaDeadline('');
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to set SLA');
        },
    });

    const getSlaStatus = (deadline: string | null) => {
        if (!deadline) return null;
        const now = new Date();
        const sla = new Date(deadline);
        const hoursLeft = (sla.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursLeft < 0) return { variant: 'error' as BadgeVariant, label: 'Overdue' };
        if (hoursLeft < 24) return { variant: 'warning' as BadgeVariant, label: `${Math.round(hoursLeft)}h left` };
        const daysLeft = Math.ceil(hoursLeft / 24);
        return { variant: 'success' as BadgeVariant, label: `${daysLeft}d left` };
    };

    const openContactModal = (v: VerificationRequest) => {
        setContactTarget(v);
        setContactForm({
            contactName: '',
            contactEmail: '',
            companyName: v.user?.companyProfile?.companyName || '',
            candidateName: [v.user?.firstName, v.user?.lastName].filter(Boolean).join(' ') || '',
            employmentPeriod: '',
            role: '',
        });
    };

    return (
        <DashboardLayout requiredRole={['ADMIN', 'SUPER_ADMIN']}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Verification Management</h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Review and manage employer and candidate verification requests.
                    </p>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {[
                            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-[var(--warning)]' },
                            { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-[var(--success)]' },
                            { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-[var(--error)]' },
                            { label: 'Total', value: stats.total, icon: ShieldCheck, color: 'text-[var(--primary)]' },
                        ].map((stat) => (
                            <Card key={stat.label}>
                                <div className="flex items-center gap-3">
                                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                                    <div>
                                        <p className="text-2xl font-bold text-[var(--text)]">{stat.value}</p>
                                        <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Filters */}
                <Card>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="w-full sm:w-48">
                            <Select
                                label="Status"
                                options={statusFilterOptions}
                                value={statusFilter}
                                onChange={(val) => { setStatusFilter(val); setPage(1); }}
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <Select
                                label="Type"
                                options={typeFilterOptions}
                                value={typeFilter}
                                onChange={(val) => { setTypeFilter(val); setPage(1); }}
                            />
                        </div>
                    </div>
                </Card>

                {/* Verifications Table */}
                <Card padding="sm">
                    {isLoading ? (
                        <div className="space-y-3 p-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} variant="rect" height={60} />
                            ))}
                        </div>
                    ) : verifications.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">User</th>
                                        <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Type</th>
                                        <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Status</th>
                                        <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Priority</th>
                                        <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">SLA</th>
                                        <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Submitted</th>
                                        <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Document</th>
                                        <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {verifications.map((v: VerificationRequest) => (
                                        <tr key={v.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-[var(--text)]">
                                                    {v.user?.firstName} {v.user?.lastName}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)]">{v.user?.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="neutral" size="sm">{typeLabels[v.type] || v.type}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={statusVariants[v.status]} size="sm">
                                                    {statusLabels[v.status]}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Badge
                                                        variant={v.priority === 'URGENT' ? 'error' : v.priority === 'HIGH' ? 'warning' : 'neutral'}
                                                        size="sm"
                                                    >
                                                        {v.priority}
                                                    </Badge>
                                                    {v.autoEscalated && (
                                                        <span title="Auto-escalated due to SLA breach">
                                                            <AlertTriangle className="h-3.5 w-3.5 text-[var(--error)]" />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {(() => {
                                                    const sla = getSlaStatus(v.slaDeadline);
                                                    if (!sla) return <span className="text-[var(--text-muted)]">—</span>;
                                                    return (
                                                        <div className="flex items-center gap-1.5">
                                                            <CalendarClock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                                                            <Badge variant={sla.variant} size="sm">{sla.label}</Badge>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-4 py-3 text-[var(--text-muted)]">
                                                {formatDate(v.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {v.documentUrl ? (
                                                    <a
                                                        href={v.documentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-primary hover:underline"
                                                    >
                                                        View <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                ) : (
                                                    <span className="text-[var(--text-muted)]">None</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {v.status === 'PENDING' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setReviewTarget(v);
                                                                    setReviewAction('APPROVED');
                                                                }}
                                                            >
                                                                Review
                                                            </Button>
                                                            {v.type === 'EMPLOYMENT' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    leftIcon={<Mail className="h-3.5 w-3.5" />}
                                                                    onClick={() => openContactModal(v)}
                                                                >
                                                                    Contact
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setEscalateTarget(v)}
                                                            >
                                                                Escalate
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                leftIcon={<CalendarClock className="h-3.5 w-3.5" />}
                                                                onClick={() => {
                                                                    setSlaTarget(v);
                                                                    setSlaDeadline(v.slaDeadline ? new Date(v.slaDeadline).toISOString().slice(0, 16) : '');
                                                                }}
                                                            >
                                                                SLA
                                                            </Button>
                                                        </>
                                                    )}
                                                    {v.status === 'REQUESTED_CHANGES' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setReviewTarget(v);
                                                                setReviewAction('APPROVED');
                                                            }}
                                                        >
                                                            Re-review
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState
                            icon={ShieldCheck}
                            title="No verification requests"
                            description="No verification requests match your filters."
                        />
                    )}
                </Card>

                {pagination && pagination.totalPages > 1 && (
                    <Pagination
                        currentPage={page}
                        totalPages={pagination.totalPages}
                        onPageChange={setPage}
                        totalItems={pagination.total}
                        pageSize={pagination.limit}
                    />
                )}

                {/* Review Modal */}
                <Modal
                    isOpen={!!reviewTarget}
                    onClose={() => { setReviewTarget(null); setReviewComments(''); }}
                    title="Review Verification"
                    size="sm"
                    footer={
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => { setReviewTarget(null); setReviewComments(''); }}>
                                Cancel
                            </Button>
                            <Button
                                variant={reviewAction === 'REJECTED' ? 'destructive' : 'primary'}
                                onClick={() => reviewMutation.mutate()}
                                isLoading={reviewMutation.isPending}
                            >
                                {reviewAction === 'APPROVED' ? 'Approve' : reviewAction === 'REJECTED' ? 'Reject' : 'Submit'}
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <div className="rounded-lg bg-[var(--bg-secondary)] p-3">
                            <p className="text-sm text-[var(--text-secondary)]">
                                <span className="font-medium">User:</span> {reviewTarget?.user?.email}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)]">
                                <span className="font-medium">Type:</span> {reviewTarget?.type && typeLabels[reviewTarget.type]}
                            </p>
                        </div>
                        <Select
                            label="Decision"
                            options={[
                                { value: 'APPROVED', label: 'Approve' },
                                { value: 'REJECTED', label: 'Reject' },
                                { value: 'REQUESTED_CHANGES', label: 'Request Changes' },
                            ]}
                            value={reviewAction}
                            onChange={(val) => setReviewAction(val as VerificationStatus)}
                        />
                        <Textarea
                            label="Comments (optional)"
                            placeholder="Add comments for the user..."
                            value={reviewComments}
                            onChange={(e) => setReviewComments(e.target.value)}
                            rows={3}
                        />
                    </div>
                </Modal>

                {/* Escalate Modal */}
                <Modal
                    isOpen={!!escalateTarget}
                    onClose={() => { setEscalateTarget(null); setEscalateReason(''); }}
                    title="Escalate Verification"
                    size="sm"
                    footer={
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => { setEscalateTarget(null); setEscalateReason(''); }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => escalateMutation.mutate()}
                                isLoading={escalateMutation.isPending}
                                disabled={!escalateReason.trim()}
                            >
                                Escalate
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Escalate this verification request for higher-level review.
                        </p>
                        <Textarea
                            label="Reason"
                            placeholder="Explain why this needs escalation..."
                            value={escalateReason}
                            onChange={(e) => setEscalateReason(e.target.value)}
                            rows={3}
                            required
                        />
                    </div>
                </Modal>

                {/* Employment Contact Modal */}
                <Modal
                    isOpen={!!contactTarget}
                    onClose={() => setContactTarget(null)}
                    title="Contact Previous Employer"
                    size="md"
                    footer={
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setContactTarget(null)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => contactMutation.mutate()}
                                isLoading={contactMutation.isPending}
                                disabled={!contactForm.contactName || !contactForm.contactEmail || !contactForm.companyName || !contactForm.candidateName || !contactForm.employmentPeriod || !contactForm.role}
                                leftIcon={<Mail className="h-4 w-4" />}
                            >
                                Send Email
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                            An email will be sent to the previous employer to confirm or deny the candidate&apos;s employment history.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Contact Name"
                                placeholder="HR Manager name..."
                                value={contactForm.contactName}
                                onChange={(e) => setContactForm(f => ({ ...f, contactName: e.target.value }))}
                                required
                            />
                            <Input
                                label="Contact Email"
                                type="email"
                                placeholder="hr@company.com"
                                value={contactForm.contactEmail}
                                onChange={(e) => setContactForm(f => ({ ...f, contactEmail: e.target.value }))}
                                required
                            />
                            <Input
                                label="Company Name"
                                placeholder="Previous employer..."
                                value={contactForm.companyName}
                                onChange={(e) => setContactForm(f => ({ ...f, companyName: e.target.value }))}
                                required
                            />
                            <Input
                                label="Candidate Name"
                                value={contactForm.candidateName}
                                onChange={(e) => setContactForm(f => ({ ...f, candidateName: e.target.value }))}
                                required
                            />
                            <Input
                                label="Role/Designation"
                                placeholder="Software Engineer..."
                                value={contactForm.role}
                                onChange={(e) => setContactForm(f => ({ ...f, role: e.target.value }))}
                                required
                            />
                            <Input
                                label="Employment Period"
                                placeholder="Jan 2022 - Dec 2024"
                                value={contactForm.employmentPeriod}
                                onChange={(e) => setContactForm(f => ({ ...f, employmentPeriod: e.target.value }))}
                                required
                            />
                        </div>
                    </div>
                </Modal>

                {/* SLA Modal */}
                <Modal
                    isOpen={!!slaTarget}
                    onClose={() => { setSlaTarget(null); setSlaDeadline(''); }}
                    title="Set SLA Deadline"
                    size="sm"
                    footer={
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => { setSlaTarget(null); setSlaDeadline(''); }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => slaMutation.mutate()}
                                isLoading={slaMutation.isPending}
                                disabled={!slaDeadline}
                                leftIcon={<CalendarClock className="h-4 w-4" />}
                            >
                                Set Deadline
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Set a deadline for this verification. If the SLA is breached, the request will be auto-escalated to URGENT priority.
                        </p>
                        <div className="rounded-lg bg-[var(--bg-secondary)] p-3">
                            <p className="text-sm text-[var(--text-secondary)]">
                                <span className="font-medium">User:</span> {slaTarget?.user?.email}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)]">
                                <span className="font-medium">Type:</span> {slaTarget?.type && typeLabels[slaTarget.type]}
                            </p>
                        </div>
                        <DatePicker
                            label="Deadline"
                            mode="datetime"
                            value={slaDeadline}
                            onChange={(v) => setSlaDeadline(v)}
                            required
                            minDate={new Date()}
                        />
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
