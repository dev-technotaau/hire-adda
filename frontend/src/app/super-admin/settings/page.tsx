'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Shield, KeyRound, Lock, QrCode, Copy, Check,
    Fingerprint, Plus, Trash2, Monitor, Smartphone, LogOut,
    ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import OtpInput from '@/components/auth/OtpInput';
import { showToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';
import { adminService } from '@/services/admin.service';
import { sessionService } from '@/services/session.service';
import { webauthnService } from '@/services/webauthn.service';
import { startRegistration } from '@simplewebauthn/browser';
import { QUERY_KEYS } from '@/constants/config';
import { formatRelativeDate } from '@/lib/utils';
import type { ApiError } from '@/types/api';
import type { MfaSetupResponse, Session } from '@/types/auth';
import type { WebAuthnCredential } from '@/types/webauthn';
import type { UserListItem, UserSession } from '@/types/admin';

const SETTINGS_TABS = [
    { key: 'security', label: 'My Security' },
    { key: 'admin-mfa', label: 'Admin MFA' },
];

export default function SuperAdminSettingsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('security');

    return (
        <DashboardLayout requiredRole={['SUPER_ADMIN']}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Security Settings</h1>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Manage your security and admin MFA
                    </p>
                </div>

                <Tabs tabs={SETTINGS_TABS} activeTab={activeTab} onChange={setActiveTab}>
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <MfaSection mfaEnabled={user?.mfaEnabled ?? false} />
                            <PasskeysSection />
                            <ActiveSessionsSection />
                        </div>
                    )}
                    {activeTab === 'admin-mfa' && <AdminMfaManagement />}
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

// ---------------------------------------------------------------------------
// MFA Section (super-admin's own MFA)
// ---------------------------------------------------------------------------

