import { Request, Response, NextFunction } from 'express';
import { isFeatureEnabled } from '../config/feature-flags';

/**
 * Maintenance mode middleware.
 * Checks the `maintenanceMode` feature flag and returns 503 if enabled.
 * Should be mounted after health routes so liveness/readiness probes still work.
 */
export const maintenanceCheck = () => {
    return async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const inMaintenance = await isFeatureEnabled('maintenanceMode');
            if (inMaintenance) {
                res.status(503).json({
                    status: 'error',
                    error: {
                        message: 'Service is currently under maintenance. Please try again later.',
                        code: 'MAINTENANCE_MODE',
                    },
                });
                return;
            }
            next();
        } catch {
            // If flag check fails, don't block requests
            next();
        }
    };
};
