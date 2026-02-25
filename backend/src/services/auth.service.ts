import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { env, getOtpExpiryMinutes, getOtpLength, getOtpMaxResendAttempts, getOtpResendCooldown, getPasswordResetExpiryHours } from '../config/env';
import logger from '../config/logger';
import { AppError } from '../middleware/error';
import { hashToken, generateOtp } from '../utils/crypto';
import { signAccessToken, TokenPayload } from '../utils/jwt';
import { checkPasswordBreach, validatePasswordStrength } from '../utils/breach-detection';
import { createRefreshToken, revokeToken, revokeAllUserTokens, isTokenValid, getTokenRecord } from './token.service';
import { verifyMfaToken } from './mfa.service';
import { RegisterInput, LoginInput, ResetPasswordInput, InitiateChangePasswordInput, ConfirmChangePasswordInput, ForgotPasswordInput } from '../schemas/auth.schema';
import { Role } from '@prisma/client';
import { emailQueue } from '../jobs/email.queue';
import { verifyEmail as verifyEmailTemplate, passwordResetOtp as passwordResetOtpTemplate, changePasswordOtp as changePasswordOtpTemplate } from '../templates/email/auth';
import { sessionService } from './session.service';
import { publishEvent, KafkaTopics } from '../kafka/producer';
import { trackEvent, getClientId } from './analytics.service';

const SALT_ROUNDS = 12;

function enforceResendLimits(lastSentAt: Date | null, resendCount: number): void {
    const cooldown = getOtpResendCooldown();
    const maxAttempts = getOtpMaxResendAttempts();

    if (resendCount >= maxAttempts) {
        throw new AppError('Maximum resend attempts reached. Please try again later.', 429, 'OTP_MAX_RESEND');
    }

    if (lastSentAt) {
        const elapsed = (Date.now() - lastSentAt.getTime()) / 1000;
        if (elapsed < cooldown) {
            const remaining = Math.ceil(cooldown - elapsed);
            throw new AppError(`Please wait ${remaining} seconds before requesting another code`, 429, 'OTP_COOLDOWN');
        }
    }
}

// ===============================
// Registration
// ===============================
export const register = async (
    data: RegisterInput,
): Promise<{
    user: { id: string; email: string; role: Role };
    breachWarning?: string;
}> => {
    const { password, firstName, lastName, role } = data;
    const email = data.email?.toLowerCase();

    // Check if user already exists (Email or Mobile)
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: email || undefined },
                { mobileNumber: data.mobileNumber || undefined }
            ]
        }
    });

    if (existingUser) {
        if (existingUser.email === email) throw new AppError('Email already registered', 400);
        if (existingUser.mobileNumber === data.mobileNumber) throw new AppError('Mobile number already registered', 400);
    }

    // Validate password strength
    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.isValid) {
        throw new AppError(strengthCheck.errors.join('. '), 400);
    }

    // Check for password breach
    const breachCheck = await checkPasswordBreach(password);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate OTP for email verification
    const verificationOtp = generateOtp(getOtpLength());
    const hashedVerificationOtp = hashToken(verificationOtp);
    const verificationExpires = new Date(Date.now() + getOtpExpiryMinutes() * 60 * 1000);

    // Create user — NO tokens issued until email is verified
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: role as Role,
            mobileNumber: data.mobileNumber,
            emailVerificationToken: hashedVerificationOtp,
            emailVerificationExpires: verificationExpires,
            emailOtpLastSentAt: new Date(),
        },
    });

    logger.info(`New user registered: ${email} (${role})`);

    // Send verification email with OTP
    try {
        const emailContent = verifyEmailTemplate(verificationOtp);
        await emailQueue.add('send-email', {
            to: email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
        });
    } catch (error) {
        logger.error(`Failed to queue verification email for ${email}`, error);
    }

    // Mobile verification happens later from profile/settings — NOT during registration

    // Publish Kafka event
    publishEvent(KafkaTopics.USER_REGISTERED, user.id, { userId: user.id, email: user.email, role: user.role });

    // GA4: track sign_up
    trackEvent(getClientId(user.id), { name: 'sign_up', params: { method: 'email', role: user.role } }).catch(() => {});

    return {
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        breachWarning: breachCheck.warning,
    };
};

/**
 * Generate Access and Refresh tokens for a user
 */
export const generateTokens = async (user: { id: string; email: string; role: string | Role }, userAgent: string | undefined, ipAddress: string | undefined) => {
    const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken(user.id, userAgent, ipAddress);

    return { accessToken, refreshToken };
};

