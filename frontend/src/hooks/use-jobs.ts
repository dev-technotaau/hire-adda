'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '@/services/job.service';
import { QUERY_KEYS } from '@/constants/config';
import type { JobSearchFilters } from '@/types/job';

export function useJobSearch(filters: JobSearchFilters) {
    return useQuery({
        queryKey: QUERY_KEYS.JOBS.SEARCH(filters as unknown as Record<string, unknown>),
        queryFn: () => jobService.searchJobs(filters),
        enabled: true,
    });
}

export function useJob(id: string) {
    return useQuery({
        queryKey: QUERY_KEYS.JOBS.DETAIL(id),
        queryFn: () => jobService.getJob(id),
        enabled: !!id,
    });
}

export function useAppliedJobs(page?: number, limit?: number) {
    return useQuery({
        queryKey: [...QUERY_KEYS.JOBS.APPLIED, page, limit],
        queryFn: () => jobService.getAppliedJobs(page, limit),
    });
}

export function useSavedJobs(page?: number, limit?: number) {
    return useQuery({
        queryKey: [...QUERY_KEYS.JOBS.SAVED, page, limit],
        queryFn: () => jobService.getSavedJobs(page, limit),
    });
}

export function useMyJobs(page?: number, limit?: number) {
    return useQuery({
        queryKey: [...QUERY_KEYS.JOBS.MY_JOBS, page, limit],
        queryFn: () => jobService.getMyJobs(page, limit),
    });
}

export function useJobApplications(jobId: string, page?: number, limit?: number) {
    return useQuery({
        queryKey: [...QUERY_KEYS.JOBS.APPLICATIONS(jobId), page, limit],
        queryFn: () => jobService.getJobApplications(jobId, page, limit),
        enabled: !!jobId,
    });
}

export function useApplyJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ jobId, coverLetter }: { jobId: string; coverLetter?: string }) =>
            jobService.applyToJob(jobId, { coverLetter }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.APPLIED });
        },
    });
}

export function useToggleSaveJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (jobId: string) => jobService.toggleSaveJob(jobId),
        onSuccess: (_data, jobId) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.SAVED });
            queryClient.invalidateQueries({ queryKey: ['jobs', 'search'] });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.DETAIL(jobId) });
        },
    });
}

export function useWithdrawApplication() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (applicationId: string) => jobService.withdrawApplication(applicationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.APPLIED });
        },
    });
}

export function useUpdateApplicationStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ applicationId, status, rejectionReason }: { applicationId: string; status: string; rejectionReason?: string }) =>
            jobService.updateApplicationStatus(applicationId, { status, rejectionReason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.LIST });
        },
    });
}
