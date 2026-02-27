'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, Shield, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/common/Logo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OtpInput from '@/components/auth/OtpInput';
import Divider from '@/components/ui/Divider';
import Turnstile from '@/components/auth/Turnstile';
import { showToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth.store';
import { webauthnService } from '@/services/webauthn.service';
import { startAuthentication } from '@simplewebauthn/browser';
import { loginSchema, type LoginFormData } from '@/validators/auth';
import { ROUTES, ROLE_DASHBOARDS } from '@/constants/routes';
import type { Role } from '@/types/auth';
import type { ApiError } from '@/types/api';

const ADMIN_ROLES: Role[] = ['ADMIN', 'SUPER_ADMIN'];

type Step = 'email' | 'password' | 'mfa';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { login } = useAuth();
  const storeLogin = useAuthStore((s) => s.login);
  const storeLogout = useAuthStore((s) => s.logout);

  const [step, setStep] = useState<Step>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
  } = useForm<LoginFormData>({
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

      // Handle MFA requirement — backend returns requireMfa flag without user data
      if (res.data.requireMfa) {
        setMfaRequired(true);
        setStep('mfa');
        return;
      }

      const role = res.data.user.role as Role;

      if (!ADMIN_ROLES.includes(role)) {
        storeLogout();
        showToast.error('Access denied. This portal is for administrators only.');
        return;
      }

      showToast.success('Welcome back!');
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

      const role = authData.user.role as Role;
      if (!ADMIN_ROLES.includes(role)) {
        showToast.error('Access denied. This portal is for administrators only.');
        return;
      }

      storeLogin(authData.user, authData.accessToken, authData.refreshToken);
      showToast.success('Welcome back!');
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
    <div className="flex min-h-screen flex-col bg-[var(--bg-secondary)]">
      {/* Minimal header */}
      <header className="flex h-16 items-center px-4 sm:px-6">
        <Logo />
      </header>

      {/* Centered content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
            {/* Admin Portal Header */}
            <div className="mb-6 text-center">
              <div className="bg-primary-light mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                <Shield className="text-primary h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--text)]">Admin Portal</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Sign in to access the administration panel
              </p>
            </div>

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
                      placeholder="Enter your admin email"
                      leftIcon={<Mail className="h-4 w-4" />}
                      error={errors.email?.message}
                      autoFocus
                      {...register('email')}
                    />
                    <Button type="submit" fullWidth className="mt-4">
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
                      <span className="text-sm text-[var(--text-secondary)]">
                        {getValues('email')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep('email')}
                        className="text-primary hover:text-primary-hover ml-auto text-xs"
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
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[var(--text-muted)] hover:text-[var(--text)]"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      }
                      error={errors.password?.message}
                      autoFocus
                      {...register('password')}
                    />

                    <p className="mt-3 text-xs text-[var(--text-muted)]">
                      Forgot your password? Contact a Super Admin to reset it.
                    </p>

                    <Turnstile
                      onSuccess={setTurnstileToken}
                      onExpire={() => setTurnstileToken('')}
                    />

                    <Button type="submit" fullWidth className="mt-4" isLoading={isLoading}>
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
                      <h3 className="text-lg font-semibold text-[var(--text)]">
                        Two-Factor Authentication
                      </h3>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Enter the 6-digit code from your authenticator app
                      </p>
                    </div>

                    <OtpInput value={mfaCode} onChange={setMfaCode} onComplete={handleMfaSubmit} />

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
                      onClick={() => {
                        setStep('password');
                        setMfaRequired(false);
                        setMfaCode('');
                      }}
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
          </div>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="py-4 text-center text-sm text-[var(--text-muted)]">
        &copy; {new Date().getFullYear()} TalentBridge. All rights reserved.
      </footer>
    </div>
  );
}
