import { Request, Response, NextFunction } from 'express';
import { verificationService } from '../services/verification.service';
import { AppError } from '../middleware/error';
import { VerificationStatus, VerificationType } from '@prisma/client';
import { AuditService } from '../services/audit.service';

/**
 * Request Verification
 */
export const requestVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        const { type, data } = req.body;

        if (!Object.values(VerificationType).includes(type)) {
            throw new AppError('Invalid verification type', 400);
        }

        const request = await verificationService.requestVerification(
            req.user.id,
            type as VerificationType,
            req.file,
            data
        );

        res.status(201).json({
            status: 'success',
            data: { request }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Pending Verifications (Admin)
 */
export const getPendingVerifications = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 10;

        const result = await verificationService.getPendingVerifications(page, limit);

        res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Review Verification Request (Admin)
 */
export const reviewVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AppError('Not authorized', 401);
        }

        const { status, comments } = req.body;
        const requestId = req.params.id; // Express params are strings by default, but verify if needed
        // req.params.id is string, but if strict mode issues arise:
        if (typeof requestId !== 'string') {
            throw new AppError('Invalid request ID', 400);
        }

        if (![VerificationStatus.APPROVED, VerificationStatus.REJECTED, VerificationStatus.REQUESTED_CHANGES].includes(status)) {
            throw new AppError('Invalid status', 400);
        }

        const updatedRequest = await verificationService.reviewVerification(
            requestId,
            req.user.id,
            status as VerificationStatus,
            comments
        );

        // Dynamic audit: log the specific action (approve/reject/request_changes)
        const auditAction =
            status === VerificationStatus.APPROVED ? 'VERIFICATION_APPROVE' :
            status === VerificationStatus.REJECTED ? 'VERIFICATION_REJECT' :
            'VERIFICATION_REQUEST_CHANGES';

        AuditService.log({
            action: auditAction,
            entity: 'Verification',
            entityId: requestId,
            performedBy: req.user.id,
            details: { method: req.method, url: req.originalUrl, status, comments },
            ipAddress: (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers['x-forwarded-for']) || req.socket.remoteAddress,
            userAgent: req.get('User-Agent'),
        }).catch(() => {});

        res.status(200).json({
            status: 'success',
            data: { request: updatedRequest }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's own verifications
 */
export const getMyVerifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const verifications = await verificationService.getUserVerifications(req.user.id);
        res.status(200).json({ status: 'success', data: { verifications } });
    } catch (error) { next(error); }
};

/**
 * Get all verifications with filters (Admin)
 */
export const getAllVerifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filters = {
            type: req.query.type as string | undefined,
            status: req.query.status as string | undefined,
            priority: req.query.priority as string | undefined,
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
        };
        const result = await verificationService.getAllVerifications(filters);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
};

/**
 * Get verification statistics (Admin)
 */
export const getVerificationStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await verificationService.getVerificationStats();
        res.status(200).json({ status: 'success', data: stats });
    } catch (error) { next(error); }
};

/**
 * Escalate verification (Admin)
 */
export const escalateVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { reason } = req.body;
        const result = await verificationService.escalateVerification(req.params.id as string, req.user.id, reason);
        res.status(200).json({ status: 'success', data: { request: result } });
    } catch (error) { next(error); }
};

/**
 * Send employment verification contact email (Admin)
 */
export const sendEmploymentContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { contactName, contactEmail, companyName, candidateName, employmentPeriod, role } = req.body;
        if (!contactName || !contactEmail || !companyName || !candidateName || !employmentPeriod || !role) {
            throw new AppError('All contact fields are required', 400);
        }
        const result = await verificationService.sendEmploymentVerificationContact(
            req.params.id as string, req.user.id,
            { contactName, contactEmail, companyName, candidateName, employmentPeriod, role }
        );
        res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
};

/**
 * Process employer response to employment verification (Public)
 */
export const processEmploymentResponse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.params;
        const { action, comments } = req.body;
        if (!token) throw new AppError('Token is required', 400);
        if (!['confirm', 'deny'].includes(action)) throw new AppError('Action must be confirm or deny', 400);
        const result = await verificationService.processEmployerResponse(token as string, action, comments);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
};

/**
 * Set SLA deadline (Admin)
 */
export const setSlaDeadline = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { deadline } = req.body;
        if (!deadline) throw new AppError('Deadline is required', 400);
        const result = await verificationService.setSlaDeadline(req.params.id as string, req.user.id, deadline);
        res.status(200).json({ status: 'success', data: { request: result } });
    } catch (error) { next(error); }
};

/**
 * Set approval chain (Admin)
 */
export const setApprovalChain = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { chain } = req.body;
        if (!Array.isArray(chain) || chain.length === 0) throw new AppError('Approval chain is required', 400);
        const result = await verificationService.setApprovalChain(req.params.id as string, chain);
        res.status(200).json({ status: 'success', data: { request: result } });
    } catch (error) { next(error); }
};

/**
 * Approve at current level (Admin)
 */
export const approveAtLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError('Not authorized', 401);
        const { comments } = req.body;
        const result = await verificationService.approveAtLevel(req.params.id as string, req.user.id, comments);
        res.status(200).json({ status: 'success', data: { request: result } });
    } catch (error) { next(error); }
};