// ===============================
// Login
// ===============================
export const login = async (
    data: LoginInput,
    userAgent?: string,
    ipAddress?: string
): Promise<{
    user: {
        id: string;
        email: string;
        role: Role;
        firstName: string | null;
        lastName: string | null;
        isEmailVerified: boolean;
        mfaEnabled: boolean;
        createdAt: Date;
        lastLoginAt: Date | null;
    };
    accessToken: string;
    refreshToken: string;
    requireMfa?: boolean;
}> => {
    const { password, mfaCode } = data;
    const email = data.email?.toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    // Check if account is active
    if (!user.isActive) {
        throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }

    // Check if account is suspended
    if (user.isSuspended) {
        throw new AppError('Your account has been suspended. Please contact support.', 403);
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
        const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
        throw new AppError(`Account is locked. Try again in ${minutesLeft} minutes.`, 423);
    }

    // Verify password
    if (!user.password) {
        throw new AppError('Invalid email or password', 401);
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        // Increment login attempts
        const maxAttempts = parseInt(env.MAX_LOGIN_ATTEMPTS, 10);
        const newAttempts = user.loginAttempts + 1;

        if (newAttempts >= maxAttempts) {
            // Lock account
            const lockDuration = parseInt(env.ACCOUNT_LOCK_DURATION_MINUTES, 10);
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    loginAttempts: newAttempts,
                    lockUntil: new Date(Date.now() + lockDuration * 60 * 1000),
                },
            });
            logger.warn(`Account locked due to failed attempts: ${email}`);
            throw new AppError(`Too many failed attempts. Account locked for ${lockDuration} minutes.`, 423);
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { loginAttempts: newAttempts },
        });

        throw new AppError('Invalid email or password', 401);
    }

    // Check email verification (after password to prevent enumeration)
    if (!user.isEmailVerified) {
        throw new AppError('Please verify your email before logging in. Check your inbox for the verification code.', 403, 'EMAIL_NOT_VERIFIED');
    }

    // Check MFA
    if (user.mfaEnabled) {
        if (!mfaCode) {
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isEmailVerified: user.isEmailVerified,
                    mfaEnabled: user.mfaEnabled,
                    createdAt: user.createdAt,
                    lastLoginAt: user.lastLoginAt,
                },
                accessToken: '',
                refreshToken: '',
                requireMfa: true,
            };
        }

        const isMfaValid = await verifyMfaToken(user.id, mfaCode);
        if (!isMfaValid) {
            // Increment login attempts on MFA failure (prevents brute-force)
            const newAttempts = user.loginAttempts + 1;
            const lockData: Record<string, unknown> = { loginAttempts: newAttempts };
            if (newAttempts >= parseInt(env.MAX_LOGIN_ATTEMPTS, 10)) {
                lockData.lockUntil = new Date(Date.now() + parseInt(env.ACCOUNT_LOCK_DURATION_MINUTES, 10) * 60 * 1000);
            }
            await prisma.user.update({ where: { id: user.id }, data: lockData });
            throw new AppError('Invalid MFA code', 401);
        }
    }

    // Reset login attempts and update last login
    await prisma.user.update({
        where: { id: user.id },
        data: {
            loginAttempts: 0,
            lockUntil: null,
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress,
        },
    });

    logger.info(`User logged in: ${email}`);

    // Generate tokens
    const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken(user.id, userAgent, ipAddress);

    // Create session
    sessionService.createSession(user.id, userAgent, ipAddress).catch(err => logger.error('Failed to create session', err));

    // Publish Kafka event
    publishEvent(KafkaTopics.USER_LOGIN, user.id, { userId: user.id, email: user.email });

    // GA4: track login
    trackEvent(getClientId(user.id), { name: 'login', params: { method: 'email' } }).catch(() => {});

    // Set online presence (fire-and-forget)
    import('../services/presence.service').then(({ presenceService }) => {
        presenceService.setOnline(user.id);
    }).catch(() => {});

    // Post-login security checks: device fingerprint, geolocation anomaly (fire-and-forget)
    import('../services/device-security.service').then(({ postLoginChecks }) => {
        const fingerprint = (data as Record<string, string>).deviceFingerprint;
        postLoginChecks(user.id, ipAddress || '', userAgent || '', fingerprint).catch(() => {});
    }).catch(() => {});

    return {
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: user.isEmailVerified,
            mfaEnabled: user.mfaEnabled,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
        },
        accessToken,
        refreshToken,
    };
};

// ===============================
// Logout
// ===============================
export const logout = async (refreshToken: string, userId?: string): Promise<void> => {
    await revokeToken(refreshToken);
    // Set offline presence (fire-and-forget)
    if (userId) {
        import('../services/presence.service').then(({ presenceService }) => {
            presenceService.setOffline(userId);
        }).catch(() => {});
    }
    logger.debug('User logged out');
};