function MfaSection({ mfaEnabled }: { mfaEnabled: boolean }) {
    const [showEnableModal, setShowEnableModal] = useState(false);
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [showRegenModal, setShowRegenModal] = useState(false);

    const [mfaSetup, setMfaSetup] = useState<MfaSetupResponse | null>(null);
    const [setupLoading, setSetupLoading] = useState(false);
    const [verifyCode, setVerifyCode] = useState('');
    const [enableLoading, setEnableLoading] = useState(false);
    const [copiedSecret, setCopiedSecret] = useState(false);

    const [disablePassword, setDisablePassword] = useState('');
    const [disableCode, setDisableCode] = useState('');
    const [disableLoading, setDisableLoading] = useState(false);

    const [regenPassword, setRegenPassword] = useState('');
    const [regenCode, setRegenCode] = useState('');
    const [regenLoading, setRegenLoading] = useState(false);
    const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);

    const queryClient = useQueryClient();

    const { data: backupCountRes } = useQuery({
        queryKey: ['mfa', 'backup-count'],
        queryFn: () => authService.mfaBackupCodeCount(),
        enabled: mfaEnabled,
    });
    const backupCodeCount = backupCountRes?.data?.count ?? 0;

    const handleSetupMfa = async () => {
        setSetupLoading(true);
        try {
            const res = await authService.mfaSetup();
            setMfaSetup(res.data);
            setShowEnableModal(true);
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to setup MFA');
        } finally {
            setSetupLoading(false);
        }
    };

    const handleEnableMfa = async () => {
        if (!verifyCode) {
            showToast.error('Please enter the verification code');
            return;
        }
        setEnableLoading(true);
        try {
            await authService.mfaEnable({ token: verifyCode });
            showToast.success('MFA enabled successfully');
            setShowEnableModal(false);
            setMfaSetup(null);
            setVerifyCode('');
            queryClient.invalidateQueries({ queryKey: ['auth'] });
            window.location.reload();
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to enable MFA');
        } finally {
            setEnableLoading(false);
        }
    };

    const handleDisableMfa = async () => {
        if (!disablePassword || !disableCode) {
            showToast.error('Please enter your password and verification code');
            return;
        }
        setDisableLoading(true);
        try {
            await authService.mfaDisable({ password: disablePassword, token: disableCode });
            showToast.success('MFA disabled successfully');
            setShowDisableModal(false);
            setDisablePassword('');
            setDisableCode('');
            queryClient.invalidateQueries({ queryKey: ['auth'] });
            window.location.reload();
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to disable MFA');
        } finally {
            setDisableLoading(false);
        }
    };

    const copySecret = useCallback(() => {
        if (mfaSetup?.secret) {
            navigator.clipboard.writeText(mfaSetup.secret);
            setCopiedSecret(true);
            setTimeout(() => setCopiedSecret(false), 2000);
        }
    }, [mfaSetup?.secret]);

    const handleRegenerateBackupCodes = async () => {
        if (!regenPassword || !regenCode) {
            showToast.error('Please enter your password and verification code');
            return;
        }
        setRegenLoading(true);
        try {
            const res = await authService.mfaRegenerateBackup({ password: regenPassword, token: regenCode });
            if (res.data?.backupCodes) {
                setNewBackupCodes(res.data.backupCodes);
                showToast.success('Backup codes regenerated');
                queryClient.invalidateQueries({ queryKey: ['mfa', 'backup-count'] });
            }
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to regenerate backup codes');
        } finally {
            setRegenLoading(false);
        }
    };

    return (
        <>
            <Card variant="bordered">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
                        <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--text)]">
                            Two-Factor Authentication (MFA)
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Add an extra layer of security to your account
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-[var(--border)] p-4">
                    <div className="flex items-center gap-3">
                        <KeyRound className="h-5 w-5 text-[var(--text-muted)]" />
                        <div>
                            <p className="font-medium text-[var(--text)]">Authenticator App</p>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {mfaEnabled
                                    ? 'Two-factor authentication is currently enabled'
                                    : 'Use an authenticator app to generate one-time codes'
                                }
                            </p>
                        </div>
                    </div>
                    {mfaEnabled ? (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowDisableModal(true)}
                        >
                            Disable MFA
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            size="sm"
                            isLoading={setupLoading}
                            onClick={handleSetupMfa}
                        >
                            Enable MFA
                        </Button>
                    )}
                </div>

                {mfaEnabled && (
                    <>
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--success)]/10 px-4 py-2">
                            <Shield className="h-4 w-4 text-[var(--success)]" />
                            <span className="text-sm text-[var(--success)]">
                                Your account is protected with two-factor authentication
                            </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--border)] p-4">
                            <div>
                                <p className="text-sm font-medium text-[var(--text)]">Backup Codes</p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {backupCodeCount} backup {backupCodeCount === 1 ? 'code' : 'codes'} remaining
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setShowRegenModal(true);
                                    setRegenPassword('');
                                    setRegenCode('');
                                    setNewBackupCodes([]);
                                }}
                            >
                                Regenerate
                            </Button>
                        </div>
                    </>
                )}
            </Card>

            {/* Enable MFA Modal */}
            <Modal
                isOpen={showEnableModal}
                onClose={() => {
                    setShowEnableModal(false);
                    setMfaSetup(null);
                    setVerifyCode('');
                }}
                title="Enable Two-Factor Authentication"
                size="md"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowEnableModal(false);
                                setMfaSetup(null);
                                setVerifyCode('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            isLoading={enableLoading}
                            onClick={handleEnableMfa}
                        >
                            Verify &amp; Enable
                        </Button>
                    </div>
                }
            >
                {mfaSetup && (
                    <div className="space-y-6">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Scan the QR code below with your authenticator app (e.g., Google Authenticator, Authy),
                            then enter the 6-digit verification code.
                        </p>

                        <div className="flex justify-center">
                            <div className="rounded-xl border border-[var(--border)] p-4 bg-white">
                                <img
                                    src={mfaSetup.qrCodeUrl}
                                    alt="MFA QR Code"
                                    className="h-48 w-48"
                                />
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-[var(--text)] mb-2">
                                Or enter this secret manually:
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-sm font-mono text-[var(--text)] break-all">
                                    {mfaSetup.secret}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={copySecret}
                                    leftIcon={copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                >
                                    {copiedSecret ? 'Copied' : 'Copy'}
                                </Button>
                            </div>
                        </div>

                        {mfaSetup.backupCodes.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-[var(--text)] mb-2">Backup Codes</p>
                                <p className="text-xs text-[var(--text-muted)] mb-2">
                                    Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                                </p>
                                <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--bg-secondary)] p-3">
                                    {mfaSetup.backupCodes.map((code) => (
                                        <code key={code} className="text-sm font-mono text-[var(--text)]">
                                            {code}
                                        </code>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--text)]">Verification Code</label>
                            <OtpInput value={verifyCode} onChange={setVerifyCode} length={6} />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Disable MFA Modal */}
            <Modal
                isOpen={showDisableModal}
                onClose={() => {
                    setShowDisableModal(false);
                    setDisablePassword('');
                    setDisableCode('');
                }}
                title="Disable Two-Factor Authentication"
                size="sm"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDisableModal(false);
                                setDisablePassword('');
                                setDisableCode('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            isLoading={disableLoading}
                            onClick={handleDisableMfa}
                        >
                            Disable MFA
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-[var(--text-secondary)]">
                        Disabling MFA will make your account less secure. You will need to provide your password
                        and a verification code from your authenticator app to confirm.
                    </p>
                    <Input
                        label="Password"
                        type="password"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        leftIcon={<Lock className="h-4 w-4" />}
                        required
                    />
                    <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--text)]">Verification Code</label>
                        <OtpInput value={disableCode} onChange={setDisableCode} length={6} />
                    </div>
                </div>
            </Modal>

            {/* Regenerate Backup Codes Modal */}
            <Modal
                isOpen={showRegenModal}
                onClose={() => {
                    setShowRegenModal(false);
                    setRegenPassword('');
                    setRegenCode('');
                    setNewBackupCodes([]);
                }}
                title={newBackupCodes.length > 0 ? 'New Backup Codes' : 'Regenerate Backup Codes'}
                size="sm"
                footer={
                    newBackupCodes.length > 0 ? (
                        <div className="flex justify-end">
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setShowRegenModal(false);
                                    setNewBackupCodes([]);
                                }}
                            >
                                Done
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowRegenModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                isLoading={regenLoading}
                                onClick={handleRegenerateBackupCodes}
                            >
                                Regenerate
                            </Button>
                        </div>
                    )
                }
            >
                {newBackupCodes.length > 0 ? (
                    <div className="space-y-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Save these new codes in a safe place. Your previous backup codes are no longer valid.
                        </p>
                        <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--bg-secondary)] p-3">
                            {newBackupCodes.map((code) => (
                                <code key={code} className="text-sm font-mono text-[var(--text)]">
                                    {code}
                                </code>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                            This will invalidate all existing backup codes and generate new ones.
                            Enter your password and a verification code to confirm.
                        </p>
                        <Input
                            label="Password"
                            type="password"
                            value={regenPassword}
                            onChange={(e) => setRegenPassword(e.target.value)}
                            leftIcon={<Lock className="h-4 w-4" />}
                            required
                        />
                        <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--text)]">Verification Code</label>
                            <OtpInput value={regenCode} onChange={setRegenCode} length={6} />
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}

