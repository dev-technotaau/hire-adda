import prisma from '../config/prisma';
import { hashToken, generateSecureToken } from '../utils/crypto';
import { signRefreshToken, getTokenExpirationMs } from '../utils/jwt';
import { env } from '../config/env';
import logger from '../config/logger';

/**
 * Create and store a new refresh token for a user
 * @param userId - User ID
 * @param userAgent - User agent string
 * @param ipAddress - IP address
 * @returns The plain refresh token (to send to client)
 */
export const createRefreshToken = async (
    userId: string,
    userAgent?: string,
    ipAddress?: string
): Promise<string> => {
    // Generate a unique token ID
    const tokenId = generateSecureToken(16);

    // Create the JWT refresh token with the token ID embedded
    const refreshToken = signRefreshToken({
        userId,
        email: '', // Will be filled by auth service
        role: '', // Will be filled by auth service
    });

    // Calculate expiration date
    const expiresIn = getTokenExpirationMs(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + expiresIn);

    // Hash the token for storage
    const hashedToken = hashToken(refreshToken);

    // Store in database
    await prisma.refreshToken.create({
        data: {
            id: tokenId,
            token: hashedToken,
            userId,
            expiresAt,
            userAgent,
            ipAddress,
        },
    });

    // Enforce session limit
    const maxSessions = parseInt(env.MAX_SESSIONS_PER_USER, 10);
    const sessions = await prisma.refreshToken.findMany({
        where: { userId, isRevoked: false },
        orderBy: { createdAt: 'desc' },
    });
    if (sessions.length > maxSessions) {
        const toRevoke = sessions.slice(maxSessions);
        await prisma.refreshToken.updateMany({
            where: { id: { in: toRevoke.map(s => s.id) } },
            data: { isRevoked: true },
        });
    }

    logger.debug(`Created refresh token for user ${userId}`);

    return refreshToken;
};

/**
 * Revoke a specific refresh token
 * @param token - Plain refresh token
 */
export const revokeToken = async (token: string): Promise<void> => {
    const hashedToken = hashToken(token);

    await prisma.refreshToken.updateMany({
        where: { token: hashedToken },
        data: { isRevoked: true },
    });

    logger.debug('Refresh token revoked');
};

/**
 * Revoke all refresh tokens for a user (logout everywhere)
 * @param userId - User ID
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
    const result = await prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
    });

    logger.info(`Revoked ${result.count} tokens for user ${userId}`);
};

/**
 * Check if a refresh token is valid (not revoked, not expired)
 * @param token - Plain refresh token
 * @returns Boolean indicating if token is valid
 */
export const isTokenValid = async (token: string): Promise<boolean> => {
    const hashedToken = hashToken(token);

    const storedToken = await prisma.refreshToken.findUnique({
        where: { token: hashedToken },
    });

    if (!storedToken) {
        return false;
    }

    if (storedToken.isRevoked) {
        return false;
    }

    if (storedToken.expiresAt < new Date()) {
        return false;
    }

    return true;
};

/**
 * Get refresh token record by plain token
 * @param token - Plain refresh token
 * @returns RefreshToken record or null
 */
export const getTokenRecord = async (token: string) => {
    const hashedToken = hashToken(token);

    return prisma.refreshToken.findUnique({
        where: { token: hashedToken },
        include: { user: true },
    });
};

/**
 * Clean up expired and revoked tokens (for scheduled job)
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
    const result = await prisma.refreshToken.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: new Date() } },
                { isRevoked: true },
            ],
        },
    });

    logger.info(`Cleaned up ${result.count} expired/revoked tokens`);
    return result.count;
};
