'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from '@/components/layout/AuthLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OtpInput from '@/components/auth/OtpInput';
import Checkbox from '@/components/ui/Checkbox';
import Divider from '@/components/ui/Divider';
import Turnstile from '@/components/auth/Turnstile';
import { showToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth.store';
import { webauthnService } from '@/services/webauthn.service';
import { startAuthentication } from '@simplewebauthn/browser';
import { loginSchema, type LoginFormData } from '@/validators/auth';
import { ROUTES, ROLE_DASHBOARDS } from '@/constants/routes';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/auth';
import type { ApiError } from '@/types/api';

type Step = 'email' | 'password' | 'mfa';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect');
    const { login } = useAuth();
    const storeLogin = useAuthStore((s) => s.login);

    const [step, setStep] = useState<Step>('email');
    const [activeTab, setActiveTab] = useState<'candidate' | 'employer'>('candidate');
    const [showPassword, setShowPassword] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState('');

    const { register, handleSubmit, formState: { errors }, getValues, trigger } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '', rememberMe: false },
    });

    const handleEmailNext = async () => {
        const valid = await trigger('email');
        if (valid) setStep('password');
    };

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const loginData = {
                ...data,
                ...(mfaRequired && { mfaCode }),
            };
            const res = await login(loginData, turnstileToken || undefined);
            showToast.success('Welcome back!');
            const role = res.data.user.role as Role;
            router.push(redirect || ROLE_DASHBOARDS[role]);
        } catch (err) {
            const error = err as ApiError;
            if (error.message?.includes('MFA') || error.message?.includes('mfa')) {
                setMfaRequired(true);
                setStep('mfa');
            } else {
                showToast.error(error.message || 'Login failed');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleMfaSubmit = () => {
        if (mfaCode.length === 6) {
            handleSubmit(onSubmit)();
        }
    };

    const handlePasskeyLogin = async () => {
        setPasskeyLoading(true);
        try {
            const optionsRes = await webauthnService.getAuthenticationOptions();
            const options = optionsRes.data;
            if (!options) throw new Error('Failed to get authentication options');

            const credential = await startAuthentication({ optionsJSON: options });
            const verifyRes = await webauthnService.verifyAuthentication(credential);
            const authData = verifyRes.data;
            if (!authData) throw new Error('Authentication failed');

            storeLogin(authData.user, authData.accessToken, authData.refreshToken);
            showToast.success('Welcome back!');
            const role = authData.user.role as Role;
            router.push(redirect || ROLE_DASHBOARDS[role]);
        } catch (err) {
            const error = err as Error;
            if (error.name !== 'NotAllowedError') {
                showToast.error(error.message || 'Passkey authentication failed');
            }
        } finally {
            setPasskeyLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 'email') handleEmailNext();
        else if (step === 'password') handleSubmit(onSubmit)();
        else if (step === 'mfa') handleMfaSubmit();
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
                    <h1 className="text-2xl font-bold text-[var(--text)]">Welcome Back</h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Sign in to your account to continue
                    </p>
                </div>

                {/* Role Tabs */}
                <div className="mb-6 flex rounded-lg bg-[var(--bg-tertiary)] p-1">
                    {(['candidate', 'employer'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                'flex-1 rounded-md py-2 text-sm font-medium transition-all',
                                activeTab === tab
                                    ? 'bg-white text-[var(--text)] shadow-sm'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                            )}
                        >
                            {tab === 'candidate' ? 'Candidate' : 'Employer'}
                        </button>
                    ))}
                </div>

                {/* Social Login — temporarily disabled, uncomment when OAuth is configured */}
                {/* <SocialButtons mode="login" role={activeTab === 'employer' ? 'EMPLOYER' : 'CANDIDATE'} /> */}
                {/* <Divider label="OR" className="my-6" /> */}

                {/* Step-wise Form */}
                <form onSubmit={handleFormSubmit}>
                    <AnimatePresence mode="wait">
                        {step === 'email' && (
                            <motion.div
                                key="email"
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.2 }}
                            >
                                <Input
                                    label="Email Address"
                                    type="email"
                                    placeholder="Enter your email"
                                    leftIcon={<Mail className="h-4 w-4" />}
                                    error={errors.email?.message}
                                    autoFocus
                                    {...register('email')}
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    className="mt-4"
                                >
                                    Continue
                                </Button>
                            </motion.div>
                        )}

                        {step === 'password' && (
                            <motion.div
                                key="password"
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.2 }}
                            >
                                <div className="mb-4 flex items-center gap-2 rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
                                    <Mail className="h-4 w-4 text-[var(--text-muted)]" />
                                    <span className="text-sm text-[var(--text-secondary)]">{getValues('email')}</span>
                                    <button
                                        type="button"
                                        onClick={() => setStep('email')}
                                        className="ml-auto text-xs text-primary hover:text-primary-hover"
                                    >
                                        Change
                                    </button>
                                </div>

                                <Input
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    leftIcon={<Lock className="h-4 w-4" />}
                                    rightIcon={
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    }
                                    error={errors.password?.message}
                                    autoFocus
                                    {...register('password')}
                                />

                                <div className="mt-3 flex items-center justify-between">
                                    <Checkbox label="Remember me" {...register('rememberMe')} />
                                    <Link
                                        href={`${ROUTES.AUTH.FORGOT_PASSWORD}?email=${encodeURIComponent(getValues('email') || '')}`}
                                        className="text-sm text-primary hover:text-primary-hover whitespace-nowrap"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                <Turnstile
                                    onSuccess={setTurnstileToken}
                                    onExpire={() => setTurnstileToken('')}
                                />

                                <Button
                                    type="submit"
                                    fullWidth
                                    className="mt-4"
                                    isLoading={isLoading}
                                >
                                    Sign In
                                </Button>
                            </motion.div>
                        )}

                        {step === 'mfa' && (
                            <motion.div
                                key="mfa"
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.2 }}
                            >
                                <div className="mb-6 text-center">
                                    <h3 className="text-lg font-semibold text-[var(--text)]">Two-Factor Authentication</h3>
                                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                                        Enter the 6-digit code from your authenticator app
                                    </p>
                                </div>

                                <OtpInput
                                    value={mfaCode}
                                    onChange={setMfaCode}
                                    onComplete={handleMfaSubmit}
                                />

                                <Button
                                    type="submit"
                                    fullWidth
                                    className="mt-6"
                                    isLoading={isLoading}
                                    disabled={mfaCode.length !== 6}
                                >
                                    Verify & Sign In
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => { setStep('password'); setMfaRequired(false); setMfaCode(''); }}
                                    className="mt-3 w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
                                >
                                    Back to login
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                {/* Passkey Login */}
                <div className="mt-4">
                    <Divider label="OR" className="my-4" />
                    <Button
                        type="button"
                        variant="outline"
                        fullWidth
                        onClick={handlePasskeyLogin}
                        isLoading={passkeyLoading}
                    >
                        <Fingerprint className="mr-2 h-4 w-4" />
                        Sign in with Passkey
                    </Button>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
                    Don&apos;t have an account?{' '}
                    <Link href={ROUTES.AUTH.REGISTER} className="font-medium text-primary hover:text-primary-hover">
                        Sign Up
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
