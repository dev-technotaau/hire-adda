import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Forgot Password',
    description: 'Reset your Talent Bridge account password. Enter your email to receive a password reset link.',
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
    return children;
}
