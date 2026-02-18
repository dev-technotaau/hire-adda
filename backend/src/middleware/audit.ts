import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';

const SENSITIVE_KEYS = ['password', 'newpassword', 'currentpassword', 'confirmpassword', 'token', 'secret', 'mfacode', 'otp', 'creditcard', 'ssn', 'refreshtoken', 'accesstoken'];

/**
 * Recursively redact sensitive fields from an object before logging.
 */
function redactSensitive(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return obj;
    if (Array.isArray(obj)) return obj.map(redactSensitive);
    if (typeof obj === 'object') {
        const redacted: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
                redacted[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                redacted[key] = redactSensitive(value);
            } else {
                redacted[key] = value;
            }
        }
        return redacted;
    }
    return obj;
}

/**
 * Middleware to automatically log audit events for sensitive routes.
 * Must be placed AFTER authentication middleware so `req.user` is available.
 * @param action The action name (e.g., 'UPDATE_PROFILE')
 * @param entity The entity being affected (e.g., 'User')
 */
export const audit = (action: string, entity: string) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        if (req.user) {
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const userAgent = req.get('User-Agent');
            const entityId = req.params.id || req.body.id;

            // Fire and forget audit log (PII redacted)
            AuditService.log({
                action,
                entity,
                entityId: typeof entityId === 'string' ? entityId : undefined,
                performedBy: req.user.id,
                details: {
                    method: req.method,
                    url: req.originalUrl,
                    body: req.method !== 'GET' ? redactSensitive(req.body) : undefined,
                },
                ipAddress: Array.isArray(ip) ? ip[0] : ip,
                userAgent
            });
        }

        next();
    };
};
