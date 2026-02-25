'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from '@/components/layout/AuthLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OtpInput from '@/components/auth/OtpInput';
import PasswordStrength from '@/components/auth/PasswordStrength';
import Turnstile from '@/components/auth/Turnstile';
import { showToast } from '@/components/ui/Toast';
import { authService } from '@/services/auth.service';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/validators/auth';
import { ROUTES } from '@/constants/routes';
import { useOtpConfig } from '@/hooks/use-otp-config';
import type { ApiError } from '@/types/api';

type Step = 'email' | 'otp' | 'success';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const otpConfig = useOtpConfig();
    const [step, setStep] = useState<Step>('email');
    const [isLoading, setIsLoading] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');

    // OTP step state
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [isResending, setIsResending] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: searchParams.get('email') || '' },
    });

    // Resend countdown
    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => {
            setResendTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    const onSubmitEmail = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        try {
            await authService.forgotPassword({ email: data.email }, turnstileToken || undefined);
            setSubmittedEmail(data.email);
            setResendTimer(otpConfig.RESEND_COOLDOWN);
            setStep('otp');
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to send reset code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            await authService.forgotPassword({ email: submittedEmail });
            showToast.success('New verification code sent!');
            setResendTimer(otpConfig.RESEND_COOLDOWN);
            setOtp('');
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to resend code');
        } finally {
            setIsResending(false);
        }
    };

    const handleResetPassword = async () => {
        if (otp.length !== otpConfig.LENGTH) {
            showToast.error('Please enter the 6-digit verification code');
            return;
        }
        if (!newPassword) {
            showToast.error('Please enter a new password');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            await authService.resetPassword({
                token: otp,
                password: newPassword,
                confirmPassword,
            });
            setStep('success');
            showToast.success('Password reset successfully!');
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to reset password. The code may have expired.');
        } finally {
            setIsLoading(false);
        }
    };

    const slideVariants = {
        enter: { x: 20, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -20, opacity: 0 },
    };

    return (
        <AuthLayout>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
                <AnimatePresence mode="wait">
                    {/* Step 1: Enter Email */}
                    {step === 'email' && (
                        <motion.div
                            key="email"
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.2 }}
                        >
                            <Link
                                href={ROUTES.AUTH.LOGIN}
                                className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
                            >
                                <ArrowLeft className="h-4 w-4" /> Back to Login
                            </Link>

                            <div className="mb-6 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light">
                                    <Mail className="h-7 w-7 text-primary" />
                                </div>
                                <h1 className="text-2xl font-bold text-[var(--text)]">Forgot Password?</h1>
                                <p className="mt-2 text-sm text-[var(--text-muted)]">
                                    No worries, we&apos;ll send you a reset code.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmitEmail)} className="space-y-4">
                                <Input
                                    label="Email Address"
                                    type="email"
                                    placeholder="Enter your registered email"
                                    leftIcon={<Mail className="h-4 w-4" />}
                                    error={errors.email?.message}
                                    required
                                    {...register('email')}
                                />

                                <Turnstile
                                    onSuccess={setTurnstileToken}
                                    onExpire={() => setTurnstileToken('')}
                                />

                                <Button type="submit" fullWidth isLoading={isLoading}>
                                    Send Reset Code
                                </Button>
                            </form>
                        </motion.div>
                    )}

                    {/* Step 2: Enter OTP + New Password */}
                    {step === 'otp' && (
                        <motion.div
                            key="otp"
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.2 }}
                        >
                            <button
                                type="button"
                                onClick={() => { setStep('email'); setOtp(''); }}
                                className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
                            >
                                <ArrowLeft className="h-4 w-4" /> Back
                            </button>

                            <div className="mb-6 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light">
                                    <Lock className="h-7 w-7 text-primary" />
                                </div>
                                <h1 className="text-2xl font-bold text-[var(--text)]">Reset Password</h1>
                                <p className="mt-2 text-sm text-[var(--text-muted)]">
                                    Enter the 6-digit code sent to{' '}
                                    <span className="font-medium text-[var(--text)]">{submittedEmail}</span>
                                </p>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }} className="space-y-5">
                                <OtpInput
                                    value={otp}
                                    onChange={setOtp}
                                    length={otpConfig.LENGTH}
                                />

                                {/* Timer + Resend */}
                                <div className="text-center">
                                    <p className="text-sm text-[var(--text-muted)]">
                                        Didn&apos;t receive the code?{' '}
                                        {resendTimer > 0 ? (
                                            <span className="text-[var(--text-secondary)]">
                                                Resend in {resendTimer}s
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleResend}
                                                disabled={isResending}
                                                className="font-medium text-primary hover:underline disabled:opacity-50"
                                            >
                                                {isResending ? 'Sending...' : 'Resend Code'}
                                            </button>
                                        )}
                                    </p>
                                </div>

                                {/* New password fields */}
                                <div className="space-y-4 pt-2">
                                    <Input
                                        label="New Password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        leftIcon={<Lock className="h-4 w-4" />}
                                        rightIcon={
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        }
                                        required
                                    />
                                    <PasswordStrength password={newPassword} />

                                    <Input
                                        label="Confirm Password"
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        leftIcon={<Lock className="h-4 w-4" />}
                                        rightIcon={
                                            <button type="button" onClick={() => setShowConfirm(!showConfirm)}>
                                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        }
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    fullWidth
                                    isLoading={isLoading}
                                    disabled={otp.length !== otpConfig.LENGTH || !newPassword || !confirmPassword}
                                >
                                    Reset Password
                                </Button>
                            </form>
                        </motion.div>
                    )}

                    {/* Step 3: Success */}
                    {step === 'success' && (
                        <motion.div
                            key="success"
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.2 }}
                        >
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
                                    <CheckCircle className="h-8 w-8 text-success" />
                                </div>
                                <h2 className="text-xl font-bold text-[var(--text)]">Password Reset!</h2>
                                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                    Your password has been successfully reset. You can now log in with your new password.
                                </p>
                                <Button
                                    fullWidth
                                    className="mt-6"
                                    onClick={() => router.push(ROUTES.AUTH.LOGIN)}
                                >
                                    Go to Login
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AuthLayout>
    );
}
