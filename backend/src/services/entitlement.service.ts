/**
 * Entitlement engine — the keystone of plan-gated access control.
 *
 *   - `grantEntitlementForOrder(orderId)`         called when an Order goes PAID
 *   - `grantEntitlementForSubscriptionCycle(...)`  called on subscription.charged
 *   - `getActiveEntitlementsForUser(userId)`       resolves merged feature + quota snapshot
 *   - `consumeResource({...})`                     atomic quota decrement (CV unlock, job post)
 *   - `releaseResource({...})`                     refund / rollback
 *   - `expireOverdueEntitlements()`                cron sweep
 *   - `revokeEntitlement(...)`                     super-admin
 *
 * Real-time sync: every grant / consume / expire emits `billing:entitlement:changed`
 * on the `user:<userId>` Socket.IO room, and updates the Firestore counter doc
 * (best-effort, never blocks).
 */
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import type { Prisma, ResourceUnit } from '@prisma/client';
import {
  EntitlementSource,
  EntitlementStatus,
  ResourceLedgerReason,
  OrderStatus,
  type Entitlement,
  type EntitlementResource,
  type Plan,
  type PlanFeature,
  type PlanResource,
  type Subscription,
} from '@prisma/client';
import { env } from '../config/env';
import { AppError, NotFoundError, BadRequestError } from '../exceptions';
import { billingEntitlementConsumptionsTotal } from '../routes/metrics.routes';
import logger from '../config/logger';

// =====================================================================
// Resolution — what features + quotas does this user have right now?
// =====================================================================

export interface ResolvedResource {
  unit: ResourceUnit;
  allocated: number;
  consumed: number;
  carriedForward: number;
  remaining: number;
  /** Sum across all active entitlements granting this resource. */
  totalAllocated: number;
  totalConsumed: number;
  totalRemaining: number;
  /** ISO timestamp of the last consume/release on this resource. */
  lastConsumedAt: string | null;
}

export interface ResolvedFeature {
  key: string;
  label: string;
  included: boolean;
  countableLimit: number | null;
  enumValue: string | null;
  textValue: string | null;
}

export interface ResolvedEntitlement {
  id: string;
  planId: string;
  planCode: string;
  planName: string;
  source: EntitlementSource;
  validFrom: string;
  validUntil: string;
  autoRenew: boolean;
  gracePeriodUntil: string | null;
  cancelledAt: string | null;
  status: EntitlementStatus;
  features: ResolvedFeature[];
  resources: ResolvedResource[];
  metadata: Record<string, unknown> | null;
}

export interface EntitlementSnapshot {
  /** All active (non-expired) entitlements for this user. */
  entitlements: ResolvedEntitlement[];
  /** Feature key → boolean (any active entitlement grants it). */
  features: Record<string, boolean>;
  /** Resource unit → totals across all active entitlements. */
  resources: Partial<Record<ResourceUnit, ResolvedResource>>;
  /** Earliest validUntil among active entitlements (null = none active). */
  nextExpiryAt: string | null;
  hasAnyActive: boolean;
}

/** Internal Prisma include for resolution. */
const RESOLVE_INCLUDE = {
  plan: { include: { features: true, resources: true } },
  resources: true,
} satisfies Prisma.EntitlementInclude;

type EntitlementWithRelations = Entitlement & {
  plan: Plan & { features: PlanFeature[]; resources: PlanResource[] };
  resources: EntitlementResource[];
};

function mapResolved(ent: EntitlementWithRelations): ResolvedEntitlement {
  const resources: ResolvedResource[] = ent.resources.map((r) => {
    const remaining = Math.max(0, r.allocated + r.carriedForward - r.consumed);
    return {
      unit: r.unit,
      allocated: r.allocated,
      consumed: r.consumed,
      carriedForward: r.carriedForward,
      remaining,
      totalAllocated: r.allocated + r.carriedForward,
      totalConsumed: r.consumed,
      totalRemaining: remaining,
      lastConsumedAt: r.lastConsumedAt?.toISOString() ?? null,
    };
  });
  const features: ResolvedFeature[] = ent.plan.features.map((f) => ({
    key: f.key,
    label: f.label,
    included: f.included,
    countableLimit: f.countableLimit,
    enumValue: f.enumValue,
    textValue: f.textValue,
  }));
  return {
    id: ent.id,
    planId: ent.planId,
    planCode: ent.plan.code,
    planName: ent.plan.name,
    source: ent.source,
    validFrom: ent.validFrom.toISOString(),
    validUntil: ent.validUntil.toISOString(),
    autoRenew: ent.autoRenew,
    gracePeriodUntil: ent.gracePeriodUntil?.toISOString() ?? null,
    cancelledAt: ent.cancelledAt?.toISOString() ?? null,
    status: ent.status,
    features,
    resources,
    metadata: (ent.metadata as Record<string, unknown> | null) ?? null,
  };
}

