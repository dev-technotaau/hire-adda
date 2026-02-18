import { Request, Response, NextFunction } from 'express';
import { getAllFlags, getFlag } from '../config/feature-flags';

// Public subset of flags exposed to frontend
const CLIENT_VISIBLE_FLAGS = [
    'enableNewJobSearch',
    'enableAIMatching',
    'enableVideoInterviews',
    'maintenanceMode',
    'maxUploadSizeMB',
    'enableBetaFeatures',
];

/**
 * GET /api/v1/feature-flags — All flags (admin only)
 */
export const getFlags = async (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const flags = await getAllFlags();
        res.status(200).json({
            status: 'success',
            data: flags,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/feature-flags/client — Public subset for frontend
 */
export const getClientFlags = async (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const allFlags = await getAllFlags();
        const clientFlags: Record<string, boolean | string | number> = {};

        for (const key of CLIENT_VISIBLE_FLAGS) {
            if (key in allFlags) {
                clientFlags[key] = allFlags[key];
            }
        }

        res.status(200).json({
            status: 'success',
            data: clientFlags,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/feature-flags/:key — Single flag value (admin only)
 */
export const getFlagByKey = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const key = req.params.key as string;
        const value = await getFlag(key, null as any);

        res.status(200).json({
            status: 'success',
            data: { key, value },
        });
    } catch (error) {
        next(error);
    }
};
