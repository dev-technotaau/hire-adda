/**
 * Downgrade scheduling — implements §5.4 of the plan.
 *
 * Downgrades are NOT immediate. Instead they are scheduled to take effect
 * at the end of the current billing period:
 *
 *   1. User picks "Downgrade to PLAN_X" in the upgrade UI.
 *   2. We persist a `SystemConfig` row keyed
 *      `pending_plan_change:<entitlementId>` with `{ toPlanId, effectiveAt }`.
 *   3. The user can cancel until 24h before period end.
 *   4. `entitlement-expiry.worker` reads pending changes when an entitlement
 *      expires and grants the new plan + carry-forward.
 *
 * Stored under `SystemConfig` instead of a dedicated `PendingPlanChange`
 * table to avoid a Prisma migration. The shape is stable so we can promote
 * it to a real table later if needed.
 */
import { prisma } from '../config/prisma';
import { EntitlementStatus } from '@prisma/client';
import { AppError, NotFoundError } from '../exceptions';
import logger from '../config/logger';

const KEY_PREFIX = 'pending_plan_change:';

export interface PendingPlanChangePayload {
  fromEntitlementId: string;
  fromPlanId: string;
  toPlanId: string;
  toPlanCode: string;
  scheduledAt: string;
  effectiveAt: string;
  scheduledBy: string;
  notes?: string;
  /** Locked window — once `effectiveAt - 24h` passes, can no longer cancel. */
  lockAfter: string;
}

function key(entitlementId: string): string {
  return `${KEY_PREFIX}${entitlementId}`;
}

export async function scheduleDowngrade(args: {
  userId: string;
  fromEntitlementId: string;
  toPlanId: string;
  notes?: string;
}): Promise<PendingPlanChangePayload> {
  const ent = await prisma.entitlement.findFirst({
    where: { id: args.fromEntitlementId, userId: args.userId },
  });
  if (!ent) throw new NotFoundError('Source entitlement not found');
  if (ent.status !== EntitlementStatus.ACTIVE) {
    throw new AppError('Only active entitlements can schedule a downgrade', 400, 'NOT_ACTIVE');
  }
  const toPlan = await prisma.plan.findUnique({ where: { id: args.toPlanId } });
  if (!toPlan) throw new NotFoundError('Target plan not found');

  const lockAfter = new Date(ent.validUntil.getTime() - 24 * 60 * 60 * 1000);
  if (lockAfter.getTime() < Date.now()) {
    throw new AppError(
      'Less than 24h to period end — start a fresh purchase instead.',
      400,
      'WINDOW_TOO_LATE'
    );
  }

  const payload: PendingPlanChangePayload = {
    fromEntitlementId: ent.id,
    fromPlanId: ent.planId,
    toPlanId: toPlan.id,
    toPlanCode: toPlan.code,
    scheduledAt: new Date().toISOString(),
    effectiveAt: ent.validUntil.toISOString(),
    scheduledBy: args.userId,
    notes: args.notes,
    lockAfter: lockAfter.toISOString(),
  };

  await prisma.systemConfig.upsert({
    where: { key: key(ent.id) },
    create: {
      key: key(ent.id),
      value: payload as unknown as object,
      updatedBy: args.userId,
    },
    update: {
      value: payload as unknown as object,
      updatedBy: args.userId,
    },
  });

  logger.info('Pending plan change scheduled', {
    entitlementId: ent.id,
    toPlanCode: toPlan.code,
    effectiveAt: payload.effectiveAt,
  });
  return payload;
}

export async function getPendingDowngrade(args: {
  userId: string;
  entitlementId: string;
}): Promise<PendingPlanChangePayload | null> {
  const ent = await prisma.entitlement.findFirst({
    where: { id: args.entitlementId, userId: args.userId },
  });
  if (!ent) return null;
  const row = await prisma.systemConfig.findUnique({ where: { key: key(args.entitlementId) } });
  if (!row) return null;
  return row.value as unknown as PendingPlanChangePayload;
}

