import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import * as ctrl from '../controllers/assisted-hiring.controller';

const router = Router();

router.use(protect);
router.use(restrictTo(Role.SUPER_ADMIN, Role.ADMIN));

router.get('/', ctrl.queue);
router.get('/:id', ctrl.detail);
router.patch('/:id/claim', ctrl.claim);
router.patch('/:id/schedule-call', ctrl.scheduleCall);
router.patch('/:id/start', ctrl.startSourcing);
router.post('/:id/profiles', ctrl.addProfile);
router.delete('/profiles/:profileId', ctrl.removeProfile);
router.post('/:id/deliver', ctrl.deliver);
router.patch('/:id/complete', ctrl.complete);
router.patch('/:id/cancel', ctrl.cancel);

export default router;
