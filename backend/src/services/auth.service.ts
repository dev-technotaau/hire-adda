import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { env } from '../config/env';
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

// ===============================
// Registration
// ===============================
export const register = async (
    data: RegisterInput,
): Promise<{
    user: { id: string; email: string; role: Role };
    breachWarning?: string;
}> => {
    const { email, password, firstName, lastName, role } = data;

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

    // Generate 6-digit OTP for email verification
    const verificationOtp = generateOtp(6);
    const hashedVerificationOtp = hashToken(verificationOtp);
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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
export const generateTokens = async (user: any, userAgent: string | undefined, ipAddress: string | undefined) => {
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
    const { email, password, mfaCode } = data;

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
    const { email, mobileNumber } = data;

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

    // Generate numeric OTP for both email and mobile for consistency in this flow
    // Or keep link for email and OTP for mobile. The requirement asked for OTP.
    // Let's generate a 6-digit OTP.
    const otp = generateOtp(6);
    const hashedOtp = hashToken(otp);
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

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
    const otp = generateOtp(6);
    const hashedOtp = hashToken(otp);

    // Store OTP in a new or existing field. 
    // Reusing `passwordResetToken` might interefere with actual reset flow if concurrently used, 
    // but for MVP it is acceptable or we should add `changePasswordToken`.
    // Given the constraints and existing fields, let's reuse `passwordResetToken` 
    // BUT typically we should differentiate. 
    // Let's use `mobileVerificationToken` or similar if we strictly follow "mobile" auth, 
    // but this is a security setting.
    // Ideally: Add `changeEmailToken` / `changePasswordToken`.
    // For now, let's reuse `passwordResetToken` as it serves the same "proof of ownership" purpose temporarily.

    await prisma.user.update({
        where: { id: userId },
        data: {
            passwordResetToken: hashedOtp,
            passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
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
            isEmailVerified: true,
            mfaEnabled: true,
            createdAt: true,
            lastLoginAt: true,
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
export const resendEmailVerification = async (email: string): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { email } });
    // Silent return to prevent email enumeration
    if (!user || user.isEmailVerified) return;

    const verificationOtp = generateOtp(6);
    const hashedVerificationOtp = hashToken(verificationOtp);
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationToken: hashedVerificationOtp, emailVerificationExpires: verificationExpires }
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

    // Generate new OTP
    const otp = generateOtp(6); // 6 digits, numeric
    const hashedOtp = hashToken(otp);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            mobileVerificationToken: hashedOtp,
            mobileVerificationExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
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
// Verify WhatsApp (Send OTP)
// ===============================
export const verifyWhatsapp = async (userId: string, mobileNumber: string): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (!user.mobileNumber && !mobileNumber) throw new AppError('No mobile number provided', 400);
    if (user.isWhatsappVerified) throw new AppError('WhatsApp already verified', 400);

    const targetNumber = mobileNumber || user.mobileNumber!;
    const otp = generateOtp(6);
    const hashedOtp = hashToken(otp);

    await prisma.user.update({
        where: { id: userId },
        data: {
            whatsappVerificationToken: hashedOtp,
            whatsappVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
            mobileNumber: targetNumber,
        }
    });

    // Send OTP via WhatsApp
    try {
        const { whatsappQueue } = await import('../jobs/whatsapp.queue');
        await whatsappQueue.add('send-whatsapp', {
            to: targetNumber,
            templateName: 'otp_whatsapp',
            components: [{ type: 'body', parameters: [{ type: 'text', text: otp }] }],
        });
    } catch (error) {
        logger.error('Failed to send WhatsApp OTP', error);
    }

    logger.info(`WhatsApp OTP sent to ${targetNumber}`);
};

// ===============================
// Confirm WhatsApp OTP
// ===============================
export const confirmWhatsappOtp = async (userId: string, mobileNumber: string, otp: string): Promise<void> => {
    const hashedOtp = hashToken(otp);
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            mobileNumber,
            whatsappVerificationToken: hashedOtp,
            whatsappVerificationExpires: { gt: new Date() },
        }
    });
    if (!user) throw new AppError('Invalid or expired OTP', 400);

    await prisma.user.update({
        where: { id: userId },
        data: { isWhatsappVerified: true, whatsappVerificationToken: null, whatsappVerificationExpires: null }
    });
    logger.info(`WhatsApp verified for ${mobileNumber}`);
};

// ===============================
// Change Email
// ===============================
export const changeEmail = async (
    userId: string,
    data: { newEmail: string; password: string }
): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    // Verify password
    if (!user.password) throw new AppError('Cannot change email for social login accounts', 400);
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new AppError('Invalid password', 401);

    // Check if new email is already taken
    const existingUser = await prisma.user.findUnique({ where: { email: data.newEmail } });
    if (existingUser) throw new AppError('Email already in use', 400);

    // Update email and mark as unverified
    const verificationOtp = generateOtp(6);
    const hashedOtp = hashToken(verificationOtp);

    await prisma.user.update({
        where: { id: userId },
        data: {
            email: data.newEmail,
            isEmailVerified: false,
            emailVerificationToken: hashedOtp,
            emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
    });

    // Send verification email to new address
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

    logger.info(`Email changed for user ${userId} to ${data.newEmail}`);
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

    // Send confirmation email
    try {
        await emailQueue.add('send-email', {
            to: user.email,
            subject: 'Account Deletion Requested - Talent Bridge',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Account Deletion Requested</h2>
                    <p>Hi ${user.firstName || 'there'},</p>
                    <p>We received a request to delete your Talent Bridge account.</p>
                    <p>Your account and all associated data will be permanently deleted after <strong>30 days</strong>.</p>
                    <p>To cancel this request, simply log in to your account before the deletion date.</p>
                </div>
            `,
        });
    } catch (error) {
        logger.error('Failed to send account deletion email', error);
    }

    logger.info(`Account deletion requested for user ${userId}`);
};