// =====================================================================
// Redis cache layer (§6.1) — 60s TTL with active invalidation on every
// grant / consume / expire / revoke / refund. Cache is a perf optimisation
// only; on miss/error we hit Postgres and reconstruct.
// =====================================================================

const ENT_CACHE_TTL = 60; // seconds, per plan §6.1
const ENT_CACHE_KEY = (userId: string) => `entitlements:${userId}`;

async function readEntitlementCache(userId: string): Promise<EntitlementSnapshot | null> {
  try {
    const raw = await redis.get(ENT_CACHE_KEY(userId));
    if (!raw) return null;
    return JSON.parse(raw) as EntitlementSnapshot;
  } catch {
    return null;
  }
}

async function writeEntitlementCache(userId: string, snap: EntitlementSnapshot): Promise<void> {
  try {
    await redis.set(ENT_CACHE_KEY(userId), JSON.stringify(snap), 'EX', ENT_CACHE_TTL);
  } catch {
    /* cache best-effort */
  }
}

/**
 * Drop the cached snapshot — call after every grant / consume / refund /
 * cancel / upgrade so the next read pulls fresh data.
 */
export async function invalidateEntitlementCache(userId: string): Promise<void> {
  try {
    await redis.del(ENT_CACHE_KEY(userId));
  } catch {
    /* cache best-effort */
  }
}

/**
 * Resolves the user whose entitlements should answer "what plan does
 * this user have access to". For solo users this returns their own id;
 * for ACTIVE multi-seat team members it returns the company OWNER's
 * userId so seats inherit the company's plan benefits.
 *
 * Per-call DB cost: one indexed lookup on `EmployerTeamMember.userId`
 * (status filter narrows further). Acceptable on every snapshot read
 * because the result is then cached for 60s.
 */
export async function resolveBillingUserId(userId: string): Promise<string> {
  try {
    const seat = await prisma.employerTeamMember.findFirst({
      where: { userId, status: 'ACTIVE' },
      select: { company: { select: { userId: true } } },
    });
    return seat?.company?.userId ?? userId;
  } catch {
    return userId;
  }
}

export async function getActiveEntitlementsForUser(
  userId: string,
  opts: { skipCache?: boolean } = {}
): Promise<EntitlementSnapshot> {
  // Multi-seat: resolve to the billing user (company owner) so team
  // members inherit the company plan. Cache is keyed on the billing
  // user, so all seats share one cache entry — invalidating the owner
  // also refreshes every seat.
  const billingUserId = await resolveBillingUserId(userId);

  if (!opts.skipCache) {
    const cached = await readEntitlementCache(billingUserId);
    if (cached) return cached;
  }

  const now = new Date();
  const ents = await prisma.entitlement.findMany({
    where: {
      userId: billingUserId,
      status: EntitlementStatus.ACTIVE,
      validUntil: { gt: now },
    },
    orderBy: { validUntil: 'asc' },
    include: RESOLVE_INCLUDE,
  });

  const resolved = ents.map(mapResolved);
  const features: Record<string, boolean> = {};
  const resources: Partial<Record<ResourceUnit, ResolvedResource>> = {};

  for (const ent of resolved) {
    for (const f of ent.features) {
      if (f.included) features[f.key] = true;
    }
    for (const r of ent.resources) {
      const existing = resources[r.unit];
      if (!existing) {
        resources[r.unit] = { ...r };
      } else {
        existing.totalAllocated += r.totalAllocated;
        existing.totalConsumed += r.totalConsumed;
        existing.totalRemaining = Math.max(0, existing.totalAllocated - existing.totalConsumed);
      }
    }
  }

  const snapshot: EntitlementSnapshot = {
    entitlements: resolved,
    features,
    resources,
    nextExpiryAt: resolved[0]?.validUntil ?? null,
    hasAnyActive: resolved.length > 0,
  };

  // Best-effort cache write — failures don't break the request.
  // Keyed on the *billing* user so all team-member seats share one entry.
  void writeEntitlementCache(billingUserId, snapshot);

  return snapshot;
}

