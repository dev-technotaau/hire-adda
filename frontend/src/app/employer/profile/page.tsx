'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Building2, Save, Upload, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import { employerService } from '@/services/employer.service';
import { QUERY_KEYS } from '@/constants/config';
import type { UpdateCompanyRequest, FundingStage } from '@/types/employer';
import type { ApiError } from '@/types/api';
import type { ArrayKey } from '@/components/employer-profile/types';
import CompanyInfoSection from '@/components/employer-profile/CompanyInfoSection';
import AboutSection from '@/components/employer-profile/AboutSection';
import CultureSection from '@/components/employer-profile/CultureSection';
import BenefitsSection from '@/components/employer-profile/BenefitsSection';
import TechPoliciesSection from '@/components/employer-profile/TechPoliciesSection';
import PeopleSection from '@/components/employer-profile/PeopleSection';
import AwardsFundingSection from '@/components/employer-profile/AwardsFundingSection';
import LegalSection from '@/components/employer-profile/LegalSection';
import ContactSection from '@/components/employer-profile/ContactSection';
import AddressSection from '@/components/employer-profile/AddressSection';
import SocialSection from '@/components/employer-profile/SocialSection';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type Section =
  | 'company'
  | 'about'
  | 'culture'
  | 'benefits'
  | 'tech'
  | 'people'
  | 'awards'
  | 'legal'
  | 'contact'
  | 'address'
  | 'social';

const sections: { key: Section; label: string }[] = [
  { key: 'company', label: 'Company Info' },
  { key: 'about', label: 'About' },
  { key: 'culture', label: 'Culture & Values' },
  { key: 'benefits', label: 'Benefits' },
  { key: 'tech', label: 'Tech & Policies' },
  { key: 'people', label: 'People' },
  { key: 'awards', label: 'Awards & Funding' },
  { key: 'legal', label: 'Legal & Financial' },
  { key: 'contact', label: 'Contact' },
  { key: 'address', label: 'Address' },
  { key: 'social', label: 'Social & Links' },
];

