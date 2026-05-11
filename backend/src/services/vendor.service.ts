/**
 * Vendor Connect — recruitment-partner role.
 *
 * A "vendor" is a staffing agency / recruiter who pays for the
 * `VENDOR_CONNECT` plan (₹199/mo) to receive hiring requirements from
 * employers and appear in our public vendor directory.
 *
 * Models:
 *   - VendorProfile : business profile, services, locations, public flag
 *   - VendorLead    : a lead routed from an employer (or scraped from a
 *                     JobPost). Vendor responds → status RESPONDED.
 *
 * Plan-gating: receiving leads requires `feature.vendor_leads`. Public
 * listing only shows vendors who have an active VENDOR_CONNECT
 * entitlement (we filter at query time).
 */
import { prisma } from '../config/prisma';
import { VendorLeadStatus, type VendorProfile, type VendorLead } from '@prisma/client';
import { AppError, NotFoundError, BadRequestError, ConflictError } from '../exceptions';
import logger from '../config/logger';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

async function findUniqueSlug(base: string): Promise<string> {
  const slug = slugify(base) || `vendor-${Date.now().toString(36)}`;
  let candidate = slug;
  let i = 1;
  while (await prisma.vendorProfile.findUnique({ where: { slug: candidate } })) {
    candidate = `${slug}-${i}`;
    i += 1;
    if (i > 100) {
      candidate = `${slug}-${Date.now().toString(36)}`;
      break;
    }
  }
  return candidate;
}

export interface CreateVendorProfileInput {
  businessName: string;
  description?: string;
  logo?: string;
  website?: string;
  contactEmail: string;
  contactPhone: string;
  services?: string[];
  industries?: string[];
  locations?: string[];
  yearsInBusiness?: number;
  teamSize?: number;
}

export async function createOrUpdateProfile(
  userId: string,
  input: CreateVendorProfileInput
): Promise<VendorProfile> {
  if (!input.businessName?.trim()) {
    throw new BadRequestError('businessName is required');
  }
  if (!input.contactEmail?.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.contactEmail)) {
    throw new BadRequestError('Valid contactEmail is required');
  }
  if (!input.contactPhone?.trim()) {
    throw new BadRequestError('contactPhone is required');
  }

  const existing = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (existing) {
    return prisma.vendorProfile.update({
      where: { id: existing.id },
      data: {
        businessName: input.businessName.trim(),
        description: input.description?.trim() ?? null,
        logo: input.logo ?? null,
        website: input.website?.trim() ?? null,
        contactEmail: input.contactEmail.trim().toLowerCase(),
        contactPhone: input.contactPhone.trim(),
        services: input.services ?? [],
        industries: input.industries ?? [],
        locations: input.locations ?? [],
        yearsInBusiness: input.yearsInBusiness ?? null,
        teamSize: input.teamSize ?? null,
      },
    });
  }
  const slug = await findUniqueSlug(input.businessName);
  return prisma.vendorProfile.create({
    data: {
      userId,
      slug,
      businessName: input.businessName.trim(),
      description: input.description?.trim() ?? null,
      logo: input.logo ?? null,
      website: input.website?.trim() ?? null,
      contactEmail: input.contactEmail.trim().toLowerCase(),
      contactPhone: input.contactPhone.trim(),
      services: input.services ?? [],
      industries: input.industries ?? [],
      locations: input.locations ?? [],
      yearsInBusiness: input.yearsInBusiness ?? null,
      teamSize: input.teamSize ?? null,
    },
  });
}

export async function getMyProfile(userId: string): Promise<VendorProfile | null> {
  return prisma.vendorProfile.findUnique({ where: { userId } });
}

/**
 * Upload a logo image, run it through Cloudinary's `companyLogo` preset
 * (400×400 fit, auto quality, auto format), and persist the resulting
 * URL on the vendor profile. Old logo is deleted from Cloudinary best-
 * effort to avoid orphaned assets.
 */
