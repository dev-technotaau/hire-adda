import { Router } from 'express';
import * as PlanController from '../controllers/plan.controller';
import { protect } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import { Role } from '@prisma/client';
import { cache } from '../middleware/cache';
import { validate } from '../validators/validate';
import {
  createPlanSchema,
  updatePlanSchema,
  planCatalogQuerySchema,
} from '../validators/billing.validator';
import { audit } from '../middleware/audit';

const router = Router();

/**
 * Public plan catalog. Cached 5 min — refresh on plan publish/archive.
 *
 *   GET  /api/v1/plans
 *   GET  /api/v1/plans/code/:code
 *   GET  /api/v1/plans/slug/:slug
 *
 * Super-admin CRUD lives at /api/v1/super-admin/billing/plans (mounted in
 * super-admin.routes.ts) — but the controller is shared.
 */
router.get(
  '/',
  cache({ ttl: 300 }),
  validate({ query: planCatalogQuerySchema }),
  PlanController.listPublicPlans
);

router.get('/code/:code', cache({ ttl: 300 }), PlanController.getPublicPlanByCode);
router.get('/slug/:slug', cache({ ttl: 300 }), PlanController.getPublicPlanBySlug);

/**
 * Authenticated super-admin sub-router. Mounted under /super-admin/plans
 * to keep the public surface clean. The /super-admin route in super-admin.routes.ts
 * will mount this. For now we expose them at /admin/plans for direct access too.
 */
export const superAdminPlanRouter = Router();
superAdminPlanRouter.use(protect, restrictTo(Role.SUPER_ADMIN));

superAdminPlanRouter.get(
  '/',
  validate({ query: planCatalogQuerySchema }),
  PlanController.listPlansAdmin
);
superAdminPlanRouter.get('/:id', PlanController.getPlanByIdAdmin);
superAdminPlanRouter.post(
  '/',
  validate({ body: createPlanSchema }),
  audit('CREATE_PLAN', 'Plan'),
  PlanController.createPlan
);
superAdminPlanRouter.patch(
  '/:id',
  validate({ body: updatePlanSchema }),
  audit('UPDATE_PLAN', 'Plan'),
  PlanController.updatePlan
);
superAdminPlanRouter.post(
  '/:id/publish',
  audit('PUBLISH_PLAN', 'Plan'),
  PlanController.publishPlan
);
superAdminPlanRouter.post(
  '/:id/archive',
  audit('ARCHIVE_PLAN', 'Plan'),
  PlanController.archivePlan
);

export default router;
