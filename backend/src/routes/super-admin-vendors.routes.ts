import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import * as vendorsController from '../controllers/super-admin-vendors.controller';

const router = Router();

router.use(protect);
router.use(restrictTo(Role.SUPER_ADMIN));

// Combined teams + vendors analytics for the SA dashboard tile.
// Mounted under /vendors/analytics rather than /teams/analytics so the
// existing super-admin top-level group stays clean.
router.get('/analytics', vendorsController.analytics);

router.get('/', vendorsController.list);
router.get('/:id', vendorsController.detail);
router.patch('/:id/verify', vendorsController.setVerified);
router.patch('/:id/visibility', vendorsController.setVisibility);
router.delete('/reviews/:reviewId', vendorsController.deleteReview);

export default router;
