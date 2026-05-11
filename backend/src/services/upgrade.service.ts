/**
 * Plan upgrade / downgrade engine.
 *
 *   pro-rata: unused_value = old.totalPaise * (remaining_seconds / total_seconds)
 *   upgrade:  charge = max(new.basePricePaise - unused_value, 0)
 *   downgrade: scheduled at end of current period (no immediate refund)
 *   carry-forward: unused resource counts (CV unlocks, search hits) added
 *                  to the new entitlement, capped per-resource by SystemConfig
 *                  or PlanResource.carryForwardCap.
 *
 * Phase 5 implementation works off the most-recent PAID Order on the same
 * plan (since Entitlement is finalised in Phase 8). Once Phase 8 wires
 * EntitlementResource consumption tracking, the carry-forward branch
 * switches from "full plan quantity" to "allocated - consumed".
 */
import { prisma } from '../config/prisma';
import {
  OrderStatus,
  PlanStatus,
  PlanBillingCycle,
  type Order,
  type Plan,
  type PlanResource,
  type Prisma,
} from '@prisma/client';
import { getRazorpayClient, withRazorpaySpan } from '../config/razorpay';
import { computePricing } from './pricing.service';
import { nextReceiptNumber } from './receipt-sequence.service';
import { env } from '../config/env';
import { AppError, NotFoundError, BadRequestError } from '../exceptions';
import logger from '../config/logger';

// =====================================================================
// Types
// =====================================================================

export interface UpgradePreviewArgs {
  userId: string;
  /** New plan to upgrade/downgrade to. */
  toPlanCode: string;
  /** Buyer state code override (defaults to current order's snapshot). */
  buyerStateCode?: string;
  /** Whether buyer is Indian (defaults to current order's snapshot). */
  buyerIsIndian?: boolean;
}

export interface CarryForwardLine {
  unit: string;
  /** Unused units on current plan (Phase 8 will subtract `consumed`). */
  unused: number;
  /** Units in the new plan (per period). */
  newPeriodAllocation: number;
  /** Cap (config-driven). */
  cap: number | null;
  /** Final addition to new entitlement = min(unused, cap). */
  carried: number;
  /** Effective allocation after carry. */
  effectiveAllocation: number;
}

export interface UpgradePreview {
  fromPlan: Pick<
    Plan,
    'id' | 'code' | 'name' | 'billingCycle' | 'basePricePaise' | 'validityDays' | 'currency'
  >;
  toPlan: Pick<
    Plan,
    | 'id'
    | 'code'
    | 'name'
    | 'billingCycle'
    | 'basePricePaise'
    | 'validityDays'
    | 'currency'
    | 'gstRatePercent'
    | 'gstInclusive'
  >;
  fromOrder: Pick<Order, 'id' | 'totalPaise' | 'paidAt' | 'currency' | 'placeOfSupplyState'>;
  /** Type of plan change. */
  changeType: 'UPGRADE' | 'DOWNGRADE' | 'SAME_PRICE_SWAP';
  /** Total seconds in the active period of the old plan. */
  totalSeconds: number;
  /** Seconds elapsed in the active period of the old plan. */
  elapsedSeconds: number;
  /** Remaining seconds in the active period. */
  remainingSeconds: number;
  /** Decimal ratio remaining (0..1). */
  remainingRatio: number;
  /** Pro-rata credit (paise). */
  unusedValuePaise: number;
  /** Charge after subtracting credit (paise) — never negative. */
  netChargePaise: number;
  /** Final pricing breakdown for the upgrade Order. */
  newOrderPricing: ReturnType<typeof computePricing>;
  /** Carry-forward per resource unit. */
  carryForward: CarryForwardLine[];
  /** Seconds the upgrade Order will activate when paid. */
  newValidityDays: number | null;
  warnings: string[];
}

// =====================================================================
// Find current active order for a plan/category combo
// =====================================================================

/**
 * Returns the most recent PAID Order belonging to the user that hasn't yet
 * expired. We pick the latest one ordered by paidAt DESC. Phase 8 will
 * replace this with `prisma.entitlement.findFirst({ where: status=ACTIVE })`.
 */
