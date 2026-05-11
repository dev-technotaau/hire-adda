/**
 * Company-review routes — single file covers the full surface area
 * (mounted at /api/v1):
 *
 *   Public-ish (auth optional):
 *     POST   /public/companies/:idOrSlug/reviews
 *     GET    /public/companies/:idOrSlug/reviews
 *     GET    /public/companies/:idOrSlug/reviews/stats
 *     GET    /public/companies/:idOrSlug/reviews/facets
 *     GET    /public/companies/:idOrSlug/reviews/top-job-profiles
 *     POST   /public/reviews/:id/vote
 *     POST   /public/reviews/:id/report
 *     GET    /public/companies-autocomplete
 *
 *   Candidate (authed):
 *     GET    /candidate/reviews
 *     DELETE /candidate/reviews/:id
 *
 *   Employer (authed):
 *     GET    /employer/reviews
 *     GET    /employer/reviews/stats
 *     POST   /employer/reviews/:id/report
 *
 *   Super-admin (authed + RBAC):
 *     GET    /super-admin/reviews
 *     POST   /super-admin/reviews/:id/moderate
 *     GET    /super-admin/companies/:companyId/reviews
 */
import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect, optionalAuth } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import {
  publicLimiter,
  reviewSubmitLimiter,
  reviewVoteLimiter,
  reviewReportLimiter,
} from '../middleware/rate-limit';
import * as ctrl from '../controllers/company-review.controller';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────
router.get(
  '/public/companies-autocomplete',
  publicLimiter,
  optionalAuth,
  ctrl.companiesAutocomplete
);
router.get(
  '/public/companies-with-reviews-sitemap',
  publicLimiter,
  ctrl.companiesWithReviewsSitemap
);

router.post('/public/companies/:idOrSlug/reviews', reviewSubmitLimiter, optionalAuth, ctrl.submit);
router.get('/public/companies/:idOrSlug/reviews', publicLimiter, optionalAuth, ctrl.list);
router.get('/public/companies/:idOrSlug/reviews/stats', publicLimiter, optionalAuth, ctrl.stats);
router.get('/public/companies/:idOrSlug/reviews/facets', publicLimiter, optionalAuth, ctrl.facets);
router.get(
  '/public/companies/:idOrSlug/reviews/top-job-profiles',
  publicLimiter,
  optionalAuth,
  ctrl.topJobProfiles
);

router.post('/public/reviews/:id/vote', reviewVoteLimiter, optionalAuth, ctrl.vote);
router.post('/public/reviews/:id/report', reviewReportLimiter, optionalAuth, ctrl.report);

// ── Candidate ────────────────────────────────────────────────────────
router.get('/candidate/reviews', protect, restrictTo(Role.CANDIDATE), ctrl.listOwnReviews);
router.delete('/candidate/reviews/:id', protect, restrictTo(Role.CANDIDATE), ctrl.deleteOwnReview);

// ── Employer ─────────────────────────────────────────────────────────
router.get('/employer/reviews', protect, restrictTo(Role.EMPLOYER), ctrl.listEmployerReviews);
router.get('/employer/reviews/stats', protect, restrictTo(Role.EMPLOYER), ctrl.employerStats);
router.post(
  '/employer/reviews/:id/report',
  protect,
  restrictTo(Role.EMPLOYER),
  reviewReportLimiter,
  ctrl.employerReportReview
);

// ── Super-admin ──────────────────────────────────────────────────────
router.get(
  '/super-admin/reviews',
  protect,
  restrictTo(Role.SUPER_ADMIN),
  ctrl.listSuperAdminReviews
);
router.post(
  '/super-admin/reviews/:id/moderate',
  protect,
  restrictTo(Role.SUPER_ADMIN),
  ctrl.moderateReview
);
router.get(
  '/super-admin/companies/:companyId/reviews',
  protect,
  restrictTo(Role.SUPER_ADMIN),
  ctrl.listReviewsForCompanyByAdmin
);

export default router;
