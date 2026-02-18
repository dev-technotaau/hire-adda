import { z } from 'zod';
import { Role } from '@prisma/client';

// ===============================
// Registration
// ===============================
export const registerSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(128, 'Password must be at most 128 characters'),
        firstName: z.string().min(1, 'First name is required').max(50),
        lastName: z.string().min(1, 'Last name is required').max(50),
        role: z.enum([Role.CANDIDATE, Role.EMPLOYER]).default(Role.CANDIDATE),
        mobileNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number').optional(),
        agreedToTerms: z.boolean().refine(val => val === true, 'You must agree to terms').optional(),
    }).refine(data => data.email || data.mobileNumber, {
        message: "Either email or mobile number is required",
        path: ["email"]
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];

// ===============================
// Login
// ===============================
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
        mfaCode: z.string().length(6, 'MFA code must be 6 digits').optional(),
    }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];

// ===============================
// Email Verification
// ===============================
export const verifyEmailSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Verification token is required'),
    }),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['body'];

// ===============================
// Forgot Password
// ===============================
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address').optional(),
        mobileNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number').optional(),
    }).refine(data => data.email || data.mobileNumber, {
        message: "Either email or mobile number is required",
        path: ["email"]
    }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];

// ===============================
// Reset Password
// ===============================
export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Reset token or OTP is required'),
        otp: z.string().length(6, 'OTP must be 6 digits').optional(),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(128, 'Password must be at most 128 characters'),
    }),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];

// ===============================
// Change Password
// ===============================
export const initiateChangePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
    }),
});

export type InitiateChangePasswordInput = z.infer<typeof initiateChangePasswordSchema>['body'];

export const confirmChangePasswordSchema = z.object({
    body: z.object({
        otp: z.string().length(6, 'OTP must be 6 digits'),
        newPassword: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(128, 'Password must be at most 128 characters'),
        confirmPassword: z.string().min(1, 'Confirm password is required'),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    }),
});

export type ConfirmChangePasswordInput = z.infer<typeof confirmChangePasswordSchema>['body'];



// ===============================
// Refresh Token
// ===============================
export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];

// ===============================
// MFA Setup
// ===============================
export const mfaVerifySchema = z.object({
    body: z.object({
        token: z.string().length(6, 'MFA code must be 6 digits'),
    }),
});

export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>['body'];

// ===============================
// MFA Disable
// ===============================
export const mfaDisableSchema = z.object({
    body: z.object({
        token: z.string().length(6, 'MFA code must be 6 digits'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export type MfaDisableInput = z.infer<typeof mfaDisableSchema>['body'];

// ===============================
// Mobile Verification
// ===============================
export const verifyMobileSchema = z.object({
    body: z.object({
        mobileNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number'),
        otp: z.string().length(6, 'OTP must be 6 digits'),
    }),
});

export type VerifyMobileInput = z.infer<typeof verifyMobileSchema>['body'];

export const resendMobileOtpSchema = z.object({
    body: z.object({
        mobileNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number'),
    }),
});

export type ResendMobileOtpInput = z.infer<typeof resendMobileOtpSchema>['body'];

// ===============================
// WhatsApp Verification
// ===============================
export const verifyWhatsappSchema = z.object({
    body: z.object({
        mobileNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number'),
    }),
});

export type VerifyWhatsappInput = z.infer<typeof verifyWhatsappSchema>['body'];

// ===============================
// WhatsApp OTP Confirmation
// ===============================
export const verifyWhatsappOtpSchema = z.object({
    body: z.object({
        mobileNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number'),
        otp: z.string().length(6, 'OTP must be 6 digits'),
    }),
});

export type VerifyWhatsappOtpInput = z.infer<typeof verifyWhatsappOtpSchema>['body'];

// ===============================
// Change Email
// ===============================
export const changeEmailSchema = z.object({
    body: z.object({
        newEmail: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>['body'];
