import { Request, Response, NextFunction } from 'express';
import { superAdminService } from '../services/super-admin.service';
import { generateMfaSecret, enableMfa } from '../services/mfa.service';
import { generateBackupCodes, hashToken } from '../utils/crypto';
import { AuditService } from '../services/audit.service';
import logger from '../config/logger';
import { AppError } from '../middleware/error';
import prisma from '../config/prisma';
import { Role } from '@prisma/client';

/**
 * Create Admin
 */
export const createAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        const admin = await superAdminService.createAdmin({ email, password, firstName, lastName });
        res.status(201).json({ status: 'success', data: admin });
    } catch (error) {
        next(error);
    }
};

/**
 * List Admins
 */
export const listAdmins = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const result = await superAdminService.listAdmins(page, limit);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove Admin
 */
export const removeAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        await superAdminService.removeAdmin(req.params.id as string, req.user.id);
        res.status(200).json({ status: 'success', message: 'Admin removed' });
    } catch (error) {
        next(error);
    }
};

/**
 * Get System Config
 */
export const getSystemConfig = async (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const config = await superAdminService.getSystemConfig();
        res.status(200).json({ status: 'success', data: config });
    } catch (error) {
        next(error);
    }
};

/**
 * Update System Config
 */
export const updateSystemConfig = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { key, value } = req.body;
        await superAdminService.updateSystemConfig(key, value, req.user.id);
        res.status(200).json({ status: 'success', message: 'Config updated' });
    } catch (error) {
        next(error);
    }
};

// ── User Management ──

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { email, password, firstName, lastName, role } = req.body;
        const user = await superAdminService.createUser({ email, password, firstName, lastName, role }, req.user.id);
        res.status(201).json({ status: 'success', data: user });
    } catch (error) {
        next(error);
    }
};

export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const updated = await superAdminService.updateUserProfile(req.params.id as string, req.body, req.user.id);
        res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
        next(error);
    }
};

export const sendAdminPasswordResetOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        await superAdminService.sendAdminPasswordResetOtp(req.params.id as string, req.user.id);
        res.status(200).json({ status: 'success', message: 'Verification code sent to admin email' });
    } catch (error) {
        next(error);
    }
};

export const adminResetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        await superAdminService.adminResetPassword(req.params.id as string, req.body.newPassword, req.body.otp, req.user.id);
        res.status(200).json({ status: 'success', message: 'Password reset successfully' });
    } catch (error) {
        next(error);
    }
};

export const uploadUserAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        if (!req.file) throw new AppError('No file uploaded', 400);
        const result = await superAdminService.uploadUserAvatar(req.params.id as string, req.file, req.user.id);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const removeUserAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        await superAdminService.removeUserAvatar(req.params.id as string, req.user.id);
        res.status(200).json({ status: 'success', message: 'Avatar removed' });
    } catch (error) {
        next(error);
    }
};

export const getUserSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sessions = await superAdminService.getUserSessions(req.params.id as string);
        res.status(200).json({ status: 'success', data: sessions });
    } catch (error) {
        next(error);
    }
};

export const revokeUserSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        await superAdminService.revokeUserSessions(req.params.id as string, req.user.id);
        res.status(200).json({ status: 'success', message: 'All sessions revoked' });
    } catch (error) {
        next(error);
    }
};

export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        await superAdminService.deactivateUser(req.params.id as string, req.user.id);
        res.status(200).json({ status: 'success', message: 'User deactivated' });
    } catch (error) {
        next(error);
    }
};

// ── Admin MFA Management ──

async function verifyTargetIsAdmin(userId: string): Promise<{ id: string; email: string }> {
    const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true },
    });
    if (!target) throw new AppError('User not found', 404);
    if (target.role !== Role.ADMIN) throw new AppError('Target user is not an admin', 400);
    return target;
}

export const setupAdminMfa = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const target = await verifyTargetIsAdmin(req.params.id as string);
        const result = await generateMfaSecret(target.id, target.email);
        res.status(200).json({ status: 'success', data: { qrCode: result.qrCodeUrl, secret: result.secret } });
    } catch (error) {
        next(error);
    }
};

export const enableAdminMfa = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await verifyTargetIsAdmin(req.params.id as string);
        const { token } = req.body;
        if (!token) throw new AppError('MFA code is required', 400);
        const result = await enableMfa(req.params.id as string, token);
        if (!result.success) throw new AppError(result.error || 'Failed to enable MFA', 400);
        res.status(200).json({ status: 'success', data: { backupCodes: result.backupCodes } });
    } catch (error) {
        next(error);
    }
};

export const disableAdminMfa = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await verifyTargetIsAdmin(req.params.id as string);
        // Super-admin authority: no password/TOTP needed
        await prisma.$transaction([
            prisma.user.update({
                where: { id: req.params.id as string },
                data: { mfaEnabled: false, mfaSecret: null, mfaBackupCodes: [] },
            }),
            prisma.mfaTrustedDevice.deleteMany({ where: { userId: req.params.id as string } }),
        ]);
        res.status(200).json({ status: 'success', message: 'Admin MFA disabled' });
    } catch (error) {
        next(error);
    }
};

export const getAdminMfaStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await verifyTargetIsAdmin(req.params.id as string);
        const user = await prisma.user.findUnique({
            where: { id: req.params.id as string },
            select: { mfaEnabled: true, mfaBackupCodes: true },
        });
        res.status(200).json({
            status: 'success',
            data: {
                mfaEnabled: user?.mfaEnabled ?? false,
                backupCodesRemaining: user?.mfaBackupCodes?.length ?? 0,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const regenerateAdminBackupCodes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await verifyTargetIsAdmin(req.params.id as string);
        const user = await prisma.user.findUnique({
            where: { id: req.params.id as string },
            select: { mfaEnabled: true },
        });
        if (!user?.mfaEnabled) throw new AppError('MFA is not enabled for this admin', 400);

        // Super-admin authority: no password/TOTP needed
        const backupCodes = generateBackupCodes(10);
        const hashedCodes = backupCodes.map(code => hashToken(code));

        await prisma.user.update({
            where: { id: req.params.id as string },
            data: { mfaBackupCodes: hashedCodes },
        });

        logger.info(`Super-admin regenerated backup codes for admin ${req.params.id}`);

        AuditService.log({
            action: 'ADMIN_MFA_BACKUP_CODES_REGENERATED',
            entity: 'User',
            entityId: req.params.id as string,
            performedBy: req.user?.id || 'unknown',
        }).catch(() => {});

        res.status(200).json({ status: 'success', data: { backupCodes } });
    } catch (error) {
        next(error);
    }
};