export async function uploadLogo(
  userId: string,
  file: Express.Multer.File
): Promise<VendorProfile> {
  const { uploadImage, uploadOptions, deleteImage, extractPublicId } =
    await import('../config/cloudinary');
  const existing = await prisma.vendorProfile.findUnique({
    where: { userId },
    select: { id: true, logo: true },
  });
  const result = await uploadImage(file.buffer, uploadOptions.companyLogo);

  if (existing?.logo) {
    const oldId = extractPublicId(existing.logo);
    if (oldId) void deleteImage(oldId).catch(() => {});
  }

  if (existing) {
    return prisma.vendorProfile.update({
      where: { id: existing.id },
      data: { logo: result.secure_url },
    });
  }
  // No profile yet — caller should hit `createOrUpdateProfile` first.
  // Throw rather than silently creating a malformed row.
  throw new BadRequestError('Set up your business profile before uploading a logo.');
}

export async function setPublicFlag(userId: string, isPublic: boolean): Promise<VendorProfile> {
  const existing = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!existing) throw new NotFoundError('Vendor profile not found');
  return prisma.vendorProfile.update({
    where: { id: existing.id },
    data: { isPublic },
  });
}

// --- Public directory ---

export interface ListPublicArgs {
  service?: string;
  location?: string;
  industry?: string;
  query?: string;
  page?: number;
  limit?: number;
}

export async function listPublicVendors(args: ListPublicArgs = {}) {
  const page = Math.max(1, Math.floor(args.page ?? 1));
  const limit = Math.min(50, Math.max(1, Math.floor(args.limit ?? 20)));
  const skip = (page - 1) * limit;

  // Vendor visibility requires:
  //   1. The vendor has flipped their profile public, AND
  //   2. They have an active VENDOR_CONNECT entitlement (feature.vendor_listing).
  // Without both, lapsed subscribers would stay in the directory forever.
  const eligibleUserIds = await getUsersWithActiveVendorListing();
  if (eligibleUserIds.length === 0) {
    return { items: [], pagination: { total: 0, page, limit, pages: 1 } };
  }

  const where: Record<string, unknown> = {
    isPublic: true,
    userId: { in: eligibleUserIds },
  };
  if (args.service) where.services = { has: args.service };
  if (args.location) where.locations = { has: args.location };
  if (args.industry) where.industries = { has: args.industry };
  if (args.query) {
    where.OR = [
      { businessName: { contains: args.query, mode: 'insensitive' } },
      { description: { contains: args.query, mode: 'insensitive' } },
    ];
  }
  const [items, total] = await prisma.$transaction([
    prisma.vendorProfile.findMany({
      where,
      orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        businessName: true,
        description: true,
        logo: true,
        website: true,
        services: true,
        industries: true,
        locations: true,
        yearsInBusiness: true,
        teamSize: true,
        isVerified: true,
      },
    }),
    prisma.vendorProfile.count({ where }),
  ]);

  // Inject rating aggregates per card — single batched query.
  const ratingStats = await getRatingStats(items.map((i) => i.id));
  const enriched = items.map((i) => ({
    ...i,
    avgRating: ratingStats.get(i.id)?.avgRating ?? null,
    reviewCount: ratingStats.get(i.id)?.reviewCount ?? 0,
  }));

  return {
    items: enriched,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
  };
}

/**
 * Returns the set of vendor userIds with an active VENDOR_CONNECT entitlement
 * (`feature.vendor_listing`). One indexed query — cheap to call per
 * directory request.
 */
async function getUsersWithActiveVendorListing(): Promise<string[]> {
  const rows = await prisma.entitlement.findMany({
    where: {
      status: 'ACTIVE',
      validUntil: { gt: new Date() },
      plan: {
        features: {
          some: { key: 'feature.vendor_listing', included: true },
        },
      },
    },
    select: { userId: true },
    distinct: ['userId'],
  });
  return rows.map((r) => r.userId);
}

