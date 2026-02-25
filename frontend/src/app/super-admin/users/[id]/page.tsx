'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
    Mail, Phone, Calendar, Clock,
    Shield, ShieldCheck, ShieldAlert, UserCog,
    Ban, CheckCircle, Trash2, AlertCircle,
    Key, Smartphone, Camera, X, Power,
    Monitor, Globe, LogOut, MessageCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import OtpInput from '@/components/auth/OtpInput';
import { showToast } from '@/components/ui/Toast';
import { adminService } from '@/services/admin.service';
import { QUERY_KEYS } from '@/constants/config';
import { useOtpConfig } from '@/hooks/use-otp-config';
import { usePasswordRules } from '@/hooks/use-security-config';
import { ROUTES } from '@/constants/routes';
import { ROLE_LABELS } from '@/constants/enums';
import { formatDate } from '@/lib/utils';
import type { Role } from '@/types/auth';
import type { ApiError } from '@/types/api';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const roleChangeOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

export default function SuperAdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const otpConfig = useOtpConfig();
    const passwordRules = usePasswordRules();
    const userId = params.id as string;
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modals
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [suspendReason, setSuspendReason] = useState('');
    const [suspendDuration, setSuspendDuration] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [newRole, setNewRole] = useState('');
    const [showResetPwModal, setShowResetPwModal] = useState(false);
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
        setIsSendingOtp(true);
        try {
            await adminService.sendPasswordResetOtp(userId);
            showToast.success('Verification code sent to user email');
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
        setIsResending(true);
        try {
            await adminService.sendPasswordResetOtp(userId);
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
        setShowResetPwModal(false);
        setNewPassword('');
        setResetStep('send');
        setResetOtp('');
        setResendTimer(0);
    };

    // Edit profile
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editMobileNumber, setEditMobileNumber] = useState('');
    const [editWhatsappNumber, setEditWhatsappNumber] = useState('');
    const [editIsMobileVerified, setEditIsMobileVerified] = useState(false);
    const [editIsWhatsappVerified, setEditIsWhatsappVerified] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: QUERY_KEYS.ADMIN.USER_DETAIL(userId),
        queryFn: () => adminService.getUserDetails(userId),
        enabled: !!userId,
    });

    const user = data?.data;

    const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
        queryKey: QUERY_KEYS.SUPER_ADMIN.USER_SESSIONS(userId),
        queryFn: () => adminService.getUserSessions(userId),
        enabled: !!userId,
    });

    const sessions = sessionsData?.data || [];

    const invalidateUser = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN.USER_DETAIL(userId) });

    const suspendMutation = useMutation({
        mutationFn: ({ reason, duration }: { reason: string; duration?: number }) =>
            adminService.suspendUser(userId, { reason, duration }),
        onSuccess: () => {
            showToast.success('User suspended successfully');
            invalidateUser();
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
            invalidateUser();
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
            router.push(ROUTES.SUPER_ADMIN.USERS);
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
            invalidateUser();
            setShowRoleModal(false);
            setNewRole('');
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to update role');
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: ({ pw, otp }: { pw: string; otp: string }) =>
            adminService.resetUserPassword(userId, { newPassword: pw, otp }),
        onSuccess: () => {
            showToast.success('Password reset successfully — all sessions revoked');
            closeResetPwModal();
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUPER_ADMIN.USER_SESSIONS(userId) });
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to reset password');
        },
    });

    const deactivateMutation = useMutation({
        mutationFn: () => adminService.deactivateUser(userId),
        onSuccess: () => {
            showToast.success('User deactivated');
            invalidateUser();
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to deactivate user');
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: (data: Parameters<typeof adminService.updateUserProfile>[1]) =>
            adminService.updateUserProfile(userId, data),
        onSuccess: () => {
            showToast.success('Profile updated');
            invalidateUser();
            setIsEditing(false);
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to update profile');
        },
    });

    const uploadAvatarMutation = useMutation({
        mutationFn: (file: File) => adminService.uploadUserAvatar(userId, file),
        onSuccess: () => {
            showToast.success('Avatar uploaded');
            invalidateUser();
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to upload avatar');
        },
    });

    const removeAvatarMutation = useMutation({
        mutationFn: () => adminService.removeUserAvatar(userId),
        onSuccess: () => {
            showToast.success('Avatar removed');
            invalidateUser();
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to remove avatar');
        },
    });

    const revokeSessionsMutation = useMutation({
        mutationFn: () => adminService.revokeUserSessions(userId),
        onSuccess: () => {
            showToast.success('All sessions revoked');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUPER_ADMIN.USER_SESSIONS(userId) });
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to revoke sessions');
        },
    });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast.error('Image must be under 5 MB');
            return;
        }
        uploadAvatarMutation.mutate(file);
    };

    const startEditing = () => {
        if (!user) return;
        setEditFirstName(user.firstName || '');
        setEditLastName(user.lastName || '');
        setEditEmail(user.email);
        setEditMobileNumber(user.mobileNumber || '');
        setEditWhatsappNumber(user.whatsappNumber || '');
        setEditIsMobileVerified(user.isMobileVerified);
        setEditIsWhatsappVerified(user.isWhatsappVerified);
        setIsEditing(true);
    };

    const handleSaveProfile = () => {
        if (!user) return;
        const updates: Record<string, unknown> = {};
        if (editFirstName && editFirstName !== user.firstName) updates.firstName = editFirstName;
        if (editLastName && editLastName !== user.lastName) updates.lastName = editLastName;
        if (editEmail && editEmail !== user.email) updates.email = editEmail;

        // Mobile number: empty string → null (remove), changed → update
        const effectiveMobile = editMobileNumber.trim() || null;
        if (effectiveMobile !== (user.mobileNumber || null)) updates.mobileNumber = effectiveMobile;
        if (editIsMobileVerified !== user.isMobileVerified) updates.isMobileVerified = editIsMobileVerified;

        // WhatsApp number
        const effectiveWhatsapp = editWhatsappNumber.trim() || null;
        if (effectiveWhatsapp !== (user.whatsappNumber || null)) updates.whatsappNumber = effectiveWhatsapp;
        if (editIsWhatsappVerified !== user.isWhatsappVerified) updates.isWhatsappVerified = editIsWhatsappVerified;

        if (Object.keys(updates).length === 0) {
            setIsEditing(false);
            return;
        }
        updateProfileMutation.mutate(updates as Parameters<typeof adminService.updateUserProfile>[1]);
    };

    const getRoleBadgeVariant = (role: string): BadgeVariant => {
        switch (role) {
            case 'SUPER_ADMIN': return 'error';
            case 'ADMIN': return 'warning';
            case 'EMPLOYER': return 'info';
            case 'CANDIDATE': return 'success';
            default: return 'neutral';
        }
    };

    const parseUserAgent = (ua: string | null) => {
        if (!ua) return 'Unknown Device';
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return ua.slice(0, 40);
    };

    return (
        <DashboardLayout requiredRole={['SUPER_ADMIN']}>
            <div className="space-y-6">
                {/* Breadcrumb */}
                <Breadcrumb items={[
                    { label: 'Dashboard', href: ROUTES.SUPER_ADMIN.DASHBOARD },
                    { label: 'Users', href: ROUTES.SUPER_ADMIN.USERS },
                    { label: user?.firstName ? `${user.firstName} ${user.lastName}` : 'User Detail' },
                ]} />

                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton variant="rect" height={200} />
                        <Skeleton variant="rect" height={200} />
                    </div>
                ) : user ? (
                    <>
                        {/* Profile Header */}
                        <Card>
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-4">
                                    {/* Avatar with upload */}
                                    <div className="group relative">
                                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-2xl font-bold text-[var(--text-muted)]">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.firstName ? `${user.firstName}'s avatar` : 'User avatar'} className="h-20 w-20 rounded-full object-cover" />
                                            ) : (
                                                (user.firstName?.[0] || user.email[0]).toUpperCase()
                                            )}
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="rounded-full p-1.5 text-white hover:bg-white/20"
                                                title="Upload avatar"
                                            >
                                                <Camera className="h-4 w-4" />
                                            </button>
                                            {user.avatar && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeAvatarMutation.mutate()}
                                                    className="rounded-full p-1.5 text-white hover:bg-white/20"
                                                    title="Remove avatar"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handleAvatarChange}
                                        />
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
                                                <Badge variant="info" size="sm">Email Verified</Badge>
                                            )}
                                            {user.isMobileVerified && (
                                                <Badge variant="info" size="sm">Mobile Verified</Badge>
                                            )}
                                            {user.isWhatsappVerified && (
                                                <Badge variant="info" size="sm">WhatsApp Verified</Badge>
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
                                    {user.isActive && !user.isSuspended && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            leftIcon={<Power className="h-4 w-4" />}
                                            onClick={() => deactivateMutation.mutate()}
                                            isLoading={deactivateMutation.isPending}
                                        >
                                            Deactivate
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={<UserCog className="h-4 w-4" />}
                                        onClick={() => { setShowRoleModal(true); setNewRole(user.role); }}
                                    >
                                        Change Role
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={<Key className="h-4 w-4" />}
                                        onClick={() => setShowResetPwModal(true)}
                                    >
                                        Reset Password
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={<LogOut className="h-4 w-4" />}
                                        onClick={() => revokeSessionsMutation.mutate()}
                                        isLoading={revokeSessionsMutation.isPending}
                                    >
                                        Revoke Sessions
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

                        {/* Edit Profile */}
                        <Card
                            header={
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-[var(--text)]">Edit Profile</h2>
                                    {!isEditing && (
                                        <Button variant="outline" size="sm" onClick={startEditing}>Edit</Button>
                                    )}
                                </div>
                            }
                        >
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Input
                                            label="First Name"
                                            value={editFirstName}
                                            onChange={(e) => setEditFirstName(e.target.value)}
                                        />
                                        <Input
                                            label="Last Name"
                                            value={editLastName}
                                            onChange={(e) => setEditLastName(e.target.value)}
                                        />
                                    </div>
                                    <Input
                                        label="Email"
                                        type="email"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                    />
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Input
                                            label="Mobile Number"
                                            placeholder="+919876543210"
                                            value={editMobileNumber}
                                            onChange={(e) => setEditMobileNumber(e.target.value)}
                                        />
                                        <Input
                                            label="WhatsApp Number"
                                            placeholder="+919876543210"
                                            value={editWhatsappNumber}
                                            onChange={(e) => setEditWhatsappNumber(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Switch
                                            label="Mobile Verified"
                                            description="Mark mobile number as verified (trusted bypass)"
                                            checked={editIsMobileVerified}
                                            onChange={(e) => setEditIsMobileVerified(e.target.checked)}
                                            disabled={!editMobileNumber.trim()}
                                        />
                                        <Switch
                                            label="WhatsApp Verified"
                                            description="Mark WhatsApp number as verified (trusted bypass)"
                                            checked={editIsWhatsappVerified}
                                            onChange={(e) => setEditIsWhatsappVerified(e.target.checked)}
                                            disabled={!editWhatsappNumber.trim()}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleSaveProfile}
                                            isLoading={updateProfileMutation.isPending}
                                        >
                                            Save Changes
                                        </Button>
                                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)]">First Name</p>
                                        <p className="text-sm font-medium text-[var(--text)]">{user.firstName || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)]">Last Name</p>
                                        <p className="text-sm font-medium text-[var(--text)]">{user.lastName || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)]">Email</p>
                                        <p className="text-sm font-medium text-[var(--text)]">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)]">Mobile Number</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-[var(--text)]">{user.mobileNumber || '—'}</p>
                                            {user.mobileNumber && (
                                                <Badge variant={user.isMobileVerified ? 'success' : 'warning'} size="sm">
                                                    {user.isMobileVerified ? 'Verified' : 'Unverified'}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)]">WhatsApp Number</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-[var(--text)]">{user.whatsappNumber || '—'}</p>
                                            {user.whatsappNumber && (
                                                <Badge variant={user.isWhatsappVerified ? 'success' : 'warning'} size="sm">
                                                    {user.isWhatsappVerified ? 'Verified' : 'Unverified'}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                <InfoItem icon={Calendar} label="Account Created" value={formatDate(user.createdAt)} />
                                <InfoItem icon={Clock} label="Last Login" value={user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'} />
                                <InfoItem icon={ShieldAlert} label="Login Attempts" value={String(user.loginAttempts)} />
                                <InfoItem icon={Key} label="MFA Enabled" value={user.mfaEnabled ? 'Yes' : 'No'} />
                                <InfoItem icon={ShieldCheck} label="Email Verified" value={user.isEmailVerified ? 'Yes' : 'No'} />
                                <InfoItem icon={Smartphone} label="Mobile Verified" value={user.isMobileVerified ? 'Yes' : 'No'} />
                                <InfoItem icon={MessageCircle} label="WhatsApp" value={user.whatsappNumber || 'Not provided'} />
                                <InfoItem icon={MessageCircle} label="WhatsApp Verified" value={user.isWhatsappVerified ? 'Yes' : 'No'} />
                                <InfoItem icon={Shield} label="Role" value={ROLE_LABELS[user.role] || user.role} />
                            </div>
                        </Card>

                        {/* Active Sessions */}
                        <Card
                            header={
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-[var(--text)]">Active Sessions</h2>
                                    {sessions.length > 0 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            leftIcon={<LogOut className="h-4 w-4" />}
                                            onClick={() => revokeSessionsMutation.mutate()}
                                            isLoading={revokeSessionsMutation.isPending}
                                        >
                                            Revoke All
                                        </Button>
                                    )}
                                </div>
                            }
                        >
                            {sessionsLoading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} variant="rect" height={48} />
                                    ))}
                                </div>
                            ) : sessions.length > 0 ? (
                                <div className="space-y-3">
                                    {sessions.map((session) => (
                                        <div
                                            key={session.id}
                                            className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
                                                    <Monitor className="h-4 w-4 text-[var(--text-muted)]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[var(--text)]">
                                                        {parseUserAgent(session.userAgent)}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                                        <Globe className="h-3 w-3" />
                                                        <span>{session.ipAddress || 'Unknown IP'}</span>
                                                        <span className="text-[var(--border)]">|</span>
                                                        <span>Created {formatDate(session.createdAt)}</span>
                                                        {session.lastSeenAt && (
                                                            <>
                                                                <span className="text-[var(--border)]">|</span>
                                                                <span>Last seen {formatDate(session.lastSeenAt)}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant={session.isActive ? 'success' : 'neutral'} size="sm">
                                                {session.isActive ? 'Active' : 'Expired'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-4 text-center text-sm text-[var(--text-muted)]">No active sessions found.</p>
                            )}
                        </Card>
                    </>
                ) : (
                    <Card>
                        <div className="py-12 text-center">
                            <p className="text-[var(--text-muted)]">User not found.</p>
                            <Link href={ROUTES.SUPER_ADMIN.USERS}>
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
                    onClose={() => { setShowSuspendModal(false); setSuspendReason(''); setSuspendDuration(''); }}
                    title="Suspend User"
                    size="sm"
                    footer={
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => { setShowSuspendModal(false); setSuspendReason(''); setSuspendDuration(''); }}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    if (!suspendReason.trim()) return;
                                    suspendMutation.mutate({
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
                            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={() => deleteMutation.mutate()} isLoading={deleteMutation.isPending}>
                                Delete
                            </Button>
                        </div>
                    }
                >
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 shrink-0 text-error" />
                        <p className="text-sm text-[var(--text-secondary)]">
                            Are you sure you want to permanently delete this user? This action cannot be undone and all associated data will be removed.
                        </p>
                    </div>
                </Modal>

                {/* Change Role Modal */}
                <Modal
                    isOpen={showRoleModal}
                    onClose={() => { setShowRoleModal(false); setNewRole(''); }}
                    title="Change User Role"
                    size="sm"
                    footer={
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => { setShowRoleModal(false); setNewRole(''); }}>
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
                            Current role: <span className="font-medium text-[var(--text)]">{user ? ROLE_LABELS[user.role] || user.role : ''}</span>
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
                    isOpen={showResetPwModal}
                    onClose={closeResetPwModal}
                    title="Reset Password"
                    size="md"
                    footer={
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={closeResetPwModal}>
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
                                    variant="destructive"
                                    onClick={() => resetPasswordMutation.mutate({ pw: newPassword, otp: resetOtp })}
                                    isLoading={resetPasswordMutation.isPending}
                                    disabled={newPassword.length < passwordRules.MIN_LENGTH || resetOtp.length !== otpConfig.LENGTH}
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
                                A 6-digit verification code will be sent to this user&apos;s email to confirm the password reset.
                                This will revoke all their active sessions.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="rounded-lg bg-[var(--bg-secondary)] px-4 py-3">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Enter the 6-digit code sent to the user&apos;s email and the new password.
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
                                            onClick={handleResendResetOtp}
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

function InfoItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
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