/**
 * Returns the userIds of every user with an active entitlement granting
 * the given feature key — no input list, full scan. One indexed lookup
 * against `Entitlement` joined to `PlanFeature`. Safe to call per search
 * because the result set is small (Premium-tier users only).
 */
export async function getUsersWithFeatureAll(featureKey: string): Promise<string[]> {
  const rows = await prisma.entitlement.findMany({
    where: {
      status: EntitlementStatus.ACTIVE,
      validUntil: { gt: new Date() },
      plan: {
        features: { some: { key: featureKey, included: true } },
      },
    },
    select: { userId: true },
    distinct: ['userId'],
  });
  return rows.map((r) => r.userId);
}

/**
 * Batch helper — given a list of user IDs and a feature key, returns the
 * subset of IDs whose active entitlements grant that feature. One DB query
 * regardless of input size; safe to call from search/list endpoints.
 *
 * Used by candidate-search to inject `hasVerifiedBadge` per row without
 * an N+1.
 */
export async function getUsersWithFeature(
  userIds: string[],
  featureKey: string
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const rows = await prisma.entitlement.findMany({
    where: {
      userId: { in: userIds },
      status: EntitlementStatus.ACTIVE,
      validUntil: { gt: new Date() },
      plan: {
        features: {
          some: { key: featureKey, included: true },
        },
      },
    },
    select: { userId: true },
    distinct: ['userId'],
  });
  return new Set(rows.map((r) => r.userId));
}

// =====================================================================
// Grant — called when an order is PAID
// =====================================================================

/**
 * Idempotent on (userId, sourceOrderId). If an entitlement already exists
 * for this order, it's returned unchanged.
 */
