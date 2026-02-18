import type { Request, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service';
import { ELASTIC_INDICES } from '../constants';

/**
 * Autocomplete — returns categorized suggestions (titles, skills, companies, locations)
 * GET /api/v1/search/autocomplete?q=react&type=jobs&limit=10
 */
export const autocomplete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const q = (req.query.q as string) || '';
        const type = (req.query.type as 'jobs' | 'candidates' | 'all') || 'all';
        const limit = Math.min(Number(req.query.limit) || 10, 20);

        const results = await searchService.autocomplete(q, type, limit);

        res.status(200).json({ status: 'success', data: { suggestions: results } });
    } catch (error) {
        next(error);
    }
};

/**
 * Suggest Skills — for form fields (skills input)
 * GET /api/v1/search/suggest/skills?q=reac&limit=15
 */
export const suggestSkills = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const q = (req.query.q as string) || '';
        const limit = Math.min(Number(req.query.limit) || 15, 30);

        const results = await searchService.suggestSkills(q, limit);

        res.status(200).json({ status: 'success', data: { suggestions: results } });
    } catch (error) {
        next(error);
    }
};

/**
 * Suggest Locations — for form fields (location input)
 * GET /api/v1/search/suggest/locations?q=mum&limit=10
 */
export const suggestLocations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const q = (req.query.q as string) || '';
        const limit = Math.min(Number(req.query.limit) || 10, 20);

        const results = await searchService.suggestLocations(q, limit);

        res.status(200).json({ status: 'success', data: { suggestions: results } });
    } catch (error) {
        next(error);
    }
};

/**
 * Suggest Companies — for form fields
 * GET /api/v1/search/suggest/companies?q=goo&limit=10
 */
export const suggestCompanies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const q = (req.query.q as string) || '';
        const limit = Math.min(Number(req.query.limit) || 10, 20);

        const results = await searchService.suggestCompanies(q, limit);

        res.status(200).json({ status: 'success', data: { suggestions: results } });
    } catch (error) {
        next(error);
    }
};

/**
 * Suggest Job Titles — for form fields
 * GET /api/v1/search/suggest/titles?q=senior&limit=10
 */
export const suggestJobTitles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const q = (req.query.q as string) || '';
        const limit = Math.min(Number(req.query.limit) || 10, 20);

        const results = await searchService.suggestJobTitles(q, limit);

        res.status(200).json({ status: 'success', data: { suggestions: results } });
    } catch (error) {
        next(error);
    }
};

/**
 * "Did you mean?" spell correction
 * GET /api/v1/search/did-you-mean?q=javasrcipt&index=jobs
 */
export const didYouMean = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const q = (req.query.q as string) || '';
        const index = req.query.index === 'candidates' ? ELASTIC_INDICES.CANDIDATES : ELASTIC_INDICES.JOBS;

        const suggestion = await searchService.didYouMean(q, index);

        res.status(200).json({ status: 'success', data: { suggestion } });
    } catch (error) {
        next(error);
    }
};

/**
 * Search History — get user's recent searches
 * GET /api/v1/search/history?limit=10
 */
export const getSearchHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ status: 'error', message: 'Not authorized' }); return; }
        const limit = Math.min(Number(req.query.limit) || 10, 20);

        const history = await searchService.getSearchHistory(req.user.id, limit);

        res.status(200).json({ status: 'success', data: { history } });
    } catch (error) {
        next(error);
    }
};

/**
 * Clear search history
 * DELETE /api/v1/search/history
 */
export const clearSearchHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ status: 'error', message: 'Not authorized' }); return; }

        await searchService.clearSearchHistory(req.user.id);

        res.status(200).json({ status: 'success', message: 'Search history cleared' });
    } catch (error) {
        next(error);
    }
};

/**
 * Add to search history
 * POST /api/v1/search/history { query, type }
 */
export const addToSearchHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ status: 'error', message: 'Not authorized' }); return; }
        const { query, type } = req.body;

        if (!query || !type) { res.status(400).json({ status: 'error', message: 'query and type are required' }); return; }

        await searchService.addToSearchHistory(req.user.id, query, type);

        res.status(200).json({ status: 'success', message: 'Added to search history' });
    } catch (error) {
        next(error);
    }
};

/**
 * Popular searches (trending)
 * GET /api/v1/search/popular?limit=10
 */
export const getPopularSearches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const limit = Math.min(Number(req.query.limit) || 10, 30);

        const searches = await searchService.getPopularSearches(limit);

        res.status(200).json({ status: 'success', data: { searches } });
    } catch (error) {
        next(error);
    }
};
