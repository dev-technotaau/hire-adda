import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../validators/validate';
import { submitContactSchema } from '../schemas/contact.schema';
import * as contactController from '../controllers/contact.controller';
import { Role } from '@prisma/client';
import { publicLimiter } from '../middleware/rate-limit';

const router = Router();

// Public: Submit a contact form message (rate-limited)
router.post(
    '/',
    publicLimiter,
    validate(submitContactSchema),
    contactController.submitContactMessage
);

// Admin: List all contact messages
router.get('/', protect, restrictTo(Role.ADMIN, Role.SUPER_ADMIN), contactController.listContactMessages);

// Admin: Mark message as read
router.patch('/:id/read', protect, restrictTo(Role.ADMIN, Role.SUPER_ADMIN), contactController.markContactMessageRead);

// Admin: Delete message
router.delete('/:id', protect, restrictTo(Role.ADMIN, Role.SUPER_ADMIN), contactController.deleteContactMessage);

export default router;
