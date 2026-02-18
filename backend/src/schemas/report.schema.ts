import { z } from 'zod';

export const exportReportSchema = z.object({
    query: z.object({
        role: z.string().optional(),
        status: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    }),
});
