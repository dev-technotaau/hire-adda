'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Globe,
  Briefcase,
  Users,
  Award,
  MapPin,
  Mail,
  Phone,
  Plus,
  Trash2,
  Sparkles,
  Target,
  Heart,
  Shield,
  Zap,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Calendar,
  DollarSign,
  ExternalLink,
  Gem,
  BookOpen,
  HandHeart,
  TrendingUp,
  UserCircle,
  Camera,
  Briefcase as BriefcaseBusiness,
} from 'lucide-react';
import OnboardingShell, { type OnboardingStep } from '@/components/onboarding/OnboardingShell';
import ServerSuggestionInput from '@/components/ui/ServerSuggestionInput';
import { useOnboarding, markOnboardingComplete } from '@/hooks/use-onboarding';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import Textarea from '@/components/ui/Textarea';
import Select, { type SelectOption } from '@/components/ui/Select';
import Tag from '@/components/ui/Tag';
import FileUpload from '@/components/ui/FileUpload';
import { showToast } from '@/components/ui/Toast';
import { employerService } from '@/services/employer.service';
import { ROUTES } from '@/constants/routes';
import { QUERY_KEYS, FILE_LIMITS } from '@/constants/config';
import { COMPANY_TYPE_LABELS, FUNDING_STAGE_LABELS } from '@/constants/enums';
import {
  INDIAN_STATES,
  REVENUE_RANGE_OPTIONS,
} from '@/constants/suggestions';
import { useAuth } from '@/hooks/use-auth';
import type {
  UpdateCompanyRequest,
  LeadershipEntry,
  EmployeeTestimonialEntry,
} from '@/types/employer';
import type { FundingStage } from '@/types/employer';
import type { ApiError } from '@/types/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSelectOptions(labels: Record<string, string>): SelectOption[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

function emptyLeadership(): LeadershipEntry {
  return { name: '', designation: '', linkedinUrl: '', bio: '' };
}

function emptyTestimonial(): EmployeeTestimonialEntry {
  return { name: '', designation: '', department: '', quote: '' };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmployerOnboardingData {
  [key: string]: unknown;
  // Step: Company Basics
  companyName: string;
  companyType: string;
  industry: string;
  subIndustry: string;
  specialties: string[];
  companySize: string;
  employeeCount: number | undefined;
  numberOfOffices: number | undefined;
  foundedYear: number | undefined;
  website: string;
  parentCompany: string;
  stockTicker: string;
  // Step: Company Identity
  tagline: string;
  description: string;
  whyWorkForUs: string;
  // Step: Mission & Culture
  missionStatement: string;
  visionStatement: string;
  companyCulture: string;
  diversityStatement: string;
  coreValues: string[];
  employeeResourceGroups: string[];
  // Step: Benefits & Perks
  benefits: string[];
  // Step: Tech Stack & Policies
  techStack: string[];
  productsServices: string[];
  workplacePolicies: Record<string, string>;
  // Step: Awards & Recognition
  awardsRecognitions: Array<{ title: string; year?: number; issuer?: string }>;
  // Step: Legal & Financial (optional)
  gstNumber: string;
  cinNumber: string;
  panNumber: string;
  annualRevenueRange: string;
  // Step: Funding
  fundingStage: string;
  totalFundingRaised: string;
  investors: string[];
  // Step: Leadership
  leadershipTeam: LeadershipEntry[];
  employeeTestimonials: EmployeeTestimonialEntry[];
  // Step: Why Work For Us / Interview Process
  interviewProcess: string;
  // Step: CSR & Values
  csrInitiatives: string;
  // Step: Contact Information
  contactEmail: string;
  contactPhone: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  // Step: Company Address
  headquarters: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  locations: string[];
  // Step: Social Profiles & Video
  companyVideoUrl: string;
  socialLinks: {
    linkedin: string;
    twitter: string;
    facebook: string;
    instagram: string;
    youtube: string;
    glassdoor: string;
  };
  careersPageUrl: string;
  blogUrl: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS: OnboardingStep[] = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'basics', label: 'Company Basics' },
  { key: 'identity', label: 'Company Identity' },
  { key: 'culture', label: 'Mission & Culture', optional: true },
  { key: 'whyWorkForUs', label: 'Why Work For Us', optional: true },
  { key: 'benefits', label: 'Benefits & Perks', optional: true },
  { key: 'tech', label: 'Tech & Policies', optional: true },
  { key: 'leadership', label: 'Leadership & Testimonials', optional: true },
  { key: 'awards', label: 'Awards', optional: true },
  { key: 'funding', label: 'Funding', optional: true },
  { key: 'legal', label: 'Legal & Financial', optional: true },
  { key: 'contact', label: 'Contact Info' },
  { key: 'address', label: 'Address & Locations' },
  { key: 'social', label: 'Social Profiles', optional: true },
  { key: 'interviewProcess', label: 'Interview Process', optional: true },
  { key: 'csrValues', label: 'CSR & Values', optional: true },
  { key: 'review', label: 'Review' },
];

const INITIAL_DATA: EmployerOnboardingData = {
  companyName: '',
  companyType: '',
  industry: '',
  subIndustry: '',
  specialties: [],
  companySize: '',
  employeeCount: undefined,
  numberOfOffices: undefined,
  foundedYear: undefined,
  website: '',
  parentCompany: '',
  stockTicker: '',
  tagline: '',
  description: '',
  whyWorkForUs: '',
  missionStatement: '',
  visionStatement: '',
  companyCulture: '',
  diversityStatement: '',
  coreValues: [],
  employeeResourceGroups: [],
  benefits: [],
  techStack: [],
  productsServices: [],
  workplacePolicies: {},
  awardsRecognitions: [],
  gstNumber: '',
  cinNumber: '',
  panNumber: '',
  annualRevenueRange: '',
  fundingStage: '',
  totalFundingRaised: '',
  investors: [],
  leadershipTeam: [],
  employeeTestimonials: [],
  interviewProcess: '',
  csrInitiatives: '',
  contactEmail: '',
  contactPhone: '',
  contactPersonName: '',
  contactPersonDesignation: '',
  headquarters: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  locations: [],
  companyVideoUrl: '',
  socialLinks: {
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    youtube: '',
    glassdoor: '',
  },
  careersPageUrl: '',
  blogUrl: '',
};

const companySizeOptions: SelectOption[] = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001-5000', label: '1001-5000 employees' },
  { value: '5001-10000', label: '5001-10000 employees' },
  { value: '10000+', label: '10000+ employees' },
];

const QUICK_BENEFITS = [
  'Health Insurance',
  'Work From Home',
  'Flexible Hours',
  'Stock Options (ESOPs)',
  'Free Meals',
  'Paid Vacation',
];

const WORKPLACE_POLICY_KEYS = ['Remote Work Policy', 'Leave Policy', 'Work Hours', 'Dress Code'];

const stateOptions: SelectOption[] = INDIAN_STATES.map((s) => ({ value: s, label: s }));

const revenueOptions: SelectOption[] = REVENUE_RANGE_OPTIONS.map((r) => ({ value: r, label: r }));

