'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employerService } from '@/services/employer.service';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { QUERY_KEYS } from '@/constants/config';
import { Loader2, Trash2, MapPin, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function SavedCandidatesPage() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: QUERY_KEYS.EMPLOYERS.SAVED_CANDIDATES,
        queryFn: () => employerService.getSavedCandidates(1, 100),
    });

    const toggleSaveMutation = useMutation({
        mutationFn: (id: string) => employerService.toggleSavedCandidate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYERS.SAVED_CANDIDATES });
            showToast.success('Candidate list updated');
        },
        onError: () => {
            showToast.error('Failed to update list');
        },
    });

    return (
        <DashboardLayout requiredRole={['EMPLOYER']}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Saved Candidates</h1>
                    <p className="text-[var(--text-muted)]">Manage your shortlisted candidates.</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !data?.data?.items?.length ? (
                    <div className="rounded-xl border border-[var(--border)] bg-white p-12 text-center">
                        <h3 className="text-lg font-medium text-[var(--text)]">No saved candidates yet</h3>
                        <p className="mt-2 text-[var(--text-muted)]">
                            Browse candidates and save them here for later review.
                        </p>
                        <Link href="/employer/candidates">
                            <Button className="mt-4">Browse Candidates</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {data.data.items.map((candidate) => (
                            <div
                                key={candidate.id}
                                className="group relative flex flex-col rounded-xl border border-[var(--border)] bg-white p-5 transition-all hover:border-primary/50 hover:shadow-md"
                            >
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-lg font-bold text-primary">
                                            {candidate.user?.firstName?.[0] || 'C'}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[var(--text)]">
                                                {candidate.user?.firstName} {candidate.user?.lastName}
                                            </h3>
                                            <p className="text-sm text-[var(--text-muted)]">{candidate.user?.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleSaveMutation.mutate(candidate.id)}
                                        className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-error/10 hover:text-error"
                                        title="Remove from saved"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="mb-4 flex-1 space-y-2 text-sm text-[var(--text-secondary)]">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-[var(--text-muted)]" />
                                        <span>{candidate.experienceYears} years exp</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-[var(--text-muted)]" />
                                        <span>{candidate.currentLocation || 'N/A'}</span>
                                    </div>
                                    {(candidate.skills?.length ?? 0) > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {candidate.skills.slice(0, 3).map((skill: string) => (
                                                <span
                                                    key={skill}
                                                    className="inline-flex items-center rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {candidate.skills.length > 3 && (
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    +{candidate.skills.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Link href={`/employer/candidates/${candidate.id}`}>
                                    <Button variant="outline" fullWidth>
                                        View Profile
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
