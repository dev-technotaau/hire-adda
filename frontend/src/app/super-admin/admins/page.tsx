'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Shield, UserPlus, Trash2,
    AlertTriangle, Mail, KeyRound,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import OtpInput from '@/components/auth/OtpInput';
import { showToast } from '@/components/ui/Toast';
import { adminService } from '@/services/admin.service';
import { useOtpConfig } from '@/hooks/use-otp-config';
import { formatRelativeDate } from '@/lib/utils';
import type { ApiError } from '@/types/api';
import type { UserListItem } from '@/types/admin';

export default function ManageAdminsPage() {
    const queryClient = useQueryClient();
    const otpConfig = useOtpConfig();
    const [showCreate, setShowCreate] = useState(false);
    const [removeTarget, setRemoveTarget] = useState<{ id: string; email: string } | null>(null);
    const [newAdmin, setNewAdmin] = useState({ email: '', firstName: '', lastName: '', password: '' });

    const { data, isLoading } = useQuery({
        queryKey: ['super-admin', 'admins'],
        queryFn: () => adminService.listAdmins(),
    });

    const admins: UserListItem[] = data?.data?.items || [];

    const createMutation = useMutation({
        mutationFn: () => adminService.createAdmin(newAdmin),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
            showToast.success('Admin created successfully');
            setShowCreate(false);
            setNewAdmin({ email: '', firstName: '', lastName: '', password: '' });
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to create admin');
        },
    });

    const removeMutation = useMutation({
        mutationFn: (id: string) => adminService.removeAdmin(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
            showToast.success('Admin removed');
            setRemoveTarget(null);
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to remove admin');
        },
    });

    // Password reset state
    const [resetTarget, setResetTarget] = useState<{ id: string; email: string } | null>(null);
    const [resetStep, setResetStep] = useState<'send' | 'verify'>('send');
    const [resetOtp, setResetOtp] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleSendResetOtp = async () => {
        if (!resetTarget) return;
        setIsSendingOtp(true);
        try {
            await adminService.sendPasswordResetOtp(resetTarget.id);
            showToast.success(`Verification code sent to ${resetTarget.email}`);
            setResetStep('verify');
            setResendTimer(otpConfig.RESEND_COOLDOWN);
        } catch (err) {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to send verification code');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleResendOtp = async () => {
        if (!resetTarget) return;
        setIsResending(true);
        try {
            await adminService.sendPasswordResetOtp(resetTarget.id);
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

    const handleConfirmReset = async () => {
        if (!resetTarget || resetOtp.length !== otpConfig.LENGTH || !resetPassword) return;
        setIsResettingPassword(true);
        try {
            await adminService.resetUserPassword(resetTarget.id, { newPassword: resetPassword, otp: resetOtp });
            showToast.success('Password reset successfully');
            closeResetModal();
        } catch (err) {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to reset password');
        } finally {
            setIsResettingPassword(false);
        }
    };

    const closeResetModal = () => {
        setResetTarget(null);
        setResetStep('send');
        setResetOtp('');
        setResetPassword('');
        setResendTimer(0);
    };

    return (
        <DashboardLayout requiredRole={['SUPER_ADMIN']}>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text)]">Manage Admins</h1>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">Create and manage admin accounts</p>
                    </div>
                    <Button
                        leftIcon={<UserPlus className="h-4 w-4" />}
                        onClick={() => setShowCreate(true)}
                    >
                        Create Admin
                    </Button>
                </div>

                <Card variant="bordered">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="h-16 animate-pulse rounded-lg bg-[var(--bg-secondary)]"
                                />
                            ))}
                        </div>
                    ) : admins.length > 0 ? (
                        <div className="divide-y divide-[var(--border)]">
                            {admins.map((admin) => (
                                <div key={admin.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                                            <Shield className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--text)]">
                                                {admin.firstName} {admin.lastName}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                                <Mail className="h-3 w-3" />
                                                <span>{admin.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={admin.isActive ? 'success' : 'error'} size="sm">
                                            {admin.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <span className="text-xs text-[var(--text-muted)]">
                                            Joined {formatRelativeDate(admin.createdAt)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setResetTarget({ id: admin.id, email: admin.email })}
                                            title="Reset Password"
                                        >
                                            <KeyRound className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setRemoveTarget({ id: admin.id, email: admin.email })}
                                            className="text-[var(--error)] hover:text-[var(--error)] hover:bg-[var(--error-light)]"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Shield}
                            title="No admins"
                            description="Create admin accounts to help manage the platform."
                        />
                    )}
                </Card>

                {/* Create Admin Modal */}
                <Modal
                    isOpen={showCreate}
                    onClose={() => setShowCreate(false)}
                    title="Create Admin Account"
                    size="md"
                    footer={
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowCreate(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => createMutation.mutate()}
                                isLoading={createMutation.isPending}
                                disabled={!newAdmin.email || !newAdmin.password}
                            >
                                Create Admin
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="First Name"
                                value={newAdmin.firstName}
                                onChange={e => setNewAdmin(p => ({ ...p, firstName: e.target.value }))}
                            />
                            <Input
                                label="Last Name"
                                value={newAdmin.lastName}
                                onChange={e => setNewAdmin(p => ({ ...p, lastName: e.target.value }))}
                            />
                        </div>
                        <Input
                            label="Email"
                            type="email"
                            value={newAdmin.email}
                            onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            value={newAdmin.password}
                            onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))}
                            helperText="Must be at least 8 characters"
                            required
                        />
                    </div>
                </Modal>

                {/* Remove Admin Modal */}
                <Modal
                    isOpen={!!removeTarget}
                    onClose={() => setRemoveTarget(null)}
                    title="Remove Admin"
                    size="sm"
                    footer={
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => removeTarget && removeMutation.mutate(removeTarget.id)}
                                isLoading={removeMutation.isPending}
                            >
                                Remove
                            </Button>
                        </div>
                    }
                >
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--error)]" />
                        <p className="text-sm text-[var(--text-secondary)]">
                            Are you sure you want to remove <strong>{removeTarget?.email}</strong> as admin?
                            This will revoke their admin privileges immediately.
                        </p>
                    </div>
                </Modal>

                {/* Reset Password Modal */}
                <Modal
                    isOpen={!!resetTarget}
                    onClose={closeResetModal}
                    title="Reset Admin Password"
                    size="md"
                    footer={
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={closeResetModal}>
                                Cancel
                            </Button>
                            {resetStep === 'send' ? (
                                <Button
                                    onClick={handleSendResetOtp}
                                    isLoading={isSendingOtp}
                                >
                                    Send Verification Code
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleConfirmReset}
                                    isLoading={isResettingPassword}
                                    disabled={resetOtp.length !== otpConfig.LENGTH || !resetPassword}
                                >
                                    Reset Password
                                </Button>
                            )}
                        </div>
                    }
                >
                    {resetStep === 'send' ? (
                        <div className="space-y-4">
                            <p className="text-sm text-[var(--text-secondary)]">
                                A 6-digit verification code will be sent to{' '}
                                <strong>{resetTarget?.email}</strong> to confirm the password reset.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="rounded-lg bg-[var(--bg-secondary)] px-4 py-3">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Enter the 6-digit code sent to{' '}
                                    <span className="font-medium text-[var(--text)]">{resetTarget?.email}</span>{' '}
                                    and the new password.
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[var(--text)]">Verification Code</label>
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
                                            onClick={handleResendOtp}
                                            disabled={isResending}
                                            className="font-medium text-primary hover:underline disabled:opacity-50"
                                        >
                                            {isResending ? 'Sending...' : 'Resend Code'}
                                        </button>
                                    )}
                                </p>
                            </div>

                            <Input
                                label="New Password"
                                type="password"
                                value={resetPassword}
                                onChange={(e) => setResetPassword(e.target.value)}
                                helperText="Must be at least 8 characters"
                                required
                            />
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
}
