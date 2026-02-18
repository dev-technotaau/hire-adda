'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
    Briefcase, FileText, DollarSign, MapPin,
    Tags, Eye, ChevronLeft, ChevronRight,
    Check, Plus, X, Save,
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
import Badge from '@/components/ui/Badge';
import { showToast } from '@/components/ui/Toast';
import { jobService } from '@/services/job.service';
import { draftService } from '@/services/draft.service';
import { ROUTES } from '@/constants/routes';
import {
    JOB_TYPE_LABELS, WORK_MODE_LABELS, SHIFT_TYPE_LABELS,
    EXPERIENCE_LEVEL_LABELS, EDUCATION_LEVEL_LABELS,
    SALARY_TYPE_LABELS, URGENCY_LEVEL_LABELS,
} from '@/constants/enums';
import type { CreateJobRequest } from '@/types/job';
import type { ApiError } from '@/types/api';
import type { FormDraft } from '@/types/draft';

function toSelectOptions(labels: Record<string, string>): SelectOption[] {
    return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const steps = [
    { icon: Briefcase, label: 'Basics' },
    { icon: FileText, label: 'Description' },
    { icon: DollarSign, label: 'Compensation' },
    { icon: MapPin, label: 'Location' },
    { icon: Tags, label: 'Tags & More' },
    { icon: Eye, label: 'Preview' },
];

const initialForm: CreateJobRequest = {
    title: '',
    description: '',
    location: '',
    skillsRequired: [],
};

export default function PostJobPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(0);
    const [form, setForm] = useState<CreateJobRequest>(initialForm);
    const [skillInput, setSkillInput] = useState('');
    const [niceSkillInput, setNiceSkillInput] = useState('');
    const [certInput, setCertInput] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [perkInput, setPerkInput] = useState('');

    // Draft restore state
    const [draftBanner, setDraftBanner] = useState<FormDraft | null>(null);
    const [isDraftLoading, setIsDraftLoading] = useState(true);

    // Check for existing drafts on page load
    useEffect(() => {
        const checkDrafts = async () => {
            try {
                const res = await draftService.getDrafts('JOB_POSTING');
                const drafts = res.data?.items ?? [];
                if (drafts.length > 0) {
                    setDraftBanner(drafts[0]);
                }
            } catch {
                // silent fail
            } finally {
                setIsDraftLoading(false);
            }
        };
        checkDrafts();
    }, []);

    const handleRestoreDraft = () => {
        if (!draftBanner) return;
        const draftData = draftBanner.data as unknown as CreateJobRequest;
        setForm({
            ...initialForm,
            ...draftData,
            skillsRequired: draftData.skillsRequired || [],
        });
        setDraftBanner(null);
        showToast.success('Draft restored successfully');
    };

    const handleDismissDraft = async () => {
        if (!draftBanner) return;
        try {
            await draftService.deleteDraft(draftBanner.id);
        } catch {
            // silent fail
        }
        setDraftBanner(null);
    };

    const updateField = <K extends keyof CreateJobRequest>(key: K, value: CreateJobRequest[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const addToArray = (key: 'skillsRequired' | 'niceToHaveSkills' | 'certificationsRequired' | 'tags' | 'jobPerks', value: string, clearFn: (v: string) => void) => {
        const trimmed = value.trim();
        if (trimmed && !(form[key] || []).includes(trimmed)) {
            updateField(key, [...(form[key] || []), trimmed]);
            clearFn('');
        }
    };

    const removeFromArray = (key: 'skillsRequired' | 'niceToHaveSkills' | 'certificationsRequired' | 'tags' | 'jobPerks', value: string) => {
        updateField(key, (form[key] || []).filter(v => v !== value));
    };

    // Auto-save draft every 30 seconds
    const saveDraft = useCallback(async () => {
        try {
            await draftService.saveDraft({ formType: 'JOB_POSTING', data: form as unknown as Record<string, unknown> });
        } catch {
            // silent fail for drafts
        }
    }, [form]);

    useEffect(() => {
        const interval = setInterval(saveDraft, 30000);
        return () => clearInterval(interval);
    }, [saveDraft]);

    const createMutation = useMutation({
        mutationFn: (data: CreateJobRequest) => jobService.createJob(data),
        onSuccess: () => {
            showToast.success('Job posted successfully!');
            router.push(ROUTES.EMPLOYER.MY_JOBS);
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to post job');
        },
    });

    const canGoNext = (): boolean => {
        switch (step) {
            case 0: return !!form.title.trim();
            case 1: return !!form.description.trim();
            case 2: return true;
            case 3: return !!form.location.trim();
            case 4: return form.skillsRequired.length > 0;
            default: return true;
        }
    };

    const handleNext = () => {
        if (step < 5 && canGoNext()) setStep((step + 1) as Step);
    };

    const handleBack = () => {
        if (step > 0) setStep((step - 1) as Step);
    };

    const handleSubmit = () => {
        const payload = {
            ...form,
            applicationDeadline: form.applicationDeadline ? new Date(form.applicationDeadline).toISOString() : undefined,
        };
        createMutation.mutate(payload);
    };

    return (
        <DashboardLayout requiredRole={['EMPLOYER']}>
            <div className="space-y-6">
                {/* Draft Restore Banner */}
                {draftBanner && (
                    <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary-light px-4 py-3">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-sm font-medium text-[var(--text)]">
                                    You have a saved draft from{' '}
                                    {new Date(draftBanner.updatedAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Would you like to restore it?
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleDismissDraft}>
                                Dismiss
                            </Button>
                            <Button variant="primary" size="sm" onClick={handleRestoreDraft}>
                                Restore Draft
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text)]">Post a New Job</h1>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">Fill in the details to create a job posting</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={saveDraft}>
                        <Save className="mr-1.5 h-4 w-4" /> Save Draft
                    </Button>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-between">
                    {steps.map((s, i) => (
                        <div key={i} className="flex flex-1 items-center">
                            <button
                                type="button"
                                onClick={() => { if (i <= step) setStep(i as Step); }}
                                className={`flex flex-col items-center gap-1.5 ${i <= step ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                                    i < step ? 'bg-[var(--success)] text-white'
                                    : i === step ? 'bg-primary text-white'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                                }`}>
                                    {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                                </div>
                                <span className={`hidden text-xs sm:block ${
                                    i === step ? 'font-medium text-primary' : 'text-[var(--text-muted)]'
                                }`}>{s.label}</span>
                            </button>
                            {i < steps.length - 1 && (
                                <div className={`mx-2 h-0.5 flex-1 ${
                                    i < step ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
                                }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <Card>
                    {step === 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-[var(--text)]">Basic Information</h2>
                            <Input
                                label="Job Title"
                                placeholder="e.g. Senior Software Engineer"
                                value={form.title}
                                onChange={e => updateField('title', e.target.value)}
                                required
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Select
                                    label="Job Type"
                                    options={toSelectOptions(JOB_TYPE_LABELS)}
                                    value={form.type || ''}
                                    onChange={v => updateField('type', v as CreateJobRequest['type'])}
                                    placeholder="Select type"
                                />
                                <Select
                                    label="Experience Level"
                                    options={toSelectOptions(EXPERIENCE_LEVEL_LABELS)}
                                    value={form.experienceLevel || ''}
                                    onChange={v => updateField('experienceLevel', v as CreateJobRequest['experienceLevel'])}
                                    placeholder="Select level"
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Input
                                    label="Min Experience (years)"
                                    type="number"
                                    placeholder="0"
                                    value={form.experienceMin?.toString() || ''}
                                    onChange={e => updateField('experienceMin', parseInt(e.target.value) || 0)}
                                />
                                <Input
                                    label="Max Experience (years)"
                                    type="number"
                                    placeholder="10"
                                    value={form.experienceMax?.toString() || ''}
                                    onChange={e => updateField('experienceMax', parseInt(e.target.value) || undefined)}
                                />
                                <Input
                                    label="Number of Openings"
                                    type="number"
                                    placeholder="1"
                                    value={form.numberOfOpenings?.toString() || ''}
                                    onChange={e => updateField('numberOfOpenings', parseInt(e.target.value) || undefined)}
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    label="Industry"
                                    placeholder="e.g. Information Technology"
                                    value={form.industry || ''}
                                    onChange={e => updateField('industry', e.target.value)}
                                />
                                <Input
                                    label="Department"
                                    placeholder="e.g. Engineering"
                                    value={form.department || ''}
                                    onChange={e => updateField('department', e.target.value)}
                                />
                            </div>
                            <Select
                                label="Education Required"
                                options={toSelectOptions(EDUCATION_LEVEL_LABELS)}
                                value={form.educationRequired || ''}
                                onChange={v => updateField('educationRequired', v as CreateJobRequest['educationRequired'])}
                                placeholder="Select level"
                            />
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-[var(--text)]">Job Description</h2>
                            <Textarea
                                label="Description"
                                rows={8}
                                placeholder="Describe the role, what the candidate will work on, and the team they'll join..."
                                value={form.description}
                                onChange={e => updateField('description', e.target.value)}
                                maxLength={10000}
                                showCount
                                required
                            />
                            <Textarea
                                label="Key Responsibilities"
                                rows={5}
                                placeholder="List the primary responsibilities of this role..."
                                value={form.keyResponsibilities || ''}
                                onChange={e => updateField('keyResponsibilities', e.target.value)}
                            />
                            <Textarea
                                label="Requirements"
                                rows={5}
                                placeholder="List the qualifications and skills required..."
                                value={form.requirements || ''}
                                onChange={e => updateField('requirements', e.target.value)}
                            />
                            <Textarea
                                label="Benefits"
                                rows={3}
                                placeholder="What benefits does this role offer?"
                                value={form.benefits || ''}
                                onChange={e => updateField('benefits', e.target.value)}
                            />
                            <Textarea
                                label="Interview Process"
                                rows={3}
                                placeholder="Describe the interview process (e.g. Phone screen → Technical → Onsite)"
                                value={form.interviewProcess || ''}
                                onChange={e => updateField('interviewProcess', e.target.value)}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-[var(--text)]">Compensation</h2>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Input
                                    label="Min Salary"
                                    type="number"
                                    placeholder="e.g. 500000"
                                    value={form.salaryMin?.toString() || ''}
                                    onChange={e => updateField('salaryMin', parseInt(e.target.value) || undefined)}
                                />
                                <Input
                                    label="Max Salary"
                                    type="number"
                                    placeholder="e.g. 1500000"
                                    value={form.salaryMax?.toString() || ''}
                                    onChange={e => updateField('salaryMax', parseInt(e.target.value) || undefined)}
                                />
                                <Select
                                    label="Salary Type"
                                    options={toSelectOptions(SALARY_TYPE_LABELS)}
                                    value={form.salaryType || ''}
                                    onChange={v => updateField('salaryType', v as CreateJobRequest['salaryType'])}
                                    placeholder="Select type"
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    label="Currency"
                                    placeholder="INR"
                                    value={form.currency || ''}
                                    onChange={e => updateField('currency', e.target.value)}
                                />
                                <div className="flex items-end pb-1">
                                    <Switch
                                        label="Disclose salary on listing"
                                        checked={form.salaryDisclosed !== false}
                                        onChange={() => updateField('salaryDisclosed', form.salaryDisclosed === false)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-[var(--text)]">Location & Work Mode</h2>
                            <Input
                                label="Location"
                                placeholder="e.g. Bangalore, Karnataka"
                                leftIcon={<MapPin className="h-4 w-4" />}
                                value={form.location}
                                onChange={e => updateField('location', e.target.value)}
                                required
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Select
                                    label="Work Mode"
                                    options={toSelectOptions(WORK_MODE_LABELS)}
                                    value={form.workMode || ''}
                                    onChange={v => updateField('workMode', v as CreateJobRequest['workMode'])}
                                    placeholder="Select mode"
                                />
                                <Select
                                    label="Shift Type"
                                    options={toSelectOptions(SHIFT_TYPE_LABELS)}
                                    value={form.shiftType || ''}
                                    onChange={v => updateField('shiftType', v as CreateJobRequest['shiftType'])}
                                    placeholder="Select shift"
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Switch
                                    label="Remote position"
                                    checked={form.isRemote || false}
                                    onChange={() => updateField('isRemote', !form.isRemote)}
                                />
                                <Switch
                                    label="Relocation assistance offered"
                                    checked={form.relocationAssistance || false}
                                    onChange={() => updateField('relocationAssistance', !form.relocationAssistance)}
                                />
                            </div>
                            <Input
                                label="Travel Requirement (%)"
                                type="number"
                                placeholder="0"
                                value={form.travelRequirementPercent?.toString() || ''}
                                onChange={e => updateField('travelRequirementPercent', parseInt(e.target.value) || undefined)}
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Switch
                                    label="Walk-in interview"
                                    checked={form.isWalkIn || false}
                                    onChange={() => updateField('isWalkIn', !form.isWalkIn)}
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    label="Contact Person"
                                    placeholder="HR Manager Name"
                                    value={form.contactPerson || ''}
                                    onChange={e => updateField('contactPerson', e.target.value)}
                                />
                                <Input
                                    label="Contact Email"
                                    type="email"
                                    placeholder="hr@company.com"
                                    value={form.contactEmail || ''}
                                    onChange={e => updateField('contactEmail', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-[var(--text)]">Skills, Tags & More</h2>

                            {/* Required Skills */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Required Skills *</label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        placeholder="e.g. React, TypeScript"
                                        value={skillInput}
                                        onChange={e => setSkillInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToArray('skillsRequired', skillInput, setSkillInput); } }}
                                    />
                                    <Button variant="outline" className="shrink-0" onClick={() => addToArray('skillsRequired', skillInput, setSkillInput)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {form.skillsRequired.map(s => <Tag key={s} label={s} variant="primary" onRemove={() => removeFromArray('skillsRequired', s)} />)}
                                </div>
                            </div>

                            {/* Nice to Have Skills */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Nice-to-Have Skills</label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        placeholder="e.g. GraphQL, Docker"
                                        value={niceSkillInput}
                                        onChange={e => setNiceSkillInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToArray('niceToHaveSkills', niceSkillInput, setNiceSkillInput); } }}
                                    />
                                    <Button variant="outline" className="shrink-0" onClick={() => addToArray('niceToHaveSkills', niceSkillInput, setNiceSkillInput)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {(form.niceToHaveSkills || []).map(s => <Tag key={s} label={s} onRemove={() => removeFromArray('niceToHaveSkills', s)} />)}
                                </div>
                            </div>

                            {/* Certifications */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Certifications Required</label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        placeholder="e.g. AWS Solutions Architect"
                                        value={certInput}
                                        onChange={e => setCertInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToArray('certificationsRequired', certInput, setCertInput); } }}
                                    />
                                    <Button variant="outline" className="shrink-0" onClick={() => addToArray('certificationsRequired', certInput, setCertInput)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {(form.certificationsRequired || []).map(c => <Tag key={c} label={c} onRemove={() => removeFromArray('certificationsRequired', c)} />)}
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Tags</label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        placeholder="e.g. startup, fintech"
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToArray('tags', tagInput, setTagInput); } }}
                                    />
                                    <Button variant="outline" className="shrink-0" onClick={() => addToArray('tags', tagInput, setTagInput)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {(form.tags || []).map(t => <Tag key={t} label={t} onRemove={() => removeFromArray('tags', t)} />)}
                                </div>
                            </div>

                            {/* Job Perks */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Job Perks</label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        placeholder="e.g. Free meals, Gym membership"
                                        value={perkInput}
                                        onChange={e => setPerkInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToArray('jobPerks', perkInput, setPerkInput); } }}
                                    />
                                    <Button variant="outline" className="shrink-0" onClick={() => addToArray('jobPerks', perkInput, setPerkInput)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {(form.jobPerks || []).map(p => <Tag key={p} label={p} onRemove={() => removeFromArray('jobPerks', p)} />)}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Select
                                    label="Urgency Level"
                                    options={toSelectOptions(URGENCY_LEVEL_LABELS)}
                                    value={form.urgencyLevel || ''}
                                    onChange={v => updateField('urgencyLevel', v as CreateJobRequest['urgencyLevel'])}
                                    placeholder="Select urgency"
                                />
                                <DatePicker
                                    label="Application Deadline"
                                    value={form.applicationDeadline || ''}
                                    onChange={(val) => updateField('applicationDeadline', val)}
                                />
                            </div>

                            <Switch
                                label="Feature this job (premium)"
                                checked={form.isFeatured || false}
                                onChange={() => updateField('isFeatured', !form.isFeatured)}
                            />
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-[var(--text)]">Preview Your Job Posting</h2>

                            <div className="space-y-4">
                                <PreviewSection label="Job Title" value={form.title} />
                                <PreviewSection label="Job Type" value={form.type ? JOB_TYPE_LABELS[form.type] : '—'} />
                                <PreviewSection label="Experience" value={`${form.experienceMin || 0} - ${form.experienceMax || 'Any'} years`} />
                                <PreviewSection label="Experience Level" value={form.experienceLevel ? EXPERIENCE_LEVEL_LABELS[form.experienceLevel] : '—'} />
                                <PreviewSection label="Education" value={form.educationRequired ? EDUCATION_LEVEL_LABELS[form.educationRequired] : '—'} />
                                <PreviewSection label="Industry" value={form.industry || '—'} />
                                <PreviewSection label="Department" value={form.department || '—'} />
                                <PreviewSection label="Openings" value={form.numberOfOpenings?.toString() || '—'} />

                                <div className="border-t border-[var(--border)] pt-4">
                                    <h3 className="mb-2 font-medium text-[var(--text)]">Description</h3>
                                    <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{form.description || '—'}</p>
                                </div>

                                {form.keyResponsibilities && (
                                    <div>
                                        <h3 className="mb-2 font-medium text-[var(--text)]">Key Responsibilities</h3>
                                        <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{form.keyResponsibilities}</p>
                                    </div>
                                )}

                                {form.requirements && (
                                    <div>
                                        <h3 className="mb-2 font-medium text-[var(--text)]">Requirements</h3>
                                        <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{form.requirements}</p>
                                    </div>
                                )}

                                <div className="border-t border-[var(--border)] pt-4">
                                    <h3 className="mb-2 font-medium text-[var(--text)]">Compensation</h3>
                                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                                        <p><span className="text-[var(--text-muted)]">Salary: </span><span className="text-[var(--text)]">{form.salaryMin || '—'} - {form.salaryMax || '—'} {form.currency || 'INR'}</span></p>
                                        <p><span className="text-[var(--text-muted)]">Type: </span><span className="text-[var(--text)]">{form.salaryType ? SALARY_TYPE_LABELS[form.salaryType] : '—'}</span></p>
                                    </div>
                                </div>

                                <div className="border-t border-[var(--border)] pt-4">
                                    <h3 className="mb-2 font-medium text-[var(--text)]">Location & Work</h3>
                                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                                        <p><span className="text-[var(--text-muted)]">Location: </span><span className="text-[var(--text)]">{form.location || '—'}</span></p>
                                        <p><span className="text-[var(--text-muted)]">Work Mode: </span><span className="text-[var(--text)]">{form.workMode ? WORK_MODE_LABELS[form.workMode] : '—'}</span></p>
                                        <p><span className="text-[var(--text-muted)]">Shift: </span><span className="text-[var(--text)]">{form.shiftType ? SHIFT_TYPE_LABELS[form.shiftType] : '—'}</span></p>
                                        <p><span className="text-[var(--text-muted)]">Remote: </span><span className="text-[var(--text)]">{form.isRemote ? 'Yes' : 'No'}</span></p>
                                    </div>
                                </div>

                                {form.skillsRequired.length > 0 && (
                                    <div className="border-t border-[var(--border)] pt-4">
                                        <h3 className="mb-2 font-medium text-[var(--text)]">Required Skills</h3>
                                        <div className="flex flex-wrap gap-1.5">
                                            {form.skillsRequired.map(s => <Tag key={s} label={s} variant="primary" />)}
                                        </div>
                                    </div>
                                )}

                                {(form.niceToHaveSkills || []).length > 0 && (
                                    <div>
                                        <h3 className="mb-2 font-medium text-[var(--text)]">Nice-to-Have Skills</h3>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(form.niceToHaveSkills || []).map(s => <Tag key={s} label={s} />)}
                                        </div>
                                    </div>
                                )}

                                {form.urgencyLevel && (
                                    <div className="border-t border-[var(--border)] pt-4">
                                        <span className="text-sm text-[var(--text-muted)]">Urgency: </span>
                                        <Badge variant={form.urgencyLevel === 'IMMEDIATE' ? 'error' : form.urgencyLevel === 'URGENT' ? 'warning' : 'neutral'}>
                                            {URGENCY_LEVEL_LABELS[form.urgencyLevel]}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={step === 0}
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" /> Back
                    </Button>
                    <span className="text-sm text-[var(--text-muted)]">Step {step + 1} of {steps.length}</span>
                    {step < 5 ? (
                        <Button onClick={handleNext} disabled={!canGoNext()}>
                            Next <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} isLoading={createMutation.isPending}>
                            <Briefcase className="mr-1.5 h-4 w-4" /> Post Job
                        </Button>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

function PreviewSection({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline gap-2">
            <span className="text-sm text-[var(--text-muted)] min-w-[140px]">{label}:</span>
            <span className="text-sm font-medium text-[var(--text)]">{value}</span>
        </div>
    );
}
