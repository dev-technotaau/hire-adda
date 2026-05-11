import AuthLayout from '@/components/layout/AuthLayout';
import RoleRegisterForm from '@/components/auth/RoleRegisterForm';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, graph, webPageSchema } from '@/lib/json-ld';

const registerJsonLd = graph(
  webPageSchema({
    url: '/auth/register/candidate',
    name: 'Candidate Registration — Hire Adda',
    description: 'Create your candidate account on Hire Adda to apply for jobs. Free to join.',
  }),
  breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Register', url: '/auth/register' },
    { name: 'Candidate', url: '/auth/register/candidate' },
  ]),
);

export const metadata = {
  title: 'Candidate Registration — Hire Adda',
  description: 'Create your candidate account on Hire Adda to apply for jobs. Free to join.',
};

export default function CandidateRegisterPage() {
  return (
    <AuthLayout>
      <JsonLd id="jsonld-register-candidate" data={registerJsonLd} />
      <RoleRegisterForm role="CANDIDATE" />
    </AuthLayout>
  );
}