export async function getPublicVendorBySlug(slug: string) {
  const v = await prisma.vendorProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      userId: true,
      businessName: true,
      description: true,
      logo: true,
      website: true,
      contactEmail: true,
      contactPhone: true,
      services: true,
      industries: true,
      locations: true,
      yearsInBusiness: true,
      teamSize: true,
      isVerified: true,
      isPublic: true,
    },
  });
  if (!v || !v.isPublic) throw new NotFoundError('Vendor not found');

  // Same active-subscription check as the listing endpoint — direct
  // slug visits would otherwise bypass the entitlement filter.
  const eligibleUserIds = await getUsersWithActiveVendorListing();
  if (!eligibleUserIds.includes(v.userId)) {
    throw new NotFoundError('Vendor not found');
  }

  // Attach rating aggregate so the public detail page can render stars.
  const stats = await getRatingStats([v.id]);
  return {
    ...v,
    avgRating: stats.get(v.id)?.avgRating ?? null,
    reviewCount: stats.get(v.id)?.reviewCount ?? 0,
  };
}

// --- Leads (vendor inbox) ---

export async function listMyLeads(
  userId: string,
  args: { status?: VendorLeadStatus; page?: number; limit?: number } = {}
) {
  const profile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Set up your vendor profile first');
  const page = Math.max(1, Math.floor(args.page ?? 1));
  const limit = Math.min(50, Math.max(1, Math.floor(args.limit ?? 20)));
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = { vendorProfileId: profile.id };
  if (args.status) where.status = args.status;
  const [items, total] = await prisma.$transaction([
    prisma.vendorLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        jobPost: { select: { id: true, title: true, location: true } },
        employer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.vendorLead.count({ where }),
  ]);
  return {
    items,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
  };
}

export async function respondToLead(args: {
  userId: string;
  leadId: string;
  status: 'RESPONDED' | 'ACCEPTED' | 'DECLINED';
  responseText?: string;
}): Promise<VendorLead> {
  const profile = await prisma.vendorProfile.findUnique({ where: { userId: args.userId } });
  if (!profile) throw new NotFoundError('Vendor profile not found');
  const lead = await prisma.vendorLead.findFirst({
    where: { id: args.leadId, vendorProfileId: profile.id },
  });
  if (!lead) throw new NotFoundError('Lead not found');
  if (lead.status !== VendorLeadStatus.PENDING) {
    throw new ConflictError('This lead has already been answered.');
  }
  return prisma.vendorLead.update({
    where: { id: lead.id },
    data: {
      status: args.status as VendorLeadStatus,
      responseText: args.responseText ?? null,
      respondedAt: new Date(),
    },
  });
}

// --- Employer-side: send a hiring requirement to a vendor ---

export async function sendLeadToVendor(args: {
  vendorSlug: string;
  employerUserId: string;
  requirementText: string;
  contactEmail: string;
  contactPhone?: string;
  jobPostId?: string;
}): Promise<VendorLead> {
  if (!args.requirementText?.trim() || args.requirementText.trim().length < 20) {
    throw new BadRequestError('requirementText must be at least 20 characters');
  }
  const vendor = await prisma.vendorProfile.findUnique({ where: { slug: args.vendorSlug } });
  if (!vendor || !vendor.isPublic) throw new NotFoundError('Vendor not found');
  const lead = await prisma.vendorLead.create({
    data: {
      vendorProfileId: vendor.id,
      employerId: args.employerUserId,
      requirementText: args.requirementText.trim(),
      contactEmail: args.contactEmail.trim().toLowerCase(),
      contactPhone: args.contactPhone?.trim() ?? null,
      jobPostId: args.jobPostId ?? null,
      expiresAt: new Date(Date.now() + 14 * 86_400_000),
    },
  });

  // Best-effort notify vendor by email so they know to log in.
  void notifyVendorOfNewLead(vendor.id, lead.id).catch((err) =>
    logger.warn('vendor lead email failed', {
      err: err instanceof Error ? err.message : err,
    })
  );
  return lead;
}