// ===============================
// Logout Everywhere
// ===============================
export const logoutEverywhere = async (userId: string): Promise<void> => {
    await revokeAllUserTokens(userId);
    await sessionService.revokeAllSessions(userId);

    // Notify user via email
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true, isEmailVerified: true } });
    if (user?.isEmailVerified) {
        import('../templates/email/security').then(({ sessionRevokedAll }) => {
            const tmpl = sessionRevokedAll(user.firstName || 'there');
            emailQueue.add('send-email', { to: user.email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text }).catch(() => {});
        });
    }

    logger.info(`User logged out from all devices: ${userId}`);
};

// ===============================
// Refresh Tokens
// ===============================
export const refreshTokens = async (
    oldRefreshToken: string,
    userAgent?: string,
    ipAddress?: string
): Promise<{ accessToken: string; refreshToken: string }> => {
    // Validate old token
    const isValid = await isTokenValid(oldRefreshToken);
    if (!isValid) {
        throw new AppError('Invalid or expired refresh token', 401);
    }

    // Get token record with user
    const tokenRecord = await getTokenRecord(oldRefreshToken);
    if (!tokenRecord?.user) {
        throw new AppError('User not found', 401);
    }

    // Revoke old token
    await revokeToken(oldRefreshToken);

    // Update lastActiveAt so session timeout resets on token refresh
    prisma.user.update({
        where: { id: tokenRecord.user.id },
        data: { lastActiveAt: new Date() },
    }).catch(() => {});

    // Generate new tokens
    const tokenPayload: TokenPayload = {
        userId: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken(tokenRecord.user.id, userAgent, ipAddress);

    return { accessToken, refreshToken };
};

// ===============================
// Verify Email
// ===============================
export const verifyEmail = async (
    token: string,
    userAgent?: string,
    ipAddress?: string
): Promise<{
    user: {
        id: string;
        email: string;
        role: Role;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
        mobileNumber: string | null;
        isMobileVerified: boolean;
        isWhatsappVerified: boolean;
        whatsappNumber: string | null;
        isActive: boolean;
        isSuspended: boolean;
        isEmailVerified: boolean;
        mfaEnabled: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    };
    accessToken: string;
    refreshToken: string;
}> => {
    const hashedToken = hashToken(token);

    const user = await prisma.user.findFirst({
        where: {
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { gt: new Date() },
        },
    });

    if (!user) {
        throw new AppError('Invalid or expired verification token', 400);
    }

    const now = new Date();

    await prisma.user.update({
        where: { id: user.id },
        data: {
            isEmailVerified: true,
            emailVerificationToken: null,
            emailVerificationExpires: null,
            emailOtpResendCount: 0,
            emailOtpLastSentAt: null,
            lastLoginAt: now,
            lastLoginIp: ipAddress,
        },
    });

    logger.info(`Email verified: ${user.email}`);

    // Generate tokens so user is auto-logged-in after verification
    const { accessToken, refreshToken } = await generateTokens(user, userAgent, ipAddress);

    // Create session (same as login flow)
    sessionService.createSession(user.id, userAgent, ipAddress)
        .catch(err => logger.error('Failed to create session after email verification', err));

    return {
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            mobileNumber: user.mobileNumber,
            isMobileVerified: user.isMobileVerified,
            isWhatsappVerified: user.isWhatsappVerified,
            whatsappNumber: user.whatsappNumber,
            isActive: user.isActive,
            isSuspended: user.isSuspended,
            isEmailVerified: true,
            mfaEnabled: user.mfaEnabled,
            lastLoginAt: now,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken,
    };
};

// ===============================
// Forgot Password
// ===============================
export const forgotPassword = async (data: ForgotPasswordInput): Promise<void> => {
    const email = data.email?.toLowerCase();
    const { mobileNumber } = data;

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: email || undefined },
                { mobileNumber: mobileNumber || undefined }
            ]
        }
    });

    if (!user) {
        // Return success to prevent enumeration
        return;
    }

    const otp = generateOtp(getOtpLength());
    const hashedOtp = hashToken(otp);
    const resetExpires = new Date(Date.now() + getPasswordResetExpiryHours() * 60 * 60 * 1000);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordResetToken: hashedOtp,
            passwordResetExpires: resetExpires,
        },
    });

    if (mobileNumber && user.mobileNumber === mobileNumber) {
        // Send SMS OTP
        if (env.NODE_ENV !== 'production') {
            logger.info(`DEV: Password Reset OTP for ${mobileNumber}: ${otp}`);
        }
        try {
            const { smsQueue } = await import('../jobs/sms.queue');
            await smsQueue.add('send-sms', { to: mobileNumber, body: `Your password reset OTP is: ${otp}. Valid for 15 minutes.` });
        } catch (error) { logger.error('Failed to send SMS OTP', error); }
    } else if (email && user.email === email) {
        // Send Email OTP
        try {
            const emailContent = passwordResetOtpTemplate(otp);
            await emailQueue.add('send-email', {
                to: email,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
            });
        } catch (error) {
            logger.error(`Failed to queue password reset email for ${email}`, error);
        }
    }
};

