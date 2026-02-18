'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, User, Building2, Phone, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from '@/components/layout/AuthLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OtpInput from '@/components/auth/OtpInput';
import PasswordStrength from '@/components/auth/PasswordStrength';
import Turnstile from '@/components/auth/Turnstile';
import LegalModal from '@/components/common/LegalModal';
import { showToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { registerSchema, type RegisterFormData } from '@/validators/auth';
import { ROUTES, ROLE_DASHBOARDS } from '@/constants/routes';
import { OTP_CONFIG } from '@/constants/config';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/auth';
import type { ApiError } from '@/types/api';

type Step = 'info' | 'password' | 'verify' | 'success';

export default function RegisterPage() {
    const router = useRouter();
    const { register: registerUser } = useAuth();
    const storeLogin = useAuthStore((s) => s.login);

    const [step, setStep] = useState<Step>('info');
    const [activeTab, setActiveTab] = useState<'CANDIDATE' | 'EMPLOYER'>('CANDIDATE');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState('');
    const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [isResending, setIsResending] = useState(false);

    const { register, formState: { errors }, watch, trigger, setValue } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'CANDIDATE',
            mobileNumber: '',
            companyName: '',
            acceptTerms: false,
        },
    });

    const password = watch('password');

    // Resend cooldown timer
    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => {
            setResendTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleOtpVerify = useCallback(async () => {
        if (otp.length !== OTP_CONFIG.LENGTH) return;
        setIsVerifying(true);
        try {
            const res = await authService.verifyEmail({ token: otp });
            const { user, accessToken, refreshToken } = res.data;
            showToast.success('Email verified! Taking you to your dashboard...');
            setStep('success');

            // Store tokens directly — no separate login call needed
            storeLogin(user, accessToken, refreshToken);
            const role = user.role as Role;
            setTimeout(() => {
                router.push(ROLE_DASHBOARDS[role]);
            }, 1500);
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Invalid or expired verification code.');
        } finally {
            setIsVerifying(false);
        }
    }, [otp, storeLogin, router]);

    const handleResendOtp = async () => {
        const email = watch('email');
        if (!email) return;
        setIsResending(true);
        try {
            await authService.resendEmailVerification(email);
            showToast.success('Verification code resent!');
            setResendTimer(OTP_CONFIG.RESEND_COOLDOWN);
            setOtp('');
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to resend verification email');
        } finally {
            setIsResending(false);
        }
    };

    const handleTabChange = (tab: 'CANDIDATE' | 'EMPLOYER') => {
        setActiveTab(tab);
        setValue('role', tab);
    };

    const handleInfoNext = async () => {
        const fields: Array<keyof RegisterFormData> = ['firstName', 'lastName', 'email'];
        if (activeTab === 'EMPLOYER') fields.push('companyName');
        const valid = await trigger(fields);
        if (valid) setStep('password');
    };

    const handlePasswordNext = async () => {
        const valid = await trigger(['password', 'confirmPassword', 'acceptTerms']);
        if (valid) {
            onSubmit(watch());
        }
    };

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            await registerUser({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                role: data.role,
                mobileNumber: data.mobileNumber || undefined,
                companyName: data.companyName || undefined,
            }, turnstileToken || undefined);
            showToast.success('Account created! Please check your email for the verification code.');
            setStep('verify');
            setResendTimer(OTP_CONFIG.RESEND_COOLDOWN);
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 'info') handleInfoNext();
        else if (step === 'password') handlePasswordNext();
        else if (step === 'verify') handleOtpVerify();
    };

    const slideVariants = {
        enter: { x: 20, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -20, opacity: 0 },
    };

    return (
        <AuthLayout>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-[var(--text)]">Create Account</h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Join TalentBridge to find your perfect match
                    </p>
                </div>

                {/* Step indicator */}
                {step !== 'success' && (
                    <div className="mb-6 flex items-center justify-center gap-2">
                        {(['info', 'password', 'verify'] as const).map((s, i) => {
                            const stepOrder = ['info', 'password', 'verify', 'success'];
                            const currentIdx = stepOrder.indexOf(step);
                            return (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={cn(
                                        'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors',
                                        step === s ? 'bg-primary text-white' :
                                            currentIdx > i ? 'bg-success text-white' :
                                                'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                                    )}>
                                        {i + 1}
                                    </div>
                                    {i < 2 && <div className={cn('h-0.5 w-8', currentIdx > i ? 'bg-success' : 'bg-[var(--border)]')} />}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Role Tabs */}
                {step === 'info' && (
                    <div className="mb-6 flex rounded-lg bg-[var(--bg-tertiary)] p-1">
                        {(['CANDIDATE', 'EMPLOYER'] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => handleTabChange(tab)}
                                className={cn(
                                    'flex-1 rounded-md py-2 text-sm font-medium transition-all',
                                    activeTab === tab
                                        ? 'bg-white text-[var(--text)] shadow-sm'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                )}
                            >
                                {tab === 'CANDIDATE' ? 'Candidate' : 'Employer'}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleFormSubmit}>
                    <AnimatePresence mode="wait">
                        {step === 'info' && (
                            <motion.div key="info" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-4">
                                {/* Social — temporarily disabled, uncomment when OAuth is configured */}
                                {/* <SocialButtons mode="register" role={activeTab} /> */}
                                {/* <Divider label="OR" /> */}

                                {activeTab === 'EMPLOYER' && (
                                    <Input
                                        label="Company Name"
                                        placeholder="Your company name"
                                        leftIcon={<Building2 className="h-4 w-4" />}
                                        error={errors.companyName?.message}
                                        required
                                        {...register('companyName')}
                                    />
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="First Name"
                                        placeholder="First name"
                                        leftIcon={<User className="h-4 w-4" />}
                                        error={errors.firstName?.message}
                                        required
                                        {...register('firstName')}
                                    />
                                    <Input
                                        label="Last Name"
                                        placeholder="Last name"
                                        error={errors.lastName?.message}
                                        required
                                        {...register('lastName')}
                                    />
                                </div>

                                <Input
                                    label="Email Address"
                                    type="email"
                                    placeholder="Enter your email"
                                    leftIcon={<Mail className="h-4 w-4" />}
                                    error={errors.email?.message}
                                    required
                                    {...register('email')}
                                />

                                <Input
                                    label="Phone Number"
                                    type="tel"
                                    placeholder="+91 9876543210"
                                    leftIcon={<Phone className="h-4 w-4" />}
                                    error={errors.mobileNumber?.message}
                                    helperText="Optional, for OTP verification"
                                    {...register('mobileNumber')}
                                />

                                <Button type="submit" fullWidth>
                                    Continue
                                </Button>
                            </motion.div>
                        )}

                        {step === 'password' && (
                            <motion.div key="password" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-4">
                                <button
                                    type="button"
                                    onClick={() => setStep('info')}
                                    className="mb-2 flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Back
                                </button>

                                <Input
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Create a password"
                                    leftIcon={<Lock className="h-4 w-4" />}
                                    rightIcon={
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    }
                                    error={errors.password?.message}
                                    required
                                    {...register('password')}
                                />
                                <PasswordStrength password={password || ''} />

                                <Input
                                    label="Confirm Password"
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Confirm your password"
                                    leftIcon={<Lock className="h-4 w-4" />}
                                    rightIcon={
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}>
                                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    }
                                    error={errors.confirmPassword?.message}
                                    required
                                    {...register('confirmPassword')}
                                />

                                <label className="flex items-start gap-2">
                                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-[var(--border)] text-primary" {...register('acceptTerms')} />
                                    <span className="text-sm text-[var(--text-secondary)]">
                                        I agree to the{' '}
                                        <button type="button" onClick={() => setLegalModal('terms')} className="text-primary hover:underline">Terms of Service</button>
                                        {' '}and{' '}
                                        <button type="button" onClick={() => setLegalModal('privacy')} className="text-primary hover:underline">Privacy Policy</button>
                                    </span>
                                </label>
                                {errors.acceptTerms && <p className="text-sm text-error">{errors.acceptTerms.message}</p>}

                                <Turnstile
                                    onSuccess={setTurnstileToken}
                                    onExpire={() => setTurnstileToken('')}
                                />

                                <Button type="submit" fullWidth isLoading={isLoading}>
                                    Create Account
                                </Button>
                            </motion.div>
                        )}

                        {step === 'verify' && (
                            <motion.div key="verify" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
                                <div className="text-center">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light">
                                        <Mail className="h-7 w-7 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--text)]">Verify Your Email</h3>
                                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                        Enter the 6-digit code we sent to{' '}
                                        <span className="font-medium text-[var(--text)]">{watch('email')}</span>
                                    </p>
                                </div>

                                <div className="mt-6 space-y-6">
                                    <OtpInput
                                        value={otp}
                                        onChange={setOtp}
                                        onComplete={handleOtpVerify}
                                        length={OTP_CONFIG.LENGTH}
                                    />

                                    <Button
                                        type="submit"
                                        fullWidth
                                        isLoading={isVerifying}
                                        disabled={otp.length !== OTP_CONFIG.LENGTH}
                                    >
                                        Verify & Continue
                                    </Button>

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
                                                    onClick={handleResendOtp}
                                                    disabled={isResending}
                                                    className="font-medium text-primary hover:underline disabled:opacity-50"
                                                >
                                                    {isResending ? 'Sending...' : 'Resend Code'}
                                                </button>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div key="success" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
                                <div className="text-center py-4">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
                                        <CheckCircle className="h-8 w-8 text-success" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[var(--text)]">Registration Successful!</h3>
                                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                        Taking you to your dashboard...
                                    </p>
                                    <div className="mt-4 flex justify-center">
                                        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                                            <motion.div
                                                className="h-full rounded-full bg-primary"
                                                initial={{ width: '0%' }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 1.5, ease: 'easeInOut' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                {step !== 'verify' && step !== 'success' && (
                    <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
                        Already have an account?{' '}
                        <Link href={ROUTES.AUTH.LOGIN} className="font-medium text-primary hover:text-primary-hover">
                            Sign In
                        </Link>
                    </p>
                )}
            </div>

            <LegalModal
                isOpen={legalModal !== null}
                onClose={() => setLegalModal(null)}
                type={legalModal ?? 'terms'}
            />
        </AuthLayout>
    );
}
