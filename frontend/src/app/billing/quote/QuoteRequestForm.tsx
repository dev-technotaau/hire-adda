'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Building2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PublicLayout from '@/components/layout/PublicLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Spinner from '@/components/ui/Spinner';
import Turnstile from '@/components/auth/Turnstile';
import { quoteService, type MyQuoteRequest } from '@/services/quote.service';
import { useAuth } from '@/hooks/use-auth';
import { usePricingHref } from '@/lib/pricing-href';
import type { ApiError } from '@/types/api';

const schema = z.object({
  companyName: z.string().min(2, 'Required').max(160),
  contactPerson: z.string().min(2, 'Required').max(160),
  designation: z.string().max(120).optional(),
  email: z.string().email().max(255),
  phone: z.string().min(6).max(20),
  employeeRange: z.string().max(60).optional(),
  hiringNeed: z.string().max(2000).optional(),
  requiredCvCount: z.coerce.number().int().min(1).max(100000).optional(),
  validityDays: z.coerce.number().int().min(1).max(365).optional(),
  expectedSeats: z.coerce.number().int().min(1).max(1000).optional(),
  currentToolStack: z.string().max(500).optional(),
  budgetRange: z.string().max(120).optional(),
  additionalNotes: z.string().max(2000).optional(),
});

type FormValues = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

const EMPLOYEE_RANGES = ['1-50', '51-200', '201-500', '501-1000', '1000+'];

export default function QuoteRequestForm() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<MyQuoteRequest[] | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  // When a guest submits, we can't redirect to the auth-gated detail
  // page — show an inline thank-you confirmation instead.
  const [guestThankYou, setGuestThankYou] = useState(false);
  // Cloudflare Turnstile challenge token — refreshed every time the
  // widget completes / expires. Required server-side for all callers
  // (guest + authed) on POST /billing/quotes.
  const [turnstileToken, setTurnstileToken] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: user?.email ?? '' },
  });

  // Existing-quotes list is per-user — only fetch when authenticated.
  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      setExisting([]);
      return;
    }
    setLoadingExisting(true);
    let active = true;
    quoteService
      .list()
      .then((res) => {
        if (active) setExisting(res);
      })
      .catch(() => {
        if (active) setExisting([]);
      })
      .finally(() => {
        if (active) setLoadingExisting(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthLoading, isAuthenticated]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const result = await quoteService.submit(values, turnstileToken || undefined);
      if (isAuthenticated) {
        router.replace(`/billing/quote/${result.id}`);
      } else {
        // Guest path — the detail page is auth-gated, so confirm inline.
        setGuestThankYou(true);
      }
    } catch (err) {
      setError((err as unknown as ApiError)?.message ?? 'Submission failed');
      // Tokens are single-use — clear so the widget re-challenges before
      // the user retries. Without this they'd send the consumed token
      // again and the backend would reject with "Invalid CAPTCHA".
      setTurnstileToken('');
    } finally {
      setSubmitting(false);
    }
  }

  // Wait for auth state to resolve before deciding which layout to render —
  // DashboardLayout's mount-time auth check would otherwise redirect us to
  // /auth/login mid-hydration for a guest user.
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const content = guestThankYou ? (
    <ThankYouScreen />
  ) : (
    <QuoteFormBody
      register={register}
      errors={errors}
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      submitting={submitting}
      error={error}
      existing={existing}
      loadingExisting={loadingExisting}
      isAuthenticated={isAuthenticated}
      employeeRanges={EMPLOYEE_RANGES}
      turnstileToken={turnstileToken}
      onTurnstileSuccess={setTurnstileToken}
      onTurnstileExpire={() => setTurnstileToken('')}
    />
  );

  // Logged-in users keep the dashboard chrome; guests see the marketing site shell.
  const Layout = isAuthenticated ? DashboardLayout : PublicLayout;
  return <Layout>{content}</Layout>;
}

// ── Form body ───────────────────────────────────────────────────────────
// Pulled out so the page component can swap between this and the
// thank-you screen without nesting the entire form inside conditionals.
interface QuoteFormBodyProps {
  register: ReturnType<typeof useForm<FormInput, unknown, FormValues>>['register'];
  errors: ReturnType<typeof useForm<FormInput, unknown, FormValues>>['formState']['errors'];
  handleSubmit: ReturnType<typeof useForm<FormInput, unknown, FormValues>>['handleSubmit'];
  onSubmit: (values: FormValues) => Promise<void>;
  submitting: boolean;
  error: string | null;
  existing: MyQuoteRequest[] | null;
  loadingExisting: boolean;
  isAuthenticated: boolean;
  employeeRanges: string[];
  /** Current Turnstile challenge token — empty until the widget completes. */
  turnstileToken: string;
  onTurnstileSuccess: (token: string) => void;
  onTurnstileExpire: () => void;
}

