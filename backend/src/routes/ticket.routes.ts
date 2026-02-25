import { Router } from 'express';
import { protect } from '../middleware/auth';
import { restrictTo } from '../middleware/rbac';
import { validate } from '../validators/validate';
import {
  createTicketSchema,
  createGuestTicketSchema,
  addMessageSchema,
  updateStatusSchema,
  assignTicketSchema,
  submitSatisfactionSchema,
} from '../schemas/ticket.schema';
import * as ticketController from '../controllers/ticket.controller';
import { Role } from '@prisma/client';
import { publicLimiter } from '../middleware/rate-limit';
import { audit } from '../middleware/audit';

const router = Router();

// ── Public (guest) ──
router.post(
  '/guest',
  publicLimiter,
  validate(createGuestTicketSchema),
  ticketController.createGuestTicket
);

// ── Stats & Analytics (must be before /:id to avoid param collision) ──
router.get(
  '/stats',
  protect,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  ticketController.getTicketStats
);

router.get(
  '/analytics',
  protect,
  restrictTo(Role.SUPER_ADMIN),
  ticketController.getTicketAnalytics
);

// ── Authenticated user routes ──
router.post('/', protect, validate(createTicketSchema), ticketController.createTicket);

router.get('/my-tickets', protect, ticketController.listMyTickets);

router.get('/by-number/:ticketNumber', protect, ticketController.getTicketByNumber);

// ── Admin: list all tickets ──
router.get(
  '/all',
  protect,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  ticketController.listAllTickets
);

// ── Ticket detail & actions (param routes last) ──
router.get('/:id', protect, ticketController.getTicket);

router.post('/:id/messages', protect, validate(addMessageSchema), ticketController.addMessage);

router.patch(
  '/:id/assign',
  protect,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  validate(assignTicketSchema),
  audit('TICKET_ASSIGN', 'SupportTicket'),
  ticketController.assignTicket
);

router.patch(
  '/:id/status',
  protect,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  validate(updateStatusSchema),
  audit('TICKET_STATUS_CHANGE', 'SupportTicket'),
  ticketController.updateStatus
);

router.post('/:id/close', protect, ticketController.closeTicket);

router.post('/:id/reopen', protect, ticketController.reopenTicket);

router.post(
  '/:id/satisfaction',
  protect,
  validate(submitSatisfactionSchema),
  ticketController.submitSatisfaction
);

export default router;