async function notifyVendorOfNewLead(vendorProfileId: string, leadId: string): Promise<void> {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: vendorProfileId },
    include: { user: { select: { email: true, firstName: true } } },
  });
  if (!vendor?.user) return;
  const lead = await prisma.vendorLead.findUnique({
    where: { id: leadId },
    include: {
      jobPost: { select: { title: true } },
      employer: { select: { firstName: true, lastName: true } },
    },
  });
  if (!lead) return;
  const { emailQueue } = await import('../jobs/email.queue');
  const { env } = await import('../config/env');
  const { vendorNewLeadEmail } = await import('../templates/email/vendor');
  const inboxUrl = `${env.FRONTEND_URL ?? 'https://hireadda.in'}/vendor/leads`;
  const employerName =
    [lead.employer?.firstName, lead.employer?.lastName].filter(Boolean).join(' ').trim() ||
    undefined;
  const tmpl = vendorNewLeadEmail({
    recipientName: vendor.user.firstName ?? undefined,
    employerName,
    jobTitle: lead.jobPost?.title ?? undefined,
    requirementPreview: lead.requirementText,
    inboxUrl,
  });
  await emailQueue.add('send-email', {
    to: vendor.user.email,
    subject: tmpl.subject,
    html: tmpl.html,
    text: tmpl.text,
  });
}

// =====================================================================
// Lead auto-routing — match an employer's requirement to top-N vendors
// =====================================================================

export interface MatchAndSendArgs {
  employerUserId: string;
  requirementText: string;
  contactEmail: string;
  contactPhone?: string;
  jobPostId?: string;
  /** Filter signals — at least one is required for matching to be useful. */
  services?: string[];
  industries?: string[];
  locations?: string[];
  /** Cap on how many vendors receive the lead. Defaults to 3. */
  limit?: number;
  /**
   * If provided, skip matching and send to exactly these vendor profile IDs
   * (still re-validated against the active-subscription filter). Used by
   * the 2-step "preview then confirm" UI so the user-visible ranking
   * matches what actually gets sent.
   */
  vendorIds?: string[];
}

export interface VendorMatchPreview {
  id: string;
  slug: string;
  businessName: string;
  logo: string | null;
  description: string | null;
  services: string[];
  locations: string[];
  industries: string[];
  isVerified: boolean;
  yearsInBusiness: number | null;
  teamSize: number | null;
  score: number;
}

interface MatchAndSendResult {
  matched: number;
  vendors: Array<{ id: string; slug: string; businessName: string; score: number }>;
}

/**
 * Find top-N matching vendors and fan out a single requirement to all
 * of them. Each receiving vendor gets their own VendorLead row so they
 * can respond independently.
 *
 * Matching score = service overlap × 3 + location overlap × 2 +
 * industry overlap × 1. Verified vendors get a +1 tie-breaker.
 *
 * Vendors must have an active VENDOR_CONNECT entitlement (same filter
 * as `listPublicVendors`) to be eligible.
 */
/**
 * Score vendors against a requirement and return the top-N. Pure read,
 * no side effects — the 2-step UI uses this for the preview screen and
 * `matchAndSendLead` calls it internally when `vendorIds` is unset.
 */
