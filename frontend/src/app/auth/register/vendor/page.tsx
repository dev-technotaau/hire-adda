import AuthLayout from '@/components/layout/AuthLayout';
import RoleRegisterForm from '@/components/auth/RoleRegisterForm';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, graph, webPageSchema } from '@/lib/json-ld';

const registerJsonLd = graph(
  webPageSchema({
    url: '/auth/register/vendor',
    name: 'Vendor Registration — Hire Adda',
    description:
      'Create your recruitment vendor / agency account on Hire Adda to receive hiring leads.',
  }),
  breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Register', url: '/auth/register' },
    { name: 'Vendor', url: '/auth/register/vendor' },
  ]),
);

export const metadata = {
  title: 'Vendor Registration — Hire Adda',
  description:
    'Create your recruitment vendor / agency account on Hire Adda to receive hiring leads.',
};

export default function VendorRegisterPage() {
  return (
    <AuthLayout>
      <JsonLd id="jsonld-register-vendor" data={registerJsonLd} />
      <RoleRegisterForm role="VENDOR" />
    </AuthLayout>
  );
}
