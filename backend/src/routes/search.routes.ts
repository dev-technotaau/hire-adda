import { Router } from 'express';
import { protect } from '../middleware/auth';
import { searchLimiter } from '../middleware/rate-limit';
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
router.get('/autocomplete', validate({ query: autocompleteQuery }), searchController.autocomplete);
router.get('/suggest/skills', validate({ query: suggestQuery }), searchController.suggestSkills);
router.get(
  '/suggest/locations',
  validate({ query: suggestQuery }),
  searchController.suggestLocations
);
router.get(
  '/suggest/companies',
  validate({ query: suggestQuery }),
  searchController.suggestCompanies
);
router.get('/suggest/titles', validate({ query: suggestQuery }), searchController.suggestJobTitles);
router.get('/did-you-mean', validate({ query: didYouMeanQuery }), searchController.didYouMean);
router.get('/popular', validate({ query: popularQuery }), searchController.getPopularSearches);

// Protected routes (auth required)
router.get('/history', protect, searchController.getSearchHistory);
router.post('/history', protect, searchController.addToSearchHistory);
router.delete('/history', protect, searchController.clearSearchHistory);

export default router;
