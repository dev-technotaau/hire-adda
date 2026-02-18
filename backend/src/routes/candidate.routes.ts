import { Router } from 'express';
import multer from 'multer';
import { protect, restrictTo } from '../middleware/auth';
import * as candidateController from '../controllers/candidate.controller';
import * as jobAlertController from '../controllers/job-alert.controller';
import { Role } from '@prisma/client';
import { validate } from '../validators/validate';
import { updateCandidateProfileSchema } from '../schemas/candidate.schema';
import { createJobAlertSchema, updateJobAlertSchema } from '../schemas/job-alert.schema';
import { audit } from '../middleware/audit';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect);

// Candidate-only routes
router.get('/me/dashboard', restrictTo(Role.CANDIDATE), candidateController.getDashboard);
router.get('/me/completeness', restrictTo(Role.CANDIDATE), candidateController.getProfileCompleteness);
router.get('/me/resume/generate', restrictTo(Role.CANDIDATE), candidateController.generateResumePdf);
router.get('/me/profile-views', restrictTo(Role.CANDIDATE), candidateController.getProfileViews);

// Analytics
router.get('/me/analytics', restrictTo(Role.CANDIDATE), candidateController.getAnalytics);
router.get('/me/analytics/export', restrictTo(Role.CANDIDATE), candidateController.exportAnalytics);

// Job Alerts
router.get('/me/job-alerts', restrictTo(Role.CANDIDATE), jobAlertController.getAlerts);
router.post('/me/job-alerts', restrictTo(Role.CANDIDATE), validate(createJobAlertSchema), jobAlertController.createAlert);
router.put('/me/job-alerts/:id', restrictTo(Role.CANDIDATE), validate(updateJobAlertSchema), jobAlertController.updateAlert);
router.delete('/me/job-alerts/:id', restrictTo(Role.CANDIDATE), jobAlertController.deleteAlert);
router.get('/me/job-alerts/:id/matches', restrictTo(Role.CANDIDATE), jobAlertController.getAlertMatches);

router.get('/me', restrictTo(Role.CANDIDATE), candidateController.getMyProfile);
router.put('/me', restrictTo(Role.CANDIDATE), validate(updateCandidateProfileSchema), audit('PROFILE_UPDATE', 'CandidateProfile'), candidateController.updateMyProfile);

router.post('/me/resume', restrictTo(Role.CANDIDATE), upload.single('resume'), audit('RESUME_UPLOAD', 'CandidateProfile'), candidateController.uploadResume);
router.post('/me/resume/parse', restrictTo(Role.CANDIDATE), candidateController.triggerResumeParse);
router.get('/me/resume/parsed', restrictTo(Role.CANDIDATE), candidateController.getParsedResumeData);
router.post('/me/avatar', restrictTo(Role.CANDIDATE), upload.single('avatar'), candidateController.uploadAvatar);
router.delete('/me/avatar', restrictTo(Role.CANDIDATE), candidateController.removeAvatar);

// Employer/Admin: Search & view candidates
router.get('/', restrictTo(Role.EMPLOYER, Role.ADMIN), candidateController.searchCandidates);
router.get('/:id', restrictTo(Role.EMPLOYER, Role.ADMIN), candidateController.getCandidateProfile);

export default router;
