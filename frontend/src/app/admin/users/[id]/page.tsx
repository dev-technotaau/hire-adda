'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  Ban,
  CheckCircle,
  Trash2,
  AlertCircle,
  Key,
  Smartphone,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import { showToast } from '@/components/ui/Toast';
import { adminService } from '@/services/admin.service';
import { QUERY_KEYS } from '@/constants/config';
import { ROUTES } from '@/constants/routes';
import { ROLE_LABELS } from '@/constants/enums';
import { formatDate } from '@/lib/utils';
import type { Role } from '@/types/auth';
import type { ApiError } from '@/types/api';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const roleChangeOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;

  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.ADMIN.USER_DETAIL(userId),
    queryFn: () => adminService.getUserDetails(userId),
    enabled: !!userId,
  });

  const user = data?.data;

  const suspendMutation = useMutation({
    mutationFn: ({ reason, duration }: { reason: string; duration?: number }) =>
      adminService.suspendUser(userId, { reason, duration }),
    onSuccess: () => {
      showToast.success('User suspended successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN.USER_DETAIL(userId) });
      setShowSuspendModal(false);
      setSuspendReason('');
      setSuspendDuration('');
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to suspend user');
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => adminService.activateUser(userId),
    onSuccess: () => {
      showToast.success('User activated successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN.USER_DETAIL(userId) });
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to activate user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminService.deleteUser(userId),
    onSuccess: () => {
      showToast.success('User deleted successfully');
      router.push(ROUTES.ADMIN.USERS);
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to delete user');
    },
  });

  const roleChangeMutation = useMutation({
    mutationFn: (role: Role) => adminService.updateUserRole(userId, { role }),
    onSuccess: () => {
      showToast.success('User role updated successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN.USER_DETAIL(userId) });
      setShowRoleModal(false);
      setNewRole('');
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to update role');
    },
  });

  const handleSuspend = () => {
    if (!suspendReason.trim()) return;
    suspendMutation.mutate({
      reason: suspendReason,
      duration: suspendDuration ? parseInt(suspendDuration, 10) : undefined,
    });
  };

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
    <DashboardLayout requiredRole={['ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: ROUTES.ADMIN.DASHBOARD },
            { label: 'Users', href: ROUTES.ADMIN.USERS },
            { label: user?.firstName ? `${user.firstName} ${user.lastName}` : 'User Detail' },
          ]}
        />

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton variant="rect" height={200} />
            <Skeleton variant="rect" height={200} />
          </div>
        ) : user ? (
          <>
            {/* User Profile Card */}
            <Card>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-xl font-bold text-[var(--text-muted)]">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.firstName ? `${user.firstName}'s avatar` : 'User avatar'}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      (user.firstName?.[0] || user.email[0]).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[var(--text)]">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.firstName || 'N/A'}
                    </h1>
                    <p className="mt-0.5 text-sm text-[var(--text-muted)]">{user.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {ROLE_LABELS[user.role] || user.role}
                      </Badge>
                      {user.isSuspended ? (
                        <Badge variant="error">Suspended</Badge>
                      ) : user.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="neutral">Inactive</Badge>
                      )}
                      {user.isEmailVerified && (
                        <Badge variant="info" size="sm">
                          Email Verified
                        </Badge>
                      )}
                      {user.isMobileVerified && (
                        <Badge variant="info" size="sm">
                          Mobile Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {user.isSuspended ? (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<CheckCircle className="h-4 w-4" />}
                      onClick={() => activateMutation.mutate()}
                      isLoading={activateMutation.isPending}
                    >
                      Activate
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Ban className="h-4 w-4" />}
                      onClick={() => setShowSuspendModal(true)}
                    >
                      Suspend
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<UserCog className="h-4 w-4" />}
                    onClick={() => {
                      setShowRoleModal(true);
                      setNewRole(user.role);
                    }}
                  >
                    Change Role
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>

            {/* Account Info */}
            <Card
              header={
                <h2 className="text-lg font-semibold text-[var(--text)]">Account Information</h2>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem icon={Mail} label="Email" value={user.email} />
                <InfoItem icon={Phone} label="Mobile" value={user.mobileNumber || 'Not provided'} />
                <InfoItem
                  icon={Calendar}
                  label="Account Created"
                  value={formatDate(user.createdAt)}
                />
                <InfoItem
                  icon={Clock}
                  label="Last Login"
                  value={user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                />
                <InfoItem
                  icon={ShieldAlert}
                  label="Login Attempts"
                  value={String(user.loginAttempts)}
                />
                <InfoItem icon={Key} label="MFA Enabled" value={user.mfaEnabled ? 'Yes' : 'No'} />
                <InfoItem
                  icon={ShieldCheck}
                  label="Email Verified"
                  value={user.isEmailVerified ? 'Yes' : 'No'}
                />
                <InfoItem
                  icon={Smartphone}
                  label="Mobile Verified"
                  value={user.isMobileVerified ? 'Yes' : 'No'}
                />
                <InfoItem icon={Shield} label="Role" value={ROLE_LABELS[user.role] || user.role} />
              </div>
            </Card>
          </>
        ) : (
          <Card>
            <div className="py-12 text-center">
              <p className="text-[var(--text-muted)]">User not found.</p>
              <Link href={ROUTES.ADMIN.USERS}>
                <Button variant="outline" size="sm" className="mt-4">
                  Back to Users
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Suspend Modal */}
        <Modal
          isOpen={showSuspendModal}
          onClose={() => {
            setShowSuspendModal(false);
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
                  setShowSuspendModal(false);
                  setSuspendReason('');
                  setSuspendDuration('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleSuspend}
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
                This will prevent the user from accessing the platform.
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
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete User"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
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
              Are you sure you want to permanently delete this user? This action cannot be undone
              and all associated data will be removed.
            </p>
          </div>
        </Modal>

        {/* Change Role Modal */}
        <Modal
          isOpen={showRoleModal}
          onClose={() => {
            setShowRoleModal(false);
            setNewRole('');
          }}
          title="Change User Role"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRoleModal(false);
                  setNewRole('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => roleChangeMutation.mutate(newRole as Role)}
                isLoading={roleChangeMutation.isPending}
                disabled={!newRole || newRole === user?.role}
              >
                Update Role
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Current role:{' '}
              <span className="font-medium text-[var(--text)]">
                {user ? ROLE_LABELS[user.role] || user.role : ''}
              </span>
            </p>
            <Select
              label="New Role"
              options={roleChangeOptions}
              value={newRole}
              onChange={setNewRole}
            />
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
        <Icon className="h-4 w-4 text-[var(--text-muted)]" />
      </div>
      <div>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="text-sm font-medium text-[var(--text)]">{value}</p>
      </div>
    </div>
  );
}
