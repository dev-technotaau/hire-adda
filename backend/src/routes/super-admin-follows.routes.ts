/**
 * Super-admin follow routes — read-only insight into the follow graph.
 *
 *   GET /super-admin/follows/stats
 *   GET /super-admin/follows/companies/:companyId/followers
 *   GET /super-admin/follows/users/:userId/following
 *
 * All routes are SUPER_ADMIN-only. No mutations from this surface —
 * super-admins shouldn't follow/unfollow on behalf of users.
 */
import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { protect } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import { validate } from '../validators/validate';
import { audit } from '../middleware/audit';
import * as ctrl from '../controllers/super-admin-follows.controller';

const router = Router();
router.use(protect, restrictTo(Role.SUPER_ADMIN));

const companyIdParams = z.object({ companyId: z.string().uuid() });
const userIdParams = z.object({ userId: z.string().uuid() });

router.get('/stats', audit('VIEW_FOLLOW_STATS', 'CompanyFollow'), ctrl.getStats);
router.get(
  '/companies/:companyId/followers',
  validate({ params: companyIdParams }),
  audit('VIEW_COMPANY_FOLLOWERS', 'CompanyFollow'),
  ctrl.listCompanyFollowers
);
router.get(
  '/users/:userId/following',
  validate({ params: userIdParams }),
  audit('VIEW_USER_FOLLOWING', 'CompanyFollow'),
  ctrl.listUserFollowing
);

export default router;
