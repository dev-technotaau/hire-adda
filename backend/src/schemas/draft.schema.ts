import { z } from 'zod';
import { FormDraftType } from '@prisma/client';

// ===============================
// Save Draft
// ===============================
export const saveDraftSchema = z.object({
    body: z.object({
        formType: z.nativeEnum(FormDraftType, {
            error: 'Invalid form draft type',
        }),
        data: z.any(),
        name: z.string().optional(),
    }),
});

export type SaveDraftInput = z.infer<typeof saveDraftSchema>['body'];

// ===============================
// List Drafts
// ===============================
export const listDraftsSchema = z.object({
    query: z.object({
        formType: z.string().optional(),
    }),
});

export type ListDraftsQuery = z.infer<typeof listDraftsSchema>['query'];
