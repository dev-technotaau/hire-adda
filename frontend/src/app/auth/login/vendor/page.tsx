import AuthLayout from '@/components/layout/AuthLayout';
import RoleLoginForm from '@/components/auth/RoleLoginForm';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, graph, webPageSchema } from '@/lib/json-ld';

const loginJsonLd = graph(
  webPageSchema({
    url: '/auth/login/vendor',
    name: 'Vendor Sign In — Hire Adda',
    description: 'Sign in as a recruitment vendor / agency to receive hiring leads on Hire Adda.',
  }),
  breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Sign In', url: '/auth/login' },
    { name: 'Vendor', url: '/auth/login/vendor' },
  ]),
);

export const metadata = {
  title: 'Vendor Sign In — Hire Adda',
  description: 'Sign in as a recruitment vendor / agency to receive hiring leads on Hire Adda.',
};

export default function VendorLoginPage() {
  return (
    <AuthLayout>
      <JsonLd id="jsonld-login-vendor" data={loginJsonLd} />
      <RoleLoginForm role="vendor" />
    </AuthLayout>
  );
}
