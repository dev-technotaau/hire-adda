import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import * as teamsController from '../controllers/super-admin-teams.controller';

const router = Router();

router.use(protect);
router.use(restrictTo(Role.SUPER_ADMIN));

router.get('/', teamsController.list);
router.get('/:companyId', teamsController.detail);
// Force-revoke a member — bypasses owner-side RBAC for compliance.
router.delete('/members/:memberId', teamsController.forceRevoke);

export default router;