export async function previewMatches(args: {
  services?: string[];
  industries?: string[];
  locations?: string[];
  limit?: number;
}): Promise<{ matches: VendorMatchPreview[] }> {
  const limit = Math.min(10, Math.max(1, Math.floor(args.limit ?? 3)));
  const eligibleUserIds = await getUsersWithActiveVendorListing();
  if (eligibleUserIds.length === 0) {
    return { matches: [] };
  }

  // Plan-promise: VENDOR_CONNECT subscribers get "Priority Access to
  // New Leads". The plan grants `feature.vendor_priority_leads`, which
  // we now use as a +5 ranking bonus on top of overlap/verified scoring.
  const { getUsersWithFeatureAll } = await import('./entitlement.service');
  const priorityIds = new Set(await getUsersWithFeatureAll('feature.vendor_priority_leads'));

  const candidates = await prisma.vendorProfile.findMany({
    where: { isPublic: true, userId: { in: eligibleUserIds } },
    select: {
      id: true,
      slug: true,
      userId: true,
      businessName: true,
      logo: true,
      description: true,
      isVerified: true,
      services: true,
      industries: true,
      locations: true,
      yearsInBusiness: true,
      teamSize: true,
    },
  });

  const services = (args.services ?? []).map((s) => s.toLowerCase().trim());
  const industries = (args.industries ?? []).map((s) => s.toLowerCase().trim());
  const locations = (args.locations ?? []).map((s) => s.toLowerCase().trim());

  const scored: VendorMatchPreview[] = candidates
    .map((v) => {
      const sOverlap = countOverlap(v.services, services) * 3;
      const lOverlap = countOverlap(v.locations, locations) * 2;
      const iOverlap = countOverlap(v.industries, industries);
      const verifiedBonus = v.isVerified ? 1 : 0;
      const priorityBonus = priorityIds.has(v.userId) ? 5 : 0;
      const score = sOverlap + lOverlap + iOverlap + verifiedBonus + priorityBonus;
      // Strip userId before returning — keep the public preview shape clean.
      const { userId: _userId, ...rest } = v;
      return { ...rest, score };
    })
    .filter((v) => v.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { matches: scored };
}

export async function matchAndSendLead(args: MatchAndSendArgs): Promise<MatchAndSendResult> {
  if (!args.requirementText?.trim() || args.requirementText.trim().length < 20) {
    throw new BadRequestError('requirementText must be at least 20 characters');
  }

  // Two paths: explicit `vendorIds` (from the preview-then-confirm UI),
  // or run matching ourselves. Both end up with `scored` of the vendors
  // we'll create leads for.
  let scored: Array<{ id: string; slug: string; businessName: string; score: number }>;

  if (args.vendorIds && args.vendorIds.length > 0) {
    // Re-validate against the active-subscription filter so a stale
    // preview can't slip a lapsed vendor through.
    const eligibleUserIds = await getUsersWithActiveVendorListing();
    if (eligibleUserIds.length === 0) {
      return { matched: 0, vendors: [] };
    }
    const rows = await prisma.vendorProfile.findMany({
      where: {
        id: { in: args.vendorIds },
        isPublic: true,
        userId: { in: eligibleUserIds },
      },
      select: { id: true, slug: true, businessName: true },
    });
    if (rows.length === 0) return { matched: 0, vendors: [] };
    // Score is 0 here — UI already showed it during preview. We still
    // store rows so the create-lead loop has consistent shape.
    scored = rows.map((v) => ({ ...v, score: 0 }));
  } else {
    const { matches } = await previewMatches({
      services: args.services,
      industries: args.industries,
      locations: args.locations,
      limit: args.limit,
    });
    if (matches.length === 0) return { matched: 0, vendors: [] };
    scored = matches.map((m) => ({
      id: m.id,
      slug: m.slug,
      businessName: m.businessName,
      score: m.score,
    }));
  }

  // Create one VendorLead per matched vendor, then fire notification emails.
  const expiresAt = new Date(Date.now() + 14 * 86_400_000);
  const created = await prisma.$transaction(
    scored.map((v) =>
      prisma.vendorLead.create({
        data: {
          vendorProfileId: v.id,
          employerId: args.employerUserId,
          requirementText: args.requirementText.trim(),
          contactEmail: args.contactEmail.trim().toLowerCase(),
          contactPhone: args.contactPhone?.trim() ?? null,
          jobPostId: args.jobPostId ?? null,
          expiresAt,
        },
      })
    )
  );

  // Fire-and-forget email notifications to each vendor.
  void Promise.all(
    created.map((lead, i) =>
      notifyVendorOfNewLead(scored[i].id, lead.id).catch((err) =>
        logger.warn('vendor lead email failed (match-and-send)', {
          vendorProfileId: scored[i].id,
          err: err instanceof Error ? err.message : err,
        })
      )
    )
  );

  return {
    matched: scored.length,
    vendors: scored.map((v) => ({
      id: v.id,
      slug: v.slug,
      businessName: v.businessName,
      score: v.score,
    })),
  };
}

function countOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b.map((s) => s.toLowerCase().trim()));
  let count = 0;
  for (const item of a) {
    if (setB.has(item.toLowerCase().trim())) count += 1;
  }
  return count;
}

