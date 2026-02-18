'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Shield, Search, CalendarDays, ChevronDown,
    ChevronUp,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { adminService } from '@/services/admin.service';
import { QUERY_KEYS, PAGINATION } from '@/constants/config';
import { formatDate } from '@/lib/utils';
import type { AuditLog, AuditLogFilters } from '@/types/admin';

export default function AuditLogsPage() {
    const [page, setPage] = useState(1);
    const [action, setAction] = useState('');
    const [entity, setEntity] = useState('');
    const [performedBy, setPerformedBy] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [detailsModal, setDetailsModal] = useState<AuditLog | null>(null);

    const filters: AuditLogFilters = {
        page,
        limit: PAGINATION.AUDIT_LOGS_PER_PAGE,
        ...(action && { action }),
        ...(entity && { entity }),
        ...(performedBy && { performedBy }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
    };

    const { data, isLoading } = useQuery({
        queryKey: QUERY_KEYS.ADMIN.AUDIT_LOGS(filters as unknown as Record<string, unknown>),
        queryFn: () => adminService.getAuditLogs(filters),
    });

    const logs = data?.data?.items || [];
    const pagination = data?.data;

    const toggleRow = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    return (
        <DashboardLayout requiredRole={['ADMIN', 'SUPER_ADMIN']}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Audit Logs</h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Track all admin actions and platform events.
                    </p>
                </div>

                {/* Filters */}
                <Card>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <select
                            value={action}
                            onChange={(e) => { setAction(e.target.value); setPage(1); }}
                            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-primary focus:outline-none"
                        >
                            <option value="">All Actions</option>
                            <option value="CREATE_ADMIN">Create Admin</option>
                            <option value="REMOVE_ADMIN">Remove Admin</option>
                            <option value="UPDATE_USER_ROLE">Update User Role</option>
                            <option value="SUSPEND_USER">Suspend User</option>
                            <option value="ACTIVATE_USER">Activate User</option>
                            <option value="DELETE_USER">Delete User</option>
                            <option value="PASSWORD_CHANGE">Password Change</option>
                            <option value="PROFILE_UPDATE">Profile Update</option>
                            <option value="RESUME_UPLOAD">Resume Upload</option>
                            <option value="JOB_CREATE">Job Create</option>
                            <option value="JOB_UPDATE">Job Update</option>
                            <option value="JOB_CLOSE">Job Close</option>
                            <option value="VERIFICATION_APPROVE">Verification Approve</option>
                            <option value="VERIFICATION_REJECT">Verification Reject</option>
                            <option value="VERIFICATION_REQUEST_CHANGES">Verification Request Changes</option>
                            <option value="VERIFICATION_ESCALATE">Verification Escalate</option>
                        </select>
                        <select
                            value={entity}
                            onChange={(e) => { setEntity(e.target.value); setPage(1); }}
                            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-primary focus:outline-none"
                        >
                            <option value="">All Entity Types</option>
                            <option value="User">User</option>
                            <option value="CandidateProfile">Candidate Profile</option>
                            <option value="CompanyProfile">Company Profile</option>
                            <option value="JobPost">Job Post</option>
                            <option value="Verification">Verification</option>
                        </select>
                        <Input
                            placeholder="Filter by user ID..."
                            value={performedBy}
                            onChange={(e) => { setPerformedBy(e.target.value); setPage(1); }}
                            leftIcon={<Search className="h-4 w-4" />}
                        />
                        <DatePicker
                            label="Start Date"
                            value={startDate}
                            onChange={(val) => { setStartDate(val); setPage(1); }}
                            leftIcon={<CalendarDays className="h-4 w-4" />}
                        />
                        <DatePicker
                            label="End Date"
                            value={endDate}
                            onChange={(val) => { setEndDate(val); setPage(1); }}
                            leftIcon={<CalendarDays className="h-4 w-4" />}
                        />
                    </div>
                </Card>

                {/* Logs Table */}
                <Card padding="sm">
                    {isLoading ? (
                        <div className="space-y-3 p-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton key={i} variant="rect" height={40} />
                            ))}
                        </div>
                    ) : logs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Timestamp</th>
                                        <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Action</th>
                                        <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Entity Type</th>
                                        <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Entity ID</th>
                                        <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">User</th>
                                        <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">IP Address</th>
                                        <th className="px-4 py-3 text-center font-medium text-[var(--text-secondary)]">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {logs.map((log) => (
                                        <>
                                            <tr key={log.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                                                <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">
                                                    {formatDate(log.createdAt, 'MMM dd, yyyy HH:mm')}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-[var(--text)]">{log.action}</td>
                                                <td className="px-4 py-3 text-[var(--text-secondary)]">{log.entity}</td>
                                                <td className="px-4 py-3 text-[var(--text-muted)] font-mono text-xs">
                                                    {log.entityId ? (
                                                        <span title={log.entityId}>
                                                            {log.entityId.length > 12
                                                                ? `${log.entityId.substring(0, 12)}...`
                                                                : log.entityId}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[var(--text-muted)]">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-[var(--text-secondary)]">{log.user?.email || '-'}</td>
                                                <td className="px-4 py-3 text-[var(--text-muted)]">{log.ipAddress || '-'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {log.details ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRow(log.id)}
                                                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-[var(--bg-secondary)] transition-colors"
                                                        >
                                                            {expandedRow === log.id ? (
                                                                <>Hide <ChevronUp className="h-3 w-3" /></>
                                                            ) : (
                                                                <>View <ChevronDown className="h-3 w-3" /></>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <span className="text-[var(--text-muted)]">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                            {expandedRow === log.id && log.details && (
                                                <tr key={`${log.id}-details`}>
                                                    <td colSpan={7} className="bg-[var(--bg-secondary)] px-4 py-3">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <pre className="flex-1 overflow-x-auto rounded-lg bg-white border border-[var(--border)] p-3 text-xs text-[var(--text-secondary)] font-mono">
                                                                {JSON.stringify(log.details, null, 2)}
                                                            </pre>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setDetailsModal(log)}
                                                            >
                                                                Full View
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState
                            icon={Shield}
                            title="No audit logs found"
                            description="Try adjusting your filters or check back later."
                        />
                    )}
                </Card>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <Pagination
                        currentPage={page}
                        totalPages={pagination.totalPages}
                        onPageChange={setPage}
                        totalItems={pagination.total}
                        pageSize={pagination.limit}
                    />
                )}

                {/* Details Modal */}
                <Modal
                    isOpen={!!detailsModal}
                    onClose={() => setDetailsModal(null)}
                    title="Audit Log Details"
                    size="lg"
                >
                    {detailsModal && (
                        <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <DetailField label="Action" value={detailsModal.action} />
                                <DetailField label="Entity Type" value={detailsModal.entity} />
                                <DetailField label="Entity ID" value={detailsModal.entityId || '-'} />
                                <DetailField label="User Email" value={detailsModal.user?.email || '-'} />
                                <DetailField label="Performed By" value={detailsModal.performedBy || '-'} />
                                <DetailField label="IP Address" value={detailsModal.ipAddress || '-'} />
                                <DetailField label="Timestamp" value={formatDate(detailsModal.createdAt, 'MMM dd, yyyy HH:mm:ss')} />
                                <DetailField label="User Agent" value={detailsModal.userAgent || '-'} />
                            </div>
                            {detailsModal.details && (
                                <div>
                                    <p className="mb-2 text-sm font-medium text-[var(--text)]">Details</p>
                                    <pre className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-xs text-[var(--text-secondary)] font-mono">
                                        {JSON.stringify(detailsModal.details, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
            <p className="text-sm font-medium text-[var(--text)] break-all">{value}</p>
        </div>
    );
}