// ===============================
// Reset Password
// ===============================
// ===============================
// Reset Password (with OTP/Token)
// ===============================
export const resetPassword = async (data: ResetPasswordInput): Promise<void> => {
    const { token, otp, password } = data;

    // We expect 'token' to be the OTP in the new flow, or 'otp' field explicitly
    const verificationCode = otp || token;

    if (!verificationCode) {
        throw new AppError('OTP or Token is required', 400);
    }

    const hashedToken = hashToken(verificationCode);

    const user = await prisma.user.findFirst({
        where: {
            passwordResetToken: hashedToken,
            passwordResetExpires: { gt: new Date() },
        },
    });

    if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    // Validate password strength
    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.isValid) {
        throw new AppError(strengthCheck.errors.join('. '), 400);
    }

    // Check for breach
    const breachCheck = await checkPasswordBreach(password);
    if (breachCheck.isBreached) {
        logger.warn(`User attempting to use breached password during reset: ${user.email}`);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Update password and clear reset token
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
        },
    });

    // Revoke all refresh tokens for security
    await revokeAllUserTokens(user.id);

    // GA4: track password_reset
    trackEvent(getClientId(user.id), { name: 'password_reset' }).catch(() => {});

    logger.info(`Password reset completed: ${user.email}`);
};

// ===============================
// Change Password - Initiate
// ===============================
export const initiateChangePassword = async (
    userId: string,
    data: InitiateChangePasswordInput
): Promise<void> => {
    const { currentPassword } = data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    if (user.password) {
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) throw new AppError('Current password is incorrect', 401);
    } else {
        throw new AppError('Account uses social login. Use reset password flow.', 400);
    }

    // Generate OTP
    const otp = generateOtp(getOtpLength());
    const hashedOtp = hashToken(otp);

    // Reuse passwordResetToken for change-password OTP (same "proof of ownership" purpose)
    await prisma.user.update({
        where: { id: userId },
        data: {
            passwordResetToken: hashedOtp,
            passwordResetExpires: new Date(Date.now() + getOtpExpiryMinutes() * 60 * 1000),
        }
    });

    // Send OTP via Email
    try {
        const emailContent = changePasswordOtpTemplate(otp);
        await emailQueue.add('send-email', {
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
        });
    } catch (error) {
        logger.error(`Failed to email Change Password OTP to ${user.email}`, error);
    }

    logger.info(`Change Password initiated for ${user.email}`);
};

// ===============================
// Change Password - Confirm
// ===============================
export const confirmChangePassword = async (
    userId: string,
    data: ConfirmChangePasswordInput
): Promise<void> => {
    const { otp, newPassword } = data;
    const hashedOtp = hashToken(otp);

    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            passwordResetToken: hashedOtp,
            passwordResetExpires: { gt: new Date() }
        }
    });

    if (!user) throw new AppError('Invalid or expired OTP', 400);

    // Validate strength & breach
    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.isValid) throw new AppError(strengthCheck.errors.join('. '), 400);

    const breachCheck = await checkPasswordBreach(newPassword);
    if (breachCheck.isBreached) logger.warn(`User uses breached pass: ${user.email}`);

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
        }
    });

    await revokeAllUserTokens(userId);

    // Notify user about password change (fire-and-forget)
    import('./notification.service').then(({ notificationService }) => {
        notificationService.notifyPasswordChanged(userId).catch(() => {});
    });

    logger.info(`Password changed for user ${userId}`);
};

// ===============================
// Get Current User
// ===============================
export const getCurrentUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
            avatar: true,
            mobileNumber: true,
            isMobileVerified: true,
            isWhatsappVerified: true,
            whatsappNumber: true,
            isActive: true,
            isSuspended: true,
            isEmailVerified: true,
            mfaEnabled: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return user;
};