export async function cancelPendingDowngrade(args: {
  userId: string;
  entitlementId: string;
}): Promise<void> {
  const pending = await getPendingDowngrade(args);
  if (!pending) throw new NotFoundError('No pending downgrade');
  if (new Date(pending.lockAfter).getTime() < Date.now()) {
    throw new AppError('Downgrade is locked (within 24h of effective time).', 400, 'LOCKED');
  }
  await prisma.systemConfig.delete({ where: { key: key(args.entitlementId) } }).catch(() => null);
}

/**
 * Called by `entitlement-expiry.worker` when an entitlement expires.
 * If a pending downgrade exists, grants the new plan to the user and
 * removes the SystemConfig row.
 *
 * Returns the granted entitlement id (or null if no downgrade was pending).
 */
export async function applyPendingDowngradeOnExpiry(entitlementId: string): Promise<string | null> {
  const row = await prisma.systemConfig.findUnique({ where: { key: key(entitlementId) } });
  if (!row) return null;
  const payload = row.value as unknown as PendingPlanChangePayload;

  const ent = await prisma.entitlement.findUnique({ where: { id: entitlementId } });
  if (!ent) {
    // Expired entitlement gone — clean up
    await prisma.systemConfig.delete({ where: { key: key(entitlementId) } }).catch(() => null);
    return null;
  }

  const plan = await prisma.plan.findUnique({
    where: { id: payload.toPlanId },
    include: { resources: true },
  });
  if (!plan) {
    logger.warn('applyPendingDowngradeOnExpiry: target plan missing', { entitlementId });
    await prisma.systemConfig.delete({ where: { key: key(entitlementId) } }).catch(() => null);
    return null;
  }

  // Carry-forward: read remaining resources from old entitlement, capped per
  // SystemConfig.billing.carryforward.cap.<unit> (consistent with §5.3).
  const oldResources = await prisma.entitlementResource.findMany({
    where: { entitlementId: ent.id },
  });
  const carryCapsRow = await prisma.systemConfig.findMany({
    where: { key: { startsWith: 'billing.carryforward.cap.' } },
  });
  const carryCaps = new Map<string, number>();
  for (const c of carryCapsRow) {
    const unit = c.key.replace('billing.carryforward.cap.', '');
    const v = c.value as unknown as number | { cap?: number };
    const cap = typeof v === 'number' ? v : (v?.cap ?? 0);
    carryCaps.set(unit, cap);
  }

  const validFrom = new Date();
  const validUntil = new Date(validFrom.getTime() + (plan.validityDays ?? 30) * 86_400_000);

  const newEnt = await prisma.$transaction(async (tx) => {
    const created = await tx.entitlement.create({
      data: {
        userId: ent.userId,
        planId: plan.id,
        source: 'MIGRATION',
        status: EntitlementStatus.ACTIVE,
        validFrom,
        validUntil,
        autoRenew: false,
        metadata: {
          downgradedFrom: ent.planId,
          fromEntitlementId: ent.id,
          scheduledAt: payload.scheduledAt,
        } as unknown as object,
      },
    });

    for (const planRes of plan.resources) {
      const oldRes = oldResources.find((r) => r.unit === planRes.unit);
      const remaining = oldRes
        ? Math.max(0, oldRes.allocated + oldRes.carriedForward - oldRes.consumed)
        : 0;
      const cap = carryCaps.get(planRes.unit) ?? Infinity;
      const carry = Math.min(remaining, cap);
      await tx.entitlementResource.create({
        data: {
          entitlementId: created.id,
          unit: planRes.unit,
          allocated: planRes.quantity,
          consumed: 0,
          carriedForward: carry,
        },
      });
      if (carry > 0) {
        await tx.resourceLedger.create({
          data: {
            entitlementResourceId: oldRes?.id ?? created.id, // best effort
            userId: ent.userId,
            delta: carry,
            reason: 'CARRY_FORWARD' as const,
            refType: 'DOWNGRADE',
            refId: created.id,
          },
        });
      }
    }
    return created;
  });

  await prisma.systemConfig.delete({ where: { key: key(entitlementId) } }).catch(() => null);

  logger.info('Pending downgrade applied on expiry', {
    fromEntitlementId: ent.id,
    toEntitlementId: newEnt.id,
    toPlanCode: plan.code,
  });
  return newEnt.id;
}
