import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { prisma } from '../config/prisma';
import { JobStatus } from '@prisma/client';
import { cache } from '../middleware/cache';
import { getTrendingJobs, getTrendingSearches } from '../utils/trending';

const router = Router();

// Public stats — cached for 10 minutes
router.get(
  '/stats',
  cache({ ttl: 600 }),
  async (_req: Request, res: Response, next: NextFunction) => {
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
  }
);

// Job counts grouped by department — cached for 10 minutes
router.get(
  '/jobs/category-counts',
  cache({ ttl: 600 }),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const groups = await prisma.jobPost.groupBy({
        by: ['department'],
        where: { status: JobStatus.OPEN, department: { not: null } },
        _count: { id: true },
      });

      const data: Record<string, number> = {};
      for (const g of groups) {
        if (g.department) {
          data[g.department] = g._count.id;
        }
      }

      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }
);

// Trending jobs & searches — cached for 60s
router.get(
  '/trending',
  cache({ ttl: 60 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 10, 20);
      const [trendingJobs, trendingSearches] = await Promise.all([
        getTrendingJobs(limit),
        getTrendingSearches(limit),
      ]);

      // Enrich trending jobs with basic info
      const jobIds = trendingJobs.map((t) => t.jobId);
      const jobs = jobIds.length > 0
        ? await prisma.jobPost.findMany({
            where: { id: { in: jobIds }, status: JobStatus.OPEN },
            select: {
              id: true,
              title: true,
              location: true,
              type: true,
              company: { select: { companyName: true, logo: true } },
            },
          })
        : [];
      const jobMap = new Map(jobs.map((j) => [j.id, j]));

      const enrichedJobs = trendingJobs
        .map((t) => {
          const job = jobMap.get(t.jobId);
          if (!job) return null;
          return { ...job, viewCount: t.score };
        })
        .filter(Boolean);

      res.status(200).json({
        status: 'success',
        data: { trendingJobs: enrichedJobs, trendingSearches },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