// ---------------------------------------------------------------------------
// Passkeys Section (super-admin's own passkeys)
// ---------------------------------------------------------------------------

function PasskeysSection() {
    const queryClient = useQueryClient();
    const [registering, setRegistering] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [friendlyName, setFriendlyName] = useState('');
    const [showNameModal, setShowNameModal] = useState(false);
    const [pendingCredential, setPendingCredential] = useState<unknown>(null);

    const { data: credentialsResponse, isLoading } = useQuery({
        queryKey: QUERY_KEYS.WEBAUTHN.CREDENTIALS,
        queryFn: () => webauthnService.listCredentials(),
    });

    const credentials: WebAuthnCredential[] = credentialsResponse?.data ?? [];

    const handleRegister = async () => {
        setRegistering(true);
        try {
            const optionsRes = await webauthnService.getRegistrationOptions();
            const options = optionsRes.data;
            if (!options) throw new Error('Failed to get registration options');

            const credential = await startRegistration({ optionsJSON: options });
            setPendingCredential(credential);
            setShowNameModal(true);
        } catch (err) {
            const error = err as Error;
            if (error.name !== 'NotAllowedError') {
                showToast.error(error.message || 'Failed to register passkey');
            }
        } finally {
            setRegistering(false);
        }
    };

    const handleConfirmRegister = async () => {
        if (!pendingCredential) return;
        try {
            await webauthnService.verifyRegistration(pendingCredential, friendlyName || undefined);
            showToast.success('Passkey registered successfully');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WEBAUTHN.CREDENTIALS });
            setShowNameModal(false);
            setFriendlyName('');
            setPendingCredential(null);
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to verify passkey');
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await webauthnService.deleteCredential(id);
            showToast.success('Passkey removed');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WEBAUTHN.CREDENTIALS });
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to remove passkey');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                            <Fingerprint className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--text)]">Passkeys</h3>
                            <p className="text-sm text-[var(--text-muted)]">
                                Use biometrics, security keys, or your device to sign in without a password.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegister}
                        isLoading={registering}
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Passkey
                    </Button>
                </div>

                {isLoading ? (
                    <div className="py-4 text-center text-sm text-[var(--text-muted)]">Loading passkeys...</div>
                ) : credentials.length > 0 ? (
                    <div className="space-y-3">
                        {credentials.map((cred) => (
                            <div
                                key={cred.id}
                                className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3"
                            >
                                <div className="flex items-center gap-3">
                                    <KeyRound className="h-5 w-5 text-[var(--text-muted)]" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text)]">
                                            {cred.friendlyName || 'Passkey'}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            Added {formatRelativeDate(cred.createdAt)}
                                            {cred.deviceType && ` \u00B7 ${cred.deviceType}`}
                                            {cred.backedUp && ' \u00B7 Backed up'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(cred.id)}
                                    isLoading={deletingId === cred.id}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="py-4 text-center text-sm text-[var(--text-muted)]">
                        No passkeys registered. Add one to enable passwordless sign-in.
                    </p>
                )}
            </Card>

            <Modal
                isOpen={showNameModal}
                onClose={() => { setShowNameModal(false); setPendingCredential(null); setFriendlyName(''); }}
                title="Name Your Passkey"
                footer={
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => { setShowNameModal(false); setPendingCredential(null); setFriendlyName(''); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmRegister}>
                            Save Passkey
                        </Button>
                    </div>
                }
            >
                <Input
                    label="Passkey Name"
                    placeholder="e.g., MacBook Pro, iPhone, YubiKey"
                    value={friendlyName}
                    onChange={(e) => setFriendlyName(e.target.value)}
                    leftIcon={<KeyRound className="h-4 w-4" />}
                />
            </Modal>
        </>
    );
}

