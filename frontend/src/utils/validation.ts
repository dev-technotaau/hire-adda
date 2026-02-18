import { z } from 'zod';

export const emailSchema = z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address');

export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const phoneSchema = z
    .string()
    .regex(/^[+]?[0-9]{10,15}$/, 'Please enter a valid phone number');

export const urlSchema = z
    .string()
    .url('Please enter a valid URL')
    .or(z.literal(''));

export const nameSchema = z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const otpSchema = z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^[0-9]+$/, 'OTP must contain only digits');

export function getPasswordStrength(password: string): {
    score: number;
    label: string;
    color: string;
} {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'error' };
    if (score <= 3) return { score, label: 'Fair', color: 'warning' };
    if (score <= 4) return { score, label: 'Good', color: 'info' };
    return { score, label: 'Strong', color: 'success' };
}