// =====================================================================
// Reviews
// =====================================================================

export interface CreateReviewInput {
  reviewerUserId: string;
  vendorSlug: string;
  rating: number;
  text?: string;
}

/**
 * Create or update an employer's review of a vendor.
 *
 * Eligibility:
 *   - Reviewer must be an employer (controller-level role check).
 *   - One review per (vendor, reviewer) — uniqueness enforced at DB level.
 *
 * Verification:
 *   - We mark `verified=true` when the reviewer has an existing
 *     RESPONDED / ACCEPTED VendorLead with this vendor. This drives a
 *     visual "Verified review" badge in the UI without blocking
 *     unverified reviewers from leaving feedback.
 */
export async function createReview(args: CreateReviewInput) {
  const rating = Math.round(args.rating);
  if (rating < 1 || rating > 5) {
    throw new BadRequestError('Rating must be 1–5');
  }
  const vendor = await prisma.vendorProfile.findUnique({
    where: { slug: args.vendorSlug },
    select: { id: true },
  });
  if (!vendor) throw new NotFoundError('Vendor not found');

  const verifiedLead = await prisma.vendorLead.findFirst({
    where: {
      vendorProfileId: vendor.id,
      employerId: args.reviewerUserId,
      status: { in: [VendorLeadStatus.RESPONDED, VendorLeadStatus.ACCEPTED] },
    },
    select: { id: true },
  });

  return prisma.vendorReview.upsert({
    where: {
      vendorProfileId_reviewerId: {
        vendorProfileId: vendor.id,
        reviewerId: args.reviewerUserId,
      },
    },
    create: {
      vendorProfileId: vendor.id,
      reviewerId: args.reviewerUserId,
      rating,
      text: args.text?.trim() || null,
      verified: Boolean(verifiedLead),
    },
    update: {
      rating,
      text: args.text?.trim() || null,
      verified: Boolean(verifiedLead),
    },
  });
}

export async function listReviewsForSlug(slug: string, page = 1, limit = 20) {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!vendor) throw new NotFoundError('Vendor not found');
  const cappedLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const skip = (Math.max(1, page) - 1) * cappedLimit;
  const [items, total, agg] = await prisma.$transaction([
    prisma.vendorReview.findMany({
      where: { vendorProfileId: vendor.id },
      orderBy: [{ verified: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: cappedLimit,
      include: {
        reviewer: { select: { firstName: true, lastName: true, avatar: true } },
      },
    }),
    prisma.vendorReview.count({ where: { vendorProfileId: vendor.id } }),
    prisma.vendorReview.aggregate({
      where: { vendorProfileId: vendor.id },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);
  return {
    items,
    pagination: { total, page, limit: cappedLimit, pages: Math.ceil(total / cappedLimit) || 1 },
    avgRating: agg._avg.rating ?? null,
    reviewCount: agg._count._all,
  };
}

/** Quick helper used by the directory list endpoint to add aggregate
 *  stats to each vendor card without an N+1. */
export async function getRatingStats(
  vendorProfileIds: string[]
): Promise<Map<string, { avgRating: number | null; reviewCount: number }>> {
  if (vendorProfileIds.length === 0) return new Map();
  const rows = await prisma.vendorReview.groupBy({
    by: ['vendorProfileId'],
    where: { vendorProfileId: { in: vendorProfileIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const map = new Map<string, { avgRating: number | null; reviewCount: number }>();
  for (const r of rows) {
    map.set(r.vendorProfileId, {
      avgRating: r._avg.rating ?? null,
      reviewCount: r._count._all,
    });
  }
  return map;
}

// Re-exports for controllers
export { VendorLeadStatus };
export type { VendorProfile, VendorLead };

// Helper for controllers that need to fail fast if the user isn't a vendor.
export async function ensureHasProfile(userId: string): Promise<VendorProfile> {
  const profile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(
      'Set up your vendor profile before using this feature.',
      400,
      'NO_VENDOR_PROFILE'
    );
  }
  return profile;
}