export async function grantEntitlementForOrder(orderId: string): Promise<Entitlement> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      plan: { include: { resources: true } },
      upgradeFromOrder: {
        include: {
          plan: true,
        },
      },
    },
  });
  if (!order) throw new NotFoundError('Order not found');
  if (order.status !== OrderStatus.PAID) {
    throw new BadRequestError(`Order is ${order.status} — must be PAID to grant entitlement`);
  }

  // Idempotency
  const existing = await prisma.entitlement.findFirst({
    where: { userId: order.userId, sourceOrderId: order.id },
  });
  if (existing) return existing;

  const validityDays =
    order.plan.validityDays ??
    (order.plan.billingCycle === 'CUSTOM'
      ? // Custom plans: read validity from the planSnapshot — set when the
        // super-admin created the offer
        ((order.planSnapshot as { validityDays?: number } | null)?.validityDays ?? 30)
      : 30);

  const validFrom = order.paidAt ?? new Date();
  const validUntil = new Date(validFrom.getTime() + validityDays * 86_400_000);

  // Compute carry-forward from the previous order's still-active entitlement.
  // Cap is read from PlanResource (not EntitlementResource — caps live on
  // the plan definition).
  const carryForwardMap = new Map<ResourceUnit, number>();
  if (order.upgradeFromOrderId) {
    const prevEnt = await prisma.entitlement.findFirst({
      where: {
        userId: order.userId,
        sourceOrderId: order.upgradeFromOrderId,
        status: EntitlementStatus.ACTIVE,
      },
      include: { resources: true, plan: { include: { resources: true } } },
    });
    if (prevEnt) {
      for (const oldRes of prevEnt.resources) {
        const newPlanRes = order.plan.resources.find((r) => r.unit === oldRes.unit);
        const oldPlanRes = prevEnt.plan.resources.find((r) => r.unit === oldRes.unit);
        if (!newPlanRes) continue;
        const remaining = Math.max(0, oldRes.allocated + oldRes.carriedForward - oldRes.consumed);
        const cap = newPlanRes.carryForwardCap ?? oldPlanRes?.carryForwardCap ?? null;
        const carried = cap === null || cap === undefined ? remaining : Math.min(remaining, cap);
        if (carried > 0) carryForwardMap.set(oldRes.unit, carried);
      }
      // Soft-cancel the old entitlement so users can't double-spend.
      await prisma.entitlement.update({
        where: { id: prevEnt.id },
        data: { status: EntitlementStatus.CANCELLED, cancelledAt: new Date() },
      });
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const ent = await tx.entitlement.create({
      data: {
        userId: order.userId,
        planId: order.planId,
        source: EntitlementSource.PLAN,
        sourceOrderId: order.id,
        sourceCouponId: order.couponId,
        status: EntitlementStatus.ACTIVE,
        validFrom,
        validUntil,
        autoRenew: false, // user opts in later from billing UI
      },
    });

    if (order.plan.resources.length > 0) {
      await tx.entitlementResource.createMany({
        data: order.plan.resources.map((r) => ({
          entitlementId: ent.id,
          unit: r.unit,
          allocated: r.quantity,
          consumed: 0,
          carriedForward: carryForwardMap.get(r.unit) ?? 0,
        })),
      });

      // Record GRANT ledger entries
      const fresh = await tx.entitlementResource.findMany({
        where: { entitlementId: ent.id },
      });
      for (const r of fresh) {
        await tx.resourceLedger.create({
          data: {
            entitlementResourceId: r.id,
            userId: order.userId,
            delta: r.allocated + r.carriedForward,
            reason:
              r.carriedForward > 0
                ? ResourceLedgerReason.CARRY_FORWARD
                : ResourceLedgerReason.GRANT,
            refType: 'ORDER',
            refId: order.id,
            notes: `Granted from plan ${order.plan.code}`,
          },
        });
      }
    }

    return ent;
  });

  logger.info('Entitlement granted', {
    entitlementId: created.id,
    userId: order.userId,
    planCode: order.plan.code,
    validUntil,
    carryForwardEntries: carryForwardMap.size,
  });

  // Real-time sync (fire-and-forget)
  void emitEntitlementChange(order.userId, 'granted');
  return created;
}

/**
 * Per-cycle grant for subscription plans. Called from
 * `subscription.handler.handleSubscriptionEvent` on `subscription.charged`.
 *
 * Idempotent on `(userId, sourceSubscriptionId, cycleStart)` — passing the
 * same cycle start re-uses the same entitlement.
 */
export async function grantEntitlementForSubscriptionCycle(args: {
  subscriptionId: string;
  cycleStart: Date;
  cycleEnd: Date;
}): Promise<Entitlement> {
  const sub = await prisma.subscription.findUnique({
    where: { id: args.subscriptionId },
    include: { plan: { include: { resources: true } } },
  });
  if (!sub) throw new NotFoundError('Subscription not found');

  // Look up previous cycle's entitlement to roll-forward unused units
  const prevCycle = await prisma.entitlement.findFirst({
    where: {
      userId: sub.userId,
      sourceSubscriptionId: sub.id,
      validUntil: { lt: args.cycleEnd },
    },
    orderBy: { validUntil: 'desc' },
    include: { resources: true },
  });

  // Idempotency — exact same cycle?
  const existing = await prisma.entitlement.findFirst({
    where: {
      userId: sub.userId,
      sourceSubscriptionId: sub.id,
      validFrom: args.cycleStart,
    },
  });
  if (existing) return existing;

  const carryForwardMap = new Map<ResourceUnit, number>();
  if (prevCycle) {
    for (const oldRes of prevCycle.resources) {
      const newPlanRes = sub.plan.resources.find((r) => r.unit === oldRes.unit);
      if (!newPlanRes) continue;
      const remaining = Math.max(0, oldRes.allocated + oldRes.carriedForward - oldRes.consumed);
      const cap = newPlanRes.carryForwardCap ?? null;
      const carried = cap === null || cap === undefined ? remaining : Math.min(remaining, cap);
      if (carried > 0) carryForwardMap.set(oldRes.unit, carried);
    }
    await prisma.entitlement.update({
      where: { id: prevCycle.id },
      data: { status: EntitlementStatus.EXPIRED, cancelledAt: new Date() },
    });
  }

  const created = await prisma.$transaction(async (tx) => {
    const ent = await tx.entitlement.create({
      data: {
        userId: sub.userId,
        planId: sub.planId,
        source: EntitlementSource.PLAN,
        sourceSubscriptionId: sub.id,
        status: EntitlementStatus.ACTIVE,
        validFrom: args.cycleStart,
        validUntil: args.cycleEnd,
        autoRenew: true,
      },
    });
    if (sub.plan.resources.length > 0) {
      await tx.entitlementResource.createMany({
        data: sub.plan.resources.map((r) => ({
          entitlementId: ent.id,
          unit: r.unit,
          allocated: r.quantity,
          consumed: 0,
          carriedForward: carryForwardMap.get(r.unit) ?? 0,
        })),
      });
    }
    return ent;
  });

  logger.info('Entitlement granted (subscription cycle)', {
    entitlementId: created.id,
    subscriptionId: sub.id,
    userId: sub.userId,
  });
  void emitEntitlementChange(sub.userId, 'granted');
  return created;
}

