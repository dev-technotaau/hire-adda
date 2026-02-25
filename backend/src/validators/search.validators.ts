import { z } from 'zod';

export const autocompleteQuery = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const suggestQuery = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const didYouMeanQuery = z.object({
  q: z.string().min(1).max(200),
});

export const popularQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