const FUNDING_STAGE_OPTIONS: SelectOption[] = toSelectOptions(FUNDING_STAGE_LABELS);

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function EmployerOnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // --- Onboarding hook ---------------------------------------------------
  const {
    step,
    data,
    updateData,
    nextStep,
    prevStep,
    goToStep,
    isFirstStep,
    isLastStep,
    skipOnboarding,
  } = useOnboarding<EmployerOnboardingData>({
    storageKey: 'tb_employer_onboarding',
    totalSteps: STEPS.length,
    initialData: INITIAL_DATA,
  });

  // --- Local input states for tag-based fields ---------------------------
  const [benefitInput, setBenefitInput] = useState('');
  const [techInput, setTechInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [coreValueInput, setCoreValueInput] = useState('');
  const [investorInput, setInvestorInput] = useState('');
  const [productInput, setProductInput] = useState('');
  const [ergInput, setErgInput] = useState('');
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const logoPreviewUrl = useMemo(
    () => (logoFiles.length > 0 ? URL.createObjectURL(logoFiles[0]) : null),
    [logoFiles],
  );

  // --- Mutations ----------------------------------------------------------
  const saveMutation = useMutation({
    mutationFn: (payload: UpdateCompanyRequest) => employerService.updateCompany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYERS.COMPANY });
    },
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => employerService.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYERS.COMPANY });
      showToast.success('Logo uploaded successfully');
    },
    onError: (err) => {
      const apiErr = err as unknown as ApiError;
      showToast.error(apiErr?.message || 'Failed to upload logo');
    },
  });

  // --- Validation ---------------------------------------------------------
  const validateStep = useCallback((): boolean => {
    const key = STEPS[step]?.key;
    if (key === 'basics') {
      if (!data.companyName.trim()) {
        showToast.error('Company name is required');
        return false;
      }
      if (!data.industry.trim()) {
        showToast.error('Industry is required');
        return false;
      }
    }
    if (key === 'identity') {
      if (!data.description.trim()) {
        showToast.error('Company description is required');
        return false;
      }
    }
    if (key === 'contact') {
      if (!data.contactEmail.trim()) {
        showToast.error('Contact email is required');
        return false;
      }
    }
    return true;
  }, [step, data]);

  // --- Handle next --------------------------------------------------------
  const handleNext = useCallback(async () => {
    if (!validateStep()) return;

    if (isLastStep) {
      // Build payload
      const payload: UpdateCompanyRequest = {
        companyName: data.companyName || undefined,
        companyType: (data.companyType as UpdateCompanyRequest['companyType']) || undefined,
        industry: data.industry || undefined,
        subIndustry: data.subIndustry || undefined,
        specialties: data.specialties.length > 0 ? data.specialties : undefined,
        companySize: data.companySize || undefined,
        employeeCount: data.employeeCount,
        numberOfOffices: data.numberOfOffices,
        foundedYear: data.foundedYear,
        website: data.website || undefined,
        parentCompany: data.parentCompany || undefined,
        stockTicker: data.stockTicker || undefined,
        tagline: data.tagline || undefined,
        description: data.description || undefined,
        whyWorkForUs: data.whyWorkForUs || undefined,
        missionStatement: data.missionStatement || undefined,
        visionStatement: data.visionStatement || undefined,
        companyCulture: data.companyCulture || undefined,
        diversityStatement: data.diversityStatement || undefined,
        coreValues: data.coreValues.length > 0 ? data.coreValues : undefined,
        employeeResourceGroups:
          data.employeeResourceGroups.length > 0 ? data.employeeResourceGroups : undefined,
        benefits: data.benefits.length > 0 ? data.benefits : undefined,
        techStack: data.techStack.length > 0 ? data.techStack : undefined,
        productsServices: data.productsServices.length > 0 ? data.productsServices : undefined,
        workplacePolicies:
          Object.keys(data.workplacePolicies).length > 0 ? data.workplacePolicies : undefined,
        awardsRecognitions:
          data.awardsRecognitions.length > 0 ? data.awardsRecognitions : undefined,
        gstNumber: data.gstNumber || undefined,
        cinNumber: data.cinNumber || undefined,
        panNumber: data.panNumber || undefined,
        annualRevenueRange: data.annualRevenueRange || undefined,
        fundingStage: (data.fundingStage || undefined) as FundingStage | undefined,
        totalFundingRaised: data.totalFundingRaised || undefined,
        investors: data.investors.length > 0 ? data.investors : undefined,
        leadershipTeam: data.leadershipTeam.length > 0 ? data.leadershipTeam : undefined,
        employeeTestimonials:
          data.employeeTestimonials.length > 0 ? data.employeeTestimonials : undefined,
        interviewProcess: data.interviewProcess || undefined,
        csrInitiatives: data.csrInitiatives || undefined,
        contactEmail: data.contactEmail || undefined,
        contactPhone: data.contactPhone || undefined,
        contactPersonName: data.contactPersonName || undefined,
        contactPersonDesignation: data.contactPersonDesignation || undefined,
        headquarters: data.headquarters || undefined,
        addressLine1: data.addressLine1 || undefined,
        addressLine2: data.addressLine2 || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        pincode: data.pincode || undefined,
        country: data.country || undefined,
        locations: data.locations.length > 0 ? data.locations : undefined,
        socialLinks: {
          linkedin: data.socialLinks.linkedin || undefined,
          twitter: data.socialLinks.twitter || undefined,
          facebook: data.socialLinks.facebook || undefined,
          instagram: data.socialLinks.instagram || undefined,
          youtube: data.socialLinks.youtube || undefined,
          glassdoor: data.socialLinks.glassdoor || undefined,
        },
        careersPageUrl: data.careersPageUrl || undefined,
        blogUrl: data.blogUrl || undefined,
        companyVideoUrl: data.companyVideoUrl || undefined,
      };

      try {
        await saveMutation.mutateAsync(payload);

        // Upload logo if provided
        if (logoFiles.length > 0) {
          await logoMutation.mutateAsync(logoFiles[0]);
        }

        markOnboardingComplete('tb_employer_onboarding');
        showToast.success('Company profile created!', 'Welcome to Talent Bridge');
        router.push(ROUTES.EMPLOYER.DASHBOARD);
      } catch (err) {
        const apiErr = err as unknown as ApiError;
        showToast.error(apiErr?.message || 'Failed to save profile. Please try again.');
      }
      return;
    }

    nextStep();
  }, [validateStep, isLastStep, data, logoFiles, saveMutation, logoMutation, nextStep, router]);

  // --- Skip handler -------------------------------------------------------
  const handleSkip = useCallback(() => {
    skipOnboarding();
    router.push(ROUTES.EMPLOYER.DASHBOARD);
  }, [skipOnboarding, router]);

  // --- Tag helpers --------------------------------------------------------
  const addBenefit = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !data.benefits.includes(trimmed)) {
        updateData({ benefits: [...data.benefits, trimmed] });
      }
      setBenefitInput('');
    },
    [data.benefits, updateData],
  );

  const removeBenefit = useCallback(
    (value: string) => {
      updateData({ benefits: data.benefits.filter((b) => b !== value) });
    },
    [data.benefits, updateData],
  );

  const addTech = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !data.techStack.includes(trimmed)) {
        updateData({ techStack: [...data.techStack, trimmed] });
      }
      setTechInput('');
    },
    [data.techStack, updateData],
  );

  const removeTech = useCallback(
    (value: string) => {
      updateData({ techStack: data.techStack.filter((t) => t !== value) });
    },
    [data.techStack, updateData],
  );

  const addLocation = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !data.locations.includes(trimmed)) {
        updateData({ locations: [...data.locations, trimmed] });
      }
      setLocationInput('');
    },
    [data.locations, updateData],
  );

  const removeLocation = useCallback(
    (value: string) => {
      updateData({ locations: data.locations.filter((l) => l !== value) });
    },
    [data.locations, updateData],
  );

  const addSpecialty = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !data.specialties.includes(trimmed)) {
        updateData({ specialties: [...data.specialties, trimmed] });
      }
      setSpecialtyInput('');
    },
    [data.specialties, updateData],
  );

  const removeSpecialty = useCallback(
    (value: string) => {
      updateData({ specialties: data.specialties.filter((s) => s !== value) });
    },
    [data.specialties, updateData],
  );

  const addCoreValue = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !data.coreValues.includes(trimmed)) {
        updateData({ coreValues: [...data.coreValues, trimmed] });
      }
      setCoreValueInput('');
    },
    [data.coreValues, updateData],
  );

  const removeCoreValue = useCallback(
    (value: string) => {
      updateData({ coreValues: data.coreValues.filter((v) => v !== value) });
    },
    [data.coreValues, updateData],
  );

  const addInvestor = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !data.investors.includes(trimmed)) {
        updateData({ investors: [...data.investors, trimmed] });
      }
      setInvestorInput('');
    },
    [data.investors, updateData],
  );

  const removeInvestor = useCallback(
    (value: string) => {
      updateData({ investors: data.investors.filter((i) => i !== value) });
    },
    [data.investors, updateData],
  );

  const addProduct = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !data.productsServices.includes(trimmed)) {
        updateData({ productsServices: [...data.productsServices, trimmed] });
      }
      setProductInput('');
    },
    [data.productsServices, updateData],
  );

  const removeProduct = useCallback(
    (value: string) => {
      updateData({ productsServices: data.productsServices.filter((p) => p !== value) });
    },
    [data.productsServices, updateData],
  );

  const addErg = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !data.employeeResourceGroups.includes(trimmed)) {
        updateData({ employeeResourceGroups: [...data.employeeResourceGroups, trimmed] });
      }
      setErgInput('');
    },
    [data.employeeResourceGroups, updateData],
  );

  const removeErg = useCallback(
    (value: string) => {
      updateData({
        employeeResourceGroups: data.employeeResourceGroups.filter((e) => e !== value),
      });
    },
    [data.employeeResourceGroups, updateData],
  );

  // --- Award helpers ------------------------------------------------------
  const addAward = useCallback(() => {
    updateData({
      awardsRecognitions: [...data.awardsRecognitions, { title: '', year: undefined, issuer: '' }],
    });
  }, [data.awardsRecognitions, updateData]);

  const updateAward = useCallback(
    (index: number, field: string, value: string | number | undefined) => {
      const updated = [...data.awardsRecognitions];
      updated[index] = { ...updated[index], [field]: value };
      updateData({ awardsRecognitions: updated });
    },
    [data.awardsRecognitions, updateData],
  );

  const removeAward = useCallback(
    (index: number) => {
      updateData({ awardsRecognitions: data.awardsRecognitions.filter((_, i) => i !== index) });
    },
    [data.awardsRecognitions, updateData],
  );

  // --- Leadership helpers -------------------------------------------------
  const addLeadership = useCallback(() => {
    updateData({ leadershipTeam: [...data.leadershipTeam, emptyLeadership()] });
  }, [data.leadershipTeam, updateData]);

  const updateLeadership = useCallback(
    (index: number, field: string, value: string) => {
      const updated = [...data.leadershipTeam];
      updated[index] = { ...updated[index], [field]: value };
      updateData({ leadershipTeam: updated });
    },
    [data.leadershipTeam, updateData],
  );

  const removeLeadership = useCallback(
    (index: number) => {
      updateData({ leadershipTeam: data.leadershipTeam.filter((_, i) => i !== index) });
    },
    [data.leadershipTeam, updateData],
  );

  // --- Testimonial helpers ------------------------------------------------
  const addTestimonial = useCallback(() => {
    updateData({ employeeTestimonials: [...data.employeeTestimonials, emptyTestimonial()] });
  }, [data.employeeTestimonials, updateData]);

  const updateTestimonial = useCallback(
    (index: number, field: string, value: string) => {
      const updated = [...data.employeeTestimonials];
      updated[index] = { ...updated[index], [field]: value };
      updateData({ employeeTestimonials: updated });
    },
    [data.employeeTestimonials, updateData],
  );

  const removeTestimonial = useCallback(
    (index: number) => {
      updateData({ employeeTestimonials: data.employeeTestimonials.filter((_, i) => i !== index) });
    },
    [data.employeeTestimonials, updateData],
  );

  // --- Workplace policy helpers -------------------------------------------
  const updatePolicy = useCallback(
    (key: string, value: string) => {
      updateData({
        workplacePolicies: { ...data.workplacePolicies, [key]: value },
      });
    },
    [data.workplacePolicies, updateData],
  );

  // --- Social link helper -------------------------------------------------
  const updateSocial = useCallback(
    (platform: keyof EmployerOnboardingData['socialLinks'], value: string) => {
      updateData({
        socialLinks: { ...data.socialLinks, [platform]: value },
      });
    },
    [data.socialLinks, updateData],
  );

  // --- Compute step title / subtitle --------------------------------------
  const getStepTitle = (): string => {
    const titles: Record<string, string> = {
      welcome: 'Welcome to Talent Bridge!',
      basics: 'Company Basics',
      identity: 'Company Identity',
      culture: 'Mission & Culture',
      whyWorkForUs: 'Why Work For Us',
      benefits: 'Benefits & Perks',
      tech: 'Tech Stack & Policies',
      leadership: 'Leadership & Testimonials',
      awards: 'Awards & Recognition',
      funding: 'Funding & Investors',
      contact: 'Contact Information',
      address: 'Address & Locations',
      social: 'Social Profiles',
      interviewProcess: 'Interview Process',
      csrValues: 'CSR & Values',
      review: 'Review & Complete',
    };
    return titles[STEPS[step]?.key] || 'Onboarding';
  };

  const getStepSubtitle = (): string => {
    const subtitles: Record<string, string> = {
      welcome: "Let's set up your company profile",
      basics: 'Tell us about your company',
      identity: 'Help candidates understand who you are',
      culture: 'Share your company values and culture',
      whyWorkForUs: 'Tell candidates why they should join you',
      benefits: 'Highlight what you offer to employees',
      tech: 'Share your tech stack and workplace policies',
      leadership: 'Showcase your team and employee voices',
      awards: 'Showcase your achievements',
      funding: 'Share your funding journey',
      contact: 'How can candidates reach you?',
      address: 'Where is your company located?',
      social: 'Connect your social media profiles',
      interviewProcess: 'Help candidates prepare for interviews',
      csrValues: 'Share your social responsibility initiatives',
      review: 'Review your profile before completing setup',
    };
    return subtitles[STEPS[step]?.key] || '';
  };

  // --- Computed helpers for review ----------------------------------------
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : 'there';

  // =======================================================================
  // STEP RENDERERS
  // =======================================================================

  const renderWelcome = () => (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="bg-primary-light mb-6 flex h-20 w-20 items-center justify-center rounded-2xl">
        <Building2 className="text-primary h-10 w-10" />
      </div>
      <h2 className="text-2xl font-bold text-[var(--text)] sm:text-3xl">
        Hey {displayName}! <span className="inline-block animate-bounce">&#128075;</span>
      </h2>
      <p className="mt-2 max-w-md text-[var(--text-secondary)]">
        Let&apos;s set up your company profile on Talent Bridge. A complete profile helps you
        attract the best candidates.
      </p>

      <div className="mt-8 w-full max-w-md space-y-3 text-left">
        {[
          { icon: Building2, text: 'Company details and identity' },
          { icon: Heart, text: 'Culture, benefits, and perks' },
          { icon: UserCircle, text: 'Leadership team and testimonials' },
          { icon: TrendingUp, text: 'Funding and investor details' },
          { icon: Shield, text: 'Legal and financial info (optional)' },
          { icon: MapPin, text: 'Address and office locations' },
          { icon: Globe, text: 'Social media profiles' },
        ].map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3"
          >
            <div className="bg-primary-light flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              <Icon className="text-primary h-4 w-4" />
            </div>
            <span className="text-sm text-[var(--text)]">{text}</span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-[var(--text-muted)]">
        This takes about 5-10 minutes. You can always save and continue later.
      </p>
    </div>
  );

  const renderBasics = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Company Name"
          placeholder="e.g. Acme Technologies Pvt. Ltd."
          value={data.companyName}
          onChange={(e) => updateData({ companyName: e.target.value })}
          leftIcon={<Building2 className="h-4 w-4" />}
          required
        />
        <Select
          label="Company Type"
          options={toSelectOptions(COMPANY_TYPE_LABELS)}
          value={data.companyType}
          onChange={(v) => updateData({ companyType: v })}
          placeholder="Select type"
        />
      </div>

      <ServerSuggestionInput
        label="Industry"
        placeholder="e.g. Information Technology"
        value={data.industry}
        onChange={(v) => updateData({ industry: v })}
        category="industry"
        onSelect={(v) => updateData({ industry: v })}
        leftIcon={<Briefcase className="h-4 w-4" />}
        required
      />

      <ServerSuggestionInput
        label="Sub-Industry"
        placeholder="e.g. SaaS, AI/ML, Payments"
        value={data.subIndustry}
        onChange={(v) => updateData({ subIndustry: v })}
        category="sub_industry"
        onSelect={(v) => updateData({ subIndustry: v })}
        leftIcon={<BriefcaseBusiness className="h-4 w-4" />}
      />

      {/* Specialties */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Specialties</label>
        <p className="mb-3 text-xs text-[var(--text-muted)]">Areas your company specializes in</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <ServerSuggestionInput
              placeholder="e.g. Cloud Computing, DevOps, AI/ML"
              value={specialtyInput}
              onChange={setSpecialtyInput}
              category="skill"
              onSelect={addSpecialty}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => addSpecialty(specialtyInput)}
            disabled={!specialtyInput.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        {data.specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.specialties.map((s) => (
              <Tag key={s} label={s} variant="primary" onRemove={() => removeSpecialty(s)} />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Company Size"
          options={companySizeOptions}
          value={data.companySize}
          onChange={(v) => updateData({ companySize: v })}
          placeholder="Select size"
        />
        <Input
          label="Employee Count"
          type="number"
          placeholder="e.g. 250"
          value={data.employeeCount ?? ''}
          onChange={(e) =>
            updateData({ employeeCount: e.target.value ? Number(e.target.value) : undefined })
          }
          leftIcon={<Users className="h-4 w-4" />}
        />
        <Input
          label="Number of Offices"
          type="number"
          placeholder="e.g. 5"
          value={data.numberOfOffices ?? ''}
          onChange={(e) =>
            updateData({ numberOfOffices: e.target.value ? Number(e.target.value) : undefined })
          }
          leftIcon={<MapPin className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Founded Year"
          type="number"
          placeholder="e.g. 2015"
          value={data.foundedYear ?? ''}
          onChange={(e) =>
            updateData({ foundedYear: e.target.value ? Number(e.target.value) : undefined })
          }
          leftIcon={<Calendar className="h-4 w-4" />}
        />
        <Input
          label="Website"
          type="url"
          placeholder="https://www.example.com"
          value={data.website}
          onChange={(e) => updateData({ website: e.target.value })}
          leftIcon={<Globe className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ServerSuggestionInput
          category="company"
          label="Parent Company"
          placeholder="e.g. Alphabet Inc."
          value={data.parentCompany}
          onChange={(val) => updateData({ parentCompany: val })}
          helperText="Leave blank if not a subsidiary"
        />
        <Input
          label="Stock Ticker"
          placeholder="e.g. GOOG, TCS"
          value={data.stockTicker}
          onChange={(e) => updateData({ stockTicker: e.target.value })}
          leftIcon={<TrendingUp className="h-4 w-4" />}
          helperText="Only if publicly listed"
        />
      </div>
    </div>
  );

  const renderIdentity = () => (
    <div className="space-y-6">
      <Input
        label="Tagline"
        placeholder="A short tagline for your company"
        value={data.tagline}
        onChange={(e) => updateData({ tagline: e.target.value })}
        leftIcon={<Sparkles className="h-4 w-4" />}
        helperText="A brief one-liner that captures what your company does"
      />

      <Textarea
        label="Company Description"
        placeholder="Tell candidates about your company, what you do, your products/services..."
        value={data.description}
        onChange={(e) => updateData({ description: e.target.value })}
        rows={6}
        maxLength={3000}
        showCount
        required
      />

      {/* Company Logo */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
        <label className="mb-3 block text-sm font-semibold text-[var(--text)]">Company Logo</label>
        <FileUpload
          label="Upload your company logo"
          accept={{ 'image/*': FILE_LIMITS.IMAGE_EXTENSIONS.map((ext) => ext) }}
          maxSize={FILE_LIMITS.LOGO_MAX_SIZE}
          onDrop={(files) => setLogoFiles(files)}
          files={logoFiles}
          onRemove={() => setLogoFiles([])}
        />
      </div>
    </div>
  );

  const renderCulture = () => (
    <div className="space-y-6">
      <Textarea
        label="Mission Statement"
        placeholder="What is your company's mission?"
        value={data.missionStatement}
        onChange={(e) => updateData({ missionStatement: e.target.value })}
        rows={3}
      />

      <Textarea
        label="Vision Statement"
        placeholder="Where does your company want to be in the future?"
        value={data.visionStatement}
        onChange={(e) => updateData({ visionStatement: e.target.value })}
        rows={3}
      />

      <Textarea
        label="Company Culture"
        placeholder="Describe your work culture, team dynamics..."
        value={data.companyCulture}
        onChange={(e) => updateData({ companyCulture: e.target.value })}
        rows={4}
      />

      <Textarea
        label="Diversity & Inclusion Statement"
        placeholder="Share your commitment to diversity and inclusion"
        value={data.diversityStatement}
        onChange={(e) => updateData({ diversityStatement: e.target.value })}
        rows={3}
      />

      {/* Core Values */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Core Values</label>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Add the core values that define your company culture
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <ServerSuggestionInput
              placeholder="e.g. Innovation, Integrity"
              value={coreValueInput}
              onChange={setCoreValueInput}
              category="core_value"
              onSelect={addCoreValue}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => addCoreValue(coreValueInput)}
            disabled={!coreValueInput.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        {data.coreValues.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.coreValues.map((val) => (
              <Tag key={val} label={val} variant="primary" onRemove={() => removeCoreValue(val)} />
            ))}
          </div>
        )}
      </div>

      {/* Employee Resource Groups */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
          Employee Resource Groups (ERGs)
        </label>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Add any employee-led groups that support diversity, equity, and inclusion
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <ServerSuggestionInput
              placeholder="e.g. Women in Tech, LGBTQ+ Alliance"
              value={ergInput}
              onChange={setErgInput}
              category="erg"
              onSelect={addErg}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => addErg(ergInput)}
            disabled={!ergInput.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        {data.employeeResourceGroups.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.employeeResourceGroups.map((erg) => (
              <Tag key={erg} label={erg} variant="primary" onRemove={() => removeErg(erg)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderWhyWorkForUs = () => (
    <div className="space-y-6">
      <div className="mb-2 flex items-center gap-3">
        <div className="bg-primary-light flex h-10 w-10 items-center justify-center rounded-xl">
          <Gem className="text-primary h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">Why Work For Us</h3>
          <p className="text-xs text-[var(--text-muted)]">
            This is optional but highly recommended
          </p>
        </div>
      </div>

      <Textarea
        label="Why Work For Us"
        placeholder="Describe what makes your company a great place to work. Cover growth opportunities, work-life balance, team culture, unique perks, and what sets you apart from other employers..."
        value={data.whyWorkForUs}
        onChange={(e) => updateData({ whyWorkForUs: e.target.value })}
        rows={8}
        maxLength={3000}
        showCount
        helperText="A compelling 'Why Work For Us' section helps attract top talent. Be specific and authentic."
      />
    </div>
  );

  const renderBenefits = () => (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
          Benefits & Perks
        </label>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Add the benefits you offer to employees. Type to search or click the popular ones below.
        </p>

        <div className="flex gap-2">
          <div className="flex-1">
            <ServerSuggestionInput
              placeholder="e.g. Health Insurance"
              value={benefitInput}
              onChange={setBenefitInput}
              category="benefit"
              onSelect={addBenefit}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => addBenefit(benefitInput)}
            disabled={!benefitInput.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Quick-add chips */}
      <div>
        <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Popular benefits</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_BENEFITS.map((benefit) => {
            const isAdded = data.benefits.includes(benefit);
            return (
              <button
                key={benefit}
                type="button"
                onClick={() => !isAdded && addBenefit(benefit)}
                disabled={isAdded}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isAdded
                    ? 'border-primary/30 bg-primary-light text-primary cursor-default'
                    : 'hover:border-primary hover:text-primary border-[var(--border)] bg-white text-[var(--text-secondary)]'
                }`}
              >
                {isAdded ? '+ ' : '+ '}
                {benefit}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected benefits */}
      {data.benefits.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
            Added benefits ({data.benefits.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {data.benefits.map((benefit) => (
              <Tag
                key={benefit}
                label={benefit}
                variant="primary"
                onRemove={() => removeBenefit(benefit)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTech = () => (
    <div className="space-y-8">
      {/* Tech Stack */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Tech Stack</label>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Technologies and tools your company uses
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <ServerSuggestionInput
              placeholder="e.g. React, Node.js, AWS"
              value={techInput}
              onChange={setTechInput}
              category="skill"
              onSelect={addTech}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => addTech(techInput)}
            disabled={!techInput.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {data.techStack.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.techStack.map((tech) => (
              <Tag key={tech} label={tech} variant="primary" onRemove={() => removeTech(tech)} />
            ))}
          </div>
        )}
      </div>

      {/* Products & Services */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
          Products & Services
        </label>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Key products or services your company offers
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <ServerSuggestionInput
              placeholder="e.g. Enterprise Software, API Services"
              value={productInput}
              onChange={setProductInput}
              category="product_service"
              onSelect={addProduct}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => addProduct(productInput)}
            disabled={!productInput.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {data.productsServices.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.productsServices.map((product) => (
              <Tag
                key={product}
                label={product}
                variant="primary"
                onRemove={() => removeProduct(product)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Workplace Policies */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
          Workplace Policies
        </label>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Share key workplace policies so candidates know what to expect
        </p>
        <div className="space-y-4">
          {WORKPLACE_POLICY_KEYS.map((policyKey) => (
            <Input
              key={policyKey}
              label={policyKey}
              placeholder={`Describe your ${policyKey.toLowerCase()}`}
              value={data.workplacePolicies[policyKey] || ''}
              onChange={(e) => updatePolicy(policyKey, e.target.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderLeadership = () => (
    <div className="space-y-8">
      {/* Leadership Team */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-primary-light flex h-10 w-10 items-center justify-center rounded-xl">
            <UserCircle className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">Leadership Team</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Showcase your company&apos;s key leaders
            </p>
          </div>
        </div>

        {data.leadershipTeam.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-10 text-center">
            <UserCircle className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">No leaders added yet</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Add members of your leadership team to build trust with candidates
            </p>
          </div>
        )}

        {data.leadershipTeam.map((leader, index) => (
          <div
            key={index}
            className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text)]">Leader #{index + 1}</span>
              <button
                type="button"
                onClick={() => removeLeadership(index)}
                className="hover:text-error rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Name"
                placeholder="e.g. Jane Doe"
                value={leader.name}
                onChange={(e) => updateLeadership(index, 'name', e.target.value)}
                required
              />
              <Input
                label="Designation"
                placeholder="e.g. CEO, CTO, VP Engineering"
                value={leader.designation}
                onChange={(e) => updateLeadership(index, 'designation', e.target.value)}
                required
              />
              <Input
                label="LinkedIn URL"
                type="url"
                placeholder="https://linkedin.com/in/janedoe"
                value={leader.linkedinUrl ?? ''}
                onChange={(e) => updateLeadership(index, 'linkedinUrl', e.target.value)}
                leftIcon={<Linkedin className="h-4 w-4" />}
              />
            </div>
            <div className="mt-4">
              <Textarea
                label="Bio"
                placeholder="Brief bio of this leader..."
                value={leader.bio ?? ''}
                onChange={(e) => updateLeadership(index, 'bio', e.target.value)}
                rows={2}
              />
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addLeadership}>
          <Plus className="h-4 w-4" />
          Add Leader
        </Button>
      </div>

      {/* Employee Testimonials */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-primary-light flex h-10 w-10 items-center justify-center rounded-xl">
            <BookOpen className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">Employee Testimonials</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Share what your employees say about working here
            </p>
          </div>
        </div>

        {data.employeeTestimonials.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-10 text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">No testimonials added yet</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Employee testimonials help candidates understand your work culture
            </p>
          </div>
        )}

        {data.employeeTestimonials.map((testimonial, index) => (
          <div
            key={index}
            className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text)]">
                Testimonial #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeTestimonial(index)}
                className="hover:text-error rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Name"
                placeholder="e.g. John Smith"
                value={testimonial.name}
                onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                required
              />
              <Input
                label="Designation"
                placeholder="e.g. Senior Engineer"
                value={testimonial.designation ?? ''}
                onChange={(e) => updateTestimonial(index, 'designation', e.target.value)}
              />
              <Input
                label="Department"
                placeholder="e.g. Engineering"
                value={testimonial.department ?? ''}
                onChange={(e) => updateTestimonial(index, 'department', e.target.value)}
              />
            </div>
            <div className="mt-4">
              <Textarea
                label="Quote"
                placeholder="What does this employee say about working here?"
                value={testimonial.quote}
                onChange={(e) => updateTestimonial(index, 'quote', e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addTestimonial}>
          <Plus className="h-4 w-4" />
          Add Testimonial
        </Button>
      </div>
    </div>
  );

  const renderAwards = () => (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
          Awards & Recognition
        </label>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Highlight any awards, certifications, or recognition your company has received
        </p>
      </div>

      {data.awardsRecognitions.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-10 text-center">
          <Award className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">No awards added yet</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Click the button below to add awards and recognitions
          </p>
        </div>
      )}

      {data.awardsRecognitions.map((award, index) => (
        <div
          key={index}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text)]">Award #{index + 1}</span>
            <button
              type="button"
              onClick={() => removeAward(index)}
              className="hover:text-error rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-white"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Title"
              placeholder="e.g. Best Place to Work"
              value={award.title}
              onChange={(e) => updateAward(index, 'title', e.target.value)}
              required
            />
            <Input
              label="Year"
              type="number"
              placeholder="e.g. 2024"
              value={award.year ?? ''}
              onChange={(e) =>
                updateAward(index, 'year', e.target.value ? Number(e.target.value) : undefined)
              }
            />
            <Input
              label="Issuer"
              placeholder="e.g. Great Place to Work"
              value={award.issuer ?? ''}
              onChange={(e) => updateAward(index, 'issuer', e.target.value)}
            />
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addAward}>
        <Plus className="h-4 w-4" />
        Add Award
      </Button>
    </div>
  );

  const renderFunding = () => (
    <div className="space-y-6">
      <div className="mb-2 flex items-center gap-3">
        <div className="bg-primary-light flex h-10 w-10 items-center justify-center rounded-xl">
          <TrendingUp className="text-primary h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">Funding Details</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Share your company&apos;s funding journey (optional)
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Funding Stage"
          options={FUNDING_STAGE_OPTIONS}
          value={data.fundingStage}
          onChange={(v) => updateData({ fundingStage: v })}
          placeholder="Select funding stage"
        />
        <Input
          label="Total Funding Raised"
          placeholder="e.g. $50M, ₹200 Crore"
          value={data.totalFundingRaised}
          onChange={(e) => updateData({ totalFundingRaised: e.target.value })}
          leftIcon={<DollarSign className="h-4 w-4" />}
        />
      </div>

      {/* Investors */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Investors</label>
        <p className="mb-3 text-xs text-[var(--text-muted)]">Add your key investors and backers</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <ServerSuggestionInput
              placeholder="e.g. Sequoia Capital India"
              value={investorInput}
              onChange={setInvestorInput}
              category="investor"
              onSelect={addInvestor}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => addInvestor(investorInput)}
            disabled={!investorInput.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {data.investors.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.investors.map((investor) => (
              <Tag
                key={investor}
                label={investor}
                variant="primary"
                onRemove={() => removeInvestor(investor)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderLegal = () => (
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-muted)]">
        These details are optional and kept private. They help verify your company and are not shown
        publicly.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="GST Number"
          placeholder="e.g. 22AAAAA0000A1Z5"
          value={data.gstNumber}
          onChange={(e) => updateData({ gstNumber: e.target.value })}
          leftIcon={<Shield className="h-4 w-4" />}
        />
        <Input
          label="CIN Number"
          placeholder="e.g. U12345MH2020PTC123456"
          value={data.cinNumber}
          onChange={(e) => updateData({ cinNumber: e.target.value })}
          leftIcon={<Shield className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="PAN Number"
          placeholder="e.g. AAAAA1234A"
          value={data.panNumber}
          onChange={(e) => updateData({ panNumber: e.target.value })}
          leftIcon={<Shield className="h-4 w-4" />}
        />
        <Select
          label="Annual Revenue Range"
          options={revenueOptions}
          value={data.annualRevenueRange}
          onChange={(v) => updateData({ annualRevenueRange: v })}
          placeholder="Select revenue range"
        />
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-muted)]">
        Provide contact details so candidates and our team can reach you.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Contact Email"
          type="email"
          placeholder="hr@company.com"
          value={data.contactEmail || user?.email || ''}
          onChange={(e) => updateData({ contactEmail: e.target.value })}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />
        <PhoneInput
          label="Contact Phone"
          placeholder="9876543210"
          value={data.contactPhone}
          onValueChange={(val) => updateData({ contactPhone: val })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Contact Person Name"
          placeholder="e.g. Priya Sharma"
          value={data.contactPersonName}
          onChange={(e) => updateData({ contactPersonName: e.target.value })}
          leftIcon={<UserCircle className="h-4 w-4" />}
          helperText="Primary point of contact for candidates"
        />
        <ServerSuggestionInput
          category="role_category"
          label="Contact Person Designation"
          placeholder="e.g. HR Manager, Talent Acquisition Lead"
          value={data.contactPersonDesignation}
          onChange={(val) => updateData({ contactPersonDesignation: val })}
        />
      </div>
    </div>
  );

  const renderAddress = () => (
    <div className="space-y-6">
      <ServerSuggestionInput
        label="Headquarters"
        placeholder="e.g. Bangalore, Karnataka"
        value={data.headquarters}
        onChange={(v) => updateData({ headquarters: v })}
        category="location"
        onSelect={(v) => updateData({ headquarters: v })}
        leftIcon={<MapPin className="h-4 w-4" />}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Address Line 1"
          placeholder="Street address, building name"
          value={data.addressLine1}
          onChange={(e) => updateData({ addressLine1: e.target.value })}
        />
        <Input
          label="Address Line 2"
          placeholder="Floor, suite, area (optional)"
          value={data.addressLine2}
          onChange={(e) => updateData({ addressLine2: e.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="City"
          placeholder="e.g. Bangalore"
          value={data.city}
          onChange={(e) => updateData({ city: e.target.value })}
        />
        <Select
          label="State"
          options={stateOptions}
          value={data.state}
          onChange={(v) => updateData({ state: v })}
          placeholder="Select state"
          searchable
        />
        <Input
          label="Pincode"
          placeholder="e.g. 560001"
          value={data.pincode}
          onChange={(e) => updateData({ pincode: e.target.value })}
        />
      </div>

      <Input
        label="Country"
        value={data.country}
        onChange={(e) => updateData({ country: e.target.value })}
        leftIcon={<Globe className="h-4 w-4" />}
      />

      {/* Additional Office Locations */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
          Additional Office Locations
        </label>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Add other cities or locations where you have offices
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <ServerSuggestionInput
              placeholder="e.g. Mumbai, Maharashtra"
              value={locationInput}
              onChange={setLocationInput}
              category="location"
              onSelect={addLocation}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => addLocation(locationInput)}
            disabled={!locationInput.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {data.locations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.locations.map((loc) => (
              <Tag key={loc} label={loc} variant="primary" onRemove={() => removeLocation(loc)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSocial = () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        Link your company social media profiles so candidates can learn more about you.
      </p>

      <Input
        label="LinkedIn"
        type="url"
        placeholder="https://linkedin.com/company/your-company"
        value={data.socialLinks.linkedin}
        onChange={(e) => updateSocial('linkedin', e.target.value)}
        leftIcon={<Linkedin className="h-4 w-4" />}
      />

      <Input
        label="Twitter / X"
        type="url"
        placeholder="https://twitter.com/your-company"
        value={data.socialLinks.twitter}
        onChange={(e) => updateSocial('twitter', e.target.value)}
        leftIcon={<Twitter className="h-4 w-4" />}
      />

      <Input
        label="Facebook"
        type="url"
        placeholder="https://facebook.com/your-company"
        value={data.socialLinks.facebook}
        onChange={(e) => updateSocial('facebook', e.target.value)}
        leftIcon={<Facebook className="h-4 w-4" />}
      />

      <Input
        label="Instagram"
        type="url"
        placeholder="https://instagram.com/your-company"
        value={data.socialLinks.instagram}
        onChange={(e) => updateSocial('instagram', e.target.value)}
        leftIcon={<Instagram className="h-4 w-4" />}
      />

      <Input
        label="YouTube"
        type="url"
        placeholder="https://youtube.com/@your-company"
        value={data.socialLinks.youtube}
        onChange={(e) => updateSocial('youtube', e.target.value)}
        leftIcon={<Youtube className="h-4 w-4" />}
      />

      <Input
        label="Glassdoor"
        type="url"
        placeholder="https://glassdoor.co.in/Overview/your-company"
        value={data.socialLinks.glassdoor}
        onChange={(e) => updateSocial('glassdoor', e.target.value)}
        leftIcon={<Globe className="h-4 w-4" />}
      />

      <Input
        label="Careers Page URL"
        type="url"
        placeholder="https://yourcompany.com/careers"
        value={data.careersPageUrl}
        onChange={(e) => updateData({ careersPageUrl: e.target.value })}
        leftIcon={<BriefcaseBusiness className="h-4 w-4" />}
        helperText="Link to your company's careers page"
      />

      <Input
        label="Blog URL"
        type="url"
        placeholder="https://blog.yourcompany.com"
        value={data.blogUrl}
        onChange={(e) => updateData({ blogUrl: e.target.value })}
        leftIcon={<BookOpen className="h-4 w-4" />}
        helperText="Link to your company's blog or engineering blog"
      />

      <Input
        label="Company Video URL"
        type="url"
        placeholder="https://youtube.com/watch?v=..."
        value={data.companyVideoUrl}
        onChange={(e) => updateData({ companyVideoUrl: e.target.value })}
        leftIcon={<Camera className="h-4 w-4" />}
        helperText="Intro video, office tour, or culture video (YouTube, Vimeo)"
      />
    </div>
  );

  const renderInterviewProcess = () => (
    <div className="space-y-6">
      <div className="mb-2 flex items-center gap-3">
        <div className="bg-primary-light flex h-10 w-10 items-center justify-center rounded-xl">
          <Target className="text-primary h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">Interview Process</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Help candidates understand what to expect
          </p>
        </div>
      </div>

      <Textarea
        label="Interview Process"
        placeholder="Describe your typical interview process step-by-step. Include number of rounds, types of interviews (technical, behavioral, system design), typical timeline, and any tips for candidates..."
        value={data.interviewProcess}
        onChange={(e) => updateData({ interviewProcess: e.target.value })}
        rows={8}
        maxLength={3000}
        showCount
        helperText="Being transparent about your interview process attracts more qualified candidates"
      />
    </div>
  );

  const renderCsrValues = () => (
    <div className="space-y-6">
      <div className="mb-2 flex items-center gap-3">
        <div className="bg-primary-light flex h-10 w-10 items-center justify-center rounded-xl">
          <HandHeart className="text-primary h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">CSR & Social Responsibility</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Share your company&apos;s social impact initiatives
          </p>
        </div>
      </div>

      <Textarea
        label="CSR Initiatives"
        placeholder="Describe your company's Corporate Social Responsibility initiatives, community programs, sustainability efforts, charitable contributions, volunteer programs, environmental commitments..."
        value={data.csrInitiatives}
        onChange={(e) => updateData({ csrInitiatives: e.target.value })}
        rows={8}
        maxLength={3000}
        showCount
        helperText="Candidates increasingly value employers with strong social responsibility programs"
      />
    </div>
  );

  const renderReview = () => {
    // Step indices: 0=welcome 1=basics 2=identity 3=culture 4=whyWorkForUs 5=benefits
    // 6=tech 7=leadership 8=awards 9=funding 10=legal 11=contact 12=address 13=social
    // 14=interviewProcess 15=csrValues 16=review
    const sections: Array<{
      title: string;
      stepIndex: number;
      icon: React.ElementType;
      items: Array<{ label: string; value: string | number | undefined | null }>;
    }> = [
      {
        title: 'Company Basics',
        stepIndex: 1,
        icon: Building2,
        items: [
          { label: 'Company Name', value: data.companyName },
          {
            label: 'Company Type',
            value: data.companyType ? COMPANY_TYPE_LABELS[data.companyType] : undefined,
          },
          { label: 'Industry', value: data.industry },
          { label: 'Sub-Industry', value: data.subIndustry },
          {
            label: 'Specialties',
            value: data.specialties.length > 0 ? data.specialties.join(', ') : undefined,
          },
          { label: 'Company Size', value: data.companySize },
          { label: 'Employee Count', value: data.employeeCount },
          { label: 'Number of Offices', value: data.numberOfOffices },
          { label: 'Founded Year', value: data.foundedYear },
          { label: 'Website', value: data.website },
          { label: 'Parent Company', value: data.parentCompany },
          { label: 'Stock Ticker', value: data.stockTicker },
        ],
      },
      {
        title: 'Company Identity',
        stepIndex: 2,
        icon: Sparkles,
        items: [
          { label: 'Tagline', value: data.tagline },
          {
            label: 'Description',
            value: data.description ? `${data.description.slice(0, 120)}...` : undefined,
          },
        ],
      },
      {
        title: 'Why Work For Us',
        stepIndex: 4,
        icon: Gem,
        items: [
          {
            label: 'Why Work For Us',
            value: data.whyWorkForUs ? `${data.whyWorkForUs.slice(0, 100)}...` : undefined,
          },
        ],
      },
      {
        title: 'Mission & Culture',
        stepIndex: 3,
        icon: Target,
        items: [
          {
            label: 'Mission',
            value: data.missionStatement ? `${data.missionStatement.slice(0, 80)}...` : undefined,
          },
          {
            label: 'Vision',
            value: data.visionStatement ? `${data.visionStatement.slice(0, 80)}...` : undefined,
          },
          { label: 'Culture', value: data.companyCulture ? 'Provided' : undefined },
          { label: 'Diversity', value: data.diversityStatement ? 'Provided' : undefined },
          {
            label: 'Core Values',
            value: data.coreValues.length > 0 ? data.coreValues.join(', ') : undefined,
          },
          {
            label: 'ERGs',
            value:
              data.employeeResourceGroups.length > 0
                ? `${data.employeeResourceGroups.length} groups`
                : undefined,
          },
        ],
      },
      {
        title: 'Benefits & Perks',
        stepIndex: 5,
        icon: Heart,
        items: [
          {
            label: 'Benefits',
            value: data.benefits.length > 0 ? `${data.benefits.length} added` : undefined,
          },
        ],
      },
      {
        title: 'Tech & Policies',
        stepIndex: 6,
        icon: Zap,
        items: [
          {
            label: 'Tech Stack',
            value: data.techStack.length > 0 ? `${data.techStack.length} technologies` : undefined,
          },
          {
            label: 'Products & Services',
            value:
              data.productsServices.length > 0
                ? `${data.productsServices.length} items`
                : undefined,
          },
          {
            label: 'Policies',
            value:
              Object.values(data.workplacePolicies).filter(Boolean).length > 0
                ? `${Object.values(data.workplacePolicies).filter(Boolean).length} policies`
                : undefined,
          },
        ],
      },
      {
        title: 'Leadership & Testimonials',
        stepIndex: 7,
        icon: UserCircle,
        items: [
          {
            label: 'Leadership Team',
            value:
              data.leadershipTeam.length > 0 ? `${data.leadershipTeam.length} leaders` : undefined,
          },
          {
            label: 'Testimonials',
            value:
              data.employeeTestimonials.length > 0
                ? `${data.employeeTestimonials.length} testimonials`
                : undefined,
          },
        ],
      },
      {
        title: 'Awards',
        stepIndex: 8,
        icon: Award,
        items: [
          {
            label: 'Awards',
            value:
              data.awardsRecognitions.length > 0
                ? `${data.awardsRecognitions.length} awards`
                : undefined,
          },
        ],
      },
      {
        title: 'Funding & Investors',
        stepIndex: 9,
        icon: TrendingUp,
        items: [
          {
            label: 'Funding Stage',
            value: data.fundingStage ? FUNDING_STAGE_LABELS[data.fundingStage] : undefined,
          },
          { label: 'Total Funding', value: data.totalFundingRaised },
          {
            label: 'Investors',
            value: data.investors.length > 0 ? data.investors.join(', ') : undefined,
          },
        ],
      },
      {
        title: 'Legal & Financial',
        stepIndex: 10,
        icon: Shield,
        items: [
          { label: 'GST Number', value: data.gstNumber },
          { label: 'CIN Number', value: data.cinNumber },
          { label: 'PAN Number', value: data.panNumber },
          { label: 'Annual Revenue', value: data.annualRevenueRange },
        ],
      },
      {
        title: 'Contact Info',
        stepIndex: 11,
        icon: Mail,
        items: [
          { label: 'Email', value: data.contactEmail },
          { label: 'Phone', value: data.contactPhone },
          { label: 'Contact Person', value: data.contactPersonName },
          { label: 'Designation', value: data.contactPersonDesignation },
        ],
      },
      {
        title: 'Address & Locations',
        stepIndex: 12,
        icon: MapPin,
        items: [
          { label: 'Headquarters', value: data.headquarters },
          {
            label: 'Full Address',
            value:
              [data.addressLine1, data.addressLine2, data.city, data.state, data.pincode]
                .filter(Boolean)
                .join(', ') || undefined,
          },
          { label: 'Country', value: data.country },
          {
            label: 'Additional Locations',
            value: data.locations.length > 0 ? data.locations.join(', ') : undefined,
          },
        ],
      },
      {
        title: 'Social Profiles',
        stepIndex: 13,
        icon: Globe,
        items: [
          { label: 'LinkedIn', value: data.socialLinks.linkedin },
          { label: 'Twitter', value: data.socialLinks.twitter },
          { label: 'Facebook', value: data.socialLinks.facebook },
          { label: 'Instagram', value: data.socialLinks.instagram },
          { label: 'YouTube', value: data.socialLinks.youtube },
          { label: 'Glassdoor', value: data.socialLinks.glassdoor },
          { label: 'Careers Page', value: data.careersPageUrl },
          { label: 'Blog', value: data.blogUrl },
          { label: 'Company Video', value: data.companyVideoUrl },
        ],
      },
      {
        title: 'Interview Process',
        stepIndex: 14,
        icon: Target,
        items: [
          {
            label: 'Interview Process',
            value: data.interviewProcess ? `${data.interviewProcess.slice(0, 100)}...` : undefined,
          },
        ],
      },
      {
        title: 'CSR & Values',
        stepIndex: 15,
        icon: HandHeart,
        items: [
          {
            label: 'CSR Initiatives',
            value: data.csrInitiatives ? `${data.csrInitiatives.slice(0, 100)}...` : undefined,
          },
        ],
      },
    ];

    return (
      <div className="space-y-6">
        <p className="text-sm text-[var(--text-muted)]">
          Review your company profile below. Click any section title to edit it.
        </p>

        {sections.map((section) => {
          const filledItems = section.items.filter(
            (item) => item.value !== undefined && item.value !== null && item.value !== '',
          );
          if (filledItems.length === 0) return null;

          const Icon = section.icon;

          return (
            <div
              key={section.title}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4"
            >
              <button
                type="button"
                onClick={() => goToStep(section.stepIndex)}
                className="text-primary mb-3 flex items-center gap-2 text-sm font-semibold hover:underline"
              >
                <Icon className="h-4 w-4" />
                {section.title}
                <ExternalLink className="h-3 w-3" />
              </button>
              <div className="grid gap-2 sm:grid-cols-2">
                {filledItems.map((item) => (
                  <div key={item.label}>
                    <span className="text-xs text-[var(--text-muted)]">{item.label}</span>
                    <p className="truncate text-sm text-[var(--text)]">{String(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Logo preview in review */}
        {logoPreviewUrl && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="text-primary mb-3 flex items-center gap-2 text-sm font-semibold hover:underline"
            >
              <Building2 className="h-4 w-4" />
              Company Logo
              <ExternalLink className="h-3 w-3" />
            </button>
            <div className="flex items-center gap-3">
              <img
                src={logoPreviewUrl}
                alt="Company logo"
                className="h-16 w-16 rounded-lg border border-[var(--border)] bg-white object-contain"
              />
              <span className="text-sm font-medium text-green-600">Logo uploaded</span>
            </div>
          </div>
        )}

        {/* Benefits tags in review */}
        {data.benefits.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <button
              type="button"
              onClick={() => goToStep(5)}
              className="text-primary mb-3 flex items-center gap-2 text-sm font-semibold hover:underline"
            >
              <Heart className="h-4 w-4" />
              Benefits
              <ExternalLink className="h-3 w-3" />
            </button>
            <div className="flex flex-wrap gap-2">
              {data.benefits.map((b) => (
                <Tag key={b} label={b} variant="primary" size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* Tech stack tags in review */}
        {data.techStack.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <button
              type="button"
              onClick={() => goToStep(6)}
              className="text-primary mb-3 flex items-center gap-2 text-sm font-semibold hover:underline"
            >
              <Zap className="h-4 w-4" />
              Tech Stack
              <ExternalLink className="h-3 w-3" />
            </button>
            <div className="flex flex-wrap gap-2">
              {data.techStack.map((t) => (
                <Tag key={t} label={t} variant="primary" size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* Core values tags in review */}
        {data.coreValues.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="text-primary mb-3 flex items-center gap-2 text-sm font-semibold hover:underline"
            >
              <Gem className="h-4 w-4" />
              Core Values
              <ExternalLink className="h-3 w-3" />
            </button>
            <div className="flex flex-wrap gap-2">
              {data.coreValues.map((v) => (
                <Tag key={v} label={v} variant="primary" size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* Investors tags in review */}
        {data.investors.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <button
              type="button"
              onClick={() => goToStep(9)}
              className="text-primary mb-3 flex items-center gap-2 text-sm font-semibold hover:underline"
            >
              <TrendingUp className="h-4 w-4" />
              Investors
              <ExternalLink className="h-3 w-3" />
            </button>
            <div className="flex flex-wrap gap-2">
              {data.investors.map((i) => (
                <Tag key={i} label={i} variant="primary" size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* Specialties tags in review */}
        {data.specialties.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="text-primary mb-3 flex items-center gap-2 text-sm font-semibold hover:underline"
            >
              <Briefcase className="h-4 w-4" />
              Specialties
              <ExternalLink className="h-3 w-3" />
            </button>
            <div className="flex flex-wrap gap-2">
              {data.specialties.map((s) => (
                <Tag key={s} label={s} variant="primary" size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* Products & Services tags in review */}
        {data.productsServices.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <button
              type="button"
              onClick={() => goToStep(6)}
              className="text-primary mb-3 flex items-center gap-2 text-sm font-semibold hover:underline"
            >
              <Zap className="h-4 w-4" />
              Products & Services
              <ExternalLink className="h-3 w-3" />
            </button>
            <div className="flex flex-wrap gap-2">
              {data.productsServices.map((p) => (
                <Tag key={p} label={p} variant="primary" size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* ERGs tags in review */}
        {data.employeeResourceGroups.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="text-primary mb-3 flex items-center gap-2 text-sm font-semibold hover:underline"
            >
              <Heart className="h-4 w-4" />
              Employee Resource Groups
              <ExternalLink className="h-3 w-3" />
            </button>
            <div className="flex flex-wrap gap-2">
              {data.employeeResourceGroups.map((e) => (
                <Tag key={e} label={e} variant="primary" size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* Locations tags in review */}
        {data.locations.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <button
              type="button"
              onClick={() => goToStep(12)}
              className="text-primary mb-3 flex items-center gap-2 text-sm font-semibold hover:underline"
            >
              <MapPin className="h-4 w-4" />
              Office Locations
              <ExternalLink className="h-3 w-3" />
            </button>
            <div className="flex flex-wrap gap-2">
              {data.locations.map((l) => (
                <Tag key={l} label={l} variant="primary" size="sm" />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // =======================================================================
  // STEP CONTENT SWITCH
  // =======================================================================

  const renderStepContent = () => {
    const key = STEPS[step]?.key;
    switch (key) {
      case 'welcome':
        return renderWelcome();
      case 'basics':
        return renderBasics();
      case 'identity':
        return renderIdentity();
      case 'culture':
        return renderCulture();
      case 'whyWorkForUs':
        return renderWhyWorkForUs();
      case 'benefits':
        return renderBenefits();
      case 'tech':
        return renderTech();
      case 'leadership':
        return renderLeadership();
      case 'awards':
        return renderAwards();
      case 'funding':
        return renderFunding();
      case 'legal':
        return renderLegal();
      case 'contact':
        return renderContact();
      case 'address':
        return renderAddress();
      case 'social':
        return renderSocial();
      case 'interviewProcess':
        return renderInterviewProcess();
      case 'csrValues':
        return renderCsrValues();
      case 'review':
        return renderReview();
      default:
        return null;
    }
  };

  // =======================================================================
  // RENDER
  // =======================================================================

  return (
    <OnboardingShell
      steps={STEPS}
      currentStep={step}
      onNext={handleNext}
      onPrev={prevStep}
      onSkip={handleSkip}
      onGoToStep={goToStep}
      isSubmitting={saveMutation.isPending || logoMutation.isPending}
      isLastStep={isLastStep}
      isFirstStep={isFirstStep}
      nextDisabled={false}
      nextLabel={isLastStep ? 'Complete Setup' : undefined}
      dashboardPath={ROUTES.EMPLOYER.DASHBOARD}
      title={getStepTitle()}
      subtitle={getStepSubtitle()}
    >
      {renderStepContent()}
    </OnboardingShell>
  );
}
