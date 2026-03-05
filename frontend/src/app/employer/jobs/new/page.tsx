'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  FileText,
  DollarSign,
  MapPin,
  Tags,
  Eye,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  X,
  Save,
  Download,
  Upload,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ServerAutoSuggest from '@/components/ui/ServerAutoSuggest';
import ServerSuggestionInput from '@/components/ui/ServerSuggestionInput';
import DatePicker from '@/components/ui/DatePicker';
import Textarea from '@/components/ui/Textarea';
import Select, { type SelectOption } from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';
import Tag from '@/components/ui/Tag';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ScreeningQuestionBuilder from '@/components/ui/ScreeningQuestionBuilder';
import { showToast } from '@/components/ui/Toast';
import DOMPurify from 'isomorphic-dompurify';
import { jobService } from '@/services/job.service';
import { jobTemplateService } from '@/services/job-template.service';
import { draftService } from '@/services/draft.service';
import { ROUTES } from '@/constants/routes';
import {
  JOB_TYPE_LABELS,
  WORK_MODE_LABELS,
  SHIFT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  EDUCATION_LEVEL_LABELS,
  SALARY_TYPE_LABELS,
  URGENCY_LEVEL_LABELS,
  FUNCTIONAL_AREA_LABELS,
  SPECIFIC_DEGREE_LABELS,
  NOTICE_PERIOD_PREFERENCE_LABELS,
  GENDER_PREFERENCE_LABELS,
  DRIVING_LICENSE_TYPE_LABELS,
  POSTING_VISIBILITY_LABELS,
  APPLY_METHOD_LABELS,
  DIVERSITY_TAG_OPTIONS,
  SALARY_CURRENCY_LABELS,
} from '@/constants/enums';
import { formatSalaryAsLPA } from '@/utils/format';
import type { CreateJobRequest, SpecificDegree, NoticePeriodPreference } from '@/types/job';
import type { ApiError } from '@/types/api';
import type { FormDraft } from '@/types/draft';

function toSelectOptions(labels: Record<string, string>): SelectOption[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}


type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const steps = [
  { icon: Briefcase, label: 'Basics' },
  { icon: FileText, label: 'Description' },
  { icon: DollarSign, label: 'Compensation' },
  { icon: MapPin, label: 'Location' },
  { icon: Tags, label: 'Skills & Tags' },
  { icon: Check, label: 'Requirements' },
  { icon: FileText, label: 'Screening' },
  { icon: Eye, label: 'Preview' },
];

const initialForm: CreateJobRequest = {
  title: '',
  description: '',
  location: '',
  skillsRequired: [],
  type: 'FULL_TIME',
  currency: 'INR',
};