function QuoteFormBody({
  register,
  errors,
  handleSubmit,
  onSubmit,
  submitting,
  error,
  existing,
  loadingExisting,
  isAuthenticated,
  employeeRanges,
  turnstileToken,
  onTurnstileSuccess,
  onTurnstileExpire,
}: QuoteFormBodyProps) {
  // Only enforce a Turnstile token client-side when a site key is
  // configured — keeps local dev usable without setting up Cloudflare.
  const turnstileConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const canSubmit = !turnstileConfigured || Boolean(turnstileToken);
  const pricingHref = usePricingHref();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href={pricingHref} className="text-primary mb-6 inline-flex items-center gap-2 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to pricing
      </Link>

      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">CV Enterprise — Custom plan</h1>
          <p className="text-sm text-[var(--text-muted)]">
            For hiring teams needing 1000+ CV access, multi-user seats, bulk download or dedicated
            support. We&apos;ll get back within 24 hours with a tailored offer.
          </p>
        </div>
      </div>

      {/* Existing-quotes panel — only shown to authenticated users since the
          backend's /me lookup requires a session. */}
      {isAuthenticated && !loadingExisting && existing && existing.length > 0 && (
        <Card padding="md" className="mt-6 border-blue-300 bg-blue-50">
          <p className="text-sm font-semibold text-blue-900">
            You have {existing.length} existing quote request{existing.length === 1 ? '' : 's'}
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {existing.slice(0, 3).map((q) => (
              <li key={q.id}>
                <Link
                  href={`/billing/quote/${q.id}`}
                  className="text-blue-700 underline hover:text-blue-900"
                >
                  {q.companyName} — {q.status.replace(/_/g, ' ').toLowerCase()}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card padding="lg" className="mt-6">
        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Company name"
              placeholder="Acme Corp"
              {...register('companyName')}
              error={errors.companyName?.message}
            />
            <Input
              label="Your name"
              placeholder="Jane Doe"
              {...register('contactPerson')}
              error={errors.contactPerson?.message}
            />
            <Input
              label="Designation"
              placeholder="Head of Talent"
              {...register('designation')}
              error={errors.designation?.message}
            />
            <Input
              label="Work email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="+91 98765 43210"
              {...register('phone')}
              error={errors.phone?.message}
            />
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Company size</label>
              <select
                {...register('employeeRange')}
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--primary)]"
              >
                <option value="">Select…</option>
                {employeeRanges.map((r) => (
                  <option key={r} value={r}>
                    {r} employees
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="CV access needed"
              type="number"
              placeholder="2000"
              {...register('requiredCvCount')}
              error={errors.requiredCvCount?.message}
            />
            <Input
              label="Validity (days)"
              type="number"
              placeholder="90"
              {...register('validityDays')}
              error={errors.validityDays?.message}
            />
            <Input
              label="Recruiter seats"
              type="number"
              placeholder="5"
              {...register('expectedSeats')}
              error={errors.expectedSeats?.message}
            />
            <Input
              label="Budget range"
              placeholder="₹50k - ₹2 lakh"
              {...register('budgetRange')}
              error={errors.budgetRange?.message}
            />
          </div>

          <Textarea
            label="What roles are you hiring for?"
            rows={3}
            placeholder="3 senior engineers + 2 product managers in next 60 days"
            {...register('hiringNeed')}
            error={errors.hiringNeed?.message}
          />

          <Textarea
            label="Current ATS / tools (optional)"
            rows={2}
            placeholder="Greenhouse, Lever, in-house portal..."
            {...register('currentToolStack')}
            error={errors.currentToolStack?.message}
          />

          <Textarea
            label="Anything else we should know? (optional)"
            rows={3}
            {...register('additionalNotes')}
            error={errors.additionalNotes?.message}
          />

          {error && (
            <p className="text-sm text-[var(--error)]" role="alert">
              {error}
            </p>
          )}

          {/* Turnstile CAPTCHA — same pattern as /auth/login & /auth/register.
              Required for both guest and authenticated submissions; the
              token is sent to the backend in the `cf-turnstile-response`
              header. Component returns null when the site key isn't set
              (local dev), so it disappears cleanly in that environment. */}
          <Turnstile onSuccess={onTurnstileSuccess} onExpire={onTurnstileExpire} />

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
            <p className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <ShieldCheck className="h-3 w-3" /> Your details are private — only seen by Hire
              Adda&apos;s sales team.
            </p>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={submitting}
              disabled={!canSubmit}
              tooltip={
                !canSubmit ? 'Complete the security check above before submitting' : undefined
              }
            >
              <Sparkles className="mr-2 h-4 w-4" /> Request quote
            </Button>
          </div>
        </form>
      </Card>

      {loadingExisting && (
        <div className="mt-6 flex justify-center">
          <Spinner />
        </div>
      )}
    </div>
  );
}

// ── Guest thank-you screen ──────────────────────────────────────────────
// Logged-in users get redirected to /billing/quote/:id where they can
// track status / accept offers. Guests get this inline confirmation,
// since the detail page is auth-gated.
function ThankYouScreen() {
  const pricingHref = usePricingHref();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="bg-success/10 text-success mx-auto flex h-16 w-16 items-center justify-center rounded-full">
        <CheckCircle2 className="h-9 w-9" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-[var(--text)]">
        Quote request received
      </h1>
      <p className="mt-3 text-base text-[var(--text-secondary)]">
        Our enterprise sales team will reach out within 24 hours on the email and phone you
        provided. No further action needed right now.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href={pricingHref}>
          <Button variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to pricing
          </Button>
        </Link>
        <Link href="/auth/register/employer">
          <Button variant="primary" size="lg">
            Create employer account
          </Button>
        </Link>
      </div>
      <p className="mt-6 text-xs text-[var(--text-muted)]">
        Creating an account lets you track the quote, accept the offer, and start hiring within
        minutes once approved.
      </p>
    </div>
  );
}