async function findCurrentActiveOrder(
  userId: string,
  forCategory: string
): Promise<(Order & { plan: Plan; resources?: PlanResource[] }) | null> {
  const candidates = await prisma.order.findMany({
    where: {
      userId,
      status: OrderStatus.PAID,
      plan: { category: forCategory as Plan['category'] },
    },
    orderBy: { paidAt: 'desc' },
    take: 5,
    include: { plan: true },
  });

  const now = Date.now();
  for (const order of candidates) {
    if (!order.paidAt || !order.plan.validityDays) continue;
    const end = order.paidAt.getTime() + order.plan.validityDays * 86_400_000;
    if (end > now) {
      const resources = await prisma.planResource.findMany({ where: { planId: order.planId } });
      return { ...order, resources };
    }
  }
  return null;
}

// =====================================================================
// Preview
// =====================================================================

export async function previewUpgrade(args: UpgradePreviewArgs): Promise<UpgradePreview> {
  const newPlan = await prisma.plan.findFirst({
    where: { code: args.toPlanCode, status: PlanStatus.ACTIVE },
    include: { resources: true },
  });
  if (!newPlan) throw new NotFoundError(`Plan ${args.toPlanCode} not found / inactive`);
  if (newPlan.requiresQuote) {
    throw new BadRequestError(
      `Plan ${args.toPlanCode} is custom — submit a quote request instead.`
    );
  }

  const currentOrder = await findCurrentActiveOrder(args.userId, newPlan.category);
  if (!currentOrder) {
    throw new BadRequestError(
      `No active plan found in category ${newPlan.category} to upgrade from. Buy the plan directly via /billing/orders.`
    );
  }
  if (currentOrder.planId === newPlan.id) {
    throw new BadRequestError(`Already on plan ${newPlan.code}.`);
  }
  if (newPlan.billingCycle !== PlanBillingCycle.ONE_TIME) {
    throw new BadRequestError(
      `Plan ${newPlan.code} is a subscription. Cancel current order and subscribe via /billing/subscriptions.`
    );
  }
  if (!currentOrder.paidAt || !currentOrder.plan.validityDays) {
    throw new BadRequestError('Current plan has no validity window — upgrade not supported.');
  }

  // ----- Pro-rata math -----
  const total = currentOrder.plan.validityDays * 86_400_000;
  const elapsed = Math.max(0, Math.min(total, Date.now() - currentOrder.paidAt.getTime()));
  const remaining = Math.max(0, total - elapsed);
  const remainingRatio = total === 0 ? 0 : remaining / total;
  const unusedValue = Math.round(currentOrder.totalPaise * remainingRatio);

  const placeOfSupply =
    args.buyerStateCode ?? currentOrder.placeOfSupplyState ?? env.HA_PLACE_OF_SUPPLY_DEFAULT_STATE;
  const buyerIsIndian = args.buyerIsIndian ?? (currentOrder.buyerCountry === null ? false : true);

  const newOrderPricing = computePricing({
    plan: newPlan,
    buyerStateCode: placeOfSupply,
    buyerIsIndian,
    prorationCreditPaise: unusedValue,
  });

  // ----- Carry-forward — uses live EntitlementResource state when available -----
  // Caps come from two sources (lower wins, per §5.3):
  //   1. PlanResource.carryForwardCap (per-plan-per-unit, from seed)
  //   2. SystemConfig billing.carryforward.cap.<unit> (global ceiling, super-admin tunable)
  const oldResources = currentOrder.resources ?? [];
  const newResources = newPlan.resources;

  // Pull the user's live EntitlementResource state so we can compute
  // remaining = allocated + carriedForward - consumed (instead of approximating
  // by ratio of the plan's nominal quantity).
  const entitlement = await prisma.entitlement.findFirst({
    where: {
      userId: args.userId,
      planId: currentOrder.plan.id,
      sourceOrderId: currentOrder.id,
      status: 'ACTIVE',
    },
    include: { resources: true },
  });
  const liveResources = new Map(
    (entitlement?.resources ?? []).map((r) => [r.unit as string, r] as const)
  );

  // Read SystemConfig caps (single query, then dictionary lookup per unit).
  const sysCapRows = await prisma.systemConfig.findMany({
    where: { key: { startsWith: 'billing.carryforward.cap.' } },
  });
  const sysCaps = new Map<string, number>();
  for (const row of sysCapRows) {
    const unit = row.key.replace('billing.carryforward.cap.', '');
    const v = row.value as unknown as number | { cap?: number };
    const cap = typeof v === 'number' ? v : (v?.cap ?? 0);
    if (Number.isFinite(cap) && cap > 0) sysCaps.set(unit, cap);
  }

  const carryForward: CarryForwardLine[] = [];
  for (const oldRes of oldResources) {
    const newRes = newResources.find((r) => r.unit === oldRes.unit);
    if (!newRes) continue;

    const planCap = newRes.carryForwardCap ?? oldRes.carryForwardCap ?? null;
    const sysCap = sysCaps.get(oldRes.unit) ?? null;
    const cap =
      planCap !== null && sysCap !== null ? Math.min(planCap, sysCap) : (planCap ?? sysCap);

    let unused: number;
    const live = liveResources.get(oldRes.unit);
    if (live) {
      // True remaining from EntitlementResource — preferred (Phase 8 path).
      unused = Math.max(0, live.allocated + live.carriedForward - live.consumed);
    } else {
      // Approximation when entitlement isn't yet wired (older orders, edge cases).
      unused = Math.round(oldRes.quantity * remainingRatio);
    }
    const carried = cap === null || cap === undefined ? unused : Math.min(unused, cap);
    carryForward.push({
      unit: oldRes.unit,
      unused,
      newPeriodAllocation: newRes.quantity,
      cap: cap ?? null,
      carried,
      effectiveAllocation: newRes.quantity + carried,
    });
  }

  let changeType: UpgradePreview['changeType'];
  if (newPlan.basePricePaise > currentOrder.plan.basePricePaise) changeType = 'UPGRADE';
  else if (newPlan.basePricePaise < currentOrder.plan.basePricePaise) changeType = 'DOWNGRADE';
  else changeType = 'SAME_PRICE_SWAP';

  const warnings: string[] = [];
  if (changeType === 'DOWNGRADE') {
    warnings.push(
      'Downgrades are scheduled at the end of the current period. The new plan activates after your current plan expires.'
    );
  }
  if (newOrderPricing.totalPaise === 0) {
    warnings.push('Pro-rata credit covers the full new plan price — no payment required.');
  }

  return {
    fromPlan: {
      id: currentOrder.plan.id,
      code: currentOrder.plan.code,
      name: currentOrder.plan.name,
      billingCycle: currentOrder.plan.billingCycle,
      basePricePaise: currentOrder.plan.basePricePaise,
      validityDays: currentOrder.plan.validityDays,
      currency: currentOrder.plan.currency,
    },
    toPlan: {
      id: newPlan.id,
      code: newPlan.code,
      name: newPlan.name,
      billingCycle: newPlan.billingCycle,
      basePricePaise: newPlan.basePricePaise,
      validityDays: newPlan.validityDays,
      currency: newPlan.currency,
      gstRatePercent: newPlan.gstRatePercent,
      gstInclusive: newPlan.gstInclusive,
    },
    fromOrder: {
      id: currentOrder.id,
      totalPaise: currentOrder.totalPaise,
      paidAt: currentOrder.paidAt,
      currency: currentOrder.currency,
      placeOfSupplyState: currentOrder.placeOfSupplyState,
    },
    changeType,
    totalSeconds: Math.floor(total / 1000),
    elapsedSeconds: Math.floor(elapsed / 1000),
    remainingSeconds: Math.floor(remaining / 1000),
    remainingRatio,
    unusedValuePaise: unusedValue,
    netChargePaise: newOrderPricing.totalPaise,
    newOrderPricing,
    carryForward,
    newValidityDays: newPlan.validityDays,
    warnings,
  };
}

