import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { JobStatus } from '@prisma/client';
import { cache } from '../middleware/cache';

const router = Router();

// Public stats — cached for 10 minutes
router.get('/stats', cache({ ttl: 600 }), async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const [activeJobs, companies, candidates, placements] = await prisma.$transaction([
            prisma.jobPost.count({ where: { status: JobStatus.OPEN } }),
            prisma.companyProfile.count(),
            prisma.candidateProfile.count(),
            prisma.jobApplication.count({ where: { status: 'HIRED' } }),
        ]);

        res.status(200).json({
            status: 'success',
            data: { activeJobs, companies, candidates, placements },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
