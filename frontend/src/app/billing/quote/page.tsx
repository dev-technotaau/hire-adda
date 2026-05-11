'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Building2, ShieldCheck, Sparkles } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Spinner from '@/components/ui/Spinner';
import { quoteService, type MyQuoteRequest } from '@/services/quote.service';
import { useAuth } from '@/hooks/use-auth';
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

export default function QuoteRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<MyQuoteRequest[] | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: user?.email ?? '' },
  });

  useEffect(() => {
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
  }, []);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const result = await quoteService.submit(values);
      router.replace(`/billing/quote/${result.id}`);
    } catch (err) {
      setError((err as unknown as ApiError)?.message ?? 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/pricing" className="text-primary mb-6 inline-flex items-center gap-2 text-sm">
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

        {!loadingExisting && existing && existing.length > 0 && (
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
                  {EMPLOYEE_RANGES.map((r) => (
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

            <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
              <p className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <ShieldCheck className="h-3 w-3" /> Your details are private — only seen by Hire
                Adda&apos;s sales team.
              </p>
              <Button type="submit" variant="primary" size="lg" isLoading={submitting}>
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
    </DashboardLayout>
  );
}
