'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Inbox,
  ExternalLink,
  Building2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { vendorService } from '@/services/vendor.service';
import { useEntitlements } from '@/hooks/use-entitlements';
import { ROUTES } from '@/constants/routes';
import WhatsappSupportCard from '@/components/support/WhatsappSupportCard';

export default function VendorDashboardPage() {
  const { hasFeature } = useEntitlements();
  const hasLeadsAccess = hasFeature('feature.vendor_leads');

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['vendor', 'me'],
    queryFn: () => vendorService.getMyProfile(),
  });

  const { data: leads } = useQuery({
    queryKey: ['vendor', 'leads', 'recent'],
    queryFn: () => vendorService.listMyLeads({ limit: 5 }),
    enabled: Boolean(profile && hasLeadsAccess),
  });

  if (profileLoading) {
    return (
      <DashboardLayout requiredRole={['VENDOR']}>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole={['VENDOR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Vendor Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Manage your business profile and respond to incoming hiring leads.
          </p>
        </div>

        {/* WhatsApp support — Vendor Connect plan includes WhatsApp Support;
            auto-hides for vendors who haven't subscribed yet. */}
        <WhatsappSupportCard />

        {!profile && (
          <Card padding="lg" className="border-amber-200 bg-amber-50/50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-amber-500 text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-amber-900">Set up your business profile</h2>
                  <p className="mt-1 text-sm text-amber-800">
                    Add your business name, services, and locations so employers can discover you.
                  </p>
                </div>
              </div>
              <Link href={ROUTES.VENDOR.PROFILE}>
                <Button variant="primary">
                  Get started <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {profile && !hasLeadsAccess && (
          <Card padding="lg" className="border-blue-200 bg-blue-50/50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Inbox className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-blue-900">Subscribe to receive hiring leads</h2>
                  <p className="mt-1 text-sm text-blue-800">
                    Hire Adda Vendor Connect (₹199/month) sends you hiring requirements from
                    employers and lists your business in our public directory.
                  </p>
                </div>
              </div>
              <Link href="/billing/checkout/VENDOR_CONNECT">
                <Button variant="primary">Subscribe</Button>
              </Link>
            </div>
          </Card>
        )}

        {profile && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-[var(--text-muted)]">Profile status</h3>
              <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
                {profile.isPublic ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-emerald-600" /> Live in directory
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-600" /> Hidden
                  </>
                )}
              </p>
              <Link
                href={ROUTES.VENDORS_PUBLIC.DETAIL(profile.slug)}
                className="text-primary mt-2 inline-flex items-center gap-1 text-sm hover:underline"
                target="_blank"
              >
                View public page <ExternalLink className="h-3 w-3" />
              </Link>
            </Card>

            <Card padding="lg">
              <h3 className="text-sm font-semibold text-[var(--text-muted)]">Verification</h3>
              <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                {profile.isVerified ? (
                  <Badge variant="success">Verified vendor</Badge>
                ) : (
                  <Badge variant="neutral">Pending</Badge>
                )}
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Verified vendors appear at the top of search results.
              </p>
            </Card>

            <Card padding="lg">
              <h3 className="text-sm font-semibold text-[var(--text-muted)]">Recent leads</h3>
              <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                {leads?.pagination.total ?? 0}
              </p>
              <Link
                href={ROUTES.VENDOR.LEADS}
                className="text-primary mt-2 inline-flex items-center gap-1 text-sm hover:underline"
              >
                Open inbox <ArrowRight className="h-3 w-3" />
              </Link>
            </Card>
          </div>
        )}

        {profile && hasLeadsAccess && (
          <Card padding="lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text)]">Latest leads</h2>
              <Link href={ROUTES.VENDOR.LEADS} className="text-primary text-sm hover:underline">
                See all
              </Link>
            </div>
            {leads?.items.length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">
                No leads yet — make sure your profile is public so employers can find you.
              </p>
            )}
            <ul className="space-y-2">
              {leads?.items.map((lead) => (
                <li
                  key={lead.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-[var(--text)]">
                      {lead.requirementText}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {new Date(lead.createdAt).toLocaleString('en-IN')} ·{' '}
                      {lead.jobPost?.title ?? 'Direct request'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      lead.status === 'PENDING'
                        ? 'warning'
                        : lead.status === 'ACCEPTED'
                          ? 'success'
                          : lead.status === 'DECLINED'
                            ? 'error'
                            : 'neutral'
                    }
                  >
                    {lead.status.toLowerCase()}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

// Vendor pages don't need the standard "needsEmployerGuard" wrapping because
// VENDOR is a separate role — DashboardLayout's requiredRole already gates.
export const dynamic = 'force-dynamic';
