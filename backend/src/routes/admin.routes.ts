import { Role } from '@prisma/client';
import { Router } from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import * as adminController from '../controllers/admin.controller';
import * as emailPreviewController from '../controllers/email-preview.controller';
import { audit } from '../middleware/audit';
import { protect } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import { requireMfaEnabled } from '../middleware/require-mfa';
import {
  analyticsQuerySchema,
  auditLogQuerySchema,
  flagJobSchema,
  suspendUserSchema,
  updateUserRoleSchema,
} from '../schemas/admin.schema';
import { firestoreCountersService } from '../services/firestore-counters.service';
import { kafkaEventsService } from '../services/kafka-events.service';
import { validate } from '../validators/validate';

// Import all BullMQ queues for Bull Board monitoring
import { emailQueue } from '../jobs/email.queue';
import { smsQueue } from '../jobs/sms.queue';
import { fcmQueue } from '../jobs/fcm.queue';
import { webPushQueue } from '../jobs/web-push.queue';
import { inAppQueue } from '../jobs/in-app.queue';
import { whatsappQueue } from '../jobs/whatsapp.queue';
import { webhookQueue } from '../jobs/webhook.queue';
import { matchingQueue } from '../jobs/matching.queue';
import { geocodingQueue } from '../jobs/geocoding.queue';
import { resumeParseQueue } from '../jobs/resume-parse.queue';
import { esReindexQueue } from '../jobs/es-reindex.queue';
import { schedulerQueue } from '../jobs/scheduler.queue';
import { onboardingDripQueue } from '../jobs/onboarding-drip.queue';
import { imageProcessingQueue } from '../jobs/image-processing.queue';

// Bull Board setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/api/v1/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(smsQueue),
    new BullMQAdapter(fcmQueue),
    new BullMQAdapter(webPushQueue),
    new BullMQAdapter(inAppQueue),
    new BullMQAdapter(whatsappQueue),
    new BullMQAdapter(webhookQueue),
    new BullMQAdapter(matchingQueue),
    new BullMQAdapter(geocodingQueue),
    new BullMQAdapter(resumeParseQueue),
    new BullMQAdapter(esReindexQueue),
    new BullMQAdapter(schedulerQueue),
    new BullMQAdapter(onboardingDripQueue),
    new BullMQAdapter(imageProcessingQueue),
  ],
  serverAdapter,
});

const router = Router();

// Protect all admin routes
router.use(protect);
router.use(restrictTo(Role.ADMIN, Role.SUPER_ADMIN));
router.use(requireMfaEnabled);

// Bull Board queue monitor dashboard (SUPER_ADMIN only)
router.use('/queues', restrictTo(Role.SUPER_ADMIN), serverAdapter.getRouter());

router.get('/stats', adminController.getDashboardStats);
router.get('/activity', adminController.getRecentActivity);

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.delete('/users/:id', audit('DELETE_USER', 'User'), adminController.deleteUser);
router.patch(
  '/users/:id/suspend',
  validate(suspendUserSchema),
  audit('SUSPEND_USER', 'User'),
  adminController.suspendUser
);
router.patch('/users/:id/activate', audit('ACTIVATE_USER', 'User'), adminController.activateUser);
router.patch(
  '/users/:id/role',
  validate(updateUserRoleSchema),
  audit('UPDATE_USER_ROLE', 'User'),
  adminController.updateUserRole
);

router.get('/jobs', adminController.getAllJobs);
router.delete('/jobs/:id', audit('DELETE_JOB', 'Job'), adminController.deleteJob);
router.patch('/jobs/:id/status', audit('MODERATE_JOB', 'Job'), adminController.moderateJob);
router.patch(
  '/jobs/:id/flag',
  validate(flagJobSchema),
  audit('FLAG_JOB', 'Job'),
  adminController.flagJob
);

router.get('/stats/comprehensive', adminController.getComprehensiveStats);
router.get('/stats/daily-active-users', adminController.getDailyActiveUsers);
router.get('/analytics', validate(analyticsQuerySchema), adminController.getDetailedAnalytics);
router.get('/audit-logs', validate(auditLogQuerySchema), adminController.getAuditLogs);

// Email template preview
router.get('/email-templates', emailPreviewController.listTemplates);
router.post('/email-templates/preview', emailPreviewController.previewTemplate);
router.post('/email-templates/test', emailPreviewController.sendTestEmail);

// Kafka event viewer
router.get('/kafka-events', async (_req, res) => {
  const limit = Number(_req.query.limit) || 20;
  const events = await kafkaEventsService.getRecentEvents(limit);
  res.status(200).json({ status: 'success', data: events });
});

// Kafka DLQ messages (SUPER_ADMIN only)
router.get('/kafka-dlq', async (req, res, next) => {
  try {
    const { kafkaReplayService } = await import('../services/kafka-replay.service');
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const replayed = req.query.replayed === 'true' ? true : req.query.replayed === 'false' ? false : undefined;
    const data = await kafkaReplayService.getDlqMessages(page, limit, replayed);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
});

// Replay a specific DLQ message (SUPER_ADMIN only)
router.post('/kafka-dlq/:id/replay', async (req, res, next) => {
  try {
    const { kafkaReplayService } = await import('../services/kafka-replay.service');
    await kafkaReplayService.replayDlqMessage(req.params.id);
    res.status(200).json({ status: 'success', message: 'DLQ message replayed' });
  } catch (error) {
    next(error);
  }
});

// Replay events by time range (SUPER_ADMIN only)
router.post('/kafka-replay', async (req, res, next) => {
  try {
    const { kafkaReplayService } = await import('../services/kafka-replay.service');
    const { startTime, endTime, eventTypes } = req.body;
    if (!startTime || !endTime) {
      res.status(400).json({ status: 'error', error: { message: 'startTime and endTime required' } });
      return;
    }
    const result = await kafkaReplayService.replayEvents(
      new Date(startTime),
      new Date(endTime),
      eventTypes
    );
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
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

// Export Job Monitoring
router.get('/export-jobs', adminController.getExportJobs);
router.delete(
  '/export-jobs/:jobId',
  audit('CANCEL_EXPORT_JOB', 'ExportJob'),
  adminController.cancelExportJob
);

// Online users & trending
router.get('/online-stats', adminController.getOnlineStats);
router.get('/trending', adminController.getTrending);

// Note: Verification routes are under /verifications/pending and /verifications/:id/review
// which are also admin restricted.

export default router;
