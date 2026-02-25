import { Role } from '@prisma/client';
import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import * as emailPreviewController from '../controllers/email-preview.controller';
import { audit } from '../middleware/audit';
import { protect } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import { requireMfaEnabled } from '../middleware/require-mfa';
import { analyticsQuerySchema, auditLogQuerySchema, flagJobSchema, suspendUserSchema, updateUserRoleSchema } from '../schemas/admin.schema';
import { firestoreCountersService } from '../services/firestore-counters.service';
import { kafkaEventsService } from '../services/kafka-events.service';
import { validate } from '../validators/validate';

const router = Router();

// Protect all admin routes
router.use(protect);
router.use(restrictTo(Role.ADMIN, Role.SUPER_ADMIN));
router.use(requireMfaEnabled);

router.get('/stats', adminController.getDashboardStats);
router.get('/activity', adminController.getRecentActivity);

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.delete('/users/:id', audit('DELETE_USER', 'User'), adminController.deleteUser);
router.patch('/users/:id/suspend', validate(suspendUserSchema), audit('SUSPEND_USER', 'User'), adminController.suspendUser);
router.patch('/users/:id/activate', audit('ACTIVATE_USER', 'User'), adminController.activateUser);
router.patch('/users/:id/role', validate(updateUserRoleSchema), audit('UPDATE_USER_ROLE', 'User'), adminController.updateUserRole);

router.get('/jobs', adminController.getAllJobs);
router.delete('/jobs/:id', audit('DELETE_JOB', 'Job'), adminController.deleteJob);
router.patch('/jobs/:id/status', audit('MODERATE_JOB', 'Job'), adminController.moderateJob);
router.patch('/jobs/:id/flag', validate(flagJobSchema), audit('FLAG_JOB', 'Job'), adminController.flagJob);

router.get('/stats/comprehensive', adminController.getComprehensiveStats);
router.get('/stats/daily-active-users', adminController.getDailyActiveUsers);
router.get('/analytics', validate(analyticsQuerySchema), adminController.getDetailedAnalytics);
router.get('/audit-logs', validate(auditLogQuerySchema), adminController.getAuditLogs);

// Email template preview
router.get('/email-templates', emailPreviewController.listTemplates);
router.post('/email-templates/preview', emailPreviewController.previewTemplate);
router.post('/email-templates/test', emailPreviewController.sendTestEmail);

// Kafka event viewer
router.get('/kafka-events', (_req, res) => {
    const limit = Number(_req.query.limit) || 20;
    const events = kafkaEventsService.getRecentEvents(limit);
    res.status(200).json({ status: 'success', data: events });
});

// Firestore live counters
router.get('/live-counters', async (_req, res, next) => {
    try {
        const counters = await firestoreCountersService.getCounters();
        res.status(200).json({ status: 'success', data: counters });
    } catch (error) {
        next(error);
    }
});

// Content Moderation
router.get('/moderation/keywords', adminController.getModerationKeywords);
router.post('/moderation/keywords', adminController.addModerationKeyword);
router.delete('/moderation/keywords/:keyword', adminController.removeModerationKeyword);

// Application Monitoring
router.get('/applications', adminController.getApplications);
router.get('/applications/stats', adminController.getApplicationStats);

// Note: Verification routes are under /verifications/pending and /verifications/:id/review
// which are also admin restricted.

export default router;
