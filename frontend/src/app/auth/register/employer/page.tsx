import AuthLayout from '@/components/layout/AuthLayout';
import RoleRegisterForm from '@/components/auth/RoleRegisterForm';
import EmployerHelplineBanner from '@/components/support/EmployerHelplineBanner';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, graph, webPageSchema } from '@/lib/json-ld';

const registerJsonLd = graph(
  webPageSchema({
    url: '/auth/register/employer',
    name: 'Employer Registration — Hire Adda',
    description: 'Create your employer account on Hire Adda to post jobs and find candidates.',
  }),
  breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Register', url: '/auth/register' },
    { name: 'Employer', url: '/auth/register/employer' },
  ]),
);

export const metadata = {
  title: 'Employer Registration — Hire Adda',
  description: 'Create your employer account on Hire Adda to post jobs and find candidates.',
};

export default function EmployerRegisterPage() {
  return (
    <AuthLayout>
      <JsonLd id="jsonld-register-employer" data={registerJsonLd} />
      <EmployerHelplineBanner compact variant="rounded" className="mb-4" />
      <RoleRegisterForm role="EMPLOYER" />
    </AuthLayout>
  );
}
