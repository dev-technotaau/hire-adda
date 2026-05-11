/**
 * Controller for /api/v1/public/search-history routes.
 * Optional auth: when `req.user` is set we use userId; otherwise we
 * fall back to a guest sessionId from the `ha_search_session` cookie.
 */
import type { Request, Response, NextFunction } from 'express';
import {
  recordSearch,
  listRecent,
  deleteEntry,
  migrateGuestHistory,
} from '../services/search-history.service';
import { BadRequestError } from '../exceptions';
import type { SearchHistoryType } from '@prisma/client';

const SESSION_COOKIE = 'ha_search_session';

function ownerFromReq(req: Request): { userId?: string; sessionId?: string } {
  const userId = (req as any).user?.id as string | undefined;
  if (userId) return { userId };
  // Read guest session from cookie. The frontend sets this on first
  // search; if absent, we still allow the request — service treats
  // missing-owner as a no-op.
  const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
  return sessionId ? { sessionId } : {};
}

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const owner = ownerFromReq(req);
    const type = String(req.query.type || 'JOB').toUpperCase() as SearchHistoryType;
    const limit = Number(req.query.limit) || 12;
    const items = await listRecent({ ...owner, searchType: type, limit });
    res.status(200).json({ status: 'success', data: { items } });
  } catch (err) {
    next(err);
  }
};

export const record = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const owner = ownerFromReq(req);
    const body = req.body ?? {};
    if (!body.searchType) throw new BadRequestError('searchType is required');
    if (!body.filters) throw new BadRequestError('filters is required');
    const row = await recordSearch({
      ...owner,
      searchType: body.searchType as SearchHistoryType,
      filters: body.filters,
      query: body.query,
      location: body.location,
      resultsCount: typeof body.resultsCount === 'number' ? body.resultsCount : undefined,
    });
    res.status(200).json({ status: 'success', data: row });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const owner = ownerFromReq(req);
    const id = String(req.params.id || '');
    const result = await deleteEntry({ ...owner, id });
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * Aggregate the most-frequent searches across all users, dedup by
 * filtersHash. Used by the sitemap's popular-aggregates shard to
 * surface high-traffic role+city combos in the public sitemap so
 * Googlebot can crawl them at scale.
 *
 * Returns up to `limit` rows ordered by total hits descending. Each
 * row carries a canonical URL derived from the stored filters JSON.
 */
export const aggregates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 5_000, 5_000);
    const { prisma } = await import('../config/prisma');
    // Group by filtersHash + searchType; sum hits across users/sessions.
    const groups = await prisma.searchHistory.groupBy({
      by: ['filtersHash', 'searchType'],
      _sum: { hits: true },
      _max: { lastSeenAt: true },
      orderBy: { _sum: { hits: 'desc' } },
      take: limit,
    });
    if (groups.length === 0) {
      res.status(200).json({ status: 'success', data: { items: [] } });
      return;
    }
    // Pick one representative row per group to access the filters blob.
    const reps = await Promise.all(
      groups.map((g) =>
        prisma.searchHistory.findFirst({
          where: { filtersHash: g.filtersHash, searchType: g.searchType },
          select: { filters: true, query: true, location: true, searchType: true, updatedAt: true },
          orderBy: { lastSeenAt: 'desc' },
        })
      )
    );
    const { buildJobSearchUrl, buildCompanySearchUrl } = await import('../lib/slugs');
    const items: Array<{ url: string; updatedAt: string }> = [];
    for (const r of reps) {
      if (!r) continue;
      const f = r.filters as Record<string, unknown>;
      const url =
        r.searchType === 'COMPANY'
          ? buildCompanySearchUrl({
              category: typeof f.category === 'string' ? f.category : undefined,
              industry: typeof f.industry === 'string' ? f.industry : undefined,
              city:
                (typeof r.location === 'string' && r.location) ||
                (typeof f.location === 'string' ? f.location : undefined),
              collection: typeof f.collection === 'string' ? f.collection : undefined,
            })
          : buildJobSearchUrl({
              role: typeof r.query === 'string' && r.query.trim() ? r.query.trim() : undefined,
              city:
                (typeof r.location === 'string' && r.location) ||
                (typeof f.location === 'string' ? f.location : undefined),
              category:
                typeof f.category === 'string'
                  ? f.category
                  : typeof f.roleCategory === 'string'
                    ? f.roleCategory
                    : undefined,
              department: typeof f.department === 'string' ? f.department : undefined,
              qualification: typeof f.qualification === 'string' ? f.qualification : undefined,
              collection: typeof f.collection === 'string' ? f.collection : undefined,
              experienceYears:
                typeof f.experienceMin === 'number' ? Number(f.experienceMin) : undefined,
              curatedPreset: typeof f.preset === 'string' ? f.preset : undefined,
            });
      // Skip "/jobs" or "/companies" root — already in static shard.
      if (url === '/jobs' || url === '/companies') continue;
      items.push({ url, updatedAt: r.updatedAt.toISOString() });
    }
    res.status(200).json({ status: 'success', data: { items } });
  } catch (err) {
    next(err);
  }
};

/**
 * Called by the auth flow on successful login. Promotes guest history
 * (sessionId-bound) into the user's history (userId-bound) with dedup.
 */
export const migrate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id as string | undefined;
    const sessionId = String(req.body?.sessionId || req.cookies?.[SESSION_COOKIE] || '');
    if (!userId) throw new BadRequestError('Auth required');
    if (!sessionId) {
      res.status(200).json({ status: 'success', data: { migrated: 0, dedup: 0 } });
      return;
    }
    const result = await migrateGuestHistory(sessionId, userId);
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};
