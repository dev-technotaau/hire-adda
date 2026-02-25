import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error';
import { PAGINATION } from '@/constants';

class SavedCandidateService {
    /**
     * Toggle save/unsave a candidate for an employer.
     * If already saved, removes the bookmark. If not saved, creates one.
     */
    async toggleSaveCandidate(employerId: string, candidateUserId: string, notes?: string) {
        const existing = await prisma.savedCandidate.findUnique({
            where: {
                employerId_candidateId: {
                    employerId,
                    candidateId: candidateUserId,
                },
            },
        });

        if (existing) {
            await prisma.savedCandidate.delete({
                where: { id: existing.id },
            });
            return { saved: false };
        }

        // Verify the candidate user exists
        const candidateUser = await prisma.user.findUnique({
            where: { id: candidateUserId },
            select: { id: true, role: true },
        });

        if (!candidateUser || candidateUser.role !== 'CANDIDATE') {
            throw new AppError('Candidate not found', 404);
        }

        await prisma.savedCandidate.create({
            data: {
                employerId,
                candidateId: candidateUserId,
                notes,
            },
        });

        return { saved: true };
    }

    /**
     * Get paginated list of saved/bookmarked candidates for an employer.
     */
    async getSavedCandidates(employerId: string, page: number = 1, limit: number = PAGINATION.DEFAULT_LIMIT) {
        const skip = (page - 1) * limit;

        const [savedCandidates, total] = await prisma.$transaction([
            prisma.savedCandidate.findMany({
                where: { employerId },
                include: {
                    candidate: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true,
                            isEmailVerified: true,
                            isMobileVerified: true,
                            isWhatsappVerified: true,
                            lastActiveAt: true,
                            candidateProfile: true,
                        },
                    },
                },
                orderBy: { savedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.savedCandidate.count({ where: { employerId } }),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;
        return { savedCandidates, total, page, limit, totalPages, hasMore: page < totalPages };
    }

    /**
     * Update notes on a saved candidate bookmark.
     */
    async updateNotes(employerId: string, candidateUserId: string, notes: string) {
        const existing = await prisma.savedCandidate.findUnique({
            where: {
                employerId_candidateId: {
                    employerId,
                    candidateId: candidateUserId,
                },
            },
        });

        if (!existing) {
            throw new AppError('Saved candidate not found', 404);
        }

        const updated = await prisma.savedCandidate.update({
            where: { id: existing.id },
            data: { notes },
        });

        return updated;
    }
}

export const savedCandidateService = new SavedCandidateService();