// ===============================
// Resend Email Verification
// ===============================
export const resendEmailVerification = async (rawEmail: string): Promise<void> => {
    const email = rawEmail.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    // Silent return to prevent email enumeration
    if (!user || user.isEmailVerified) return;

    enforceResendLimits(user.emailOtpLastSentAt, user.emailOtpResendCount);

    const verificationOtp = generateOtp(getOtpLength());
    const hashedVerificationOtp = hashToken(verificationOtp);
    const verificationExpires = new Date(Date.now() + getOtpExpiryMinutes() * 60 * 1000);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerificationToken: hashedVerificationOtp,
            emailVerificationExpires: verificationExpires,
            emailOtpResendCount: user.emailOtpResendCount + 1,
            emailOtpLastSentAt: new Date(),
        }
    });

    try {
        const emailContent = verifyEmailTemplate(verificationOtp);
        await emailQueue.add('send-email', { to: user.email, subject: emailContent.subject, html: emailContent.html, text: emailContent.text });
    } catch (error) {
        logger.error('Failed to queue verification email', error);
    }
    logger.info(`Resent email verification for ${user.email}`);
};

// ===============================
// Verify Mobile
// ===============================
export const verifyMobile = async (mobileNumber: string, otp: string): Promise<void> => {
    const hashedOtp = hashToken(otp); // Assuming OTPs are hashed in DB for security

    const user = await prisma.user.findFirst({
        where: {
            mobileNumber,
            mobileVerificationToken: hashedOtp, // In real app, check hash match
            mobileVerificationExpires: { gt: new Date() },
        },
    });

    // NOTE: For MVP/Dev without SMS, we might store plain OTP or use a fixed one. 
    // If using `generateSecureToken(6, true)` it returns numeric string. 
    // For this implementation, let's assume `mobileVerificationToken` stores the HASHED OTP.

    if (!user) {
        throw new AppError('Invalid or expired OTP', 400);
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            isMobileVerified: true,
            mobileVerificationToken: null,
            mobileVerificationExpires: null,
            mobileOtpResendCount: 0,
            mobileOtpLastSentAt: null,
        },
    });

    logger.info(`Mobile verified: ${mobileNumber}`);
};

// ===============================
// Resend Mobile OTP
// ===============================
export const resendMobileOtp = async (mobileNumber: string): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { mobileNumber } });
    if (!user) return; // Silent return to prevent mobile number enumeration

    if (user.isMobileVerified) throw new AppError('Mobile already verified', 400);

    enforceResendLimits(user.mobileOtpLastSentAt, user.mobileOtpResendCount);

    // Generate new OTP
    const otp = generateOtp(getOtpLength());
    const hashedOtp = hashToken(otp);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            mobileVerificationToken: hashedOtp,
            mobileVerificationExpires: new Date(Date.now() + getOtpExpiryMinutes() * 60 * 1000),
            mobileOtpResendCount: user.mobileOtpResendCount + 1,
            mobileOtpLastSentAt: new Date(),
        },
    });

    // TODO: Send SMS via Queue
    if (env.NODE_ENV !== 'production') {
        logger.info(`DEV: Resent Mobile OTP for ${mobileNumber}: ${otp}`);
    }

    try {
        const { smsQueue } = await import('../jobs/sms.queue');
        await smsQueue.add('send-sms', { to: mobileNumber, body: `Your verification OTP is: ${otp}. Valid for 10 minutes.` });
    } catch (error) { logger.error('Failed to send SMS OTP', error); }
};

// ===============================
// Get effective WhatsApp number
// ===============================
export const getWhatsappNumber = (user: { whatsappNumber: string | null; mobileNumber: string | null }): string | null => {
    return user.whatsappNumber || user.mobileNumber;
};

// ===============================
// Verify WhatsApp (Send OTP)
// ===============================
export const verifyWhatsapp = async (userId: string, mobileNumber: string, whatsappNumber?: string): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (!user.mobileNumber && !mobileNumber) throw new AppError('No mobile number provided', 400);
    if (user.isWhatsappVerified) throw new AppError('WhatsApp already verified', 400);

    // If a separate whatsappNumber is provided and different from mobileNumber, store it
    const effectiveMobile = mobileNumber || user.mobileNumber!;
    const targetNumber = whatsappNumber || effectiveMobile;
    const separateWhatsapp = whatsappNumber && whatsappNumber !== effectiveMobile ? whatsappNumber : null;

    // Check if WhatsApp number is already used by another user
    if (separateWhatsapp) {
        const existingUser = await prisma.user.findFirst({
            where: { whatsappNumber: separateWhatsapp, id: { not: userId } },
        });
        if (existingUser) throw new AppError('This WhatsApp number is already in use by another account', 400);
    }

    enforceResendLimits(user.whatsappOtpLastSentAt, user.whatsappOtpResendCount);

    const otp = generateOtp(getOtpLength());
    const hashedOtp = hashToken(otp);

    await prisma.user.update({
        where: { id: userId },
        data: {
            whatsappVerificationToken: hashedOtp,
            whatsappVerificationExpires: new Date(Date.now() + getOtpExpiryMinutes() * 60 * 1000),
            mobileNumber: effectiveMobile,
            whatsappNumber: separateWhatsapp,
            whatsappOtpResendCount: user.whatsappOtpResendCount + 1,
            whatsappOtpLastSentAt: new Date(),
        }
    });

    // Send OTP via WhatsApp
    try {
        const { otpWhatsapp } = await import('../templates/whatsapp');
        const { whatsappQueue } = await import('../jobs/whatsapp.queue');
        const tmpl = otpWhatsapp(otp);
        await whatsappQueue.add('send-whatsapp', {
            to: targetNumber,
            templateName: tmpl.templateName,
            components: tmpl.components,
        });
    } catch (error) {
        logger.error('Failed to send WhatsApp OTP', error);
    }

    logger.info(`WhatsApp OTP sent to ${targetNumber}`);
};

