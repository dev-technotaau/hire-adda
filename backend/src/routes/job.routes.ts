import { Router } from 'express';
import { protect } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import * as jobController from '../controllers/job.controller';
import { validate } from '../validators/validate';
import {
  createJobSchema,
  updateJobSchema,
  updateApplicationStatusSchema,
  applyToJobSchema,
} from '../schemas/job.schema';
import { searchJobsSchema } from '../schemas/search.schema';
import { Role } from '@prisma/client';
import { audit } from '../middleware/audit';

const router = Router();

// Public: Search jobs
router.get('/', validate(searchJobsSchema), jobController.searchJobs);

// --- Static paths MUST be registered before /:id to avoid route conflicts ---

// Candidate: Get Saved Jobs
router.get('/saved', protect, restrictTo(Role.CANDIDATE), jobController.getSavedJobs);

// Candidate: Get Applied Jobs
router.get('/applications/me', protect, restrictTo(Role.CANDIDATE), jobController.getAppliedJobs);

// Employer: Get my posted jobs
router.get('/employer/my-jobs', protect, restrictTo(Role.EMPLOYER), jobController.getMyJobs);

// Application management (static multi-segment paths)
router.get('/applications/:applicationId', protect, jobController.getApplicationDetail);
router.patch(
  '/applications/:applicationId/withdraw',
  protect,
  restrictTo(Role.CANDIDATE),
  jobController.withdrawApplication
);
router.patch(
  '/applications/:applicationId',
  protect,
  restrictTo(Role.EMPLOYER),
  validate(updateApplicationStatusSchema),
  jobController.updateApplicationStatus
);

// Public: View single job (must come AFTER static paths like /saved, /applications/me)
router.get('/:id', jobController.getJob);

// --- Dynamic /:id routes (all protected) ---

// Candidate actions
router.post(
  '/:id/apply',
  protect,
  restrictTo(Role.CANDIDATE),
  validate(applyToJobSchema),
  jobController.applyToJob
);
router.post('/:id/save', protect, restrictTo(Role.CANDIDATE), jobController.toggleSaveJob);

// Employer actions
router.post(
  '/:id/clone',
  protect,
  restrictTo(Role.EMPLOYER),
  audit('JOB_CREATE', 'JobPost'),
  jobController.cloneJob
);
router.get(
  '/:id/applications',
  protect,
  restrictTo(Role.EMPLOYER),
  jobController.getJobApplications
);
router.put(
  '/:id',
  protect,
  restrictTo(Role.EMPLOYER),
  validate(updateJobSchema),
  audit('JOB_UPDATE', 'JobPost'),
  jobController.updateJob
);
router.patch(
  '/:id/deactivate',
  protect,
  restrictTo(Role.EMPLOYER),
  audit('JOB_CLOSE', 'JobPost'),
  jobController.deactivateJob
);

// Employer: Create job
router.post(
  '/',
  protect,
  restrictTo(Role.EMPLOYER),
  validate(createJobSchema),
  audit('JOB_CREATE', 'JobPost'),
  jobController.createJob
);

export default router;
