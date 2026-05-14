'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Sparkles, Lock, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/use-auth';
import { planService } from '@/services/plan.service';
import { orderService } from '@/services/order.service';
import { subscriptionService } from '@/services/subscription.service';
import { type ValidatedCouponDTO } from '@/services/coupon.service';
import { usePricingHref } from '@/lib/pricing-href';
import CouponInput from '@/components/billing/CouponInput';
import { openRazorpayCheckout, type RazorpayCheckoutFailure } from '@/lib/razorpay-checkout';
import { formatPaise, type Plan } from '@/types/billing';
import type { ApiError } from '@/types/api';

type CheckoutPhase =
  | 'loading'
  | 'ready'
  | 'creating'
  | 'opening'
  | 'verifying'
  | 'success'
  | 'error';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const code = decodeURIComponent(String(params?.code ?? ''));
  const pricingHref = usePricingHref();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [phase, setPhase] = useState<CheckoutPhase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<ValidatedCouponDTO | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const p = await planService.getByCode(code);
        if (!active) return;
        if (!p) {
          setError('Plan not found');
          setPhase('error');
          return;
        }
        if (p.requiresQuote) {
          router.replace('/billing/quote');
          return;
        }
        setPlan(p);
        setPhase('ready');
      } catch (err) {
        const apiErr = err as unknown as ApiError;
        setError(apiErr?.message ?? 'Failed to load plan');
        setPhase('error');
      }
    })();
    return () => {
      active = false;
    };
  }, [code, router]);

  async function startCheckout() {
    if (!plan || !user) return;
    setError(null);
    setPhase('creating');

    // Subscription plans (Vendor Connect, etc.) use Razorpay's hosted
    // subscription page — we create the subscription and redirect.
    if (plan.billingCycle !== 'ONE_TIME') {
      try {
        const subResponse = await subscriptionService.create({
          planCode: plan.code,
          notifyEmail: user.email,
          metadata: { source: 'web_checkout' },
        });
        if (subResponse.razorpay.shortUrl) {
          window.location.href = subResponse.razorpay.shortUrl;
          return;
        }
        // Fallback — redirect to subscription detail (mandate auth in-app)
        router.replace(`/billing/subscriptions/${subResponse.subscription.id}`);
        return;
      } catch (err) {
        const apiErr = err as unknown as ApiError;
        setError(apiErr?.message ?? 'Failed to create subscription');
        setPhase('error');
        return;
      }
    }

    let response;
    try {
      response = await orderService.create({
        planCode: plan.code,
        buyerEmail: user.email,
        buyerStateCode: undefined, // backend will fall back to default state
        couponCode: coupon?.code,
        notes: { source: 'web_checkout' },
      });
    } catch (err) {
      const apiErr = err as unknown as ApiError;
      setError(apiErr?.message ?? 'Failed to create order');
      setPhase('error');
      return;
    }

    setPhase('opening');
    let success;
    try {
      success = await openRazorpayCheckout({
        key: response.razorpay.keyId,
        amount: response.razorpay.amount,
        currency: response.razorpay.currency,
        name: 'Hire Adda',
        description: `${plan.name} — ${plan.shortDescription ?? ''}`.trim(),
        order_id: response.razorpay.orderId,
        prefill: {
          name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || undefined,
          email: user.email,
        },
        theme: { color: '#1E5CAF' },
        notes: { receipt: response.order.receiptNumber },
        retry: { enabled: true, max_count: 2 },
        remember_customer: true,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'CHECKOUT_DISMISSED') {
        setPhase('ready');
        return;
      }
      const fail = err as RazorpayCheckoutFailure;
      setError(fail?.error?.description ?? 'Payment failed. Please try again.');
      setPhase('error');
      return;
    }

    setPhase('verifying');
    try {
      const result = await orderService.verify(response.order.id, {
        razorpay_order_id: success.razorpay_order_id,
        razorpay_payment_id: success.razorpay_payment_id,
        razorpay_signature: success.razorpay_signature,
      });
      if (result.status === 'PAID') {
        setPhase('success');
        router.replace(`/billing/orders/${response.order.id}?from=checkout`);
        return;
      }
      setError(`Payment verification returned status ${result.status}`);
      setPhase('error');
    } catch (err) {
      const apiErr = err as unknown as ApiError;
      setError(apiErr?.message ?? 'Payment verification failed');
      setPhase('error');
    }
  }

  if (phase === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!plan) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl px-4 py-12">
          <Card padding="lg">
            <h1 className="text-xl font-semibold text-[var(--text)]">Plan unavailable</h1>
            <p className="mt-2 text-[var(--text-muted)]">{error ?? 'Plan not found.'}</p>
            <Link href={pricingHref} className="text-primary mt-6 inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to pricing
            </Link>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const total = plan.basePricePaise;
  const inProgress =
    phase === 'creating' || phase === 'opening' || phase === 'verifying' || phase === 'success';

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link
          href={pricingHref}
          className="text-primary mb-6 inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to pricing
        </Link>

        <h1 className="text-3xl font-bold text-[var(--text)]">Checkout</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Secure payment via Razorpay — UPI, cards, netbanking, wallets, EMI.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-[var(--text)]">{plan.name}</h2>
            {plan.shortDescription && (
              <p className="mt-1 text-sm text-[var(--text-muted)]">{plan.shortDescription}</p>
            )}
            <ul className="mt-4 space-y-2 text-sm">
              {plan.features
                .filter((f) => f.included)
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((f) => (
                  <li key={f.key} className="flex items-start gap-2">
                    <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 flex-none" />
                    <span className="text-[var(--text)]">{f.label}</span>
                  </li>
                ))}
            </ul>
          </Card>

          <Card padding="lg" className="self-start">
            <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
              <span>Subtotal</span>
              <span>{formatPaise(total, plan.currency)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>GST {plan.gstRatePercent}% (inclusive)</span>
              <span>included</span>
            </div>
            {coupon && (
              <div className="mt-1 flex items-center justify-between text-sm text-green-700">
                <span>Coupon {coupon.code}</span>
                <span>- {formatPaise(coupon.discountPaise, plan.currency)}</span>
              </div>
            )}
            <div className="mt-4">
              <CouponInput
                planCode={plan.code}
                orderAmountPaise={total}
                currency={plan.currency}
                applied={coupon}
                onApply={(c) => setCoupon(c)}
                onRemove={() => setCoupon(null)}
                disabled={inProgress}
              />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
              <span className="text-sm font-semibold text-[var(--text)]">Total payable</span>
              <span className="text-2xl font-bold text-[var(--text)]">
                {formatPaise(Math.max(0, total - (coupon?.discountPaise ?? 0)), plan.currency)}
              </span>
            </div>

            <Button
              variant="primary"
              className="mt-6 w-full"
              onClick={() => void startCheckout()}
              isLoading={inProgress}
              disabled={inProgress}
            >
              {phase === 'creating' && 'Creating order...'}
              {phase === 'opening' && 'Opening payment...'}
              {phase === 'verifying' && 'Verifying...'}
              {phase === 'success' && 'Success'}
              {(phase === 'ready' || phase === 'error') && (
                <span className="inline-flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Pay securely
                </span>
              )}
            </Button>

            {error && (
              <p className="mt-3 text-sm text-[var(--error)]" role="alert">
                {error}
              </p>
            )}

            <ul className="mt-6 space-y-2 text-xs text-[var(--text-muted)]">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" /> 256-bit TLS · PCI-DSS via
                Razorpay
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 flex-none" /> GST tax invoice generated
                automatically
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" /> 2-day refund window — see
                <Link href="/refund-policy" className="text-primary ml-1 underline">
                  policy
                </Link>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
