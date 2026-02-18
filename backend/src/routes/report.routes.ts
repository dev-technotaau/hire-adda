import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth';
import * as reportController from '../controllers/report.controller';
import { Role } from '@prisma/client';
import { validate } from '../validators/validate';
import { exportReportSchema } from '../schemas/report.schema';

const router = Router();

router.use(protect);
router.use(restrictTo(Role.ADMIN, Role.SUPER_ADMIN));

router.get('/users/export', validate(exportReportSchema), reportController.exportUsersExcel);
router.get('/jobs/export', validate(exportReportSchema), reportController.exportJobsExcel);
router.get('/analytics/export', reportController.exportAnalyticsPdf);

export default router;