// ===============================
// Confirm WhatsApp OTP
// ===============================
export const confirmWhatsappOtp = async (userId: string, _mobileNumber: string, otp: string): Promise<void> => {
    const hashedOtp = hashToken(otp);
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            whatsappVerificationToken: hashedOtp,
            whatsappVerificationExpires: { gt: new Date() },
        }
    });
    if (!user) throw new AppError('Invalid or expired OTP', 400);

    await prisma.user.update({
        where: { id: userId },
        data: {
            isWhatsappVerified: true,
            whatsappVerificationToken: null,
            whatsappVerificationExpires: null,
            whatsappOtpResendCount: 0,
            whatsappOtpLastSentAt: null,
        }
    });
    const verifiedNumber = user.whatsappNumber || user.mobileNumber;
    logger.info(`WhatsApp verified for ${verifiedNumber}`);
};

// ===============================
// Change WhatsApp Number
// ===============================
export const changeWhatsappNumber = async (
    userId: string,
    data: { newWhatsappNumber: string; password: string }
): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    // Verify password
    if (!user.password) throw new AppError('Cannot change WhatsApp number for social login accounts', 400);
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new AppError('Invalid password', 401);

    const currentWhatsapp = user.whatsappNumber || user.mobileNumber;
    if (data.newWhatsappNumber === currentWhatsapp) {
        throw new AppError('New WhatsApp number must be different from current', 400);
    }

    // If new number equals mobile number, store null (meaning "same as mobile")
    const storeNumber = data.newWhatsappNumber === user.mobileNumber ? null : data.newWhatsappNumber;
    const targetNumber = data.newWhatsappNumber;

    // Check if WhatsApp number is already used by another user
    if (storeNumber) {
        const existingUser = await prisma.user.findFirst({
            where: { whatsappNumber: storeNumber, id: { not: userId } },
        });
        if (existingUser) throw new AppError('This WhatsApp number is already in use by another account', 400);
    }

    // Reset verification and generate OTP
    const otp = generateOtp(getOtpLength());
    const hashedOtp = hashToken(otp);

    await prisma.user.update({
        where: { id: userId },
        data: {
            whatsappNumber: storeNumber,
            isWhatsappVerified: false,
            whatsappVerificationToken: hashedOtp,
            whatsappVerificationExpires: new Date(Date.now() + getOtpExpiryMinutes() * 60 * 1000),
            whatsappOtpResendCount: 1,
            whatsappOtpLastSentAt: new Date(),
        },
    });

    if (env.NODE_ENV !== 'production') {
        logger.info(`DEV: WhatsApp change OTP for ${targetNumber}: ${otp}`);
    }

    // Send OTP to new WhatsApp number
    try {
        const { otpWhatsapp } = await import('../templates/whatsapp');
        const { whatsappQueue } = await import('../jobs/whatsapp.queue');
        const tmpl = otpWhatsapp(otp);
        await whatsappQueue.add('send-whatsapp', {
            to: targetNumber,
            templateName: tmpl.templateName,
            components: tmpl.components,
        });
    } catch (error) {
        logger.error('Failed to send WhatsApp OTP for number change', error);
    }

    logger.info(`WhatsApp number change initiated for user ${userId} to ${targetNumber}`);
};

// ===============================
// Remove Separate WhatsApp Number
// ===============================
export const removeWhatsappNumber = async (userId: string): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    await prisma.user.update({
        where: { id: userId },
        data: {
            whatsappNumber: null,
            isWhatsappVerified: false,
            whatsappVerificationToken: null,
            whatsappVerificationExpires: null,
            whatsappOtpResendCount: 0,
            whatsappOtpLastSentAt: null,
        },
    });

    logger.info(`Separate WhatsApp number removed for user ${userId}, reverted to mobile number`);
};

