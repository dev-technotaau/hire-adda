import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { generateBackupCodes, hashToken } from '../utils/crypto';
import logger from '../config/logger';
import bcrypt from 'bcryptjs';

/**
 * Generate a new MFA secret for a user
 * @param userId - User ID
 * @param email - User email (for QR code label)
 * @returns Object with secret and QR code data URL
 */
export const generateMfaSecret = async (
    userId: string,
    email: string
): Promise<{ secret: string; qrCodeUrl: string }> => {
    // Generate a new secret
    const secret = speakeasy.generateSecret({
        name: `${env.MFA_ISSUER}:${email}`,
        issuer: env.MFA_ISSUER,
        length: 32,
    });

    // Store the secret (not enabled yet)
    await prisma.user.update({
        where: { id: userId },
        data: {
            mfaSecret: secret.base32,
            mfaEnabled: false, // Will be enabled after verification
        },
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    logger.debug(`MFA secret generated for user ${userId}`);

    return {
        secret: secret.base32,
        qrCodeUrl,
    };
};

/**
 * Enable MFA after user verifies with a valid token
 * @param userId - User ID
 * @param token - TOTP token to verify
 * @returns Object with success status and backup codes
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

    // Verify the token
    const isValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token,
        window: 1, // Allow 1 step tolerance
    });

    if (!isValid) {
        return { success: false, error: 'Invalid MFA code.' };
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedCodes = backupCodes.map(code => hashToken(code));

    // Enable MFA and store backup codes
    await prisma.user.update({
        where: { id: userId },
        data: {
            mfaEnabled: true,
            mfaBackupCodes: hashedCodes,
        },
    });

    logger.info(`MFA enabled for user ${userId}`);

    return {
        success: true,
        backupCodes, // Return plain codes to user (one-time display)
    };
};

/**
 * Disable MFA for a user
 * @param userId - User ID
 * @param password - User password for verification
 * @param token - TOTP token for verification
 * @returns Success status
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

    // Verify password
    if (!user.password) {
        return { success: false, error: 'Account uses social login (no password set).' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return { success: false, error: 'Invalid password.' };
    }

    // Verify TOTP token
    const isTokenValid = speakeasy.totp.verify({
        secret: user.mfaSecret!,
        encoding: 'base32',
        token,
        window: 1,
    });

    if (!isTokenValid) {
        return { success: false, error: 'Invalid MFA code.' };
    }

    // Disable MFA
    await prisma.user.update({
        where: { id: userId },
        data: {
            mfaEnabled: false,
            mfaSecret: null,
            mfaBackupCodes: [],
        },
    });

    logger.info(`MFA disabled for user ${userId}`);

    return { success: true };
};

/**
 * Verify a TOTP token for a user
 * @param userId - User ID
 * @param token - TOTP token
 * @returns Boolean indicating if token is valid
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

    // First try TOTP verification
    const isValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token,
        window: 1,
    });

    if (isValid) {
        return true;
    }

    // Try backup codes if TOTP fails
    const hashedToken = hashToken(token.replace('-', '').toUpperCase());
    const backupCodeIndex = user.mfaBackupCodes.indexOf(hashedToken);

    if (backupCodeIndex !== -1) {
        // Remove used backup code
        const updatedCodes = [...user.mfaBackupCodes];
        updatedCodes.splice(backupCodeIndex, 1);

        await prisma.user.update({
            where: { id: userId },
            data: { mfaBackupCodes: updatedCodes },
        });

        logger.info(`Backup code used for user ${userId}`);
        return true;
    }

    return false;
};

/**
 * Check if MFA is required for a user
 * @param userId - User ID
 * @returns Boolean indicating if MFA is enabled
 */
export const isMfaEnabled = async (userId: string): Promise<boolean> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { mfaEnabled: true },
    });

    return user?.mfaEnabled ?? false;
};
