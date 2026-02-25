import { z } from 'zod';
import { emailSchema, passwordSchema, createPasswordSchema, createOtpSchema, nameSchema, phoneSchema, otpSchema } from '@/utils/validation';
import type { PasswordRules } from '@/constants/config';

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
    mfaCode: z.string().optional(),
    rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['CANDIDATE', 'EMPLOYER']),
    mobileNumber: phoneSchema.optional().or(z.literal('')),
    companyName: z.string().optional(),
    acceptTerms: z.boolean().refine((val) => val === true, {
        message: 'You must accept the terms and conditions',
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
}).refine((data) => {
    if (data.role === 'EMPLOYER') {
        return !!data.companyName && data.companyName.length >= 2;
    }
    return true;
}, {
    message: 'Company name is required for employer registration',
    path: ['companyName'],
});

/** Dynamic register schema using backend password rules */
export function createRegisterSchema(rules: PasswordRules) {
    return z.object({
        firstName: nameSchema,
        lastName: nameSchema,
        email: emailSchema,
        password: createPasswordSchema(rules),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
        role: z.enum(['CANDIDATE', 'EMPLOYER']),
        mobileNumber: phoneSchema.optional().or(z.literal('')),
        companyName: z.string().optional(),
        acceptTerms: z.boolean().refine((val) => val === true, {
            message: 'You must accept the terms and conditions',
        }),
    }).refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    }).refine((data) => {
        if (data.role === 'EMPLOYER') {
            return !!data.companyName && data.companyName.length >= 2;
        }
        return true;
    }, {
        message: 'Company name is required for employer registration',
        path: ['companyName'],
    });
}

export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

/** Dynamic reset password schema using backend password rules */
export function createResetPasswordSchema(rules: PasswordRules) {
    return z.object({
        token: z.string().min(1, 'Reset token is required'),
        password: createPasswordSchema(rules),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
    }).refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });
}

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
});

/** Dynamic change password schema using backend password rules */
export function createChangePasswordSchema(rules: PasswordRules) {
    return z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: createPasswordSchema(rules),
        confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
    }).refine((data) => data.newPassword === data.confirmNewPassword, {
        message: 'Passwords do not match',
        path: ['confirmNewPassword'],
    });
}

export const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Verification token is required'),
});

export const verifyOtpSchema = z.object({
    otp: otpSchema,
});

/** Dynamic OTP verification schema using backend config */
export function createVerifyOtpSchema(otpLength: number) {
    return z.object({
        otp: createOtpSchema(otpLength),
    });
}

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