// ===============================
// Change Email (2-step: initiate → confirm)
// ===============================
export const initiateChangeEmail = async (
    userId: string,
    data: { newEmail: string; password: string }
): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    // Verify password
    if (!user.password) throw new AppError('Cannot change email for social login accounts', 400);
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new AppError('Invalid password', 401);

    // Normalize new email
    const newEmail = data.newEmail.toLowerCase();

    // Check new email is different
    if (newEmail === user.email) throw new AppError('New email must be different from current email', 400);

    // Check if new email is already taken
    const existingUser = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existingUser) throw new AppError('Email already in use', 400);

    // Generate OTP and store as pending (do NOT change user.email yet)
    const verificationOtp = generateOtp(getOtpLength());
    const hashedOtp = hashToken(verificationOtp);

    await prisma.user.update({
        where: { id: userId },
        data: {
            pendingEmail: newEmail,
            emailVerificationToken: hashedOtp,
            emailVerificationExpires: new Date(Date.now() + getOtpExpiryMinutes() * 60 * 1000),
            emailOtpResendCount: 0,
            emailOtpLastSentAt: new Date(),
        },
    });

    // Send verification email to NEW address
    try {
        const emailContent = verifyEmailTemplate(verificationOtp);
        await emailQueue.add('send-email', {
            to: data.newEmail,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
        });
    } catch (error) {
        logger.error('Failed to send email verification', error);
    }

    logger.info(`Email change initiated for user ${userId} to ${data.newEmail}`);
};

export const confirmChangeEmail = async (
    userId: string,
    otp: string
): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (!user.pendingEmail) throw new AppError('No pending email change', 400);

    // Verify OTP
    const hashedOtp = hashToken(otp);
    if (user.emailVerificationToken !== hashedOtp) {
        throw new AppError('Invalid verification code', 400);
    }
    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
        throw new AppError('Verification code has expired', 400);
    }

    const oldEmail = user.email;

    // Atomic check-and-update to prevent race conditions
    await prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({ where: { email: user.pendingEmail! } });
        if (existingUser) throw new AppError('Email already in use', 400);

        await tx.user.update({
            where: { id: userId },
            data: {
                email: user.pendingEmail!,
                isEmailVerified: true,
                pendingEmail: null,
                emailVerificationToken: null,
                emailVerificationExpires: null,
                emailOtpResendCount: 0,
                emailOtpLastSentAt: null,
            },
        });
    });

    // Notify old email address using template
    try {
        const { emailChanged } = await import('../templates/email/security');
        const tmpl = emailChanged(user.firstName || 'there', user.pendingEmail!);
        await emailQueue.add('send-email', { to: oldEmail, subject: tmpl.subject, html: tmpl.html, text: tmpl.text });
    } catch (error) {
        logger.error('Failed to send email change notification', error);
    }

    logger.info(`Email changed for user ${userId} from ${oldEmail} to ${user.pendingEmail}`);
};

export const resendChangeEmailOtp = async (userId: string): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (!user.pendingEmail) throw new AppError('No pending email change', 400);

    enforceResendLimits(user.emailOtpLastSentAt, user.emailOtpResendCount);

    const verificationOtp = generateOtp(getOtpLength());
    const hashedOtp = hashToken(verificationOtp);

    await prisma.user.update({
        where: { id: userId },
        data: {
            emailVerificationToken: hashedOtp,
            emailVerificationExpires: new Date(Date.now() + getOtpExpiryMinutes() * 60 * 1000),
            emailOtpResendCount: user.emailOtpResendCount + 1,
            emailOtpLastSentAt: new Date(),
        },
    });

    try {
        const emailContent = verifyEmailTemplate(verificationOtp);
        await emailQueue.add('send-email', {
            to: user.pendingEmail,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
        });
    } catch (error) {
        logger.error('Failed to resend email verification', error);
    }

    logger.info(`Resent email change OTP for user ${userId}`);
};

