import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
    namespace Express {
        interface Request {
            id: string;
        }
    }
}

/**
 * Request ID middleware - adds unique ID to each request for tracing
 */
export const requestId = () => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Check for existing request ID from load balancer/proxy
        const existingId = req.headers['x-request-id'] || req.headers['x-correlation-id'];

        // Use existing or generate new UUID
        req.id = (Array.isArray(existingId) ? existingId[0] : existingId) || uuidv4();

        // Set response header for client tracking
        res.setHeader('X-Request-ID', req.id);

        next();
    };
};

export default requestId;
