import AuthLayout from '@/components/layout/AuthLayout';
import RoleLoginForm from '@/components/auth/RoleLoginForm';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, graph, webPageSchema } from '@/lib/json-ld';

const loginJsonLd = graph(
  webPageSchema({
    url: '/auth/login/candidate',
    name: 'Candidate Sign In — Hire Adda',
    description: 'Sign in as a candidate to find jobs and manage your profile on Hire Adda.',
  }),
  breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Sign In', url: '/auth/login' },
    { name: 'Candidate', url: '/auth/login/candidate' },
  ]),
);

export const metadata = {
  title: 'Candidate Sign In — Hire Adda',
  description: 'Sign in as a candidate to find jobs and manage your profile on Hire Adda.',
};

export default function CandidateLoginPage() {
  return (
    <AuthLayout>
      <JsonLd id="jsonld-login-candidate" data={loginJsonLd} />
      <RoleLoginForm role="candidate" />
    </AuthLayout>
  );
}