// ===============================
// Change Mobile (2-step: initiate → confirm)
// ===============================
export const initiateChangeMobile = async (
    userId: string,
    data: { newMobileNumber: string; password: string }
): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    // Verify password
    if (!user.password) throw new AppError('Cannot change mobile for social login accounts', 400);
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new AppError('Invalid password', 401);

    // Check new number is different
    if (data.newMobileNumber === user.mobileNumber) {
        throw new AppError('New mobile number must be different from current number', 400);
    }

    // Check if number is already taken
    const existingUser = await prisma.user.findFirst({ where: { mobileNumber: data.newMobileNumber } });
    if (existingUser) throw new AppError('Mobile number already in use', 400);

    // Generate OTP and store as pending
    const otp = generateOtp(getOtpLength());
    const hashedOtp = hashToken(otp);

    await prisma.user.update({
        where: { id: userId },
        data: {
            pendingMobileNumber: data.newMobileNumber,
            mobileVerificationToken: hashedOtp,
            mobileVerificationExpires: new Date(Date.now() + getOtpExpiryMinutes() * 60 * 1000),
            mobileOtpResendCount: 0,
            mobileOtpLastSentAt: new Date(),
        },
    });

    // Send SMS to NEW number
    if (env.NODE_ENV !== 'production') {
        logger.info(`DEV: Mobile change OTP for ${data.newMobileNumber}: ${otp}`);
    }

    try {
        const { smsQueue } = await import('../jobs/sms.queue');
        await smsQueue.add('send-sms', { to: data.newMobileNumber, body: `Your verification OTP is: ${otp}. Valid for ${getOtpExpiryMinutes()} minutes.` });
    } catch (error) {
        logger.error('Failed to send SMS OTP for mobile change', error);
    }

    logger.info(`Mobile change initiated for user ${userId} to ${data.newMobileNumber}`);
};

export const confirmChangeMobile = async (
    userId: string,
    otp: string
): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (!user.pendingMobileNumber) throw new AppError('No pending mobile number change', 400);

    // Verify OTP
    const hashedOtp = hashToken(otp);
    if (user.mobileVerificationToken !== hashedOtp) {
        throw new AppError('Invalid verification code', 400);
    }
    if (!user.mobileVerificationExpires || user.mobileVerificationExpires < new Date()) {
        throw new AppError('Verification code has expired', 400);
    }

    // Atomic check-and-update to prevent race conditions
    // Only reset WhatsApp verification if user uses mobile number for WhatsApp (whatsappNumber is null)
    const hasSeparateWhatsapp = !!user.whatsappNumber;

    await prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findFirst({ where: { mobileNumber: user.pendingMobileNumber! } });
        if (existingUser) throw new AppError('Mobile number already in use', 400);

        await tx.user.update({
            where: { id: userId },
            data: {
                mobileNumber: user.pendingMobileNumber,
                isMobileVerified: true,
                // Only reset WhatsApp if user was using mobile for WhatsApp
                ...(hasSeparateWhatsapp ? {} : {
                    isWhatsappVerified: false,
                    whatsappVerificationToken: null,
                    whatsappVerificationExpires: null,
                    whatsappOtpResendCount: 0,
                    whatsappOtpLastSentAt: null,
                }),
                pendingMobileNumber: null,
                mobileVerificationToken: null,
                mobileVerificationExpires: null,
                mobileOtpResendCount: 0,
                mobileOtpLastSentAt: null,
            },
        });
    });

    logger.info(`Mobile changed for user ${userId} to ${user.pendingMobileNumber}`);
};

export const resendChangeMobileOtp = async (userId: string): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (!user.pendingMobileNumber) throw new AppError('No pending mobile number change', 400);

    enforceResendLimits(user.mobileOtpLastSentAt, user.mobileOtpResendCount);

    const otp = generateOtp(getOtpLength());
    const hashedOtp = hashToken(otp);

    await prisma.user.update({
        where: { id: userId },
        data: {
            mobileVerificationToken: hashedOtp,
            mobileVerificationExpires: new Date(Date.now() + getOtpExpiryMinutes() * 60 * 1000),
            mobileOtpResendCount: user.mobileOtpResendCount + 1,
            mobileOtpLastSentAt: new Date(),
        },
    });

    if (env.NODE_ENV !== 'production') {
        logger.info(`DEV: Resent mobile change OTP for ${user.pendingMobileNumber}: ${otp}`);
    }

    try {
        const { smsQueue } = await import('../jobs/sms.queue');
        await smsQueue.add('send-sms', { to: user.pendingMobileNumber, body: `Your verification OTP is: ${otp}. Valid for ${getOtpExpiryMinutes()} minutes.` });
    } catch (error) {
        logger.error('Failed to resend SMS OTP for mobile change', error);
    }

    logger.info(`Resent mobile change OTP for user ${userId}`);
};

// ===============================
// Account Deletion
// ===============================
export const requestAccountDeletion = async (userId: string): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    await prisma.user.update({
        where: { id: userId },
        data: { deletionRequestedAt: new Date() },
    });

    // Revoke all tokens and sessions
    await revokeAllUserTokens(userId);
    await sessionService.revokeAllSessions(userId);

    // Notify user (email + in-app)
    import('./notification.service').then(({ notificationService }) => {
        notificationService.notifyAccountDeletionRequested(userId).catch(() => {});
    });

    logger.info(`Account deletion requested for user ${userId}`);
};
