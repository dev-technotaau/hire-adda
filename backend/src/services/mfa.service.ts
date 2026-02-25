import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { generateBackupCodes, hashToken, compareTokens, generateSecureToken } from '../utils/crypto';
import { encryptField, decryptField } from '../utils/encryption';
import { AuditService } from './audit.service';
import { AppError } from '../middleware/error';
import logger from '../config/logger';
import bcrypt from 'bcryptjs';

const TRUSTED_DEVICE_DAYS = 30;

/**
 * Generate a new MFA secret for a user.
 * Guards against calling when MFA is already enabled.
 */
export const generateMfaSecret = async (
    userId: string,
    email: string
): Promise<{ secret: string; qrCodeUrl: string }> => {
    // Guard: prevent re-setup when MFA is already enabled
    const existing = await prisma.user.findUnique({
        where: { id: userId },
        select: { mfaEnabled: true },
    });
    if (existing?.mfaEnabled) {
        throw new AppError('MFA is already enabled. Disable it first to reconfigure.', 400);
    }

    const secret = speakeasy.generateSecret({
        name: `${env.MFA_ISSUER}:${email}`,
        issuer: env.MFA_ISSUER,
        length: 32,
    });

    // Encrypt the secret at rest
    await prisma.user.update({
        where: { id: userId },
        data: {
            mfaSecret: encryptField(secret.base32),
            mfaEnabled: false,
        },
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Audit
    AuditService.log({ action: 'MFA_SETUP_INITIATED', entity: 'User', entityId: userId, performedBy: userId }).catch(() => {});

    logger.debug(`MFA secret generated for user ${userId}`);

    return {
        secret: secret.base32,
        qrCodeUrl,
    };
};

/**
 * Enable MFA after user verifies with a valid TOTP token.
 */
export const enableMfa = async (
    userId: string,
    token: string
): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { mfaSecret: true, mfaEnabled: true },
    });

    if (!user?.mfaSecret) {
        return { success: false, error: 'MFA not set up. Please generate a secret first.' };
    }

    if (user.mfaEnabled) {
        return { success: false, error: 'MFA is already enabled.' };
    }

    // Decrypt the stored secret for verification
    const decryptedSecret = decryptField(user.mfaSecret);

    const isValid = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token,
        window: 1,
    });

    if (!isValid) {
        return { success: false, error: 'Invalid MFA code.' };
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedCodes = backupCodes.map(code => hashToken(code));

    await prisma.user.update({
        where: { id: userId },
        data: {
            mfaEnabled: true,
            mfaBackupCodes: hashedCodes,
        },
    });

    logger.info(`MFA enabled for user ${userId}`);

    // Audit
    AuditService.log({ action: 'MFA_ENABLED', entity: 'User', entityId: userId, performedBy: userId }).catch(() => {});

    // Notify user
    const enabledUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, isEmailVerified: true } });
    if (enabledUser?.isEmailVerified) {
        import('../templates/email/security').then(({ twoFactorEnabled }) => {
            const tmpl = twoFactorEnabled('Authenticator App');
            import('../jobs/email.queue').then(({ emailQueue }) => {
                emailQueue.add('send-email', { to: enabledUser.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text }).catch(() => {});
            });
        });
    }

    return {
        success: true,
        backupCodes,
    };
};

/**
 * Disable MFA for a user (requires password + TOTP verification).
 */
export const disableMfa = async (
    userId: string,
    password: string,
    token: string
): Promise<{ success: boolean; error?: string }> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true, mfaSecret: true, mfaEnabled: true },
    });

    if (!user) {
        return { success: false, error: 'User not found.' };
    }

    if (!user.mfaEnabled) {
        return { success: false, error: 'MFA is not enabled.' };
    }

    if (!user.password) {
        return { success: false, error: 'Account uses social login (no password set).' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return { success: false, error: 'Invalid password.' };
    }

    // Decrypt secret for TOTP verification
    const decryptedSecret = decryptField(user.mfaSecret!);

    const isTokenValid = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token,
        window: 1,
    });

    if (!isTokenValid) {
        return { success: false, error: 'Invalid MFA code.' };
    }

    // Disable MFA and revoke trusted devices
    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: {
                mfaEnabled: false,
                mfaSecret: null,
                mfaBackupCodes: [],
            },
        }),
        prisma.mfaTrustedDevice.deleteMany({ where: { userId } }),
    ]);

    logger.info(`MFA disabled for user ${userId}`);

    // Audit
    AuditService.log({ action: 'MFA_DISABLED', entity: 'User', entityId: userId, performedBy: userId }).catch(() => {});

    // Notify user
    const disabledUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, isEmailVerified: true } });
    if (disabledUser?.isEmailVerified) {
        import('../templates/email/security').then(({ twoFactorDisabled }) => {
            const tmpl = twoFactorDisabled('Authenticator App');
            import('../jobs/email.queue').then(({ emailQueue }) => {
                emailQueue.add('send-email', { to: disabledUser.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text }).catch(() => {});
            });
        });
    }

    return { success: true };
};

/**
 * Verify a TOTP token or backup code for a user.
 * Uses timing-safe comparison for backup codes.
 */
