import { Router } from 'express';
import { protect } from '../middleware/auth';
import { searchLimiter } from '../middleware/rate-limit';
import { cache } from '../middleware/cache';
import { validate } from '../validators/validate';
import {
  autocompleteQuery,
  suggestQuery,
  didYouMeanQuery,
  popularQuery,
} from '../validators/search.validators';
import * as searchController from '../controllers/search.controller';

const router = Router();

// Apply search-specific rate limiter (60 req/min)
router.use(searchLimiter);

// Public routes (no auth required) — with query param validation
router.get('/autocomplete', validate({ query: autocompleteQuery }), cache({ ttl: 300 }), searchController.autocomplete);
router.get('/suggest/skills', validate({ query: suggestQuery }), cache({ ttl: 600 }), searchController.suggestSkills);
router.get(
  '/suggest/locations',
  validate({ query: suggestQuery }),
  cache({ ttl: 600 }),
  searchController.suggestLocations
);
router.get(
  '/suggest/companies',
  validate({ query: suggestQuery }),
  cache({ ttl: 600 }),
  searchController.suggestCompanies
);
router.get('/suggest/titles', validate({ query: suggestQuery }), cache({ ttl: 600 }), searchController.suggestJobTitles);
router.get('/did-you-mean', validate({ query: didYouMeanQuery }), cache({ ttl: 300 }), searchController.didYouMean);
router.get('/popular', validate({ query: popularQuery }), cache({ ttl: 600 }), searchController.getPopularSearches);

// Protected routes (auth required)
router.get('/history', protect, searchController.getSearchHistory);
router.post('/history', protect, searchController.addToSearchHistory);
router.delete('/history', protect, searchController.clearSearchHistory);

export default router;
