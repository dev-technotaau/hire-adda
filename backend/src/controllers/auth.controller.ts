import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import * as mfaService from '../services/mfa.service';
import { AppError } from '../middleware/error';
import { env } from '../config/env';

// Helper to get client info
const getClientInfo = (req: Request) => ({
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip || req.socket.remoteAddress,
});

// ===============================
// Register
// ===============================
export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await authService.register(req.body);

        res.status(201).json({
            status: 'success',
            message: 'Registration successful. Please check your email for the verification code.',
            data: {
                user: result.user,
            },
            ...(result.breachWarning && { warning: result.breachWarning }),
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Login
// ===============================
export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { userAgent, ipAddress } = getClientInfo(req);

        const result = await authService.login(req.body, userAgent, ipAddress);

        if (result.requireMfa) {
            res.status(200).json({
                status: 'success',
                message: 'MFA required',
                data: { requireMfa: true },
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Logout
// ===============================
export const logout = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await authService.logout(refreshToken);
        }

        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Logout Everywhere
// ===============================
export const logoutEverywhere = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        await authService.logoutEverywhere(req.user.id);

        res.status(200).json({
            status: 'success',
            message: 'Logged out from all devices',
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Refresh Token
// ===============================
export const refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { refreshToken } = req.body;
        const { userAgent, ipAddress } = getClientInfo(req);

        if (!refreshToken) {
            throw new AppError('Refresh token is required', 400);
        }

        const result = await authService.refreshTokens(refreshToken, userAgent, ipAddress);

        res.status(200).json({
            status: 'success',
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Verify Email
// ===============================
export const verifyEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { token } = req.body;

        if (!token) {
            throw new AppError('Verification token is required', 400);
        }

        const result = await authService.verifyEmail(
            token,
            req.headers['user-agent'],
            req.ip
        );

        res.status(200).json({
            status: 'success',
            message: 'Email verified successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Forgot Password
// ===============================
export const forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await authService.forgotPassword(req.body);

        res.status(200).json({
            status: 'success',
            message: 'If an account exists, we have sent a password reset OTP.',
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Reset Password
// ===============================
export const resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await authService.resetPassword(req.body);

        res.status(200).json({
            status: 'success',
            message: 'Password reset successful. Please log in with your new password.',
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Change Password
// ===============================
// ===============================
// Change Password - Initiate
// ===============================
export const initiateChangePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        await authService.initiateChangePassword(req.user.id, req.body);

        res.status(200).json({
            status: 'success',
            message: 'OTP sent to your registered email/mobile.',
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Change Password - Confirm
// ===============================
export const confirmChangePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        await authService.confirmChangePassword(req.user.id, req.body);

        res.status(200).json({
            status: 'success',
            message: 'Password changed successfully',
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Get Current User
// ===============================
export const getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        const user = await authService.getCurrentUser(req.user.id);

        res.status(200).json({
            status: 'success',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// MFA: Setup
// ===============================
export const mfaSetup = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        const result = await mfaService.generateMfaSecret(req.user.id, req.user.email);

        res.status(200).json({
            status: 'success',
            message: 'MFA setup initiated. Scan the QR code with your authenticator app.',
            data: {
                qrCode: result.qrCodeUrl,
                // Secret is optional - some users prefer manual entry
                secret: result.secret,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// MFA: Enable
// ===============================
export const mfaEnable = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        const { token } = req.body;

        if (!token) {
            throw new AppError('MFA code is required', 400);
        }

        const result = await mfaService.enableMfa(req.user.id, token);

        if (!result.success) {
            throw new AppError(result.error || 'Failed to enable MFA', 400);
        }

        res.status(200).json({
            status: 'success',
            message: 'MFA enabled successfully. Save your backup codes securely.',
            data: {
                backupCodes: result.backupCodes,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// MFA: Disable
// ===============================
export const mfaDisable = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        const { token, password } = req.body;

        if (!token || !password) {
            throw new AppError('MFA code and password are required', 400);
        }

        const result = await mfaService.disableMfa(req.user.id, password, token);

        if (!result.success) {
            throw new AppError(result.error || 'Failed to disable MFA', 400);
        }

        res.status(200).json({
            status: 'success',
            message: 'MFA disabled successfully',
        });
    } catch (error) {
        next(error);
    }
};
// ===============================
// Change Email
// ===============================
export const changeEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        await authService.changeEmail(req.user.id, req.body);

        res.status(200).json({
            status: 'success',
            message: 'Email changed successfully. Please verify your new email.',
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Social Auth Callbacks
// ===============================
export const socialCallback = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = req.user as any;

        if (!user) {
            // Should be handled by passport, but safe fallback
            res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
            return;
        }

        // Generate tokens
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown';

        const { accessToken, refreshToken } = await authService.generateTokens(user, userAgent, ipAddress);

        const isProduction = env.NODE_ENV === 'production';

        // Set tokens in httpOnly cookies (not URL params) to prevent leakage via Referer/logs
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/',
        });

        res.redirect(`${env.FRONTEND_URL}/auth/callback`);
    } catch (error) {
        next(error);
    }
};

// ===============================
// Verify Mobile (OTP)
// ===============================
export const verifyMobile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { mobileNumber, otp } = req.body;
        await authService.verifyMobile(mobileNumber, otp);

        res.status(200).json({
            status: 'success',
            message: 'Mobile number verified successfully',
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Resend Mobile OTP
// ===============================
export const resendMobileOtp = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { mobileNumber } = req.body;
        await authService.resendMobileOtp(mobileNumber);

        res.status(200).json({
            status: 'success',
            message: 'OTP resent successfully',
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Resend Email Verification
// ===============================
export const resendEmailVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) throw new AppError('Email is required', 400);
        await authService.resendEmailVerification(email);
        // Always return success to prevent email enumeration
        res.status(200).json({ status: 'success', message: 'If an account exists, a verification email has been sent.' });
    } catch (error) { next(error); }
};

// ===============================
// Verify WhatsApp (Send OTP)
// ===============================
export const verifyWhatsapp = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { mobileNumber } = req.body;
        await authService.verifyWhatsapp(req.user.id, mobileNumber);

        res.status(200).json({
            status: 'success',
            message: 'WhatsApp verification code sent',
        });
    } catch (error) {
        next(error);
    }
};

// ===============================
// Confirm WhatsApp OTP
// ===============================
export const confirmWhatsappOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { mobileNumber, otp } = req.body;
        await authService.confirmWhatsappOtp(req.user.id, mobileNumber, otp);
        res.status(200).json({ status: 'success', message: 'WhatsApp verified successfully' });
    } catch (error) { next(error); }
};

// ===============================
// Account Deletion
// ===============================
export const requestAccountDeletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        await authService.requestAccountDeletion(req.user.id);
        res.status(200).json({ success: true, message: 'Account deletion requested. Your account will be deleted after 30 days. You can cancel by logging in before then.' });
    } catch (error) { next(error); }
};

// ===============================
// Consent Management
// ===============================
export const getConsents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { ConsentService } = await import('../services/consent.service');
        const consents = await ConsentService.getUserConsents(req.user.id);
        res.status(200).json({ success: true, data: consents });
    } catch (error) { next(error); }
};

export const giveConsent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { type, version } = req.body;
        const { ConsentService } = await import('../services/consent.service');
        const ip = req.ip || req.socket.remoteAddress;
        const consent = await ConsentService.giveConsent(req.user.id, type, version, ip);
        res.status(201).json({ success: true, data: consent });
    } catch (error) { next(error); }
};

export const revokeConsent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { type } = req.params;
        const { ConsentService } = await import('../services/consent.service');
        await ConsentService.revokeConsent(req.user.id, type as any);
        res.status(200).json({ success: true, message: 'Consent revoked' });
    } catch (error) { next(error); }
};

// ===============================
// Data Export (GDPR)
// ===============================
export const exportMyData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { requestDataExport } = await import('../services/data-export.service');
        await requestDataExport(req.user.id, req.user.email);
        res.status(202).json({ success: true, message: 'Data export request received. You will receive an email with your data shortly.' });
    } catch (error) { next(error); }
};