export const verifyMfaToken = async (
    userId: string,
    token: string
): Promise<boolean> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { mfaSecret: true, mfaEnabled: true, mfaBackupCodes: true },
    });

    if (!user?.mfaEnabled || !user.mfaSecret) {
        return false;
    }

    // Decrypt secret for TOTP verification
    const decryptedSecret = decryptField(user.mfaSecret);

    // Try TOTP verification first
    const isValid = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token,
        window: 1,
    });

    if (isValid) {
        return true;
    }

    // Try backup codes if TOTP fails (timing-safe comparison)
    const normalizedInput = token.replace(/-/g, '').toUpperCase();
    const backupCodeIndex = user.mfaBackupCodes.findIndex(stored => {
        try {
            return compareTokens(normalizedInput, stored);
        } catch {
            return false;
        }
    });

    if (backupCodeIndex !== -1) {
        // Remove used backup code
        const updatedCodes = [...user.mfaBackupCodes];
        updatedCodes.splice(backupCodeIndex, 1);

        await prisma.user.update({
            where: { id: userId },
            data: { mfaBackupCodes: updatedCodes },
        });

        logger.info(`Backup code used for user ${userId}`);

        // Audit
        AuditService.log({
            action: 'MFA_BACKUP_CODE_USED',
            entity: 'User',
            entityId: userId,
            performedBy: userId,
            details: { remainingCodes: updatedCodes.length },
        }).catch(() => {});

        return true;
    }

    // Audit failed verification
    AuditService.log({
        action: 'MFA_VERIFY_FAILED',
        entity: 'User',
        entityId: userId,
        performedBy: userId,
    }).catch(() => {});

    return false;
};

/**
 * Check if MFA is enabled for a user.
 */
export const isMfaEnabled = async (userId: string): Promise<boolean> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { mfaEnabled: true },
    });

    return user?.mfaEnabled ?? false;
};

/**
 * Regenerate backup codes (requires password + TOTP verification).
 */
export const regenerateBackupCodes = async (
    userId: string,
    password: string,
    token: string
): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true, mfaSecret: true, mfaEnabled: true },
    });

    if (!user?.mfaEnabled || !user.mfaSecret) {
        return { success: false, error: 'MFA is not enabled.' };
    }

    if (!user.password) {
        return { success: false, error: 'Account uses social login (no password set).' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return { success: false, error: 'Invalid password.' };
    }

    const decryptedSecret = decryptField(user.mfaSecret);
    const isTokenValid = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token,
        window: 1,
    });

    if (!isTokenValid) {
        return { success: false, error: 'Invalid MFA code.' };
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedCodes = backupCodes.map(code => hashToken(code));

    await prisma.user.update({
        where: { id: userId },
        data: { mfaBackupCodes: hashedCodes },
    });

    logger.info(`Backup codes regenerated for user ${userId}`);

    // Audit
    AuditService.log({
        action: 'MFA_BACKUP_CODES_REGENERATED',
        entity: 'User',
        entityId: userId,
        performedBy: userId,
    }).catch(() => {});

    // Notify user
    const notifUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, isEmailVerified: true } });
    if (notifUser?.isEmailVerified) {
        import('../templates/email/security').then(({ twoFactorEnabled }) => {
            const tmpl = twoFactorEnabled('Backup Codes Regenerated');
            import('../jobs/email.queue').then(({ emailQueue }) => {
                emailQueue.add('send-email', { to: notifUser.email, subject: 'Backup Codes Regenerated', html: tmpl.html, text: tmpl.text }).catch(() => {});
            });
        });
    }

    return { success: true, backupCodes };
};

/**
 * Get the number of remaining backup codes for a user.
 */
export const getBackupCodeCount = async (userId: string): Promise<number> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { mfaBackupCodes: true, mfaEnabled: true },
    });

    if (!user?.mfaEnabled) return 0;
    return user.mfaBackupCodes.length;
};

// ===============================
// Trusted Devices
// ===============================

/**
 * Create a trusted device token (skip MFA for 30 days).
 * Returns the plain token to store in a cookie on the client.
 */
export const createTrustedDevice = async (
    userId: string,
    userAgent?: string,
    ipAddress?: string
): Promise<string> => {
    const plainToken = generateSecureToken(32);
    const tokenHash = hashToken(plainToken);

    await prisma.mfaTrustedDevice.create({
        data: {
            userId,
            tokenHash,
            userAgent,
            ipAddress,
            expiresAt: new Date(Date.now() + TRUSTED_DEVICE_DAYS * 24 * 60 * 60 * 1000),
        },
    });

    return plainToken;
};

/**
 * Verify a trusted device token. Returns true if valid and not expired.
 */
export const verifyTrustedDevice = async (
    userId: string,
    token: string
): Promise<boolean> => {
    if (!token) return false;

    const tokenHash = hashToken(token);
    const device = await prisma.mfaTrustedDevice.findFirst({
        where: {
            userId,
            tokenHash,
            expiresAt: { gt: new Date() },
        },
    });

    return !!device;
};

/**
 * Revoke all trusted devices for a user.
 */
export const revokeTrustedDevices = async (userId: string): Promise<void> => {
    await prisma.mfaTrustedDevice.deleteMany({ where: { userId } });
};
