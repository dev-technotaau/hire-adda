'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    MapPin, Briefcase, Clock, Building2, Bookmark,
    Share2, ArrowLeft, Users, GraduationCap,
    Globe, IndianRupee, CheckCircle, AlertCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Tag from '@/components/ui/Tag';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import PresenceIndicator from '@/components/ui/PresenceIndicator';
import { useJob, useApplyJob, useToggleSaveJob } from '@/hooks/use-jobs';
import { ROUTES } from '@/constants/routes';
import {
    JOB_TYPE_LABELS, WORK_MODE_LABELS, EXPERIENCE_LEVEL_LABELS,
    SHIFT_TYPE_LABELS, SALARY_TYPE_LABELS, EDUCATION_LEVEL_LABELS,
    COMPANY_TYPE_LABELS, URGENCY_LEVEL_LABELS,
} from '@/constants/enums';
import { formatSalaryRange, formatDate, formatRelativeDate, getExperienceLabel } from '@/lib/utils';
import type { ApiError } from '@/types/api';

export default function JobDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const { data, isLoading } = useJob(id);
    const applyMutation = useApplyJob();
    const saveMutation = useToggleSaveJob();

    const [activeTab, setActiveTab] = useState('description');
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');

    const job = data?.data;

    const handleApply = async () => {
        try {
            await applyMutation.mutateAsync({
                jobId: id,
                coverLetter: coverLetter || undefined,
            });
            setShowApplyModal(false);
            setCoverLetter('');
            showToast.success('Application submitted successfully!');
        } catch (err) {
            const error = err as ApiError;
            showToast.error(error.message || 'Failed to apply');
        }
    };

    const handleSave = async () => {
        try {
            await saveMutation.mutateAsync(id);
            showToast.success('Job saved!');
        } catch {
            showToast.error('Failed to save job');
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            await navigator.share({ title: job?.title, url });
        } else {
            await navigator.clipboard.writeText(url);
            showToast.success('Link copied to clipboard!');
        }
    };

    const tabs = [
        { key: 'description', label: 'Description' },
        { key: 'requirements', label: 'Requirements' },
        { key: 'benefits', label: 'Benefits' },
        { key: 'company', label: 'Company' },
    ];

    if (isLoading) {
        return (
            <DashboardLayout requiredRole={['CANDIDATE']}>
                <div className="space-y-6">
                    <Skeleton variant="rect" height={200} />
                    <Skeleton variant="text" lines={5} />
                </div>
            </DashboardLayout>
        );
    }

    if (!job) {
        return (
            <DashboardLayout requiredRole={['CANDIDATE']}>
                <div className="flex flex-col items-center justify-center py-20">
                    <AlertCircle className="h-12 w-12 text-[var(--text-muted)]" />
                    <h2 className="mt-4 text-lg font-semibold text-[var(--text)]">Job Not Found</h2>
                    <Link href={ROUTES.CANDIDATE.JOBS}>
                        <Button variant="outline" className="mt-4">Back to Jobs</Button>
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout requiredRole={['CANDIDATE']}>
            <div className="space-y-6">
                {/* Back */}
                <Link
                    href={ROUTES.CANDIDATE.JOBS}
                    className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Jobs
                </Link>

                {/* Header */}
                <Card>
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-tertiary)]">
                                {job.company?.logo ? (
                                    <img src={job.company.logo} alt={job.company.companyName} className="h-14 w-14 rounded-lg object-contain" />
                                ) : (
                                    <Building2 className="h-8 w-8 text-[var(--text-muted)]" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-[var(--text)] sm:text-2xl">{job.title}</h1>
                                <p className="mt-1 text-[var(--text-secondary)]">
                                    {job.company?.companyName}
                                    {job.company?.isVerified && (
                                        <CheckCircle className="ml-1.5 inline h-4 w-4 text-[var(--success)]" />
                                    )}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--text-muted)]">
                                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {getExperienceLabel(job.experienceMin)}{job.experienceMax ? ` - ${getExperienceLabel(job.experienceMax)}` : '+'}</span>
                                    <span className="flex items-center gap-1"><IndianRupee className="h-4 w-4" /> {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}</span>
                                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {formatRelativeDate(job.createdAt)}</span>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {job.type && <Badge variant="info">{JOB_TYPE_LABELS[job.type]}</Badge>}
                                    {job.workMode && <Badge variant="neutral">{WORK_MODE_LABELS[job.workMode]}</Badge>}
                                    {job.shiftType && <Badge variant="neutral">{SHIFT_TYPE_LABELS[job.shiftType]}</Badge>}
                                    {job.urgencyLevel && job.urgencyLevel !== 'NORMAL' && (
                                        <Badge variant={job.urgencyLevel === 'URGENT' ? 'warning' : 'error'}>
                                            {URGENCY_LEVEL_LABELS[job.urgencyLevel]}
                                        </Badge>
                                    )}
                                    {job.isFeatured && <Badge variant="success">Featured</Badge>}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                            <Button variant="outline" size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
                                <Bookmark className="mr-1.5 h-4 w-4" /> Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleShare}>
                                <Share2 className="mr-1.5 h-4 w-4" /> Share
                            </Button>
                            <Button size="sm" onClick={() => setShowApplyModal(true)}>
                                Apply Now
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Key Details */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'Openings', value: job.numberOfOpenings || 'N/A', icon: Users },
                        { label: 'Education', value: job.educationRequired ? EDUCATION_LEVEL_LABELS[job.educationRequired] : 'Any', icon: GraduationCap },
                        { label: 'Experience Level', value: job.experienceLevel ? EXPERIENCE_LEVEL_LABELS[job.experienceLevel] : 'Any', icon: Briefcase },
                        { label: 'Salary Type', value: job.salaryType ? SALARY_TYPE_LABELS[job.salaryType] : 'N/A', icon: IndianRupee },
                    ].map((item) => (
                        <Card key={item.label} padding="sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
                                    <item.icon className="h-4 w-4 text-[var(--text-muted)]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
                                    <p className="text-sm font-medium text-[var(--text)]">{item.value}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Skills */}
                {((job.skillsRequired?.length ?? 0) > 0 || (job.niceToHaveSkills?.length ?? 0) > 0) && (
                    <Card>
                        {(job.skillsRequired?.length ?? 0) > 0 && (
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Required Skills</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {job.skillsRequired.map((skill) => (
                                        <Tag key={skill} label={skill} variant="primary" />
                                    ))}
                                </div>
                            </div>
                        )}
                        {(job.niceToHaveSkills?.length ?? 0) > 0 && (
                            <div className={(job.skillsRequired?.length ?? 0) > 0 ? 'mt-4' : ''}>
                                <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Nice to Have</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {job.niceToHaveSkills.map((skill) => (
                                        <Tag key={skill} label={skill} variant="outline" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                {/* Tabs Content */}
                <Card>
                    <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                    <div className="mt-4">
                        {activeTab === 'description' && (
                            <div className="prose prose-sm max-w-none text-[var(--text-secondary)]">
                                <div className="whitespace-pre-wrap">{job.description}</div>
                                {job.keyResponsibilities && (
                                    <>
                                        <h3 className="mt-6 text-base font-semibold text-[var(--text)]">Key Responsibilities</h3>
                                        <div className="whitespace-pre-wrap">{job.keyResponsibilities}</div>
                                    </>
                                )}
                            </div>
                        )}
                        {activeTab === 'requirements' && (
                            <div className="prose prose-sm max-w-none text-[var(--text-secondary)]">
                                {job.requirements ? (
                                    <div className="whitespace-pre-wrap">{job.requirements}</div>
                                ) : (
                                    <p className="text-[var(--text-muted)]">No specific requirements listed.</p>
                                )}
                                {job.certificationsRequired.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-base font-semibold text-[var(--text)]">Required Certifications</h3>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {job.certificationsRequired.map((cert) => (
                                                <Tag key={cert} label={cert} variant="outline" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'benefits' && (
                            <div className="prose prose-sm max-w-none text-[var(--text-secondary)]">
                                {job.benefits ? (
                                    <div className="whitespace-pre-wrap">{job.benefits}</div>
                                ) : (
                                    <p className="text-[var(--text-muted)]">No benefits information listed.</p>
                                )}
                                {job.jobPerks.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-base font-semibold text-[var(--text)]">Perks</h3>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {job.jobPerks.map((perk) => (
                                                <Tag key={perk} label={perk} variant="primary" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {job.relocationAssistance && (
                                    <p className="mt-3 flex items-center gap-1 text-sm text-[var(--success)]">
                                        <CheckCircle className="h-4 w-4" /> Relocation assistance available
                                    </p>
                                )}
                            </div>
                        )}
                        {activeTab === 'company' && (
                            <div>
                                {job.company ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--bg-tertiary)]">
                                                {job.company.logo ? (
                                                    <img src={job.company.logo} alt={job.company?.companyName || 'Company logo'} className="h-12 w-12 rounded-lg object-contain" />
                                                ) : (
                                                    <Building2 className="h-7 w-7 text-[var(--text-muted)]" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="flex items-center gap-2 font-semibold text-[var(--text)]">
                                                    {job.company.companyName}
                                                    <PresenceIndicator userId={job.company.userId} showLabel size="sm" />
                                                </h3>
                                                <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                                                    {job.company.companyType && <span>{COMPANY_TYPE_LABELS[job.company.companyType]}</span>}
                                                    {job.company.companySize && <span>{job.company.companySize} employees</span>}
                                                    {job.company.industry && <span>{job.company.industry}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[var(--text-muted)]">Company information not available.</p>
                                )}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Sticky Apply */}
                <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-white p-4 sm:hidden z-40">
                    <Button fullWidth onClick={() => setShowApplyModal(true)}>
                        Apply Now
                    </Button>
                </div>

                {/* Apply Modal */}
                <Modal
                    isOpen={showApplyModal}
                    onClose={() => setShowApplyModal(false)}
                    title="Apply to this Job"
                    size="md"
                    footer={
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleApply} isLoading={applyMutation.isPending}>
                                Submit Application
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium text-[var(--text)]">{job.title}</h3>
                            <p className="text-sm text-[var(--text-muted)]">{job.company?.companyName} · {job.location}</p>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                                Cover Letter <span className="text-[var(--text-muted)]">(optional)</span>
                            </label>
                            <textarea
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                                rows={6}
                                placeholder="Tell the employer why you're a great fit for this role..."
                                className="w-full rounded-lg border border-[var(--border)] bg-white p-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                            />
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                            Your profile and resume will be shared with the employer.
                        </p>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
