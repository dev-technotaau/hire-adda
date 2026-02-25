import type { Request, Response, NextFunction } from 'express';
import { isFeatureEnabled, getFlag } from '../config/feature-flags';

/**
 * Maintenance mode middleware.
 * Checks the `maintenanceMode` feature flag and returns 503 if enabled.
 * Should be mounted after health routes so liveness/readiness probes still work.
 *
 * Optional Remote Config keys:
 *   - `maintenanceMessage`    (string) — custom message shown to users
 *   - `maintenanceReturnTime` (string) — ISO-8601 timestamp for the countdown timer
 */
export const maintenanceCheck = () => {
  return async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const inMaintenance = await isFeatureEnabled('maintenanceMode');
      if (inMaintenance) {
        const message = await getFlag<string>(
          'maintenanceMessage',
          'Service is currently under maintenance. Please try again later.'
        );
        const estimatedReturnTime = await getFlag<string>('maintenanceReturnTime', '');

        res.status(503).json({
          status: 'error',
          error: {
            message,
            code: 'MAINTENANCE_MODE',
            ...(estimatedReturnTime && { estimatedReturnTime }),
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
