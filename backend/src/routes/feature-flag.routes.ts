import { Router } from 'express';
import { protect } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import { cache } from '../middleware/cache';
import { Role } from '@prisma/client';
import * as featureFlagController from '../controllers/feature-flag.controller';

const router = Router();

// Public: client flags (no auth required — cached 30min, rarely changes)
router.get('/client', cache({ ttl: 1800 }), featureFlagController.getClientFlags);

// Admin only: all flags
router.get('/', protect, restrictTo(Role.ADMIN, Role.SUPER_ADMIN), featureFlagController.getFlags);

// Admin only: single flag
router.get(
  '/:key',
  protect,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  featureFlagController.getFlagByKey
);

export default router;
