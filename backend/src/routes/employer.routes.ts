import { Router } from 'express';
import multer from 'multer';
import { protect, restrictTo } from '../middleware/auth';
import * as employerController from '../controllers/employer.controller';
import { Role } from '@prisma/client';
import { validate } from '../validators/validate';
import { updateCompanyProfileSchema } from '../schemas/employer.schema';
import { audit } from '../middleware/audit';

const router = Router();

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    }
});

// All routes require authentication and EMPLOYER role
router.use(protect);
router.use(restrictTo(Role.EMPLOYER));

router.get('/dashboard', employerController.getDashboard);
router.get('/engagement-metrics', employerController.getEngagementMetrics);
router.get('/analytics', employerController.getAnalytics);
router.get('/analytics/export', employerController.exportAnalytics);

router.get('/me', employerController.getMyCompany);
router.put('/me', validate(updateCompanyProfileSchema), audit('PROFILE_UPDATE', 'CompanyProfile'), employerController.updateMyCompany);

router.post(
    '/me/logo',
    upload.single('logo'),
    employerController.uploadLogo
);
router.delete('/me/logo', employerController.removeLogo);

router.get('/me/profile-views', employerController.getProfileViews);

router.get(
    '/candidates/search',
    employerController.searchCandidates
);

export default router;
