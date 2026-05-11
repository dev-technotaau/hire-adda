/**
 * CV unlock — employer reveals contact details for a single candidate.
 *
 * One unlock = 1 CV_UNLOCK quota consumed (atomic via entitlement service).
 * Idempotent on `(employerUserId, candidateId)` — a re-unlock returns the
 * cached contact details without burning another quota unit.
 *
 * Backed by `ResourceLedger.refType='CV_UNLOCK', refId=candidateId` so we
 * can detect prior unlocks and short-circuit.
 */
import { prisma } from '../config/prisma';
import { ResourceLedgerReason } from '@prisma/client';
import { consumeResource, getActiveEntitlementsForUser } from './entitlement.service';
import { NotFoundError, BadRequestError } from '../exceptions';
import logger from '../config/logger';

export interface UnlockContactArgs {
  employerUserId: string;
  candidateId: string; // CandidateProfile.userId (the candidate's User.id)
  ipAddress?: string;
  userAgent?: string;
}

export interface UnlockResult {
  email: string;
  phone: string | null;
  alternateEmail: string | null;
  alternatePhone: string | null;
  /** True if this unlock was free (already unlocked previously). */
  cached: boolean;
}

export async function unlockContact(args: UnlockContactArgs): Promise<UnlockResult> {
  const candidate = await prisma.user.findFirst({
    where: { id: args.candidateId, role: 'CANDIDATE' },
    include: { candidateProfile: true },
  });
  if (!candidate) throw new NotFoundError('Candidate not found');
  if (candidate.id === args.employerUserId) {
    throw new BadRequestError('Cannot unlock your own contact');
  }

  // Idempotency: has this employer already unlocked this candidate?
  const prior = await prisma.resourceLedger.findFirst({
    where: {
      userId: args.employerUserId,
      refType: 'CV_UNLOCK',
      refId: args.candidateId,
      reason: ResourceLedgerReason.CONSUME,
    },
  });
  if (prior) {
    logger.info('CV unlock cache hit — no quota consumed', {
      employerUserId: args.employerUserId,
      candidateId: args.candidateId,
    });
    return {
      email: candidate.email,
      phone: candidate.candidateProfile?.phone ?? candidate.mobileNumber ?? null,
      alternateEmail: candidate.candidateProfile?.alternateEmail ?? null,
      alternatePhone: candidate.candidateProfile?.alternatePhone ?? null,
      cached: true,
    };
  }

  // CV Enterprise plan — `feature.cv_unlock_unlimited` bypasses the quota
  // ledger entirely (Enterprise has empty resources, so consumeResource
  // would throw 402). We still surface the contact details and rely on the
  // route-level audit log for the access trail.
  const snapshot = await getActiveEntitlementsForUser(args.employerUserId);
  const isUnlimited = Boolean(snapshot.features['feature.cv_unlock_unlimited']);

  if (!isUnlimited) {
    // Consume CV_UNLOCK quota — throws 402 PAYMENT_REQUIRED if no entitlement
    await consumeResource({
      userId: args.employerUserId,
      unit: 'CV_UNLOCK',
      amount: 1,
      refType: 'CV_UNLOCK',
      refId: args.candidateId,
      notes: `CV unlock for candidate ${args.candidateId}`,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    logger.info('CV unlock — quota consumed', {
      employerUserId: args.employerUserId,
      candidateId: args.candidateId,
    });
  } else {
    logger.info('CV unlock — Enterprise unlimited (no quota consumed)', {
      employerUserId: args.employerUserId,
      candidateId: args.candidateId,
    });
  }

  return {
    email: candidate.email,
    phone: candidate.candidateProfile?.phone ?? candidate.mobileNumber ?? null,
    alternateEmail: candidate.candidateProfile?.alternateEmail ?? null,
    alternatePhone: candidate.candidateProfile?.alternatePhone ?? null,
    cached: false,
  };
}

/**
 * List candidates this employer has previously unlocked. Used for the
 * "Unlocked candidates" admin view.
 */
export async function listUnlockedCandidatesForEmployer(
  employerUserId: string,
  args: { page?: number; limit?: number } = {}
): Promise<{ items: { candidateId: string; unlockedAt: Date }[]; total: number }> {
  const page = Math.max(1, args.page ?? 1);
  const limit = Math.min(100, Math.max(1, args.limit ?? 50));
  const [rows, total] = await prisma.$transaction([
    prisma.resourceLedger.findMany({
      where: {
        userId: employerUserId,
        refType: 'CV_UNLOCK',
        reason: ResourceLedgerReason.CONSUME,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      select: { refId: true, createdAt: true },
    }),
    prisma.resourceLedger.count({
      where: {
        userId: employerUserId,
        refType: 'CV_UNLOCK',
        reason: ResourceLedgerReason.CONSUME,
      },
    }),
  ]);
  return {
    items: rows.map((r) => ({ candidateId: r.refId ?? '', unlockedAt: r.createdAt })),
    total,
  };
}
