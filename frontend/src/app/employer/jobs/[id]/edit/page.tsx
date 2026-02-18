'use client';

import { useState, useEffect, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, Save, X, Plus,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import Textarea from '@/components/ui/Textarea';
import Select, { type SelectOption } from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';
import Tag from '@/components/ui/Tag';
import Skeleton from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import { jobService } from '@/services/job.service';
import { ROUTES } from '@/constants/routes';
import { QUERY_KEYS } from '@/constants/config';
import {
    JOB_TYPE_LABELS, WORK_MODE_LABELS, SHIFT_TYPE_LABELS,
    EXPERIENCE_LEVEL_LABELS, EDUCATION_LEVEL_LABELS,
    SALARY_TYPE_LABELS, URGENCY_LEVEL_LABELS,
} from '@/constants/enums';
import type { UpdateJobRequest } from '@/types/job';
import type { ApiError } from '@/types/api';

function toSelectOptions(labels: Record<string, string>): SelectOption[] {
    return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

const jobTypeOptions = toSelectOptions(JOB_TYPE_LABELS);
const workModeOptions = toSelectOptions(WORK_MODE_LABELS);
const shiftTypeOptions = toSelectOptions(SHIFT_TYPE_LABELS);
const experienceLevelOptions = toSelectOptions(EXPERIENCE_LEVEL_LABELS);
const educationLevelOptions = toSelectOptions(EDUCATION_LEVEL_LABELS);
const salaryTypeOptions = toSelectOptions(SALARY_TYPE_LABELS);
const urgencyLevelOptions = toSelectOptions(URGENCY_LEVEL_LABELS);

export default function EditJobPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const queryClient = useQueryClient();

    const [form, setForm] = useState<UpdateJobRequest>({});
    const [skillInput, setSkillInput] = useState('');
    const [niceSkillInput, setNiceSkillInput] = useState('');
    const [certInput, setCertInput] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [perkInput, setPerkInput] = useState('');
    const [initialized, setInitialized] = useState(false);

    const { data: jobData, isLoading } = useQuery({
        queryKey: QUERY_KEYS.JOBS.DETAIL(id),
        queryFn: () => jobService.getJob(id),
        enabled: !!id,
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateJobRequest) => jobService.updateJob(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.DETAIL(id) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.MY_JOBS });
            showToast.success('Job updated successfully');
            router.push(ROUTES.EMPLOYER.JOB_DETAIL(id));
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to update job');
        },
    });

    const job = jobData?.data;

    // Populate form when job data loads
    useEffect(() => {
        if (job && !initialized) {
            setForm({
                title: job.title || '',
                description: job.description || '',
                keyResponsibilities: job.keyResponsibilities || '',
                requirements: job.requirements || '',
                benefits: job.benefits || '',
                interviewProcess: job.interviewProcess || '',
                location: job.location || '',
                type: job.type || undefined,
                workMode: job.workMode || undefined,
                shiftType: job.shiftType || undefined,
                industry: job.industry || '',
                department: job.department || '',
                experienceMin: job.experienceMin ?? 0,
                experienceMax: job.experienceMax ?? undefined,
                experienceLevel: job.experienceLevel || undefined,
                educationRequired: job.educationRequired || undefined,
                numberOfOpenings: job.numberOfOpenings ?? undefined,
                salaryMin: job.salaryMin ?? undefined,
                salaryMax: job.salaryMax ?? undefined,
                salaryType: job.salaryType || undefined,
                currency: job.currency || '',
                salaryDisclosed: job.salaryDisclosed ?? true,
                isRemote: job.isRemote ?? false,
                relocationAssistance: job.relocationAssistance ?? false,
                travelRequirementPercent: job.travelRequirementPercent ?? undefined,
                isWalkIn: job.isWalkIn ?? false,
                contactPerson: job.contactPerson || '',
                contactEmail: job.contactEmail || '',
                skillsRequired: job.skillsRequired || [],
                niceToHaveSkills: job.niceToHaveSkills || [],
                certificationsRequired: job.certificationsRequired || [],
                tags: job.tags || [],
                jobPerks: job.jobPerks || [],
                urgencyLevel: job.urgencyLevel || undefined,
                applicationDeadline: job.applicationDeadline ? job.applicationDeadline.split('T')[0] : '',
                isFeatured: job.isFeatured ?? false,
            });
            setInitialized(true);
        }
    }, [job, initialized]);

    const handleChange = (field: keyof UpdateJobRequest, value: unknown) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const addToArray = (key: 'skillsRequired' | 'niceToHaveSkills' | 'certificationsRequired' | 'tags' | 'jobPerks', value: string, clearFn: (v: string) => void) => {
        const trimmed = value.trim();
        if (trimmed && !(form[key] || []).includes(trimmed)) {
            handleChange(key, [...(form[key] || []), trimmed]);
            clearFn('');
        }
    };

    const removeFromArray = (key: 'skillsRequired' | 'niceToHaveSkills' | 'certificationsRequired' | 'tags' | 'jobPerks', value: string) => {
        handleChange(key, (form[key] || []).filter((v) => v !== value));
    };

    const handleAddSkill = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addToArray('skillsRequired', skillInput, setSkillInput);
        }
    };

    const handleRemoveSkill = (skill: string) => {
        removeFromArray('skillsRequired', skill);
    };

    const handleAddTag = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addToArray('tags', tagInput, setTagInput);
        }
    };

    const handleRemoveTag = (tag: string) => {
        removeFromArray('tags', tag);
    };

    const handleSubmit = () => {
        if (!form.title?.trim()) {
            showToast.error('Job title is required');
            return;
        }
        if (!form.description?.trim()) {
            showToast.error('Job description is required');
            return;
        }
        if (!form.location?.trim()) {
            showToast.error('Location is required');
            return;
        }
        if (!form.skillsRequired || form.skillsRequired.length === 0) {
            showToast.error('At least one required skill is needed');
            return;
        }
        const payload = {
            ...form,
            applicationDeadline: form.applicationDeadline ? new Date(form.applicationDeadline).toISOString() : undefined,
        };
        updateMutation.mutate(payload);
    };

    if (isLoading) {
        return (
            <DashboardLayout requiredRole={['EMPLOYER']}>
                <div className="space-y-6">
                    <Skeleton variant="line" width="200px" height="32px" />
                    <Skeleton variant="rect" height="400px" />
                </div>
            </DashboardLayout>
        );
    }

    if (!job) {
        return (
            <DashboardLayout requiredRole={['EMPLOYER']}>
                <div className="flex flex-col items-center justify-center py-20">
                    <h2 className="text-lg font-semibold text-[var(--text)]">Job not found</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">The job you are trying to edit does not exist.</p>
                    <Link href={ROUTES.EMPLOYER.MY_JOBS} className="mt-4">
                        <Button variant="outline" size="sm">Back to My Jobs</Button>
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout requiredRole={['EMPLOYER']}>
            <div className="space-y-6">
                {/* Back Button */}
                <Link
                    href={ROUTES.EMPLOYER.JOB_DETAIL(id)}
                    className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Job Details
                </Link>

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text)]">Edit Job</h1>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Update your job listing details
                        </p>
                    </div>
                    <Button
                        leftIcon={<Save className="h-4 w-4" />}
                        onClick={handleSubmit}
                        isLoading={updateMutation.isPending}
                    >
                        Save Changes
                    </Button>
                </div>

                {/* Basic Info */}
                <Card>
                    <h2 className="text-base font-semibold text-[var(--text)] mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        <Input
                            label="Job Title"
                            required
                            value={form.title || ''}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="e.g. Senior Software Engineer"
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Select
                                label="Experience Level"
                                options={experienceLevelOptions}
                                value={form.experienceLevel || ''}
                                onChange={(val) => handleChange('experienceLevel', val || undefined)}
                                placeholder="Select level"
                            />
                            <Select
                                label="Education Required"
                                options={educationLevelOptions}
                                value={form.educationRequired || ''}
                                onChange={(val) => handleChange('educationRequired', val || undefined)}
                                placeholder="Select level"
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Industry"
                                placeholder="e.g. Information Technology"
                                value={form.industry || ''}
                                onChange={(e) => handleChange('industry', e.target.value)}
                            />
                            <Input
                                label="Department"
                                placeholder="e.g. Engineering"
                                value={form.department || ''}
                                onChange={(e) => handleChange('department', e.target.value)}
                            />
                        </div>
                        <Input
                            label="Number of Openings"
                            type="number"
                            placeholder="1"
                            value={form.numberOfOpenings?.toString() || ''}
                            onChange={(e) => handleChange('numberOfOpenings', e.target.value ? Number(e.target.value) : undefined)}
                            min={1}
                        />
                    </div>
                </Card>

                {/* Description & Details */}
                <Card>
                    <h2 className="text-base font-semibold text-[var(--text)] mb-4">Description & Details</h2>
                    <div className="space-y-4">
                        <Textarea
                            label="Description"
                            required
                            value={form.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Describe the role and what the candidate will be doing..."
                            rows={6}
                            maxLength={10000}
                            showCount
                        />
                        <Textarea
                            label="Key Responsibilities"
                            value={form.keyResponsibilities || ''}
                            onChange={(e) => handleChange('keyResponsibilities', e.target.value)}
                            placeholder="List the key responsibilities for this role..."
                            rows={4}
                        />
                        <Textarea
                            label="Requirements"
                            value={form.requirements || ''}
                            onChange={(e) => handleChange('requirements', e.target.value)}
                            placeholder="List the qualifications and requirements..."
                            rows={4}
                        />
                        <Textarea
                            label="Benefits"
                            value={form.benefits || ''}
                            onChange={(e) => handleChange('benefits', e.target.value)}
                            placeholder="List the benefits and perks..."
                            rows={4}
                        />
                        <Textarea
                            label="Interview Process"
                            value={form.interviewProcess || ''}
                            onChange={(e) => handleChange('interviewProcess', e.target.value)}
                            placeholder="Describe the interview process (e.g. Phone screen -> Technical -> Onsite)"
                            rows={3}
                        />
                    </div>
                </Card>

                {/* Location & Type */}
                <Card>
                    <h2 className="text-base font-semibold text-[var(--text)] mb-4">Location & Work Mode</h2>
                    <div className="space-y-4">
                        <Input
                            label="Location"
                            required
                            value={form.location || ''}
                            onChange={(e) => handleChange('location', e.target.value)}
                            placeholder="e.g. Mumbai, India"
                        />
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Select
                                label="Job Type"
                                options={jobTypeOptions}
                                value={form.type || ''}
                                onChange={(val) => handleChange('type', val || undefined)}
                                placeholder="Select job type"
                            />
                            <Select
                                label="Work Mode"
                                options={workModeOptions}
                                value={form.workMode || ''}
                                onChange={(val) => handleChange('workMode', val || undefined)}
                                placeholder="Select work mode"
                            />
                            <Select
                                label="Shift Type"
                                options={shiftTypeOptions}
                                value={form.shiftType || ''}
                                onChange={(val) => handleChange('shiftType', val || undefined)}
                                placeholder="Select shift"
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Switch
                                label="Remote position"
                                checked={form.isRemote || false}
                                onChange={() => handleChange('isRemote', !form.isRemote)}
                            />
                            <Switch
                                label="Relocation assistance offered"
                                checked={form.relocationAssistance || false}
                                onChange={() => handleChange('relocationAssistance', !form.relocationAssistance)}
                            />
                        </div>
                        <Input
                            label="Travel Requirement (%)"
                            type="number"
                            placeholder="0"
                            value={form.travelRequirementPercent?.toString() || ''}
                            onChange={(e) => handleChange('travelRequirementPercent', e.target.value ? Number(e.target.value) : undefined)}
                            min={0}
                            max={100}
                        />
                        <Switch
                            label="Walk-in interview"
                            checked={form.isWalkIn || false}
                            onChange={() => handleChange('isWalkIn', !form.isWalkIn)}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Contact Person"
                                placeholder="HR Manager Name"
                                value={form.contactPerson || ''}
                                onChange={(e) => handleChange('contactPerson', e.target.value)}
                            />
                            <Input
                                label="Contact Email"
                                type="email"
                                placeholder="hr@company.com"
                                value={form.contactEmail || ''}
                                onChange={(e) => handleChange('contactEmail', e.target.value)}
                            />
                        </div>
                    </div>
                </Card>

                {/* Experience & Salary */}
                <Card>
                    <h2 className="text-base font-semibold text-[var(--text)] mb-4">Experience & Compensation</h2>
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Min Experience (years)"
                                type="number"
                                value={form.experienceMin ?? ''}
                                onChange={(e) => handleChange('experienceMin', e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="0"
                                min={0}
                            />
                            <Input
                                label="Max Experience (years)"
                                type="number"
                                value={form.experienceMax ?? ''}
                                onChange={(e) => handleChange('experienceMax', e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="10"
                                min={0}
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Input
                                label="Min Salary"
                                type="number"
                                value={form.salaryMin ?? ''}
                                onChange={(e) => handleChange('salaryMin', e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="e.g. 500000"
                                min={0}
                            />
                            <Input
                                label="Max Salary"
                                type="number"
                                value={form.salaryMax ?? ''}
                                onChange={(e) => handleChange('salaryMax', e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="e.g. 1500000"
                                min={0}
                            />
                            <Select
                                label="Salary Type"
                                options={salaryTypeOptions}
                                value={form.salaryType || ''}
                                onChange={(val) => handleChange('salaryType', val || undefined)}
                                placeholder="Select type"
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Currency"
                                placeholder="INR"
                                value={form.currency || ''}
                                onChange={(e) => handleChange('currency', e.target.value)}
                            />
                            <div className="flex items-end pb-1">
                                <Switch
                                    label="Disclose salary on listing"
                                    checked={form.salaryDisclosed !== false}
                                    onChange={() => handleChange('salaryDisclosed', form.salaryDisclosed === false)}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Skills & Certifications */}
                <Card>
                    <h2 className="text-base font-semibold text-[var(--text)] mb-4">Skills & Certifications</h2>
                    <div className="space-y-4">
                        {/* Required Skills */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Required Skills *</label>
                            <div className="flex gap-2 mb-2">
                                <Input
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={handleAddSkill}
                                    placeholder="e.g. React, TypeScript"
                                />
                                <Button variant="outline" className="shrink-0" onClick={() => addToArray('skillsRequired', skillInput, setSkillInput)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {(form.skillsRequired || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {(form.skillsRequired || []).map((skill) => (
                                        <Tag key={skill} label={skill} variant="primary" size="md" onRemove={() => handleRemoveSkill(skill)} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Nice-to-Have Skills */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Nice-to-Have Skills</label>
                            <div className="flex gap-2 mb-2">
                                <Input
                                    value={niceSkillInput}
                                    onChange={(e) => setNiceSkillInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addToArray('niceToHaveSkills', niceSkillInput, setNiceSkillInput); } }}
                                    placeholder="e.g. GraphQL, Docker"
                                />
                                <Button variant="outline" className="shrink-0" onClick={() => addToArray('niceToHaveSkills', niceSkillInput, setNiceSkillInput)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {(form.niceToHaveSkills || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {(form.niceToHaveSkills || []).map((skill) => (
                                        <Tag key={skill} label={skill} size="md" onRemove={() => removeFromArray('niceToHaveSkills', skill)} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Certifications Required */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Certifications Required</label>
                            <div className="flex gap-2 mb-2">
                                <Input
                                    value={certInput}
                                    onChange={(e) => setCertInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addToArray('certificationsRequired', certInput, setCertInput); } }}
                                    placeholder="e.g. AWS Solutions Architect"
                                />
                                <Button variant="outline" className="shrink-0" onClick={() => addToArray('certificationsRequired', certInput, setCertInput)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {(form.certificationsRequired || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {(form.certificationsRequired || []).map((cert) => (
                                        <Tag key={cert} label={cert} size="md" onRemove={() => removeFromArray('certificationsRequired', cert)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Tags, Perks & More */}
                <Card>
                    <h2 className="text-base font-semibold text-[var(--text)] mb-4">Tags, Perks & More</h2>
                    <div className="space-y-4">
                        {/* Tags */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Tags</label>
                            <div className="flex gap-2 mb-2">
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleAddTag}
                                    placeholder="e.g. startup, fintech"
                                />
                                <Button variant="outline" className="shrink-0" onClick={() => addToArray('tags', tagInput, setTagInput)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {(form.tags || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {(form.tags || []).map((tag) => (
                                        <Tag key={tag} label={tag} size="md" onRemove={() => handleRemoveTag(tag)} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Job Perks */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Job Perks</label>
                            <div className="flex gap-2 mb-2">
                                <Input
                                    value={perkInput}
                                    onChange={(e) => setPerkInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addToArray('jobPerks', perkInput, setPerkInput); } }}
                                    placeholder="e.g. Free meals, Gym membership"
                                />
                                <Button variant="outline" className="shrink-0" onClick={() => addToArray('jobPerks', perkInput, setPerkInput)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {(form.jobPerks || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {(form.jobPerks || []).map((perk) => (
                                        <Tag key={perk} label={perk} size="md" onRemove={() => removeFromArray('jobPerks', perk)} />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Select
                                label="Urgency Level"
                                options={urgencyLevelOptions}
                                value={form.urgencyLevel || ''}
                                onChange={(val) => handleChange('urgencyLevel', val || undefined)}
                                placeholder="Select urgency"
                            />
                            <DatePicker
                                label="Application Deadline"
                                value={form.applicationDeadline || ''}
                                onChange={(val) => handleChange('applicationDeadline', val)}
                            />
                        </div>

                        <Switch
                            label="Feature this job (premium)"
                            checked={form.isFeatured || false}
                            onChange={() => handleChange('isFeatured', !form.isFeatured)}
                        />
                    </div>
                </Card>

                {/* Bottom Save */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link href={ROUTES.EMPLOYER.JOB_DETAIL(id)}>
                        <Button variant="outline">Cancel</Button>
                    </Link>
                    <Button
                        leftIcon={<Save className="h-4 w-4" />}
                        onClick={handleSubmit}
                        isLoading={updateMutation.isPending}
                    >
                        Save Changes
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
