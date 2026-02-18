import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';
import { AppError } from '../middleware/error';
import bcrypt from 'bcryptjs';
import logger from '../config/logger';
import { uploadImage, uploadOptions } from '../config/cloudinary';
import { revokeAllUserTokens } from './token.service';
import { sessionService } from './session.service';
import { validatePasswordStrength } from '../utils/breach-detection';
import { hashToken, generateOtp } from '../utils/crypto';
import { emailQueue } from '../jobs/email.queue';
import { verifyEmail as verifyEmailTemplate, passwordResetOtp as passwordResetOtpTemplate } from '../templates/email/auth';

const SALT_ROUNDS = 12;

class SuperAdminService {
    async createAdmin(data: { email: string; password: string; firstName: string; lastName: string }) {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) throw new AppError('Email already registered', 400);

        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

        // Generate 6-digit OTP for email verification
        const verificationOtp = generateOtp(6);
        const hashedOtp = hashToken(verificationOtp);
        const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const admin = await prisma.user.create({
            data: {
                email: data.email, password: hashedPassword,
                firstName: data.firstName, lastName: data.lastName,
                role: Role.ADMIN, isEmailVerified: false,
                emailVerificationToken: hashedOtp,
                emailVerificationExpires: verificationExpires,
            },
            select: { id: true, email: true, role: true, firstName: true, lastName: true, createdAt: true }
        });

        // Send verification email with OTP
        try {
            const emailContent = verifyEmailTemplate(verificationOtp);
            await emailQueue.add('send-email', {
                to: data.email,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
            });
        } catch (error) {
            logger.error(`Failed to queue verification email for admin ${data.email}`, error);
        }

