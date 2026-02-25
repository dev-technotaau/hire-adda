'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Users,
  Search,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  UserCog,
  Trash2,
  AlertCircle,
  UserPlus,
  Key,
  Power,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import OtpInput from '@/components/auth/OtpInput';
import { showToast } from '@/components/ui/Toast';
import { adminService } from '@/services/admin.service';
import { QUERY_KEYS, PAGINATION } from '@/constants/config';
import { useOtpConfig } from '@/hooks/use-otp-config';
import { usePasswordRules } from '@/hooks/use-security-config';
import { ROUTES } from '@/constants/routes';
import { ROLE_LABELS } from '@/constants/enums';
import { formatDate, debounce } from '@/lib/utils';
import type { UserListItem, CreateUserRequest } from '@/types/admin';
import type { Role } from '@/types/auth';
import type { ApiError } from '@/types/api';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const roleOptions = [
  { value: '', label: 'All Roles' },
  ...Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
];

const roleChangeOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

const createRoleOptions = [
  { value: 'CANDIDATE', label: 'Candidate' },
  { value: 'EMPLOYER', label: 'Employer' },
  { value: 'ADMIN', label: 'Admin' },
];

export default function SuperAdminUsersPage() {
  const queryClient = useQueryClient();
  const otpConfig = useOtpConfig();
  const passwordRules = usePasswordRules();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
      setPage(1);
    }, 400),
    [],
  );

  // Create User modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'CANDIDATE',
  });

  // Suspend modal
  const [suspendTarget, setSuspendTarget] = useState<UserListItem | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);

  // Role change modal
  const [roleChangeTarget, setRoleChangeTarget] = useState<UserListItem | null>(null);
  const [newRole, setNewRole] = useState('');

  // Reset password modal (2-step OTP)
  const [resetPwTarget, setResetPwTarget] = useState<UserListItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'send' | 'verify'>('send');
  const [resetOtp, setResetOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendResetOtp = async () => {
    if (!resetPwTarget) return;
    setIsSendingOtp(true);
    try {
      await adminService.sendPasswordResetOtp(resetPwTarget.id);
      showToast.success(`Verification code sent to ${resetPwTarget.email}`);
      setResetStep('verify');
      setResendTimer(otpConfig.RESEND_COOLDOWN);
    } catch (err) {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to send verification code');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendResetOtp = async () => {
    if (!resetPwTarget) return;
    setIsResending(true);
    try {
      await adminService.sendPasswordResetOtp(resetPwTarget.id);
      showToast.success('New verification code sent!');
      setResendTimer(otpConfig.RESEND_COOLDOWN);
      setResetOtp('');
    } catch (err) {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const closeResetPwModal = () => {
    setResetPwTarget(null);
    setNewPassword('');
    setResetStep('send');
    setResetOtp('');
    setResendTimer(0);
  };

  const filters: Record<string, string | number | undefined> = {
    page,
    limit: PAGINATION.USERS_PER_PAGE,
    ...(search && { search }),
    ...(roleFilter && { role: roleFilter }),
    ...(statusFilter && { status: statusFilter }),
  };

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.ADMIN.USERS(filters),
    queryFn: () => adminService.getUsers(filters),
  });

  const users = data?.data?.items || [];
  const pagination = data?.data;

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => adminService.createUser(data),
    onSuccess: () => {
      showToast.success('User created successfully');
      invalidateUsers();
      setShowCreateModal(false);
      setCreateForm({ email: '', password: '', firstName: '', lastName: '', role: 'CANDIDATE' });
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to create user');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason, duration }: { id: string; reason: string; duration?: number }) =>
      adminService.suspendUser(id, { reason, duration }),
    onSuccess: () => {
      showToast.success('User suspended successfully');
      invalidateUsers();
      setSuspendTarget(null);
      setSuspendReason('');
      setSuspendDuration('');
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to suspend user');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminService.activateUser(id),
    onSuccess: () => {
      showToast.success('User activated successfully');
      invalidateUsers();
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to activate user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      showToast.success('User deleted successfully');
      invalidateUsers();
      setDeleteTarget(null);
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to delete user');
    },
  });

  const roleChangeMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      adminService.updateUserRole(id, { role }),
    onSuccess: () => {
      showToast.success('User role updated successfully');
      invalidateUsers();
      setRoleChangeTarget(null);
      setNewRole('');
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to update role');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword, otp }: { id: string; newPassword: string; otp: string }) =>
      adminService.resetUserPassword(id, { newPassword, otp }),
    onSuccess: () => {
      showToast.success('Password reset successfully');
      closeResetPwModal();
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to reset password');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => adminService.deactivateUser(id),
    onSuccess: () => {
      showToast.success('User deactivated successfully');
      invalidateUsers();
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to deactivate user');
    },
  });

  const getUserActions = (user: UserListItem) => [
    {
      label: 'View Details',
      icon: Eye,
      onClick: () => {
        window.location.href = ROUTES.SUPER_ADMIN.USER_DETAIL(user.id);
      },
    },
    ...(user.isSuspended
      ? [{ label: 'Activate', icon: CheckCircle, onClick: () => activateMutation.mutate(user.id) }]
      : [{ label: 'Suspend', icon: Ban, onClick: () => setSuspendTarget(user) }]),
    {
      label: 'Change Role',
      icon: UserCog,
      onClick: () => {
        setRoleChangeTarget(user);
        setNewRole(user.role);
      },
    },
    {
      label: 'Reset Password',
      icon: Key,
      onClick: () => setResetPwTarget(user),
    },
    ...(user.isActive && !user.isSuspended
      ? [{ label: 'Deactivate', icon: Power, onClick: () => deactivateMutation.mutate(user.id) }]
      : []),
    { label: '', onClick: () => {}, separator: true },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: () => setDeleteTarget(user),
      destructive: true,
    },
  ];

  const getRoleBadgeVariant = (role: string): BadgeVariant => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'error';
      case 'ADMIN':
        return 'warning';
      case 'EMPLOYER':
        return 'info';
      case 'CANDIDATE':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <DashboardLayout requiredRole={['SUPER_ADMIN']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">User Management</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Full control over all platform users — create, edit, suspend, deactivate.
            </p>
          </div>
          <Button
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Create User
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  debouncedSetSearch(e.target.value);
                }}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                label="Role"
                options={roleOptions}
                value={roleFilter}
                onChange={(val) => {
                  setRoleFilter(val);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                label="Status"
                options={statusOptions}
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card padding="sm">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="rect" height={48} />
              ))}
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                      Verified
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                      Last Login
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {users.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-[var(--bg-secondary)]">
                      <td className="px-4 py-3 font-medium text-[var(--text)]">
                        <Link
                          href={ROUTES.SUPER_ADMIN.USER_DETAIL(user.id)}
                          className="hover:text-primary transition-colors"
                        >
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.firstName || 'N/A'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                          {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {user.isSuspended ? (
                          <Badge variant="error" size="sm">
                            Suspended
                          </Badge>
                        ) : user.isActive ? (
                          <Badge variant="success" size="sm">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.isEmailVerified ? (
                          <Badge variant="success" size="sm">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            No
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Dropdown
                          align="right"
                          trigger={
                            <button
                              type="button"
                              className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          }
                          items={getUserActions(user)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No users found"
              description="Try adjusting your search or filters."
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

        {/* Create User Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setCreateForm({
              email: '',
              password: '',
              firstName: '',
              lastName: '',
              role: 'CANDIDATE',
            });
          }}
          title="Create User"
          size="md"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createUserMutation.mutate(createForm)}
                isLoading={createUserMutation.isPending}
                disabled={
                  !createForm.email ||
                  !createForm.password ||
                  !createForm.firstName ||
                  !createForm.lastName
                }
              >
                Create
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                placeholder="First name"
                value={createForm.firstName}
                onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
                required
              />
              <Input
                label="Last Name"
                placeholder="Last name"
                value={createForm.lastName}
                onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              placeholder="user@example.com"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min 8 characters"
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
            <Select
              label="Role"
              options={createRoleOptions}
              value={createForm.role}
              onChange={(val) =>
                setCreateForm((f) => ({ ...f, role: val as CreateUserRequest['role'] }))
              }
            />
          </div>
        </Modal>

        {/* Suspend Modal */}
        <Modal
          isOpen={!!suspendTarget}
          onClose={() => {
            setSuspendTarget(null);
            setSuspendReason('');
            setSuspendDuration('');
          }}
          title="Suspend User"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSuspendTarget(null);
                  setSuspendReason('');
                  setSuspendDuration('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!suspendTarget || !suspendReason.trim()) return;
                  suspendMutation.mutate({
                    id: suspendTarget.id,
                    reason: suspendReason,
                    duration: suspendDuration ? parseInt(suspendDuration, 10) : undefined,
                  });
                }}
                isLoading={suspendMutation.isPending}
                disabled={!suspendReason.trim()}
              >
                Suspend
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-[var(--warning)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                You are about to suspend{' '}
                <span className="font-medium text-[var(--text)]">{suspendTarget?.email}</span>. They
                will not be able to access the platform.
              </p>
            </div>
            <Input
              label="Reason"
              placeholder="Enter reason for suspension..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              required
            />
            <Input
              label="Duration (days, optional)"
              placeholder="Leave blank for indefinite"
              type="number"
              value={suspendDuration}
              onChange={(e) => setSuspendDuration(e.target.value)}
            />
          </div>
        </Modal>

        {/* Delete Modal */}
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete User"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
                }}
                isLoading={deleteMutation.isPending}
              >
                Delete
              </Button>
            </div>
          }
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="text-error h-5 w-5 shrink-0" />
            <p className="text-sm text-[var(--text-secondary)]">
              Are you sure you want to permanently delete{' '}
              <span className="font-medium text-[var(--text)]">{deleteTarget?.email}</span>? This
              action cannot be undone.
            </p>
          </div>
        </Modal>

        {/* Change Role Modal */}
        <Modal
          isOpen={!!roleChangeTarget}
          onClose={() => {
            setRoleChangeTarget(null);
            setNewRole('');
          }}
          title="Change User Role"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setRoleChangeTarget(null);
                  setNewRole('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!roleChangeTarget || !newRole) return;
                  roleChangeMutation.mutate({ id: roleChangeTarget.id, role: newRole as Role });
                }}
                isLoading={roleChangeMutation.isPending}
                disabled={!newRole || newRole === roleChangeTarget?.role}
              >
                Update Role
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Change the role for{' '}
              <span className="font-medium text-[var(--text)]">{roleChangeTarget?.email}</span>.
            </p>
            <Select
              label="New Role"
              options={roleChangeOptions}
              value={newRole}
              onChange={setNewRole}
            />
          </div>
        </Modal>

        {/* Reset Password Modal (2-step OTP) */}
        <Modal
          isOpen={!!resetPwTarget}
          onClose={closeResetPwModal}
          title="Reset Password"
          size="md"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeResetPwModal}>
                Cancel
              </Button>
              {resetStep === 'send' ? (
                <Button onClick={handleSendResetOtp} isLoading={isSendingOtp}>
                  Send Verification Code
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!resetPwTarget || !newPassword || resetOtp.length !== otpConfig.LENGTH)
                      return;
                    resetPasswordMutation.mutate({
                      id: resetPwTarget.id,
                      newPassword,
                      otp: resetOtp,
                    });
                  }}
                  isLoading={resetPasswordMutation.isPending}
                  disabled={
                    newPassword.length < passwordRules.MIN_LENGTH ||
                    resetOtp.length !== otpConfig.LENGTH
                  }
                >
                  Reset Password
                </Button>
              )}
            </div>
          }
        >
          {resetStep === 'send' ? (
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-[var(--warning)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                A 6-digit verification code will be sent to <strong>{resetPwTarget?.email}</strong>{' '}
                to confirm the password reset. This will revoke all their active sessions.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-lg bg-[var(--bg-secondary)] px-4 py-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  Enter the 6-digit code sent to{' '}
                  <span className="font-medium text-[var(--text)]">{resetPwTarget?.email}</span> and
                  the new password.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                  Verification Code
                </label>
                <OtpInput value={resetOtp} onChange={setResetOtp} length={otpConfig.LENGTH} />
              </div>

              <div className="text-center">
                <p className="text-sm text-[var(--text-muted)]">
                  Didn&apos;t receive the code?{' '}
                  {resendTimer > 0 ? (
                    <span className="text-[var(--text-secondary)]">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendResetOtp}
                      disabled={isResending}
                      className="text-primary font-medium hover:underline disabled:opacity-50"
                    >
                      {isResending ? 'Sending...' : 'Resend Code'}
                    </button>
                  )}
                </p>
              </div>

              <Input
                label="New Password"
                type="password"
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