export default function PostJobPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<CreateJobRequest>(initialForm);
  const [tagInput, setTagInput] = useState('');

  // Template state
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showLoadTemplateModal, setShowLoadTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');

  const { data: templatesData, refetch: refetchTemplates } = useQuery({
    queryKey: ['job-templates'],
    queryFn: () => jobTemplateService.getTemplates(),
    enabled: false,
  });

  const saveTemplateMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      templateData: Record<string, unknown>;
    }) => jobTemplateService.createTemplate(data),
    onSuccess: () => {
      showToast.success('Template saved');
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setTemplateDesc('');
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to save template');
    },
  });

  const handleSaveAsTemplate = () => {
    if (!templateName.trim()) return;
    saveTemplateMutation.mutate({
      name: templateName.trim(),
      description: templateDesc.trim() || undefined,
      templateData: form as unknown as Record<string, unknown>,
    });
  };

  const handleLoadTemplate = (templateData: Record<string, unknown>) => {
    const tplData = templateData as unknown as CreateJobRequest;
    setForm({
      ...initialForm,
      ...tplData,
      skillsRequired: tplData.skillsRequired || [],
    });
    setShowLoadTemplateModal(false);
    showToast.success('Template loaded');
  };

  const openLoadTemplateModal = () => {
    refetchTemplates();
    setShowLoadTemplateModal(true);
  };

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
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  type ArrayFieldKey =
    | 'skillsRequired'
    | 'niceToHaveSkills'
    | 'certificationsRequired'
    | 'tags'
    | 'jobPerks'
    | 'languagesRequired'
    | 'additionalLocations'
    | 'degreeSpecializations'
    | 'diversityTags';

  const addToArray = (key: ArrayFieldKey, value: string, clearFn: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !(form[key] || []).includes(trimmed)) {
      updateField(key, [...(form[key] || []), trimmed]);
      clearFn('');
    }
  };

  const removeFromArray = (key: ArrayFieldKey, value: string) => {
    updateField(
      key,
      (form[key] || []).filter((v) => v !== value),
    );
  };

  // Auto-save draft every 30 seconds
  const saveDraft = useCallback(async () => {
    try {
      await draftService.saveDraft({
        formType: 'JOB_POSTING',
        data: form as unknown as Record<string, unknown>,
      });
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
    onSuccess: (response) => {
      showToast.success('Job posted successfully!');

      // Extract suggested filters from response
      const responseData = response.data as
        | { suggestedFilters?: Record<string, string | string[] | number | null> }
        | undefined;
      const suggestedFilters = responseData?.suggestedFilters;

      if (suggestedFilters) {
        // Build query params for candidate search
        const params = new URLSearchParams();

        const skills = suggestedFilters.skills;
        if (Array.isArray(skills) && skills.length) {
          params.set('skills', skills.join(','));
        }
        if (suggestedFilters.location) {
          params.set('location', String(suggestedFilters.location));
        }
        if (suggestedFilters.experienceMin != null) {
          params.set('experienceMin', String(suggestedFilters.experienceMin));
        }
        if (suggestedFilters.experienceMax != null) {
          params.set('experienceMax', String(suggestedFilters.experienceMax));
        }
        if (suggestedFilters.experienceLevel) {
          params.set('experienceLevel', String(suggestedFilters.experienceLevel));
        }
        if (suggestedFilters.educationRequired) {
          params.set('highestEducationLevel', String(suggestedFilters.educationRequired));
        }
        if (suggestedFilters.preferredWorkMode) {
          params.set('preferredWorkMode', String(suggestedFilters.preferredWorkMode));
        }
        if (suggestedFilters.preferredJobType) {
          params.set('preferredJobType', String(suggestedFilters.preferredJobType));
        }
        if (suggestedFilters.industry) {
          params.set('industry', String(suggestedFilters.industry));
        }
        if (suggestedFilters.department) {
          params.set('department', String(suggestedFilters.department));
        }
        if (suggestedFilters.expectedSalaryMax != null) {
          params.set('expectedSalaryMax', String(suggestedFilters.expectedSalaryMax));
        }

        // Redirect to candidate search with pre-filled filters
        router.push(`${ROUTES.EMPLOYER.CANDIDATES}?${params.toString()}`);
      } else {
        // Fallback to MY_JOBS if no filters
        router.push(ROUTES.EMPLOYER.MY_JOBS);
      }
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to post job');
    },
  });

  const canGoNext = (): boolean => {
    switch (step) {
      case 0:
        return !!form.title.trim();
      case 1:
        return !!form.description.trim();
      case 2:
        return true;
      case 3:
        return !!form.location.trim();
      case 4:
        return form.skillsRequired.length > 0;
      case 5:
        return true;
      case 6:
        // Validate expiresAt is after applicationDeadline
        if (form.expiresAt && form.applicationDeadline) {
          if (new Date(form.expiresAt) < new Date(form.applicationDeadline)) {
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < 7 && canGoNext()) setStep((step + 1) as Step);
  };

  const handleBack = () => {
    if (step > 0) setStep((step - 1) as Step);
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      applicationDeadline: form.applicationDeadline
        ? new Date(form.applicationDeadline).toISOString()
        : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <DashboardLayout requiredRole={['EMPLOYER']}>
      <div className="space-y-6">
        {/* Draft Restore Banner */}
        {draftBanner && (
          <div className="border-primary/30 bg-primary-light flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="flex items-center gap-3">
              <FileText className="text-primary h-5 w-5" />
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
                <p className="text-xs text-[var(--text-muted)]">Would you like to restore it?</p>
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
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Fill in the details to create a job posting
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openLoadTemplateModal}>
              <Download className="mr-1.5 h-4 w-4" /> Load Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSaveTemplateModal(true)}>
              <Upload className="mr-1.5 h-4 w-4" /> Save as Template
            </Button>
            <Button variant="outline" size="sm" onClick={saveDraft}>
              <Save className="mr-1.5 h-4 w-4" /> Save Draft
            </Button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => {
                  if (i <= step) setStep(i as Step);
                }}
                className={`flex flex-col items-center gap-1.5 ${i <= step ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    i < step
                      ? 'bg-[var(--success)] text-white'
                      : i === step
                        ? 'bg-primary text-white'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span
                  className={`hidden text-xs sm:block ${
                    i === step ? 'text-primary font-medium' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    i < step ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text)]">Basic Information</h2>
              <ServerSuggestionInput
                category="job_title"
                label="Job Title"
                placeholder="e.g. Senior Software Engineer"
                value={form.title}
                onChange={(val) => updateField('title', val)}
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Job Type"
                  options={toSelectOptions(JOB_TYPE_LABELS)}
                  value={form.type || ''}
                  onChange={(v) => updateField('type', v as CreateJobRequest['type'])}
                  placeholder="Select type"
                />
                <Select
                  label="Experience Level"
                  options={toSelectOptions(EXPERIENCE_LEVEL_LABELS)}
                  value={form.experienceLevel || ''}
                  onChange={(v) =>
                    updateField('experienceLevel', v as CreateJobRequest['experienceLevel'])
                  }
                  placeholder="Select level"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Min Experience (years)"
                  type="number"
                  placeholder="0"
                  value={form.experienceMin?.toString() || ''}
                  onChange={(e) => updateField('experienceMin', parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Max Experience (years)"
                  type="number"
                  placeholder="10"
                  value={form.experienceMax?.toString() || ''}
                  onChange={(e) =>
                    updateField('experienceMax', parseInt(e.target.value) || undefined)
                  }
                />
                <Input
                  label="Number of Openings"
                  type="number"
                  placeholder="1"
                  value={form.numberOfOpenings?.toString() || ''}
                  onChange={(e) =>
                    updateField('numberOfOpenings', parseInt(e.target.value) || undefined)
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ServerAutoSuggest
                  category="industry"
                  label="Industry"
                  placeholder="e.g. Information Technology"
                  value={form.industry || ''}
                  onChange={(v) => updateField('industry', v as string)}
                  allowCreate
                />
                <ServerAutoSuggest
                  category="department"
                  label="Department"
                  placeholder="e.g. Engineering"
                  value={form.department || ''}
                  onChange={(v) => updateField('department', v as string)}
                  allowCreate
                />
              </div>
              <Select
                label="Education Required"
                options={toSelectOptions(EDUCATION_LEVEL_LABELS)}
                value={form.educationRequired || ''}
                onChange={(v) =>
                  updateField('educationRequired', v as CreateJobRequest['educationRequired'])
                }
                placeholder="Select level"
              />
              <ServerAutoSuggest
                category="field_of_study"
                label="Preferred Education Field"
                placeholder="e.g. Computer Science, MBA"
                value={form.preferredEducationField || ''}
                onChange={(v) => updateField('preferredEducationField', v as string)}
                allowCreate
              />
              <ServerAutoSuggest
                category="role_category"
                label="Role Category"
                placeholder="e.g. Engineering, Marketing"
                value={form.roleCategory || ''}
                onChange={(v) => updateField('roleCategory', v as string)}
                allowCreate
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Functional Area"
                  options={toSelectOptions(FUNCTIONAL_AREA_LABELS)}
                  value={form.functionalArea || ''}
                  onChange={(v) =>
                    updateField('functionalArea', v as CreateJobRequest['functionalArea'])
                  }
                  placeholder="Select area"
                />
                <Input
                  label="Job Reference Code"
                  placeholder="e.g. ENG-2026-001"
                  value={form.referenceCode || ''}
                  onChange={(e) => updateField('referenceCode', e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="UG Required"
                  options={toSelectOptions(EDUCATION_LEVEL_LABELS)}
                  value={form.ugRequired || ''}
                  onChange={(v) => updateField('ugRequired', v as CreateJobRequest['ugRequired'])}
                  placeholder="Select UG level"
                />
                <Select
                  label="PG Required"
                  options={toSelectOptions(EDUCATION_LEVEL_LABELS)}
                  value={form.pgRequired || ''}
                  onChange={(v) => updateField('pgRequired', v as CreateJobRequest['pgRequired'])}
                  placeholder="Select PG level"
                />
              </div>
              {/* Specific Degrees */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                  Specific Degrees Accepted
                </label>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {Object.entries(SPECIFIC_DEGREE_LABELS).map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        const existing = form.specificDegrees || [];
                        updateField(
                          'specificDegrees',
                          existing.includes(val as SpecificDegree)
                            ? existing.filter((d) => d !== val)
                            : [...existing, val as SpecificDegree],
                        );
                      }}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        (form.specificDegrees || []).includes(val as SpecificDegree)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'hover:border-primary/50 border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <ServerAutoSuggest
                category="field_of_study"
                label="Degree Specializations"
                placeholder="e.g. Computer Science, Electronics"
                multiple
                allowCreate
                value={form.degreeSpecializations || []}
                onChange={(v) => updateField('degreeSpecializations', v as string[])}
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text)]">Job Description</h2>
              <RichTextEditor
                label="Description"
                placeholder="Describe the role, what the candidate will work on, and the team they'll join..."
                value={form.description}
                onChange={(v) => updateField('description', v)}
                required
              />
              <RichTextEditor
                label="Key Responsibilities"
                placeholder="List the primary responsibilities of this role..."
                value={form.keyResponsibilities || ''}
                onChange={(v) => updateField('keyResponsibilities', v)}
              />
              <RichTextEditor
                label="Requirements"
                placeholder="List the qualifications and skills required..."
                value={form.requirements || ''}
                onChange={(v) => updateField('requirements', v)}
              />
              <RichTextEditor
                label="Benefits"
                placeholder="What benefits does this role offer?"
                value={form.benefits || ''}
                onChange={(v) => updateField('benefits', v)}
              />
              <Textarea
                label="Interview Process"
                rows={3}
                placeholder="Describe the interview process (e.g. Phone screen → Technical → Onsite)"
                value={form.interviewProcess || ''}
                onChange={(e) => updateField('interviewProcess', e.target.value)}
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
                  onChange={(e) => updateField('salaryMin', parseInt(e.target.value) || undefined)}
                />
                <Input
                  label="Max Salary"
                  type="number"
                  placeholder="e.g. 1500000"
                  value={form.salaryMax?.toString() || ''}
                  onChange={(e) => updateField('salaryMax', parseInt(e.target.value) || undefined)}
                />
                <Select
                  label="Salary Type"
                  options={toSelectOptions(SALARY_TYPE_LABELS)}
                  value={form.salaryType || ''}
                  onChange={(v) => updateField('salaryType', v as CreateJobRequest['salaryType'])}
                  placeholder="Select type"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Currency"
                  options={toSelectOptions(SALARY_CURRENCY_LABELS)}
                  value={form.currency || ''}
                  onChange={(v) => updateField('currency', v)}
                  placeholder="Select currency"
                />
                <div className="flex items-end pb-1">
                  <Switch
                    label="Disclose salary on listing"
                    checked={form.salaryDisclosed !== false}
                    onChange={() => updateField('salaryDisclosed', form.salaryDisclosed === false)}
                  />
                </div>
              </div>
              <Switch
                label="Salary is negotiable"
                checked={form.salaryNegotiable || false}
                onChange={() => updateField('salaryNegotiable', !form.salaryNegotiable)}
              />
              {(form.currency || 'INR') === 'INR' &&
                form.salaryType === 'ANNUAL' &&
                (form.salaryMin || form.salaryMax) && (
                  <p className="text-primary text-sm font-medium">
                    CTC: {formatSalaryAsLPA(form.salaryMin, form.salaryMax)}
                  </p>
                )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text)]">Location & Work Mode</h2>
              <ServerAutoSuggest
                category="location"
                label="Location"
                placeholder="e.g. Bangalore, Karnataka"
                value={form.location}
                onChange={(v) => updateField('location', v as string)}
                allowCreate
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Work Mode"
                  options={toSelectOptions(WORK_MODE_LABELS)}
                  value={form.workMode || ''}
                  onChange={(v) => updateField('workMode', v as CreateJobRequest['workMode'])}
                  placeholder="Select mode"
                />
                <Select
                  label="Shift Type"
                  options={toSelectOptions(SHIFT_TYPE_LABELS)}
                  value={form.shiftType || ''}
                  onChange={(v) => updateField('shiftType', v as CreateJobRequest['shiftType'])}
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
                onChange={(e) =>
                  updateField('travelRequirementPercent', parseInt(e.target.value) || undefined)
                }
              />
              <ServerAutoSuggest
                category="location"
                label="Additional Locations"
                placeholder="e.g. Mumbai, Delhi NCR"
                multiple
                allowCreate
                value={form.additionalLocations || []}
                onChange={(v) => updateField('additionalLocations', v as string[])}
              />
              <Switch
                label="Accommodation provided"
                checked={form.accommodationProvided || false}
                onChange={() => updateField('accommodationProvided', !form.accommodationProvided)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Switch
                  label="Walk-in interview"
                  checked={form.isWalkIn || false}
                  onChange={() => updateField('isWalkIn', !form.isWalkIn)}
                />
              </div>
              {form.isWalkIn && (
                <div className="space-y-4 rounded-lg border border-[var(--border)] p-4">
                  <h3 className="text-sm font-medium text-[var(--text)]">Walk-in Details</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DatePicker
                      label="Start Date & Time"
                      value={form.walkInStartDate || ''}
                      onChange={(v) => updateField('walkInStartDate', v)}
                      mode="datetime"
                    />
                    <DatePicker
                      label="End Date & Time"
                      value={form.walkInEndDate || ''}
                      onChange={(v) => updateField('walkInEndDate', v)}
                      mode="datetime"
                    />
                  </div>
                  <Input
                    label="Time"
                    placeholder="e.g. 10:00 AM - 4:00 PM"
                    value={form.walkInTime || ''}
                    onChange={(e) => updateField('walkInTime', e.target.value)}
                  />
                  <Input
                    label="Venue"
                    placeholder="Full address of walk-in venue"
                    value={form.walkInVenue || ''}
                    onChange={(e) => updateField('walkInVenue', e.target.value)}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Contact Person"
                      placeholder="Name"
                      value={form.walkInContactPerson || ''}
                      onChange={(e) => updateField('walkInContactPerson', e.target.value)}
                    />
                    <Input
                      label="Contact Phone"
                      placeholder="Phone number"
                      value={form.walkInContactPhone || ''}
                      onChange={(e) => updateField('walkInContactPhone', e.target.value)}
                    />
                  </div>
                  <Textarea
                    label="Instructions"
                    rows={2}
                    placeholder="Any special instructions for walk-in candidates"
                    value={form.walkInInstructions || ''}
                    onChange={(e) => updateField('walkInInstructions', e.target.value)}
                  />
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Contact Person"
                  placeholder="HR Manager Name"
                  value={form.contactPerson || ''}
                  onChange={(e) => updateField('contactPerson', e.target.value)}
                />
                <Input
                  label="Contact Email"
                  type="email"
                  placeholder="hr@company.com"
                  value={form.contactEmail || ''}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text)]">Skills, Tags & More</h2>

              <ServerAutoSuggest
                category="skill"
                label="Required Skills"
                placeholder="e.g. React, TypeScript"
                multiple
                allowCreate
                required
                value={form.skillsRequired}
                onChange={(v) => updateField('skillsRequired', v as string[])}
              />

              <ServerAutoSuggest
                category="skill"
                label="Nice-to-Have Skills"
                placeholder="e.g. GraphQL, Docker"
                multiple
                allowCreate
                value={form.niceToHaveSkills || []}
                onChange={(v) => updateField('niceToHaveSkills', v as string[])}
              />

              <ServerAutoSuggest
                category="certification"
                label="Certifications Required"
                placeholder="e.g. AWS Solutions Architect"
                multiple
                allowCreate
                value={form.certificationsRequired || []}
                onChange={(v) => updateField('certificationsRequired', v as string[])}
              />

              <ServerAutoSuggest
                category="language"
                label="Languages Required"
                placeholder="e.g. English, Hindi"
                multiple
                allowCreate
                value={form.languagesRequired || []}
                onChange={(v) => updateField('languagesRequired', v as string[])}
              />

              {/* Tags */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Tags</label>
                <div className="mb-2 flex gap-2">
                  <Input
                    placeholder="e.g. startup, fintech"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('tags', tagInput, setTagInput);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    className="shrink-0"
                    onClick={() => addToArray('tags', tagInput, setTagInput)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(form.tags || []).map((t) => (
                    <Tag key={t} label={t} onRemove={() => removeFromArray('tags', t)} />
                  ))}
                </div>
              </div>

              <ServerAutoSuggest
                category="benefit"
                label="Job Perks"
                placeholder="e.g. Free meals, Gym membership"
                multiple
                allowCreate
                value={form.jobPerks || []}
                onChange={(v) => updateField('jobPerks', v as string[])}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Urgency Level"
                  options={toSelectOptions(URGENCY_LEVEL_LABELS)}
                  value={form.urgencyLevel || ''}
                  onChange={(v) =>
                    updateField('urgencyLevel', v as CreateJobRequest['urgencyLevel'])
                  }
                  placeholder="Select urgency"
                />
                <DatePicker
                  label="Application Deadline (Date & Time)"
                  value={form.applicationDeadline || ''}
                  onChange={(val) => updateField('applicationDeadline', val)}
                  mode="datetime"
                />
              </div>

              <Switch
                label="Feature this job (premium)"
                checked={form.isFeatured || false}
                onChange={() => updateField('isFeatured', !form.isFeatured)}
              />

              <Switch
                label="Premium Job Posting"
                description="Highlight this job with premium badge and priority placement"
                checked={form.isPremium || false}
                onChange={() => updateField('isPremium', !form.isPremium)}
              />

              {/* Notice Period Preference */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                  Preferred Notice Period
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(NOTICE_PERIOD_PREFERENCE_LABELS).map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        const existing = form.noticePeriodPreference || [];
                        updateField(
                          'noticePeriodPreference',
                          existing.includes(val as NoticePeriodPreference)
                            ? existing.filter((n) => n !== val)
                            : [...existing, val as NoticePeriodPreference],
                        );
                      }}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        (form.noticePeriodPreference || []).includes(val as NoticePeriodPreference)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'hover:border-primary/50 border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text)]">Requirements & Inclusion</h2>

              {/* Diversity Tags */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
                  Diversity & Inclusion Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIVERSITY_TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const existing = form.diversityTags || [];
                        updateField(
                          'diversityTags',
                          existing.includes(tag)
                            ? existing.filter((t) => t !== tag)
                            : [...existing, tag],
                        );
                      }}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        (form.diversityTags || []).includes(tag)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'hover:border-primary/50 border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Switch
                  label="PwD (Differently Abled) Friendly"
                  checked={form.isPwdFriendly || false}
                  onChange={() => updateField('isPwdFriendly', !form.isPwdFriendly)}
                />
                <Switch
                  label="Visa Sponsorship Available"
                  checked={form.visaSponsorshipAvailable || false}
                  onChange={() =>
                    updateField('visaSponsorshipAvailable', !form.visaSponsorshipAvailable)
                  }
                />
                <Switch
                  label="Background Check Required"
                  checked={form.backgroundCheckRequired || false}
                  onChange={() =>
                    updateField('backgroundCheckRequired', !form.backgroundCheckRequired)
                  }
                />
                <Switch
                  label="Passport Required"
                  checked={form.passportRequired || false}
                  onChange={() => updateField('passportRequired', !form.passportRequired)}
                />
                <Switch
                  label="Confidential Posting"
                  checked={form.isConfidential || false}
                  onChange={() => updateField('isConfidential', !form.isConfidential)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Gender Preference"
                  options={toSelectOptions(GENDER_PREFERENCE_LABELS)}
                  value={form.genderPreference || ''}
                  onChange={(v) =>
                    updateField('genderPreference', v as CreateJobRequest['genderPreference'])
                  }
                  placeholder="Select"
                />
                <Select
                  label="Driving License Required"
                  options={toSelectOptions(DRIVING_LICENSE_TYPE_LABELS)}
                  value={form.drivingLicenseRequired || ''}
                  onChange={(v) =>
                    updateField(
                      'drivingLicenseRequired',
                      v as CreateJobRequest['drivingLicenseRequired'],
                    )
                  }
                  placeholder="Select"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Minimum Age"
                  type="number"
                  placeholder="18"
                  value={form.ageMin?.toString() || ''}
                  onChange={(e) => updateField('ageMin', parseInt(e.target.value) || undefined)}
                />
                <Input
                  label="Maximum Age"
                  type="number"
                  placeholder="65"
                  value={form.ageMax?.toString() || ''}
                  onChange={(e) => updateField('ageMax', parseInt(e.target.value) || undefined)}
                />
              </div>

              <Textarea
                label="Bond / Service Agreement Details"
                rows={2}
                placeholder="e.g. 2-year service bond with ₹2L penalty clause"
                value={form.bondDetails || ''}
                onChange={(e) => updateField('bondDetails', e.target.value)}
              />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text)]">Screening & Posting</h2>

              <ScreeningQuestionBuilder
                questions={form.screeningQuestions || []}
                onChange={(q) => updateField('screeningQuestions', q)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Posting Visibility"
                  options={toSelectOptions(POSTING_VISIBILITY_LABELS)}
                  value={form.postingVisibility || ''}
                  onChange={(v) =>
                    updateField('postingVisibility', v as CreateJobRequest['postingVisibility'])
                  }
                  placeholder="Select visibility"
                />
                <Select
                  label="Apply Method"
                  options={toSelectOptions(APPLY_METHOD_LABELS)}
                  value={form.applyMethod || ''}
                  onChange={(v) => updateField('applyMethod', v as CreateJobRequest['applyMethod'])}
                  placeholder="Select method"
                />
              </div>

              {form.applyMethod === 'EXTERNAL_URL' && (
                <Input
                  label="External Apply URL"
                  placeholder="https://careers.company.com/apply/123"
                  value={form.externalApplyUrl || ''}
                  onChange={(e) => updateField('externalApplyUrl', e.target.value)}
                  required
                />
              )}

              <DatePicker
                label="Schedule Publish Date & Time (leave empty to publish immediately)"
                value={form.scheduledPublishAt || ''}
                onChange={(v) => updateField('scheduledPublishAt', v)}
                mode="datetime"
              />

              <DatePicker
                label="Job Expiration Date & Time"
                helperText="Date and time when this job will automatically expire and close"
                value={form.expiresAt || ''}
                onChange={(v) => updateField('expiresAt', v)}
                mode="datetime"
                minDate={new Date()}
              />
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-[var(--text)]">Preview Your Job Posting</h2>

              {/* Badges row */}
              <div className="flex flex-wrap gap-1.5">
                {form.isConfidential && <Badge variant="warning">Confidential</Badge>}
                {form.isFeatured && <Badge variant="success">Featured</Badge>}
                {form.isPremium && <Badge variant="info">Premium</Badge>}
                {form.postingVisibility && form.postingVisibility !== 'PUBLIC' && (
                  <Badge variant="info">{POSTING_VISIBILITY_LABELS[form.postingVisibility]}</Badge>
                )}
                {form.applyMethod && form.applyMethod !== 'IN_PLATFORM' && (
                  <Badge variant="neutral">{APPLY_METHOD_LABELS[form.applyMethod]}</Badge>
                )}
                {form.scheduledPublishAt && (
                  <Badge variant="info">Scheduled: {form.scheduledPublishAt}</Badge>
                )}
                {form.expiresAt && <Badge variant="warning">Expires: {form.expiresAt}</Badge>}
              </div>

              {/* Basic Info */}
              <div className="space-y-2">
                <PreviewSection label="Job Title" value={form.title} />
                <PreviewSection
                  label="Job Type"
                  value={form.type ? JOB_TYPE_LABELS[form.type] : '—'}
                />
                <PreviewSection
                  label="Experience"
                  value={`${form.experienceMin || 0} - ${form.experienceMax || 'Any'} years`}
                />
                <PreviewSection
                  label="Experience Level"
                  value={form.experienceLevel ? EXPERIENCE_LEVEL_LABELS[form.experienceLevel] : '—'}
                />
                <PreviewSection
                  label="Education"
                  value={
                    form.educationRequired ? EDUCATION_LEVEL_LABELS[form.educationRequired] : '—'
                  }
                />
                {form.preferredEducationField && (
                  <PreviewSection label="Education Field" value={form.preferredEducationField} />
                )}
                {form.roleCategory && (
                  <PreviewSection label="Role Category" value={form.roleCategory} />
                )}
                {form.industry && <PreviewSection label="Industry" value={form.industry} />}
                {form.department && <PreviewSection label="Department" value={form.department} />}
                <PreviewSection label="Openings" value={form.numberOfOpenings?.toString() || '—'} />
                {form.functionalArea && (
                  <PreviewSection
                    label="Functional Area"
                    value={FUNCTIONAL_AREA_LABELS[form.functionalArea]}
                  />
                )}
                {form.referenceCode && (
                  <PreviewSection label="Reference Code" value={form.referenceCode} />
                )}
                {form.ugRequired && (
                  <PreviewSection
                    label="UG Required"
                    value={EDUCATION_LEVEL_LABELS[form.ugRequired]}
                  />
                )}
                {form.pgRequired && (
                  <PreviewSection
                    label="PG Required"
                    value={EDUCATION_LEVEL_LABELS[form.pgRequired]}
                  />
                )}
              </div>

              {(form.specificDegrees || []).length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium text-[var(--text)]">Specific Degrees</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(form.specificDegrees || []).map((d) => (
                      <Tag key={d} label={SPECIFIC_DEGREE_LABELS[d] || d} />
                    ))}
                  </div>
                </div>
              )}

              {(form.degreeSpecializations || []).length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium text-[var(--text)]">Degree Specializations</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(form.degreeSpecializations || []).map((d) => (
                      <Tag key={d} label={d} />
                    ))}
                  </div>
                </div>
              )}

              {/* Description (rich text) */}
              <div className="border-t border-[var(--border)] pt-4">
                <h3 className="mb-2 font-medium text-[var(--text)]">Description</h3>
                <div
                  className="prose prose-sm max-w-none text-sm text-[var(--text-secondary)]"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.description || '') }}
                />
              </div>

              {form.keyResponsibilities && (
                <div>
                  <h3 className="mb-2 font-medium text-[var(--text)]">Key Responsibilities</h3>
                  <div
                    className="prose prose-sm max-w-none text-sm text-[var(--text-secondary)]"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(form.keyResponsibilities),
                    }}
                  />
                </div>
              )}

              {form.requirements && (
                <div>
                  <h3 className="mb-2 font-medium text-[var(--text)]">Requirements</h3>
                  <div
                    className="prose prose-sm max-w-none text-sm text-[var(--text-secondary)]"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.requirements) }}
                  />
                </div>
              )}

              {form.benefits && (
                <div>
                  <h3 className="mb-2 font-medium text-[var(--text)]">Benefits</h3>
                  <div
                    className="prose prose-sm max-w-none text-sm text-[var(--text-secondary)]"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.benefits) }}
                  />
                </div>
              )}

              {form.interviewProcess && (
                <div>
                  <h3 className="mb-2 font-medium text-[var(--text)]">Interview Process</h3>
                  <p className="text-sm whitespace-pre-wrap text-[var(--text-secondary)]">
                    {form.interviewProcess}
                  </p>
                </div>
              )}

              {/* Compensation */}
              <div className="space-y-2 border-t border-[var(--border)] pt-4">
                <h3 className="mb-2 font-medium text-[var(--text)]">Compensation</h3>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-[var(--text-muted)]">Salary: </span>
                    <span className="text-[var(--text)]">
                      {form.salaryMin || '—'} - {form.salaryMax || '—'} {form.currency || 'INR'}
                    </span>
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">Type: </span>
                    <span className="text-[var(--text)]">
                      {form.salaryType ? SALARY_TYPE_LABELS[form.salaryType] : '—'}
                    </span>
                  </p>
                </div>
                {form.salaryNegotiable && (
                  <p className="text-sm text-[var(--success)]">Salary is negotiable</p>
                )}
                {(form.currency || 'INR') === 'INR' &&
                  form.salaryType === 'ANNUAL' &&
                  (form.salaryMin || form.salaryMax) && (
                    <p className="text-primary text-sm font-medium">
                      CTC: {formatSalaryAsLPA(form.salaryMin, form.salaryMax)}
                    </p>
                  )}
              </div>

              {/* Location & Work */}
              <div className="space-y-2 border-t border-[var(--border)] pt-4">
                <h3 className="mb-2 font-medium text-[var(--text)]">Location & Work</h3>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-[var(--text-muted)]">Location: </span>
                    <span className="text-[var(--text)]">{form.location || '—'}</span>
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">Work Mode: </span>
                    <span className="text-[var(--text)]">
                      {form.workMode ? WORK_MODE_LABELS[form.workMode] : '—'}
                    </span>
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">Shift: </span>
                    <span className="text-[var(--text)]">
                      {form.shiftType ? SHIFT_TYPE_LABELS[form.shiftType] : '—'}
                    </span>
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">Remote: </span>
                    <span className="text-[var(--text)]">{form.isRemote ? 'Yes' : 'No'}</span>
                  </p>
                  {form.relocationAssistance && (
                    <p className="text-[var(--success)]">Relocation assistance offered</p>
                  )}
                  {form.travelRequirementPercent != null && form.travelRequirementPercent > 0 && (
                    <p>
                      <span className="text-[var(--text-muted)]">Travel: </span>
                      <span className="text-[var(--text)]">{form.travelRequirementPercent}%</span>
                    </p>
                  )}
                  {form.accommodationProvided && (
                    <p className="text-[var(--success)]">Accommodation provided</p>
                  )}
                </div>
                {(form.additionalLocations || []).length > 0 && (
                  <div>
                    <span className="text-sm text-[var(--text-muted)]">Additional Locations: </span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {(form.additionalLocations || []).map((l) => (
                        <Tag key={l} label={l} />
                      ))}
                    </div>
                  </div>
                )}
                {(form.contactPerson || form.contactEmail) && (
                  <div className="text-sm">
                    {form.contactPerson && (
                      <p>
                        <span className="text-[var(--text-muted)]">Contact: </span>
                        {form.contactPerson}
                      </p>
                    )}
                    {form.contactEmail && (
                      <p>
                        <span className="text-[var(--text-muted)]">Email: </span>
                        {form.contactEmail}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Walk-in Details */}
              {form.isWalkIn && (
                <div className="space-y-2 border-t border-[var(--border)] pt-4">
                  <h3 className="mb-2 font-medium text-[var(--text)]">Walk-in Details</h3>
                  <div className="space-y-1 text-sm">
                    {form.walkInStartDate && (
                      <p>
                        <span className="text-[var(--text-muted)]">Date: </span>
                        {form.walkInStartDate}
                        {form.walkInEndDate ? ` – ${form.walkInEndDate}` : ''}
                      </p>
                    )}
                    {form.walkInTime && (
                      <p>
                        <span className="text-[var(--text-muted)]">Time: </span>
                        {form.walkInTime}
                      </p>
                    )}
                    {form.walkInVenue && (
                      <p>
                        <span className="text-[var(--text-muted)]">Venue: </span>
                        {form.walkInVenue}
                      </p>
                    )}
                    {form.walkInContactPerson && (
                      <p>
                        <span className="text-[var(--text-muted)]">Contact: </span>
                        {form.walkInContactPerson}
                        {form.walkInContactPhone ? ` (${form.walkInContactPhone})` : ''}
                      </p>
                    )}
                    {form.walkInInstructions && (
                      <p>
                        <span className="text-[var(--text-muted)]">Instructions: </span>
                        {form.walkInInstructions}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Skills & Tags */}
              {form.skillsRequired.length > 0 && (
                <div className="border-t border-[var(--border)] pt-4">
                  <h3 className="mb-2 font-medium text-[var(--text)]">Required Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {form.skillsRequired.map((s) => (
                      <Tag key={s} label={s} variant="primary" />
                    ))}
                  </div>
                </div>
              )}

              {(form.niceToHaveSkills || []).length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium text-[var(--text)]">Nice-to-Have Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(form.niceToHaveSkills || []).map((s) => (
                      <Tag key={s} label={s} />
                    ))}
                  </div>
                </div>
              )}

              {(form.certificationsRequired || []).length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium text-[var(--text)]">Certifications Required</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(form.certificationsRequired || []).map((c) => (
                      <Tag key={c} label={c} />
                    ))}
                  </div>
                </div>
              )}

              {(form.languagesRequired || []).length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium text-[var(--text)]">Languages Required</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(form.languagesRequired || []).map((l) => (
                      <Tag key={l} label={l} />
                    ))}
                  </div>
                </div>
              )}

              {(form.tags || []).length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium text-[var(--text)]">Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(form.tags || []).map((t) => (
                      <Tag key={t} label={t} />
                    ))}
                  </div>
                </div>
              )}

              {(form.jobPerks || []).length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium text-[var(--text)]">Job Perks</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(form.jobPerks || []).map((p) => (
                      <Tag key={p} label={p} variant="primary" />
                    ))}
                  </div>
                </div>
              )}

              {/* Urgency & Deadline */}
              {(form.urgencyLevel || form.applicationDeadline) && (
                <div className="flex flex-wrap gap-4 border-t border-[var(--border)] pt-4 text-sm">
                  {form.urgencyLevel && (
                    <div>
                      <span className="text-[var(--text-muted)]">Urgency: </span>
                      <Badge
                        variant={
                          form.urgencyLevel === 'IMMEDIATE'
                            ? 'error'
                            : form.urgencyLevel === 'URGENT'
                              ? 'warning'
                              : 'neutral'
                        }
                      >
                        {URGENCY_LEVEL_LABELS[form.urgencyLevel]}
                      </Badge>
                    </div>
                  )}
                  {form.applicationDeadline && (
                    <div>
                      <span className="text-[var(--text-muted)]">Deadline: </span>
                      <span className="text-[var(--text)]">{form.applicationDeadline}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notice Period */}
              {(form.noticePeriodPreference || []).length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium text-[var(--text)]">Notice Period Preference</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(form.noticePeriodPreference || []).map((np) => (
                      <Tag key={np} label={NOTICE_PERIOD_PREFERENCE_LABELS[np] || np} />
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements & Inclusion */}
              {(form.diversityTags?.length ||
                form.isPwdFriendly ||
                form.visaSponsorshipAvailable ||
                form.backgroundCheckRequired ||
                form.passportRequired ||
                form.genderPreference ||
                form.drivingLicenseRequired ||
                form.ageMin ||
                form.ageMax ||
                form.bondDetails) && (
                <div className="space-y-3 border-t border-[var(--border)] pt-4">
                  <h3 className="font-medium text-[var(--text)]">Requirements & Inclusion</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {form.isPwdFriendly && <Badge variant="success">PwD Friendly</Badge>}
                    {form.visaSponsorshipAvailable && (
                      <Badge variant="info">Visa Sponsorship</Badge>
                    )}
                    {form.backgroundCheckRequired && (
                      <Badge variant="warning">Background Check</Badge>
                    )}
                    {form.passportRequired && <Badge variant="warning">Passport Required</Badge>}
                    {(form.diversityTags || []).map((tag) => (
                      <Badge key={tag} variant="neutral">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-1 text-sm">
                    {form.genderPreference && form.genderPreference !== 'ANY' && (
                      <p>
                        <span className="text-[var(--text-muted)]">Gender Pref.: </span>
                        {GENDER_PREFERENCE_LABELS[form.genderPreference]}
                      </p>
                    )}
                    {form.drivingLicenseRequired && form.drivingLicenseRequired !== 'NONE' && (
                      <p>
                        <span className="text-[var(--text-muted)]">Driving License: </span>
                        {DRIVING_LICENSE_TYPE_LABELS[form.drivingLicenseRequired]}
                      </p>
                    )}
                    {(form.ageMin || form.ageMax) && (
                      <p>
                        <span className="text-[var(--text-muted)]">Age: </span>
                        {form.ageMin || '—'} – {form.ageMax || '—'} years
                      </p>
                    )}
                  </div>
                  {form.bondDetails && (
                    <div>
                      <p className="text-sm text-[var(--text-muted)]">Bond / Service Agreement:</p>
                      <p className="text-sm text-[var(--text)]">{form.bondDetails}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Screening Questions */}
              {(form.screeningQuestions || []).length > 0 && (
                <div className="border-t border-[var(--border)] pt-4">
                  <h3 className="mb-2 font-medium text-[var(--text)]">
                    Screening Questions ({(form.screeningQuestions || []).length})
                  </h3>
                  <div className="space-y-2">
                    {(form.screeningQuestions || []).map((q, idx) => (
                      <div key={idx} className="rounded-lg border border-[var(--border)] p-3">
                        <p className="text-sm font-medium text-[var(--text)]">
                          {idx + 1}. {q.question}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <span>{q.questionType}</span>
                          {q.isRequired && (
                            <Badge variant="warning" size="sm">
                              Required
                            </Badge>
                          )}
                          {q.isDealBreaker && (
                            <Badge variant="error" size="sm">
                              Deal Breaker
                            </Badge>
                          )}
                          {q.idealAnswer && <span>Ideal: {q.idealAnswer}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Apply URL */}
              {form.applyMethod === 'EXTERNAL_URL' && form.externalApplyUrl && (
                <div className="text-sm">
                  <span className="text-[var(--text-muted)]">External Apply URL: </span>
                  <span className="text-primary break-all">{form.externalApplyUrl}</span>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 0}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <span className="text-sm text-[var(--text-muted)]">
            Step {step + 1} of {steps.length}
          </span>
          {step < 7 ? (
            <Button onClick={handleNext} disabled={!canGoNext()}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} isLoading={createMutation.isPending}>
              <Briefcase className="mr-1.5 h-4 w-4" /> Post Job
            </Button>
          )}
        </div>
        {/* Save Template Modal */}
        <Modal
          isOpen={showSaveTemplateModal}
          onClose={() => setShowSaveTemplateModal(false)}
          title="Save as Template"
        >
          <div className="space-y-4">
            <Input
              label="Template Name"
              placeholder="e.g. Senior Engineer Template"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              required
            />
            <Textarea
              label="Description (optional)"
              rows={2}
              placeholder="Brief description of this template"
              value={templateDesc}
              onChange={(e) => setTemplateDesc(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveTemplateModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveAsTemplate}
                isLoading={saveTemplateMutation.isPending}
                disabled={!templateName.trim()}
              >
                Save Template
              </Button>
            </div>
          </div>
        </Modal>

        {/* Load Template Modal */}
        <Modal
          isOpen={showLoadTemplateModal}
          onClose={() => setShowLoadTemplateModal(false)}
          title="Load Template"
        >
          <div className="space-y-3">
            {!templatesData?.data || templatesData.data.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">
                No templates saved yet.
              </p>
            ) : (
              templatesData.data.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleLoadTemplate(tpl.templateData)}
                  className="hover:border-primary/50 w-full rounded-lg border border-[var(--border)] p-3 text-left transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  <p className="text-sm font-medium text-[var(--text)]">{tpl.name}</p>
                  {tpl.description && (
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{tpl.description}</p>
                  )}
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Saved {new Date(tpl.updatedAt).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowLoadTemplateModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

function PreviewSection({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="min-w-[140px] text-sm text-[var(--text-muted)]">{label}:</span>
      <span className="text-sm font-medium text-[var(--text)]">{value}</span>
    </div>
  );
}