// =====================================================================
// Consume — called by feature handlers (post-success)
// =====================================================================

export interface ConsumeArgs {
  userId: string;
  unit: ResourceUnit;
  amount: number;
  refType: string; // 'JOB_POST' | 'CV_UNLOCK' | 'SEARCH' | 'APPLICATION' | 'CUSTOM'
  refId?: string;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConsumeResult {
  consumed: boolean;
  /** Which entitlement was charged. */
  entitlementId: string | null;
  /** New remaining quota across ALL active entitlements (for the unit). */
  remaining: number;
  reason?: 'INSUFFICIENT' | 'NO_ENTITLEMENT';
}

/**
 * Atomically decrement a resource. Picks the entitlement closest to expiry
 * first ("FIFO by validUntil") so credits don't sit on a long-dated plan
 * while a short-dated one expires unused.
 *
 * Throws `AppError(402, 'PAYMENT_REQUIRED')` when no entitlement has
 * sufficient remaining — caller can catch and redirect to upgrade.
 */
export async function consumeResource(args: ConsumeArgs): Promise<ConsumeResult> {
  if (args.amount <= 0) {
    return { consumed: true, entitlementId: null, remaining: 0 };
  }

  // Multi-seat: drain from the company owner's pool when the caller is a
  // team member. The actor (args.userId) is still recorded in the ledger
  // so we keep an audit trail of who unlocked what.
  const billingUserId = await resolveBillingUserId(args.userId);

  const result = await prisma.$transaction(async (tx) => {
    // Lock + select active entitlement resources for this unit
    const candidates = await tx.entitlementResource.findMany({
      where: {
        unit: args.unit,
        entitlement: {
          userId: billingUserId,
          status: EntitlementStatus.ACTIVE,
          validUntil: { gt: new Date() },
        },
      },
      orderBy: { entitlement: { validUntil: 'asc' } },
      include: { entitlement: true },
    });

    if (candidates.length === 0) {
      return {
        consumed: false,
        entitlementId: null,
        remaining: 0,
        reason: 'NO_ENTITLEMENT' as const,
      };
    }

    // Try to satisfy from a single entitlement first (cleanest accounting),
    // falling back to splitting across multiple if necessary.
    let needed = args.amount;
    let chargedEntitlementId: string | null = null;

    for (const cand of candidates) {
      const remaining = cand.allocated + cand.carriedForward - cand.consumed;
      if (remaining <= 0) continue;
      const take = Math.min(remaining, needed);
      // Atomic increment with row-level guard via `where: { id, consumed }`
      const updated = await tx.entitlementResource.updateMany({
        where: { id: cand.id, consumed: cand.consumed },
        data: { consumed: { increment: take }, lastConsumedAt: new Date() },
      });
      if (updated.count === 0) {
        // Lost the optimistic lock — abort and let the caller retry.
        throw new AppError('Concurrent quota update — please retry', 409, 'QUOTA_RACE');
      }
      await tx.resourceLedger.create({
        data: {
          entitlementResourceId: cand.id,
          userId: args.userId,
          delta: -take,
          reason: ResourceLedgerReason.CONSUME,
          refType: args.refType,
          refId: args.refId ?? null,
          notes: args.notes ?? null,
          ipAddress: args.ipAddress ?? null,
          userAgent: args.userAgent ?? null,
        },
      });
      needed -= take;
      chargedEntitlementId = cand.entitlementId;
      if (needed === 0) break;
    }

    if (needed > 0) {
      // Insufficient — the partial decrements above will be rolled back when
      // we throw out of the transaction.
      throw new AppError(`Insufficient ${args.unit.toLowerCase()} quota`, 402, 'PAYMENT_REQUIRED');
    }

    // Compute new remaining total — same billingUserId scope as above so
    // multi-seat callers see the company pool's remainder.
    const refreshed = await tx.entitlementResource.findMany({
      where: {
        unit: args.unit,
        entitlement: {
          userId: billingUserId,
          status: EntitlementStatus.ACTIVE,
          validUntil: { gt: new Date() },
        },
      },
    });
    const totalRemaining = refreshed.reduce(
      (sum, r) => sum + Math.max(0, r.allocated + r.carriedForward - r.consumed),
      0
    );

    return {
      consumed: true,
      entitlementId: chargedEntitlementId,
      remaining: totalRemaining,
    };
  });

  if (result.consumed) {
    void emitEntitlementChange(args.userId, 'consumed');
    // Phase 14: Prometheus counter — drives "hot quotas" dashboards
    billingEntitlementConsumptionsTotal.inc({ unit: args.unit, plan: 'unknown' }, args.amount);
  }
  return result;
}

/**
 * Restore a previously consumed resource (e.g. after refund). Pure inverse
 * of `consumeResource`.
 */
export async function releaseResource(args: ConsumeArgs): Promise<void> {
  if (args.amount <= 0) return;
  await prisma.$transaction(async (tx) => {
    const lastConsume = await tx.resourceLedger.findFirst({
      where: {
        userId: args.userId,
        refType: args.refType,
        refId: args.refId ?? undefined,
        reason: ResourceLedgerReason.CONSUME,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!lastConsume) return;
    await tx.entitlementResource.update({
      where: { id: lastConsume.entitlementResourceId },
      data: {
        consumed: { decrement: Math.min(args.amount, Math.abs(lastConsume.delta)) },
      },
    });
    await tx.resourceLedger.create({
      data: {
        entitlementResourceId: lastConsume.entitlementResourceId,
        userId: args.userId,
        delta: args.amount,
        reason:
          args.refType === 'REFUND'
            ? ResourceLedgerReason.REFUND_RESTORE
            : ResourceLedgerReason.ROLLBACK,
        refType: args.refType,
        refId: args.refId ?? null,
        notes: args.notes ?? 'Restored',
      },
    });
  });
  void emitEntitlementChange(args.userId, 'restored');
}

// =====================================================================
// Cron / lifecycle
// =====================================================================

export async function expireOverdueEntitlements(): Promise<{
  expired: number;
  downgrades: number;
}> {
  const now = new Date();
  // Fetch the rows about to expire so we can apply pending downgrades after.
  const expiring = await prisma.entitlement.findMany({
    where: {
      status: EntitlementStatus.ACTIVE,
      validUntil: { lt: now },
    },
    select: { id: true, userId: true, planId: true },
  });
  const result = await prisma.entitlement.updateMany({
    where: {
      status: EntitlementStatus.ACTIVE,
      validUntil: { lt: now },
    },
    data: { status: EntitlementStatus.EXPIRED },
  });
  if (result.count > 0) {
    logger.info(`Expired ${result.count} overdue entitlements`);
  }

  // Apply any scheduled downgrades (§5.4)
  let downgrades = 0;
  if (expiring.length > 0) {
    const { applyPendingDowngradeOnExpiry } = await import('./downgrade.service');
    for (const ent of expiring) {
      try {
        const newEntId = await applyPendingDowngradeOnExpiry(ent.id);
        if (newEntId) {
          downgrades += 1;
          void emitEntitlementChange(ent.userId, 'granted');
          void notifyDowngradeApplied(ent.userId, ent.planId, newEntId).catch((err) =>
            logger.warn('DOWNGRADED notification failed', {
              entitlementId: ent.id,
              err: err instanceof Error ? err.message : err,
            })
          );
        } else {
          void emitEntitlementChange(ent.userId, 'expired');
        }
      } catch (err) {
        logger.error('applyPendingDowngradeOnExpiry failed', {
          entitlementId: ent.id,
          err: err instanceof Error ? err.message : err,
        });
      }
    }
  }

  return { expired: result.count, downgrades };
}

async function notifyDowngradeApplied(
  userId: string,
  fromPlanId: string,
  toEntitlementId: string
): Promise<void> {
  const [fromPlan, toEnt] = await Promise.all([
    prisma.plan.findUnique({ where: { id: fromPlanId }, select: { name: true, code: true } }),
    prisma.entitlement.findUnique({
      where: { id: toEntitlementId },
      include: { plan: { select: { name: true, code: true } } },
    }),
  ]);
  if (!toEnt) return;
  const { sendBillingNotification } = await import('./billing-notification.service');
  await sendBillingNotification({
    userId,
    kind: 'DOWNGRADED',
    refType: 'ENTITLEMENT',
    refId: toEnt.id,
    title: `Switched to ${toEnt.plan.name}`,
    message: `Your scheduled switch from ${fromPlan?.name ?? 'previous plan'} to ${toEnt.plan.name} has been applied.`,
    link: `/billing/subscriptions`,
    metadata: {
      planCode: toEnt.plan.code,
      planName: toEnt.plan.name,
      fromPlanName: fromPlan?.name ?? null,
      validUntil: toEnt.validUntil.toISOString(),
    },
  });
}

export async function revokeEntitlement(args: {
  entitlementId: string;
  reason: string;
  revokedBy: string;
}): Promise<Entitlement> {
  const ent = await prisma.entitlement.findUnique({ where: { id: args.entitlementId } });
  if (!ent) throw new NotFoundError('Entitlement not found');
  const updated = await prisma.entitlement.update({
    where: { id: ent.id },
    data: {
      status: EntitlementStatus.CANCELLED,
      cancelledAt: new Date(),
      metadata: {
        ...(ent.metadata as Record<string, unknown> | null),
        revokedReason: args.reason,
        revokedBy: args.revokedBy,
      } as Prisma.InputJsonValue,
    },
  });
  void emitEntitlementChange(ent.userId, 'revoked');
  return updated;
}

/**
 * Manually grant a bonus / promotional entitlement (super-admin tool).
 */
export async function manuallyGrantEntitlement(args: {
  userId: string;
  planId: string;
  validityDays: number;
  source?: EntitlementSource;
  notes?: string;
  createdBy: string;
}): Promise<Entitlement> {
  const plan = await prisma.plan.findUnique({
    where: { id: args.planId },
    include: { resources: true },
  });
  if (!plan) throw new NotFoundError('Plan not found');

  const validFrom = new Date();
  const validUntil = new Date(validFrom.getTime() + args.validityDays * 86_400_000);

  const created = await prisma.$transaction(async (tx) => {
    const ent = await tx.entitlement.create({
      data: {
        userId: args.userId,
        planId: plan.id,
        source: args.source ?? EntitlementSource.MANUAL,
        status: EntitlementStatus.ACTIVE,
        validFrom,
        validUntil,
        autoRenew: false,
        metadata: {
          notes: args.notes,
          grantedBy: args.createdBy,
        } as Prisma.InputJsonValue,
      },
    });
    if (plan.resources.length > 0) {
      await tx.entitlementResource.createMany({
        data: plan.resources.map((r) => ({
          entitlementId: ent.id,
          unit: r.unit,
          allocated: r.quantity,
          consumed: 0,
          carriedForward: 0,
        })),
      });
    }
    return ent;
  });
  void emitEntitlementChange(args.userId, 'granted');
  void (async () => {
    const { AuditService } = await import('./audit.service');
    await AuditService.log({
      action: 'BILLING_USER_PLAN_GRANTED',
      entity: 'Entitlement',
      entityId: created.id,
      performedBy: args.createdBy,
      details: {
        userId: args.userId,
        planId: plan.id,
        planCode: plan.code,
        validityDays: args.validityDays,
        source: args.source ?? EntitlementSource.MANUAL,
        notes: args.notes,
      },
    });
  })();
  return created;
}

// =====================================================================
// Real-time sync helpers
// =====================================================================

/**
 * Best-effort Socket.IO emit on entitlement change. Loaded lazily to avoid
 * circular deps with `socket.ts`.
 */
/**
 * Returns all userIds that share the billing pool with the given owner —
 * the owner themselves plus every ACTIVE team-member seat. Used to fan
 * out cache invalidation + socket events when entitlements change.
 */
async function getAllSeatUserIds(billingUserId: string): Promise<string[]> {
  const ids = new Set<string>([billingUserId]);
  try {
    const company = await prisma.companyProfile.findUnique({
      where: { userId: billingUserId },
      select: { id: true },
    });
    if (!company) return Array.from(ids);
    const seats = await prisma.employerTeamMember.findMany({
      where: {
        companyId: company.id,
        status: 'ACTIVE',
        userId: { not: null },
      },
      select: { userId: true },
    });
    for (const s of seats) {
      if (s.userId) ids.add(s.userId);
    }
  } catch {
    /* non-critical — fall through with just the owner id */
  }
  return Array.from(ids);
}

async function emitEntitlementChange(
  userId: string,
  reason: 'granted' | 'consumed' | 'restored' | 'expired' | 'revoked'
): Promise<void> {
  // Resolve to the billing pool first so cache invalidation hits the
  // shared key. Owners pass through unchanged; team members get redirected
  // to their company's owner id.
  const billingUserId = await resolveBillingUserId(userId);
  await invalidateEntitlementCache(billingUserId);

  // Fan out the socket event to every seat user so multi-seat teams see
  // real-time quota updates after one member consumes.
  const seatIds = await getAllSeatUserIds(billingUserId);
  try {
    const { getIO } = await import('../socket');
    const io = getIO();
    for (const id of seatIds) {
      io.to(`user:${id}`).emit('billing:entitlement:changed', {
        userId: id,
        reason,
        ts: Date.now(),
      });
    }
  } catch (err) {
    // Socket may not be initialised in tests — silent
    if (env.NODE_ENV !== 'test') {
      logger.debug('Socket emit (entitlement) skipped', {
        err: err instanceof Error ? err.message : err,
      });
    }
  }
  // Firestore counter mirror — best effort, owner only (mirror is keyed
  // on the owner anyway because the data is per-billing-pool).
  void mirrorToFirestore(billingUserId).catch(() => {});
  // Kafka fan-out — granted/consumed/expired only (restored/revoked have no topic).
  void emitEntitlementToKafka(billingUserId, reason).catch(() => {});
}

async function emitEntitlementToKafka(
  userId: string,
  reason: 'granted' | 'consumed' | 'restored' | 'expired' | 'revoked'
): Promise<void> {
  const { publishEvent } = await import('../kafka/producer');
  const { KafkaTopics } = await import('../kafka/topics');
  const topic =
    reason === 'granted'
      ? KafkaTopics.BILLING_ENTITLEMENT_GRANTED
      : reason === 'consumed'
        ? KafkaTopics.BILLING_ENTITLEMENT_CONSUMED
        : reason === 'expired'
          ? KafkaTopics.BILLING_ENTITLEMENT_EXPIRED
          : null;
  if (!topic) return;
  await publishEvent(topic, userId, { userId, reason });
}

async function mirrorToFirestore(userId: string): Promise<void> {
  try {
    const { firestore } = await import('../config/firebase');
    if (!firestore) return;
    const snapshot = await getActiveEntitlementsForUser(userId);
    await firestore.collection('users').doc(userId).collection('entitlements').doc('current').set(
      {
        features: snapshot.features,
        resources: snapshot.resources,
        nextExpiryAt: snapshot.nextExpiryAt,
        hasAnyActive: snapshot.hasAnyActive,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    /* swallowed — firebase may be unconfigured locally */
  }
}

// AppError re-export keeps imports tidy
export { AppError };

// Type helper export
export type { Subscription };
