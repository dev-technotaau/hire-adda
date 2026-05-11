import { Router } from 'express';
import { z } from 'zod';
import * as EntitlementController from '../controllers/entitlement.controller';
import { protect } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import { Role } from '@prisma/client';
import { validate } from '../validators/validate';
import { audit } from '../middleware/audit';

const userRouter = Router();
userRouter.use(protect);
userRouter.get('/me/entitlements', EntitlementController.getMyEntitlements);

const superAdminRouter = Router();
superAdminRouter.use(protect, restrictTo(Role.SUPER_ADMIN));
superAdminRouter.get(
  '/users/:userId',
  validate({ params: z.object({ userId: z.string().uuid() }) }),
  EntitlementController.getUserEntitlementsAdmin
);
superAdminRouter.post(
  '/grant',
  validate({
    body: z.object({
      userId: z.string().uuid(),
      planId: z.string().uuid(),
      validityDays: z.number().int().min(1).max(3650),
      notes: z.string().max(500).optional(),
    }),
  }),
  audit('GRANT_ENTITLEMENT', 'Entitlement'),
  EntitlementController.grantManualEntitlement
);
superAdminRouter.post(
  '/:id/revoke',
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ reason: z.string().min(2).max(500) }),
  }),
  audit('REVOKE_ENTITLEMENT', 'Entitlement'),
  EntitlementController.revokeEntitlementAdmin
);

export { userRouter as entitlementUserRouter, superAdminRouter as entitlementSuperAdminRouter };
export default userRouter;
