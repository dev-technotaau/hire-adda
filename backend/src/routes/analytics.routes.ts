import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { protect } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(restrictTo(Role.ADMIN, Role.SUPER_ADMIN));

router.get('/advanced/user-growth', analyticsController.getUserGrowth);
router.get('/advanced/application-funnel', analyticsController.getApplicationFunnel);
router.get('/advanced/popular-skills', analyticsController.getPopularSkills);
router.get('/advanced/salary-trends', analyticsController.getSalaryTrends);
router.get('/advanced/job-trends', analyticsController.getJobTrends);

export default router;