// =====================================================================
// Execute upgrade — creates the new Order, links the old one
// =====================================================================

export interface ExecuteUpgradeArgs extends UpgradePreviewArgs {
  idempotencyKey: string;
  notes?: Record<string, string | number>;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface ExecuteUpgradeResult {
  upgradeChangeId: string;
  order: Order;
  razorpay?: {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    receipt: string;
  };
  /** Set if the pro-rata credit covered the full new plan price. */
  zeroAmountAutoApply: boolean;
  preview: UpgradePreview;
}

export async function executeUpgrade(args: ExecuteUpgradeArgs): Promise<ExecuteUpgradeResult> {
  const preview = await previewUpgrade(args);

  // Reject double-execute on same idempotency key
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: args.idempotencyKey },
  });
  if (existing) {
    throw new AppError(
      'An upgrade with this Idempotency-Key is already in progress. Use a fresh key to retry.',
      409,
      'IDEMPOTENCY_KEY_REUSED'
    );
  }

  const newPlan = await prisma.plan.findUnique({ where: { id: preview.toPlan.id } });
  if (!newPlan) throw new NotFoundError('Plan disappeared between preview and execute');

  // Use the order receipt prefix — invoice prefix is reserved for GST invoices.
  const receipt = await nextReceiptNumber('HA-ORD');

  // Zero-amount upgrades skip Razorpay (pro-rata covers everything)
  let razorpayOrderId: string | null = null;
  if (preview.netChargePaise > 0) {
    const client = getRazorpayClient();
    if (!client) throw new AppError('Razorpay not configured', 503, 'RAZORPAY_NOT_CONFIGURED');
    const rzpOrder = (await withRazorpaySpan(
      'orders.create',
      async () =>
        client.orders.create({
          amount: preview.netChargePaise,
          currency: preview.newOrderPricing.currency,
          receipt: receipt.formatted.slice(0, 40),
          notes: {
            userId: args.userId,
            planCode: newPlan.code,
            planName: newPlan.name,
            upgradeFromOrderId: preview.fromOrder.id,
            ...(args.notes ?? {}),
          },
        }),
      { plan: newPlan.code, amount: preview.netChargePaise, type: 'upgrade' }
    )) as { id: string };
    razorpayOrderId = rzpOrder?.id ?? null;
    if (!razorpayOrderId) {
      throw new AppError('Razorpay order create failed', 502, 'RAZORPAY_BAD_RESPONSE');
    }
  }

  const expiresAt = new Date(Date.now() + env.BILLING_ORDER_EXPIRY_MINUTES * 60_000);

  const result = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId: args.userId,
        planId: newPlan.id,
        planSnapshot: {
          id: newPlan.id,
          code: newPlan.code,
          name: newPlan.name,
          slug: newPlan.slug,
          category: newPlan.category,
          billingCycle: newPlan.billingCycle,
          basePricePaise: newPlan.basePricePaise,
          currency: newPlan.currency,
          gstRatePercent: newPlan.gstRatePercent,
          gstInclusive: newPlan.gstInclusive,
          hsnCode: newPlan.hsnCode,
          validityDays: newPlan.validityDays,
        } as Prisma.InputJsonValue,
        originalAmountPaise: preview.newOrderPricing.originalAmountPaise,
        discountPaise: 0,
        prorationPaise: preview.unusedValuePaise,
        taxableAmountPaise: preview.newOrderPricing.taxableAmountPaise,
        cgstPaise: preview.newOrderPricing.cgstPaise,
        sgstPaise: preview.newOrderPricing.sgstPaise,
        igstPaise: preview.newOrderPricing.igstPaise,
        cessPaise: preview.newOrderPricing.cessPaise,
        taxPaise: preview.newOrderPricing.taxPaise,
        totalPaise: preview.newOrderPricing.totalPaise,
        currency: preview.newOrderPricing.currency,
        taxRegion: preview.newOrderPricing.taxRegion,
        status: preview.netChargePaise === 0 ? OrderStatus.PAID : OrderStatus.CREATED,
        channel: 'CHECKOUT',
        idempotencyKey: args.idempotencyKey,
        receiptNumber: receipt.formatted,
        razorpayOrderId,
        placeOfSupplyState: preview.fromOrder.placeOfSupplyState ?? null,
        upgradeFromOrderId: preview.fromOrder.id,
        notes: (args.notes ?? null) as Prisma.InputJsonValue,
        ipAddress: args.ipAddress ?? null,
        userAgent: args.userAgent ?? null,
        deviceFingerprint: args.deviceFingerprint ?? null,
        expiresAt: preview.netChargePaise === 0 ? null : expiresAt,
        paidAt: preview.netChargePaise === 0 ? new Date() : null,
      },
    });

    await tx.priceAdjustment.create({
      data: {
        orderId: newOrder.id,
        reason: 'PRORATION',
        amountPaise: -preview.unusedValuePaise,
        narration: `Pro-rata credit from order ${preview.fromOrder.id}`,
        createdById: args.userId,
        metadata: {
          fromOrderId: preview.fromOrder.id,
          remainingRatio: preview.remainingRatio,
        } as Prisma.InputJsonValue,
      },
    });

    const upgradeChange = await tx.upgradeChange.create({
      data: {
        userId: args.userId,
        fromPlanId: preview.fromPlan.id,
        toPlanId: preview.toPlan.id,
        fromOrderId: preview.fromOrder.id,
        toOrderId: newOrder.id,
        prorationPaise: preview.unusedValuePaise,
        carryForward: preview.carryForward as unknown as Prisma.InputJsonValue,
        snapshot: {
          remainingRatio: preview.remainingRatio,
          remainingSeconds: preview.remainingSeconds,
          totalSeconds: preview.totalSeconds,
          newOrderPricing: preview.newOrderPricing,
          changeType: preview.changeType,
        } as unknown as Prisma.InputJsonValue,
        createdById: args.userId,
      },
    });

    return { newOrder, upgradeChange };
  });

  logger.info('Upgrade order created', {
    upgradeChangeId: result.upgradeChange.id,
    newOrderId: result.newOrder.id,
    fromOrderId: preview.fromOrder.id,
    netChargePaise: preview.netChargePaise,
  });

  // Zero-amount upgrade is auto-PAID inside the transaction above — fire the
  // UPGRADED notification immediately. Paid upgrades are notified later from
  // `payment.service.notifyPaymentCaptured` once the webhook lands.
  if (preview.netChargePaise === 0) {
    void (async () => {
      const { sendBillingNotification } = await import('./billing-notification.service');
      await sendBillingNotification({
        userId: args.userId,
        kind: 'UPGRADED',
        refType: 'ORDER',
        refId: result.newOrder.id,
        title: `Upgraded to ${preview.toPlan.name}`,
        message: `You've upgraded from ${preview.fromPlan.name} to ${preview.toPlan.name}.`,
        link: `/billing/subscriptions`,
        metadata: {
          planCode: newPlan.code,
          planName: newPlan.name,
          fromPlanName: preview.fromPlan.name,
          totalPaise: result.newOrder.totalPaise,
          prorationCreditPaise: preview.unusedValuePaise,
          receiptNumber: result.newOrder.receiptNumber,
        },
      });
    })().catch((err) =>
      logger.warn('UPGRADED notification (zero-amount) failed', {
        upgradeChangeId: result.upgradeChange.id,
        err: err instanceof Error ? err.message : err,
      })
    );
  }

  return {
    upgradeChangeId: result.upgradeChange.id,
    order: result.newOrder,
    razorpay: razorpayOrderId
      ? {
          keyId: env.RAZORPAY_KEY_ID!,
          orderId: razorpayOrderId,
          amount: preview.netChargePaise,
          currency: preview.newOrderPricing.currency,
          receipt: receipt.formatted,
        }
      : undefined,
    zeroAmountAutoApply: preview.netChargePaise === 0,
    preview,
  };
}