const SECTION_HEADERS: Record<Section, string> = {
  company: 'Company Information',
  about: 'About Company',
  culture: 'Culture & Values',
  benefits: 'Benefits & Perks',
  tech: 'Tech Stack & Policies',
  people: 'People',
  awards: 'Awards & Funding',
  legal: 'Legal & Financial',
  contact: 'Contact Information',
  address: 'Address & Locations',
  social: 'Social & Links',
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function CompanyProfilePage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<Section>('company');
  const [form, setForm] = useState<UpdateCompanyRequest>({});

  // Deep-link: read ?section= and ?focus= query params
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && sections.some((s) => s.key === section)) {
      queueMicrotask(() => setActiveSection(section as Section));
    }
  }, [searchParams]);

  useEffect(() => {
    const focus = searchParams.get('focus');
    if (focus) {
      const timer = setTimeout(() => {
        const el = document.getElementById(focus);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [searchParams, activeSection]);

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  const { data: companyData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.EMPLOYERS.COMPANY,
    queryFn: () => employerService.getCompany(),
  });

  const { data: completenessData } = useQuery({
    queryKey: QUERY_KEYS.EMPLOYERS.COMPLETENESS,
    queryFn: () => employerService.getCompleteness(),
  });

  const company = companyData?.data;
  const completeness = completenessData?.data;

  useEffect(() => {
    if (company) {
      queueMicrotask(() =>
        setForm({
          companyName: company.companyName || '',
          companyType: company.companyType || undefined,
          tagline: company.tagline || '',
          industry: company.industry || '',
          subIndustry: company.subIndustry || '',
          specialties: company.specialties || [],
          companySize: company.companySize || '',
          employeeCount: company.employeeCount || undefined,
          numberOfOffices: company.numberOfOffices || undefined,
          description: company.description || '',
          whyWorkForUs: company.whyWorkForUs || '',
          website: company.website || '',
          careersPageUrl: company.careersPageUrl || '',
          blogUrl: company.blogUrl || '',
          companyVideoUrl: company.companyVideoUrl || '',
          foundedYear: company.foundedYear || undefined,
          parentCompany: company.parentCompany || '',
          stockTicker: company.stockTicker || '',
          gstNumber: company.gstNumber || '',
          cinNumber: company.cinNumber || '',
          panNumber: company.panNumber || '',
          annualRevenueRange: company.annualRevenueRange || '',
          fundingStage: (company.fundingStage || undefined) as FundingStage | undefined,
          totalFundingRaised: company.totalFundingRaised || '',
          investors: company.investors || [],
          productsServices: company.productsServices || [],
          techStack: company.techStack || [],
          companyCulture: company.companyCulture || '',
          missionStatement: company.missionStatement || '',
          visionStatement: company.visionStatement || '',
          coreValues: company.coreValues || [],
          diversityStatement: company.diversityStatement || '',
          employeeResourceGroups: company.employeeResourceGroups || [],
          csrInitiatives: company.csrInitiatives || '',
          benefits: company.benefits || [],
          workplacePolicies: company.workplacePolicies || {},
          interviewProcess: company.interviewProcess || '',
          awardsRecognitions: company.awardsRecognitions || [],
          leadershipTeam: company.leadershipTeam || [],
          employeeTestimonials: company.employeeTestimonials || [],
          socialLinks: company.socialLinks || {
            linkedin: '',
            twitter: '',
            facebook: '',
            instagram: '',
            youtube: '',
            glassdoor: '',
          },
          contactEmail: company.contactEmail || '',
          contactPhone: company.contactPhone || '',
          contactPersonName: company.contactPersonName || '',
          contactPersonDesignation: company.contactPersonDesignation || '',
          addressLine1: company.addressLine1 || '',
          addressLine2: company.addressLine2 || '',
          city: company.city || '',
          state: company.state || '',
          pincode: company.pincode || '',
          country: company.country || 'India',
          headquarters: company.headquarters || '',
          locations: company.locations || [],
        }),
      );
    }
  }, [company]);

  // -----------------------------------------------------------------------
  // Mutations
  // -----------------------------------------------------------------------

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCompanyRequest) => employerService.updateCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYERS.COMPANY });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYERS.COMPLETENESS });
      showToast.success('Company profile updated!');
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to update profile');
    },
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => employerService.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYERS.COMPANY });
      showToast.success('Logo uploaded!');
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error.message || 'Failed to upload logo');
    },
  });

  const removeLogoMutation = useMutation({
    mutationFn: () => employerService.removeLogo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYERS.COMPANY });
      showToast.success('Logo removed');
    },
    onError: (err) => {
      const error = err as unknown as ApiError;
      showToast.error(error?.message || 'Failed to remove logo');
    },
  });

  // -----------------------------------------------------------------------
  // Field helpers
  // -----------------------------------------------------------------------

  const updateField = <K extends keyof UpdateCompanyRequest>(
    key: K,
    value: UpdateCompanyRequest[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addToArray = (key: ArrayKey, value: string, clearFn: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !((form[key] as string[] | undefined) || []).includes(trimmed)) {
      updateField(key, [
        ...((form[key] as string[] | undefined) || []),
        trimmed,
      ] as UpdateCompanyRequest[typeof key]);
      clearFn('');
    }
  };

  const removeFromArray = (key: ArrayKey, value: string) => {
    updateField(
      key,
      ((form[key] as string[] | undefined) || []).filter(
        (v) => v !== value,
      ) as UpdateCompanyRequest[typeof key],
    );
  };

  const handleSave = () => updateMutation.mutate(form);

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  if (isLoading) {
    return (
      <DashboardLayout requiredRole={['EMPLOYER']}>
        <div className="space-y-6">
          <Skeleton variant="rect" height={60} />
          <Skeleton variant="text" lines={10} />
        </div>
      </DashboardLayout>
    );
  }

  // -----------------------------------------------------------------------
  // Section content
  // -----------------------------------------------------------------------

  const sectionProps = { form, updateField, addToArray, removeFromArray };

  const renderSection = () => {
    switch (activeSection) {
      case 'company':
        return <CompanyInfoSection {...sectionProps} />;
      case 'about':
        return <AboutSection form={form} updateField={updateField} />;
      case 'culture':
        return <CultureSection {...sectionProps} />;
      case 'benefits':
        return <BenefitsSection {...sectionProps} />;
      case 'tech':
        return <TechPoliciesSection {...sectionProps} />;
      case 'people':
        return <PeopleSection form={form} updateField={updateField} />;
      case 'awards':
        return <AwardsFundingSection {...sectionProps} />;
      case 'legal':
        return <LegalSection form={form} updateField={updateField} />;
      case 'contact':
        return <ContactSection form={form} updateField={updateField} />;
      case 'address':
        return <AddressSection {...sectionProps} />;
      case 'social':
        return <SocialSection form={form} updateField={updateField} />;
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <DashboardLayout requiredRole={['EMPLOYER']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Company Profile</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Manage your company information</p>
          </div>
          <Button onClick={handleSave} isLoading={updateMutation.isPending}>
            <Save className="mr-1.5 h-4 w-4" /> Save Changes
          </Button>
        </div>

        {/* Logo */}
        <Card padding="sm">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--bg-tertiary)]">
              {company?.logo ? (
                <img
                  src={company.logo}
                  alt={company?.companyName || 'Company logo'}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Building2 className="h-10 w-10 text-[var(--text-muted)]" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-[var(--text)]">
                {company?.companyName || 'Your Company'}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                Upload a company logo (PNG, JPG, max 5MB)
              </p>
              <div className="mt-2 flex gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) logoMutation.mutate(file);
                    }}
                  />
                  <span className="pointer-events-none inline-flex items-center rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg-secondary)]">
                    <Upload className="mr-1 h-3.5 w-3.5" />{' '}
                    {company?.logo ? 'Change Logo' : 'Upload Logo'}
                  </span>
                </label>
                {company?.logo && (
                  <button
                    onClick={() => removeLogoMutation.mutate()}
                    disabled={removeLogoMutation.isPending}
                    className="inline-flex items-center rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--error)] disabled:opacity-50"
                  >
                    <X className="mr-1 h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Completeness */}
        {completeness && completeness.score < 100 && (
          <Card padding="sm">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text)]">
                  Profile Completeness: {completeness.score}%
                </p>
                <ProgressBar
                  value={completeness.score}
                  color={
                    completeness.score >= 80
                      ? 'success'
                      : completeness.score >= 50
                        ? 'warning'
                        : 'error'
                  }
                  size="sm"
                  className="mt-2"
                />
                {completeness.sections.filter((s) => !s.completed).length > 0 && (
                  <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                    Missing:{' '}
                    {completeness.sections
                      .filter((s) => !s.completed)
                      .slice(0, 3)
                      .map((s) => s.name)
                      .join(', ')}
                    {completeness.sections.filter((s) => !s.completed).length > 3 &&
                      ` +${completeness.sections.filter((s) => !s.completed).length - 3} more`}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <Card padding="sm">
            <nav className="space-y-1">
              {sections.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSection(key)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeSection === key
                      ? 'bg-primary-light text-primary'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </Card>

          {/* Content */}
          <div className="space-y-6 lg:col-span-3">
            <Card
              header={
                <h2 className="text-lg font-semibold text-[var(--text)]">
                  {SECTION_HEADERS[activeSection]}
                </h2>
              }
            >
              {renderSection()}
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} isLoading={updateMutation.isPending}>
                <Save className="mr-1.5 h-4 w-4" /> Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
