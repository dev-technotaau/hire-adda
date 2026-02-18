import { Request, Response, NextFunction } from 'express';
import { superAdminService } from '../services/super-admin.service';
import { AppError } from '../middleware/error';

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
