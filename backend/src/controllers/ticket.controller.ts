import { Request, Response, NextFunction } from 'express';
import { ticketService } from '../services/ticket.service';
import { Role, TicketStatus } from '@prisma/client';

export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ticket = await ticketService.createTicket(req.user!.id, req.body);
        res.status(201).json({
            status: 'success',
            message: `Ticket ${ticket.ticketNumber} created successfully`,
            data: ticket,
        });
    } catch (error) {
        next(error);
    }
};

export const createGuestTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ticket = await ticketService.createGuestTicket(req.body);
        res.status(201).json({
            status: 'success',
            message: `Your ticket ${ticket.ticketNumber} has been created. We will respond within 24 hours.`,
            data: { id: ticket.id, ticketNumber: ticket.ticketNumber },
        });
    } catch (error) {
        next(error);
    }
};

export const getTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isAdmin = req.user!.role === Role.ADMIN || req.user!.role === Role.SUPER_ADMIN;
        const ticket = await ticketService.getTicketById(req.params.id as string, req.user!.id, isAdmin);
        res.status(200).json({ status: 'success', data: ticket });
    } catch (error) {
        next(error);
    }
};

export const getTicketByNumber = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ticket = await ticketService.getTicketByNumber(req.params.ticketNumber as string);
        res.status(200).json({ status: 'success', data: ticket });
    } catch (error) {
        next(error);
    }
};

export const listMyTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as TicketStatus | undefined;
        const result = await ticketService.listUserTickets(req.user!.id, page, limit, status);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const listAllTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await ticketService.listTickets({
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
            status: req.query.status as TicketStatus | undefined,
            priority: req.query.priority as any,
            category: req.query.category as any,
            assignedToId: req.query.assignedToId as string | undefined,
            search: req.query.search as string | undefined,
        });
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const addMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isAdmin = req.user!.role === Role.ADMIN || req.user!.role === Role.SUPER_ADMIN;
        const senderType = isAdmin ? 'ADMIN' : 'USER';
        const senderName = [req.user!.firstName, req.user!.lastName].filter(Boolean).join(' ') || req.user!.email;

        const message = await ticketService.addMessage(
            req.params.id as string,
            req.user!.id,
            senderType,
            senderName,
            req.body.body,
            isAdmin ? req.body.isInternal : false, // Only admins can create internal notes
        );

        res.status(201).json({ status: 'success', data: message });
    } catch (error) {
        next(error);
    }
};

export const assignTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ticket = await ticketService.assignTicket(req.params.id as string, req.body.assignedToId);
        res.status(200).json({ status: 'success', data: ticket });
    } catch (error) {
        next(error);
    }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ticket = await ticketService.updateStatus(req.params.id as string, req.body.status);
        res.status(200).json({ status: 'success', data: ticket });
    } catch (error) {
        next(error);
    }
};

export const closeTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isAdmin = req.user!.role === Role.ADMIN || req.user!.role === Role.SUPER_ADMIN;
        const ticket = await ticketService.closeTicket(req.params.id as string, req.user!.id, isAdmin);
        res.status(200).json({ status: 'success', data: ticket });
    } catch (error) {
        next(error);
    }
};

export const reopenTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ticket = await ticketService.reopenTicket(req.params.id as string, req.user!.id);
        res.status(200).json({ status: 'success', data: ticket });
    } catch (error) {
        next(error);
    }
};

export const submitSatisfaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ticket = await ticketService.submitSatisfaction(
            req.params.id as string,
            req.user!.id,
            req.body.satisfaction,
            req.body.comment,
        );
        res.status(200).json({ status: 'success', data: ticket });
    } catch (error) {
        next(error);
    }
};

export const getTicketStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await ticketService.getTicketStats();
        res.status(200).json({ status: 'success', data: stats });
    } catch (error) {
        next(error);
    }
};

export const getTicketAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const analytics = await ticketService.getTicketAnalytics(startDate, endDate);
        res.status(200).json({ status: 'success', data: analytics });
    } catch (error) {
        next(error);
    }
};