// ---------------------------------------------------------------------------
// Active Sessions Section (super-admin's own sessions)
// ---------------------------------------------------------------------------

function ActiveSessionsSection() {
    const queryClient = useQueryClient();
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [revokingAll, setRevokingAll] = useState(false);

    const { data: sessionsResponse, isLoading } = useQuery({
        queryKey: QUERY_KEYS.SESSIONS.LIST,
        queryFn: () => sessionService.listSessions(),
    });

    const sessions: Session[] = sessionsResponse?.data ?? [];

    const handleRevoke = async (sessionId: string) => {
        setRevokingId(sessionId);
        try {
            await sessionService.revokeSession(sessionId);
            showToast.success('Session revoked successfully');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SESSIONS.LIST });
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to revoke session');
        } finally {
            setRevokingId(null);
        }
    };

    const handleRevokeAll = async () => {
        setRevokingAll(true);
        try {
            await sessionService.revokeAllSessions();
            showToast.success('All other sessions have been revoked');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SESSIONS.LIST });
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to revoke sessions');
        } finally {
            setRevokingAll(false);
        }
    };

    const getDeviceIcon = (deviceInfo: string | null) => {
        if (!deviceInfo) return <Monitor className="h-5 w-5" />;
        const lower = deviceInfo.toLowerCase();
        if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
            return <Smartphone className="h-5 w-5" />;
        }
        return <Monitor className="h-5 w-5" />;
    };

    return (
        <Card variant="bordered">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
                        <Monitor className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--text)]">Active Sessions</h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Manage your active sessions across devices
                        </p>
                    </div>
                </div>
                {sessions.length > 1 && (
                    <Button
                        variant="outline"
                        size="sm"
                        isLoading={revokingAll}
                        leftIcon={<LogOut className="h-4 w-4" />}
                        onClick={handleRevokeAll}
                    >
                        Revoke All Other Sessions
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-16 animate-pulse rounded-lg bg-[var(--bg-secondary)]"
                        />
                    ))}
                </div>
            ) : sessions.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-8">
                    No active sessions found
                </p>
            ) : (
                <div className="space-y-3">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="flex items-center justify-between rounded-lg border border-[var(--border)] p-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-[var(--text-muted)]">
                                    {getDeviceIcon(session.deviceInfo ?? null)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-[var(--text)]">
                                            {session.deviceInfo || 'Unknown Device'}
                                        </p>
                                        {session.isCurrent && (
                                            <span className="rounded-full bg-[var(--success)]/10 px-2 py-0.5 text-xs font-medium text-[var(--success)]">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        IP: {session.ipAddress || 'Unknown'} &middot; Last active{' '}
                                        {formatRelativeDate(session.lastActive || session.createdAt)}
                                    </p>
                                </div>
                            </div>
                            {!session.isCurrent && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    isLoading={revokingId === session.id}
                                    onClick={() => handleRevoke(session.id)}
                                    className="text-[var(--error)] hover:text-[var(--error)] hover:bg-[var(--error-light)]"
                                >
                                    Revoke
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Admin MFA Management (manage MFA for admin accounts)
// ---------------------------------------------------------------------------

function AdminMfaManagement() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['super-admin', 'admins'],
        queryFn: () => adminService.listAdmins(),
    });
    const admins: UserListItem[] = data?.data?.items || [];

    // Expanded admin details
    const [expandedAdminId, setExpandedAdminId] = useState<string | null>(null);

    // Setup MFA modal state
    const [setupTarget, setSetupTarget] = useState<UserListItem | null>(null);
    const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
    const [setupLoading, setSetupLoading] = useState(false);
    const [verifyCode, setVerifyCode] = useState('');
    const [enableLoading, setEnableLoading] = useState(false);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [copiedSecret, setCopiedSecret] = useState(false);

    // Disable MFA modal state
    const [disableTarget, setDisableTarget] = useState<UserListItem | null>(null);
    const [disableLoading, setDisableLoading] = useState(false);

    // Regenerate backup codes modal state
    const [regenTarget, setRegenTarget] = useState<UserListItem | null>(null);
    const [regenLoading, setRegenLoading] = useState(false);
    const [regenCodes, setRegenCodes] = useState<string[]>([]);

    const handleSetupMfa = async (admin: UserListItem) => {
        setSetupTarget(admin);
        setSetupData(null);
        setVerifyCode('');
        setBackupCodes([]);
        setSetupLoading(true);
        try {
            const res = await adminService.setupAdminMfa(admin.id);
            if (res.data) {
                setSetupData(res.data);
            }
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to setup MFA');
            setSetupTarget(null);
        } finally {
            setSetupLoading(false);
        }
    };

    const handleEnableMfa = async () => {
        if (!setupTarget || !verifyCode) return;
        setEnableLoading(true);
        try {
            const res = await adminService.enableAdminMfa(setupTarget.id, verifyCode);
            if (res.data?.backupCodes) {
                setBackupCodes(res.data.backupCodes);
                showToast.success(`MFA enabled for ${setupTarget.email}`);
                queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
            }
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to enable MFA');
        } finally {
            setEnableLoading(false);
        }
    };

    const handleDisableMfa = async () => {
        if (!disableTarget) return;
        setDisableLoading(true);
        try {
            await adminService.disableAdminMfa(disableTarget.id);
            showToast.success(`MFA disabled for ${disableTarget.email}`);
            queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
            setDisableTarget(null);
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to disable MFA');
        } finally {
            setDisableLoading(false);
        }
    };

    const handleRegenBackupCodes = async () => {
        if (!regenTarget) return;
        setRegenLoading(true);
        try {
            const res = await adminService.regenerateAdminBackupCodes(regenTarget.id);
            if (res.data?.backupCodes) {
                setRegenCodes(res.data.backupCodes);
                showToast.success(`Backup codes regenerated for ${regenTarget.email}`);
                queryClient.invalidateQueries({ queryKey: ['admin-mfa-status', regenTarget.id] });
            }
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to regenerate backup codes');
        } finally {
            setRegenLoading(false);
        }
    };

    const copySecret = () => {
        if (setupData?.secret) {
            navigator.clipboard.writeText(setupData.secret);
            setCopiedSecret(true);
            setTimeout(() => setCopiedSecret(false), 2000);
        }
    };

    return (
        <>
            <Card variant="bordered">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
                        <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--text)]">
                            Admin MFA Management
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Enable or disable two-factor authentication for admin accounts
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                ) : admins.length === 0 ? (
                    <p className="text-center text-sm text-[var(--text-muted)] py-8">No admin accounts found</p>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {admins.map((admin) => (
                            <div key={admin.id} className="py-4 first:pt-0 last:pb-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-secondary)]">
                                            <KeyRound className="h-4 w-4 text-[var(--text-muted)]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[var(--text)]">
                                                {admin.firstName} {admin.lastName}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">{admin.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Badge variant={admin.mfaEnabled ? 'success' : 'warning'}>
                                            {admin.mfaEnabled ? 'MFA Enabled' : 'MFA Disabled'}
                                        </Badge>
                                        {admin.mfaEnabled ? (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setExpandedAdminId(expandedAdminId === admin.id ? null : admin.id)}
                                                >
                                                    {expandedAdminId === admin.id ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => setDisableTarget(admin)}
                                                >
                                                    Disable
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                isLoading={setupLoading && setupTarget?.id === admin.id}
                                                onClick={() => handleSetupMfa(admin)}
                                            >
                                                Setup MFA
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Expandable admin details */}
                                {expandedAdminId === admin.id && admin.mfaEnabled && (
                                    <AdminExpandedDetails
                                        admin={admin}
                                        onRegenerate={() => {
                                            setRegenTarget(admin);
                                            setRegenCodes([]);
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Setup / Enable MFA Modal */}
            <Modal
                isOpen={!!setupTarget}
                onClose={() => {
                    setSetupTarget(null);
                    setSetupData(null);
                    setVerifyCode('');
                    setBackupCodes([]);
                }}
                title={
                    backupCodes.length > 0
                        ? 'MFA Enabled - Save Backup Codes'
                        : `Setup MFA for ${setupTarget?.firstName || ''} ${setupTarget?.lastName || ''}`
                }
                size="md"
                footer={
                    backupCodes.length > 0 ? (
                        <div className="flex justify-end">
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setSetupTarget(null);
                                    setSetupData(null);
                                    setBackupCodes([]);
                                }}
                            >
                                Done
                            </Button>
                        </div>
                    ) : setupData ? (
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setSetupTarget(null)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                isLoading={enableLoading}
                                onClick={handleEnableMfa}
                                disabled={verifyCode.length !== 6}
                            >
                                Verify & Enable
                            </Button>
                        </div>
                    ) : undefined
                }
            >
                {setupLoading && (
                    <div className="flex justify-center py-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                )}

                {backupCodes.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Share these backup codes with the admin securely. They will need them if they lose access to their authenticator app.
                        </p>
                        <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--bg-secondary)] p-3">
                            {backupCodes.map((code) => (
                                <code key={code} className="text-sm font-mono text-[var(--text)]">
                                    {code}
                                </code>
                            ))}
                        </div>
                    </div>
                )}

                {setupData && backupCodes.length === 0 && (
                    <div className="space-y-6">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Have the admin scan this QR code with their authenticator app, then enter the 6-digit code below.
                        </p>

                        <div className="flex justify-center">
                            <div className="rounded-xl border border-[var(--border)] p-4 bg-white">
                                <img
                                    src={setupData.qrCodeUrl}
                                    alt="MFA QR Code"
                                    className="h-48 w-48"
                                />
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-[var(--text)] mb-2">
                                Or enter this secret manually:
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-sm font-mono text-[var(--text)] break-all">
                                    {setupData.secret}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={copySecret}
                                    leftIcon={copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                >
                                    {copiedSecret ? 'Copied' : 'Copy'}
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--text)]">Verification Code</label>
                            <OtpInput value={verifyCode} onChange={setVerifyCode} length={6} />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Disable MFA Confirmation Modal */}
            <Modal
                isOpen={!!disableTarget}
                onClose={() => setDisableTarget(null)}
                title="Disable Admin MFA"
                size="sm"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setDisableTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            isLoading={disableLoading}
                            onClick={handleDisableMfa}
                        >
                            Disable MFA
                        </Button>
                    </div>
                }
            >
                <div className="space-y-3">
                    <p className="text-sm text-[var(--text-secondary)]">
                        Are you sure you want to disable MFA for <strong>{disableTarget?.email}</strong>?
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                        This admin will no longer be able to access admin routes until MFA is re-enabled.
                    </p>
                </div>
            </Modal>

            {/* Regenerate Backup Codes Modal */}
            <Modal
                isOpen={!!regenTarget}
                onClose={() => {
                    setRegenTarget(null);
                    setRegenCodes([]);
                }}
                title={regenCodes.length > 0
                    ? `New Backup Codes for ${regenTarget?.firstName || ''}`
                    : `Regenerate Backup Codes for ${regenTarget?.firstName || ''} ${regenTarget?.lastName || ''}`
                }
                size="sm"
                footer={
                    regenCodes.length > 0 ? (
                        <div className="flex justify-end">
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setRegenTarget(null);
                                    setRegenCodes([]);
                                }}
                            >
                                Done
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setRegenTarget(null)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                isLoading={regenLoading}
                                onClick={handleRegenBackupCodes}
                            >
                                Regenerate
                            </Button>
                        </div>
                    )
                }
            >
                {regenCodes.length > 0 ? (
                    <div className="space-y-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Share these new codes with the admin securely. Previous backup codes are now invalid.
                        </p>
                        <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--bg-secondary)] p-3">
                            {regenCodes.map((code) => (
                                <code key={code} className="text-sm font-mono text-[var(--text)]">
                                    {code}
                                </code>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-[var(--text-secondary)]">
                            This will invalidate all existing backup codes for <strong>{regenTarget?.email}</strong> and generate 10 new ones.
                        </p>
                        <p className="text-sm text-[var(--text-muted)]">
                            You will need to securely share the new codes with the admin.
                        </p>
                    </div>
                )}
            </Modal>
        </>
    );
}

// ---------------------------------------------------------------------------
// Admin Expanded Details (backup codes, sessions per admin)
// ---------------------------------------------------------------------------

function AdminExpandedDetails({ admin, onRegenerate }: { admin: UserListItem; onRegenerate: () => void }) {
    const queryClient = useQueryClient();
    const [revokingAll, setRevokingAll] = useState(false);

    const { data: statusRes } = useQuery({
        queryKey: ['admin-mfa-status', admin.id],
        queryFn: () => adminService.getAdminMfaStatus(admin.id),
    });

    const { data: sessionsRes, isLoading: sessionsLoading } = useQuery({
        queryKey: ['admin-sessions', admin.id],
        queryFn: () => adminService.getAdminSessions(admin.id),
    });

    const backupCodesRemaining = statusRes?.data?.backupCodesRemaining ?? 0;
    const sessions: UserSession[] = sessionsRes?.data ?? [];

    const handleRevokeAllSessions = async () => {
        setRevokingAll(true);
        try {
            await adminService.revokeAdminSessions(admin.id);
            showToast.success(`All sessions revoked for ${admin.email}`);
            queryClient.invalidateQueries({ queryKey: ['admin-sessions', admin.id] });
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to revoke sessions');
        } finally {
            setRevokingAll(false);
        }
    };

    const getDeviceIcon = (ua: string | null) => {
        if (!ua) return <Monitor className="h-4 w-4" />;
        const lower = ua.toLowerCase();
        if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
            return <Smartphone className="h-4 w-4" />;
        }
        return <Monitor className="h-4 w-4" />;
    };

    return (
        <div className="mt-4 ml-12 space-y-4">
            {/* Backup Codes */}
            <div className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3">
                <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-[var(--text-muted)]" />
                    <div>
                        <p className="text-sm font-medium text-[var(--text)]">Backup Codes</p>
                        <p className="text-xs text-[var(--text-muted)]">
                            {backupCodesRemaining} {backupCodesRemaining === 1 ? 'code' : 'codes'} remaining
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRegenerate}
                    leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                >
                    Regenerate
                </Button>
            </div>

            {/* Active Sessions */}
            <div className="rounded-lg border border-[var(--border)] p-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-[var(--text-muted)]" />
                        <p className="text-sm font-medium text-[var(--text)]">Active Sessions</p>
                    </div>
                    {sessions.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            isLoading={revokingAll}
                            onClick={handleRevokeAllSessions}
                            className="text-[var(--error)] hover:text-[var(--error)]"
                            leftIcon={<LogOut className="h-3.5 w-3.5" />}
                        >
                            Revoke All
                        </Button>
                    )}
                </div>

                {sessionsLoading ? (
                    <div className="py-2 text-center text-xs text-[var(--text-muted)]">Loading sessions...</div>
                ) : sessions.length === 0 ? (
                    <p className="py-2 text-center text-xs text-[var(--text-muted)]">No active sessions</p>
                ) : (
                    <div className="space-y-2">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className="flex items-center justify-between rounded-md bg-[var(--bg-secondary)] px-3 py-2"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="text-[var(--text-muted)]">
                                        {getDeviceIcon(session.userAgent)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-[var(--text)]">
                                            {session.userAgent
                                                ? session.userAgent.length > 50
                                                    ? session.userAgent.substring(0, 50) + '...'
                                                    : session.userAgent
                                                : 'Unknown Device'
                                            }
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            IP: {session.ipAddress || 'Unknown'}
                                            {session.lastSeenAt && ` \u00B7 Last active ${formatRelativeDate(session.lastSeenAt)}`}
                                        </p>
                                    </div>
                                </div>
                                {session.isActive && (
                                    <span className="rounded-full bg-[var(--success)]/10 px-2 py-0.5 text-xs text-[var(--success)]">
                                        Active
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