        logger.info(`Admin account created: ${data.email} (verification email sent)`);
        return admin;
    }

    async listAdmins(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [admins, total] = await prisma.$transaction([
            prisma.user.findMany({
                where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
                select: { id: true, email: true, role: true, firstName: true, lastName: true, isActive: true, isSuspended: true, createdAt: true, lastLoginAt: true },
                skip, take: limit, orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } } })
        ]);
        return { admins, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
    }

    async removeAdmin(adminId: string, superAdminId: string) {
        const admin = await prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new AppError('Admin not found', 404);
        if (admin.role === Role.SUPER_ADMIN) throw new AppError('Cannot remove a super admin', 403);
        if (admin.role !== Role.ADMIN) throw new AppError('User is not an admin', 400);

        await prisma.user.update({ where: { id: adminId }, data: { role: Role.CANDIDATE } });

        await prisma.auditLog.create({
            data: { action: 'REMOVE_ADMIN', entity: 'User', entityId: adminId, performedBy: superAdminId }
        });

        logger.info(`Admin ${adminId} removed by super admin ${superAdminId}`);
    }

    async getSystemConfig() {
        const configs = await prisma.systemConfig.findMany({ orderBy: { key: 'asc' } });
        return Object.fromEntries(configs.map(c => [c.key, c.value]));
    }

    async updateSystemConfig(key: string, value: any, adminId: string) {
        await prisma.systemConfig.upsert({
            where: { key },
            create: { key, value, updatedBy: adminId },
            update: { value, updatedBy: adminId },
        });

        await prisma.auditLog.create({
            data: { action: 'UPDATE_SYSTEM_CONFIG', entity: 'SystemConfig', entityId: key, performedBy: adminId, details: { value } }
        });
    }

    // ── User Management ──

    async createUser(data: { email: string; password: string; firstName: string; lastName: string; role: Role }, superAdminId: string) {
        if (data.role === Role.SUPER_ADMIN) throw new AppError('Cannot create super admin accounts', 403);

        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) throw new AppError('Email already registered', 400);

        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

        // Generate 6-digit OTP for email verification
        const verificationOtp = generateOtp(6);
        const hashedOtp = hashToken(verificationOtp);
        const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const user = await prisma.user.create({
            data: {
                email: data.email, password: hashedPassword,
                firstName: data.firstName, lastName: data.lastName,
                role: data.role, isEmailVerified: false,
                emailVerificationToken: hashedOtp,
                emailVerificationExpires: verificationExpires,
            },
            select: { id: true, email: true, role: true, firstName: true, lastName: true, createdAt: true }
        });

        // Send verification email with OTP
        try {
            const emailContent = verifyEmailTemplate(verificationOtp);
            await emailQueue.add('send-email', {
                to: data.email,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
            });
        } catch (error) {
            logger.error(`Failed to queue verification email for ${data.email}`, error);
        }

        await prisma.auditLog.create({
            data: { action: 'CREATE_USER', entity: 'User', entityId: user.id, performedBy: superAdminId, details: { role: data.role } }
        });

        logger.info(`User created by super admin: ${data.email} (${data.role}) (verification email sent)`);
        return user;
    }

    async updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; email?: string }, superAdminId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new AppError('User not found', 404);
        if (user.role === Role.SUPER_ADMIN && userId !== superAdminId) throw new AppError('Cannot modify another super admin', 403);

        if (data.email && data.email !== user.email) {
            const existing = await prisma.user.findUnique({ where: { email: data.email } });
            if (existing) throw new AppError('Email already in use', 400);
        }

        const updateData: Record<string, string> = {};
        if (data.firstName) updateData.firstName = data.firstName;
        if (data.lastName) updateData.lastName = data.lastName;
        if (data.email) updateData.email = data.email;

        const updated = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, email: true, firstName: true, lastName: true, role: true }
        });

        await prisma.auditLog.create({
            data: { action: 'UPDATE_USER_PROFILE', entity: 'User', entityId: userId, performedBy: superAdminId, details: data }
        });

        return updated;
    }

    async sendAdminPasswordResetOtp(userId: string, superAdminId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new AppError('User not found', 404);
        if (user.role === Role.SUPER_ADMIN && userId !== superAdminId) throw new AppError('Cannot reset another super admin password', 403);

        const otp = generateOtp(6);
        const hashedOtp = hashToken(otp);
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.user.update({
            where: { id: userId },
            data: { emailVerificationToken: hashedOtp, emailVerificationExpires: expires },
        });

        try {
            const emailContent = passwordResetOtpTemplate(otp);
            await emailQueue.add('send-email', {
                to: user.email,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
            });
        } catch (error) {
            logger.error(`Failed to queue password reset OTP email for ${user.email}`, error);
        }

        logger.info(`Password reset OTP sent to ${user.email} by super admin ${superAdminId}`);
    }

    async adminResetPassword(userId: string, newPassword: string, otp: string, superAdminId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new AppError('User not found', 404);
        if (user.role === Role.SUPER_ADMIN && userId !== superAdminId) throw new AppError('Cannot change another super admin password', 403);

        // Verify OTP
        if (!user.emailVerificationToken || !user.emailVerificationExpires) {
            throw new AppError('No verification code found. Please request a new one.', 400);
        }
        if (user.emailVerificationExpires < new Date()) {
            throw new AppError('Verification code has expired. Please request a new one.', 400);
        }
        const hashedOtp = hashToken(otp);
        if (hashedOtp !== user.emailVerificationToken) {
            throw new AppError('Invalid verification code', 400);
        }

        const strengthCheck = validatePasswordStrength(newPassword);
        if (!strengthCheck.isValid) throw new AppError(strengthCheck.errors.join('. '), 400);

        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword, emailVerificationToken: null, emailVerificationExpires: null },
        });

        await revokeAllUserTokens(userId);
        await sessionService.revokeAllSessions(userId);

        await prisma.auditLog.create({
            data: { action: 'ADMIN_RESET_PASSWORD', entity: 'User', entityId: userId, performedBy: superAdminId }
        });

        logger.info(`Password reset by super admin for user ${userId}`);
    }

    async uploadUserAvatar(userId: string, file: Express.Multer.File, superAdminId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { candidateProfile: true } });
        if (!user) throw new AppError('User not found', 404);

        const uploadResult = await uploadImage(file.buffer, uploadOptions.profileImage);
        const avatarUrl = uploadResult.secure_url;

        if (user.candidateProfile) {
            await prisma.$transaction([
                prisma.user.update({ where: { id: userId }, data: { avatar: avatarUrl } }),
                prisma.candidateProfile.update({ where: { userId }, data: { profileImage: avatarUrl } }),
            ]);
        } else {
            await prisma.user.update({ where: { id: userId }, data: { avatar: avatarUrl } });
        }

        await prisma.auditLog.create({
            data: { action: 'UPLOAD_USER_AVATAR', entity: 'User', entityId: userId, performedBy: superAdminId }
        });

        return { avatar: avatarUrl };
    }

    async removeUserAvatar(userId: string, superAdminId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { candidateProfile: true } });
        if (!user) throw new AppError('User not found', 404);

        if (user.candidateProfile) {
            await prisma.$transaction([
                prisma.user.update({ where: { id: userId }, data: { avatar: null } }),
                prisma.candidateProfile.update({ where: { userId }, data: { profileImage: null } }),
            ]);
        } else {
            await prisma.user.update({ where: { id: userId }, data: { avatar: null } });
        }

        await prisma.auditLog.create({
            data: { action: 'REMOVE_USER_AVATAR', entity: 'User', entityId: userId, performedBy: superAdminId }
        });
    }

    async getUserSessions(userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new AppError('User not found', 404);
        return sessionService.listActiveSessions(userId);
    }

    async revokeUserSessions(userId: string, superAdminId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new AppError('User not found', 404);
        if (user.role === Role.SUPER_ADMIN && userId !== superAdminId) throw new AppError('Cannot revoke another super admin sessions', 403);

        await revokeAllUserTokens(userId);
        await sessionService.revokeAllSessions(userId);

        await prisma.auditLog.create({
            data: { action: 'REVOKE_USER_SESSIONS', entity: 'User', entityId: userId, performedBy: superAdminId }
        });

        logger.info(`All sessions revoked for user ${userId} by super admin ${superAdminId}`);
    }

    async deactivateUser(userId: string, superAdminId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new AppError('User not found', 404);
        if (user.role === Role.SUPER_ADMIN) throw new AppError('Cannot deactivate a super admin', 403);
        if (userId === superAdminId) throw new AppError('Cannot deactivate yourself', 400);

        await prisma.user.update({ where: { id: userId }, data: { isActive: false } });

        await prisma.auditLog.create({
            data: { action: 'DEACTIVATE_USER', entity: 'User', entityId: userId, performedBy: superAdminId }
        });

        logger.info(`User ${userId} deactivated by super admin ${superAdminId}`);
    }
}

export const superAdminService = new SuperAdminService();
