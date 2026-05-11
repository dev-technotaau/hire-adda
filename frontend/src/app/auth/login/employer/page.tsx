import AuthLayout from '@/components/layout/AuthLayout';
import RoleLoginForm from '@/components/auth/RoleLoginForm';
import EmployerHelplineBanner from '@/components/support/EmployerHelplineBanner';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, graph, webPageSchema } from '@/lib/json-ld';

const loginJsonLd = graph(
  webPageSchema({
    url: '/auth/login/employer',
    name: 'Employer Sign In — Hire Adda',
    description:
      'Sign in as an employer to post jobs, search CVs and manage your hiring on Hire Adda.',
  }),
  breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Sign In', url: '/auth/login' },
    { name: 'Employer', url: '/auth/login/employer' },
  ]),
);

export const metadata = {
  title: 'Employer Sign In — Hire Adda',
  description:
    'Sign in as an employer to post jobs, search CVs and manage your hiring on Hire Adda.',
};

export default function EmployerLoginPage() {
  return (
    <AuthLayout>
      <JsonLd id="jsonld-login-employer" data={loginJsonLd} />
      <EmployerHelplineBanner compact variant="rounded" className="mb-4" />
      <RoleLoginForm role="employer" />
    </AuthLayout>
  );
}
