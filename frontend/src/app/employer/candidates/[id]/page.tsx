'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  Globe,
  Code,
  Award,
  BookOpen,
  Calendar,
  Building2,
  Clock,
  CheckCircle,
  ExternalLink,
  Languages,
  Trophy,
  Heart,
  FolderKanban,
  Palette,
  FileText,
  Bookmark,
  Users,
  Download,
  Video,
  Car,
  Shield,
  Flag,
  Star,
  UserCheck,
  Linkedin,
  Github,
  Accessibility,
  MessageCircle,
  Activity,
  Pencil,
  X,
  Search,
  ChevronDown,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tag from '@/components/ui/Tag';
import Skeleton from '@/components/ui/Skeleton';
import PresenceIndicator from '@/components/ui/PresenceIndicator';
import { showToast } from '@/components/ui/Toast';
import { candidateService } from '@/services/candidate.service';
import { employerService } from '@/services/employer.service';
import { jobService } from '@/services/job.service';
import { QUERY_KEYS } from '@/constants/config';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/constants/enums';
import { ROUTES } from '@/constants/routes';
import {
  WORK_STATUS_LABELS,
  NOTICE_PERIOD_LABELS,
  WORK_MODE_LABELS,
  JOB_TYPE_LABELS,
  SHIFT_TYPE_LABELS,
  OPEN_TO_WORK_LABELS,
  CAREER_BREAK_TYPE_LABELS,
  DISABILITY_TYPE_LABELS,
  COURSE_TYPE_LABELS,
  GRADE_TYPE_LABELS,
  PATENT_STATUS_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  EDUCATION_LEVEL_LABELS,
  SPECIFIC_DEGREE_LABELS,
  DRIVING_LICENSE_TYPE_LABELS,
} from '@/constants/enums';
import { formatRelativeDate } from '@/lib/utils';
import { formatSalaryAsLPA } from '@/utils/format';
import type { CandidateProfile } from '@/types/candidate';
import type { JobApplication } from '@/types/job';
import type { ApiError } from '@/types/api';

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function formatFullDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
const statusColorMap: Record<string, BadgeVariant> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
  neutral: 'neutral',
};

export default function EmployerCandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.CANDIDATES.DETAIL(id),
    queryFn: () => candidateService.getCandidateProfile(id),
    enabled: !!id,
  });

  const [jobPickerOpen, setJobPickerOpen] = useState(false);
  const [jobPickerAction, setJobPickerAction] = useState<'shortlist' | 'select'>('shortlist');
  const [jobSearch, setJobSearch] = useState('');
  const [contactOpen, setContactOpen] = useState(false);

  const { data: myJobsData } = useQuery({
    queryKey: [...QUERY_KEYS.JOBS.MY_JOBS, 'picker'],
    queryFn: () => jobService.getMyJobs(1, 100),
    enabled: jobPickerOpen,
  });

  const toggleSaveMutation = useMutation({
    mutationFn: () => employerService.toggleSavedCandidate(id),
    onSuccess: (res) => {
      const saved = res.data?.saved ?? false;
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYERS.SAVED_CANDIDATES });
      showToast.success(saved ? 'Candidate saved!' : 'Candidate removed from saved');
    },
    onError: (err) => {
      const e = err as unknown as ApiError;
      showToast.error(e.message || 'Failed to save candidate');
    },
  });

  const shortlistMutation = useMutation({
    mutationFn: (jobId: string) => employerService.shortlistCandidateForJob(id, jobId),
    onSuccess: () => {
      setJobPickerOpen(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CANDIDATES.DETAIL(id) });
      showToast.success('Candidate shortlisted successfully!');
    },
    onError: (err) => {
      const e = err as unknown as ApiError;
      showToast.error(e.message || 'Failed to shortlist candidate');
    },
  });

  const selectMutation = useMutation({
    mutationFn: (jobId: string) => employerService.selectCandidateForJob(id, jobId),
    onSuccess: () => {
      setJobPickerOpen(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CANDIDATES.DETAIL(id) });
      showToast.success('Candidate selected successfully!');
    },
    onError: (err) => {
      const e = err as unknown as ApiError;
      showToast.error(e.message || 'Failed to select candidate');
    },
  });

  const { data: candidateAppsData } = useQuery({
    queryKey: [...QUERY_KEYS.EMPLOYERS.APPLICATIONS, 'candidate', id],
    queryFn: () => employerService.getAllApplications({ candidateId: id, limit: 50 }),
    enabled: !!id,
  });

  if (error) {
    notFound();
  }

  const profile = data?.data as CandidateProfile | undefined;
  const candidateApplications = (candidateAppsData?.data?.items || []) as JobApplication[];
  const name = profile?.user
    ? `${profile.user.firstName || ''} ${profile.user.lastName || ''}`.trim()
    : 'Candidate';

  const handleResumeDownload = useCallback(
    async (applicationId?: string) => {
      if (!id) return;
      try {
        const res = await candidateService.getResumeDownloadUrl(id, applicationId);
        if (res.data?.url) {
          window.open(res.data.url, '_blank', 'noopener,noreferrer');
        }
      } catch {
        showToast.error('Failed to download resume');
      }
    },
    [id],
  );

  return (
    <DashboardLayout requiredRole={['EMPLOYER']}>
      <div className="space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setJobPickerAction('shortlist');
                setJobPickerOpen(true);
              }}
            >
              <Star className="mr-1.5 h-4 w-4" /> Shortlist
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setJobPickerAction('select');
                setJobPickerOpen(true);
              }}
            >
              <UserCheck className="mr-1.5 h-4 w-4" /> Select
            </Button>

            {/* Contact dropdown */}
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setContactOpen(!contactOpen)}>
                <Phone className="mr-1.5 h-4 w-4" /> Contact{' '}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
              {contactOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setContactOpen(false)} />
                  <div className="absolute top-full right-0 z-50 mt-1 w-52 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-1 shadow-lg">
                    {profile?.user?.email && (
                      <a
                        href={`mailto:${profile.user.email}`}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                        onClick={() => setContactOpen(false)}
                      >
                        <Mail className="h-4 w-4" /> Email
                      </a>
                    )}
                    {(profile?.user?.mobileNumber || profile?.phone) && (
                      <a
                        href={`tel:${profile.user?.mobileNumber || profile.phone}`}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                        onClick={() => setContactOpen(false)}
                      >
                        <Phone className="h-4 w-4" /> Call
                      </a>
                    )}
                    {(profile?.user?.whatsappNumber ||
                      profile?.user?.mobileNumber ||
                      profile?.phone) && (
                      <a
                        href={`https://wa.me/${(profile.user?.whatsappNumber || profile.user?.mobileNumber || profile.phone || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                        onClick={() => setContactOpen(false)}
                      >
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </a>
                    )}
                    {!profile?.user?.email && !profile?.phone && !profile?.user?.mobileNumber && !profile?.user?.whatsappNumber && (
                      <p className="px-3 py-2 text-sm text-[var(--text-muted)]">No contact info available</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSaveMutation.mutate()}
              isLoading={toggleSaveMutation.isPending}
              title="Save Candidate"
            >
              <Bookmark className="h-4 w-4" />
            </Button>
            {profile?.resume && (
              <Button
                variant="ghost"
                size="sm"
                title="Download Resume"
                onClick={() => handleResumeDownload()}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Card>
              <Skeleton variant="rect" height={200} />
            </Card>
            <Card>
              <Skeleton variant="rect" height={150} />
            </Card>
            <Card>
              <Skeleton variant="rect" height={200} />
            </Card>
          </div>
        ) : profile ? (
          <>
            {/* Profile Header */}
            <Card>
              <div className="flex flex-col gap-6 sm:flex-row">
                <div className="flex shrink-0 flex-col items-center gap-3">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={`${name}'s photo`}
                      className="h-28 w-28 rounded-full border-4 border-[var(--bg-secondary)] object-cover"
                    />
                  ) : (
                    <div className="bg-primary-light text-primary flex h-28 w-28 items-center justify-center rounded-full text-3xl font-bold">
                      {profile.user?.firstName?.[0] || 'C'}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <PresenceIndicator userId={profile.userId} />
                    <span className="text-xs text-[var(--text-muted)]">
                      {profile.profileCompleteness}% complete
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">{name}</h1>
                    {profile.pronouns && (
                      <span className="text-sm text-[var(--text-muted)]">({profile.pronouns})</span>
                    )}
                    {profile.headline && (
                      <p className="mt-0.5 text-base text-[var(--text-secondary)]">
                        {profile.headline}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
                    {profile.currentLocation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {profile.currentLocation}
                      </span>
                    )}
                    {profile.experienceYears > 0 && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" /> {profile.experienceYears} yrs experience
                        {profile.totalExperienceMonths != null &&
                          profile.totalExperienceMonths % 12 !== 0 && (
                            <span className="text-xs text-[var(--text-muted)]">
                              ({profile.totalExperienceMonths} months)
                            </span>
                          )}
                      </span>
                    )}
                    {profile.currentCompany && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" /> {profile.currentCompany}
                      </span>
                    )}
                    {profile.currentRole && (
                      <span className="text-[var(--text)]">{profile.currentRole}</span>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    {profile.openToWork && (
                      <Badge
                        variant={
                          profile.openToWork === 'ACTIVELY_LOOKING'
                            ? 'success'
                            : profile.openToWork === 'OPEN_TO_OFFERS'
                              ? 'info'
                              : 'neutral'
                        }
                        size="sm"
                      >
                        {OPEN_TO_WORK_LABELS[profile.openToWork]}
                      </Badge>
                    )}
                    {profile.workStatus && (
                      <Badge
                        variant={profile.workStatus === 'ACTIVELY_LOOKING' ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {WORK_STATUS_LABELS[profile.workStatus]}
                      </Badge>
                    )}
                    {profile.experienceLevel && (
                      <Badge variant="neutral" size="sm">
                        {EXPERIENCE_LEVEL_LABELS[profile.experienceLevel]}
                      </Badge>
                    )}
                    {profile.noticePeriod && (
                      <Badge variant="info" size="sm">
                        {NOTICE_PERIOD_LABELS[profile.noticePeriod]}
                        {profile.servingNoticePeriod && ' (Serving)'}
                      </Badge>
                    )}
                    {profile.user?.isEmailVerified && (
                      <Badge variant="success" size="sm">
                        <CheckCircle className="mr-0.5 h-3 w-3" /> Email Verified
                      </Badge>
                    )}
                    {profile.user?.isMobileVerified && (
                      <Badge variant="success" size="sm">
                        <CheckCircle className="mr-0.5 h-3 w-3" /> Mobile Verified
                      </Badge>
                    )}
                    {profile.user?.isWhatsappVerified && (
                      <Badge variant="success" size="sm">
                        <MessageCircle className="mr-0.5 h-3 w-3" /> WhatsApp Verified
                      </Badge>
                    )}
                    {profile.isVeteran && (
                      <Badge variant="info" size="sm">
                        <Shield className="mr-0.5 h-3 w-3" /> Veteran
                      </Badge>
                    )}
                    {profile.isPhysicallyChallenged && (
                      <Badge variant="info" size="sm">
                        <Accessibility className="mr-0.5 h-3 w-3" /> PwD
                        {profile.disabilityType &&
                          profile.disabilityType !== 'NONE' &&
                          ` — ${DISABILITY_TYPE_LABELS[profile.disabilityType]}`}
                      </Badge>
                    )}
                    {profile.hasCareerBreak && (
                      <Badge variant="warning" size="sm">
                        Career Break
                        {profile.careerBreakType &&
                          ` — ${CAREER_BREAK_TYPE_LABELS[profile.careerBreakType]}`}
                      </Badge>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
                    {profile.user?.email && (
                      <a
                        href={`mailto:${profile.user.email}`}
                        className="hover:text-primary flex items-center gap-1"
                      >
                        <Mail className="h-3.5 w-3.5" /> {profile.user.email}
                      </a>
                    )}
                    {profile.phone && (
                      <a
                        href={`tel:${profile.phone}`}
                        className="hover:text-primary flex items-center gap-1"
                      >
                        <Phone className="h-3.5 w-3.5" /> {profile.phone}
                      </a>
                    )}
                  </div>

                  {/* Activity & Modification timestamps */}
                  <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
                    {profile.user?.lastActiveAt && (
                      <span className="flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5" /> Active{' '}
                        {formatRelativeDate(profile.user.lastActiveAt)}
                      </span>
                    )}
                    {profile.updatedAt && (
                      <span className="flex items-center gap-1">
                        <Pencil className="h-3.5 w-3.5" /> Profile modified{' '}
                        {formatRelativeDate(profile.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Content (left 2/3) */}
              <div className="space-y-6 lg:col-span-2">
                {/* About / Bio */}
                {profile.bio && (
                  <Card>
                    <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">About</h2>
                    <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--text-secondary)]">
                      {profile.bio}
                    </p>
                  </Card>
                )}

                {/* Experience */}
                {profile.experience && profile.experience.length > 0 && (
                  <Card>
                    <div className="mb-4 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-[var(--info)]" />
                      <h2 className="text-lg font-semibold text-[var(--text)]">Experience</h2>
                    </div>
                    <div className="space-y-6">
                      {profile.experience.map((exp, i) => (
                        <div key={i} className="relative border-l-2 border-[var(--border)] pl-6">
                          <div className="absolute top-1 -left-[7px] h-3 w-3 rounded-full border-2 border-[var(--border)] bg-white" />
                          <h3 className="font-semibold text-[var(--text)]">{exp.role}</h3>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {exp.company}
                            {exp.location && ` · ${exp.location}`}
                            {exp.employmentType && ` · ${exp.employmentType}`}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {formatDate(exp.startDate)} —{' '}
                            {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                          </p>
                          {(exp.industry || exp.department) && (
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                              {exp.industry && `Industry: ${exp.industry}`}
                              {exp.industry && exp.department && ' · '}
                              {exp.department && `Dept: ${exp.department}`}
                            </p>
                          )}
                          {(exp.teamSize || exp.reportingTo) && (
                            <p className="text-xs text-[var(--text-muted)]">
                              {exp.teamSize && `Team size: ${exp.teamSize}`}
                              {exp.teamSize && exp.reportingTo && ' · '}
                              {exp.reportingTo && `Reporting to: ${exp.reportingTo}`}
                            </p>
                          )}
                          {exp.description && (
                            <p className="mt-2 text-sm text-[var(--text-secondary)]">
                              {exp.description}
                            </p>
                          )}
                          {exp.keyAchievements && exp.keyAchievements.length > 0 && (
                            <ul className="mt-2 list-inside list-disc text-sm text-[var(--text-secondary)]">
                              {exp.keyAchievements.map((a, j) => (
                                <li key={j}>{a}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Education */}
                {(profile.education && profile.education.length > 0) ||
                profile.highestEducationLevel ||
                profile.highestDegree ? (
                  <Card>
                    <div className="mb-4 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-[var(--warning)]" />
                      <h2 className="text-lg font-semibold text-[var(--text)]">Education</h2>
                    </div>
                    {(profile.highestEducationLevel || profile.highestDegree) && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {profile.highestEducationLevel && (
                          <Badge variant="info" size="sm">
                            {EDUCATION_LEVEL_LABELS[profile.highestEducationLevel]}
                          </Badge>
                        )}
                        {profile.highestDegree && (
                          <Badge variant="neutral" size="sm">
                            {SPECIFIC_DEGREE_LABELS[profile.highestDegree]}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="space-y-4">
                      {(profile.education || []).map((edu, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--warning-light)]">
                            <GraduationCap className="h-5 w-5 text-[var(--warning)]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[var(--text)]">
                              {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                              {edu.institution}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                              {edu.grade &&
                                ` · ${edu.gradeType ? GRADE_TYPE_LABELS[edu.gradeType] || edu.gradeType : 'Grade'}: ${edu.grade}`}
                              {edu.courseType && ` · ${COURSE_TYPE_LABELS[edu.courseType]}`}
                            </p>
                            {edu.specialization && (
                              <p className="text-xs text-[var(--text-muted)]">
                                Specialization: {edu.specialization}
                              </p>
                            )}
                            {edu.activities && (
                              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                {edu.activities}
                              </p>
                            )}
                            {edu.description && (
                              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                {edu.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : null}

                {/* Projects */}
                {profile.projects && profile.projects.length > 0 && (
                  <Card>
                    <div className="mb-4 flex items-center gap-2">
                      <FolderKanban className="text-primary h-5 w-5" />
                      <h2 className="text-lg font-semibold text-[var(--text)]">Projects</h2>
                    </div>
                    <div className="space-y-4">
                      {profile.projects.map((proj, i) => (
                        <div key={i} className="rounded-lg border border-[var(--border)] p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-[var(--text)]">{proj.name}</h3>
                              {proj.role && (
                                <p className="text-sm text-[var(--text-secondary)]">
                                  Role: {proj.role}
                                </p>
                              )}
                            </div>
                            {proj.url && (
                              <a
                                href={proj.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">
                            {proj.startDate && formatDate(proj.startDate)}
                            {proj.startDate &&
                              (proj.isCurrent
                                ? ' — Present'
                                : proj.endDate
                                  ? ` — ${formatDate(proj.endDate)}`
                                  : '')}
                            {proj.client && ` · Client: ${proj.client}`}
                            {proj.teamSize && ` · Team: ${proj.teamSize}`}
                          </p>
                          {proj.description && (
                            <p className="mt-2 text-sm text-[var(--text-secondary)]">
                              {proj.description}
                            </p>
                          )}
                          {proj.technologies && proj.technologies.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {proj.technologies.map((tech) => (
                                <Tag key={tech} label={tech} size="sm" />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Certifications */}
                {profile.certifications && profile.certifications.length > 0 && (
                  <Card>
                    <div className="mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5 text-[var(--success)]" />
                      <h2 className="text-lg font-semibold text-[var(--text)]">Certifications</h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {profile.certifications.map((cert, i) => (
                        <div key={i} className="rounded-lg border border-[var(--border)] p-3">
                          <h3 className="font-medium text-[var(--text)]">{cert.name}</h3>
                          <p className="text-sm text-[var(--text-secondary)]">{cert.issuer}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {cert.issueDate && formatDate(cert.issueDate)}
                            {cert.expiryDate && !cert.doesNotExpire
                              ? ` — ${formatDate(cert.expiryDate)}`
                              : ''}
                            {cert.doesNotExpire ? ' · No expiry' : ''}
                          </p>
                          {cert.credentialId && (
                            <p className="text-xs text-[var(--text-muted)]">
                              ID: {cert.credentialId}
                            </p>
                          )}
                          {cert.url && (
                            <a
                              href={cert.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary mt-1 inline-flex items-center gap-1 text-xs hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> Verify
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Publications & Patents */}
                {((profile.publications && profile.publications.length > 0) ||
                  (profile.patents && profile.patents.length > 0)) && (
                  <Card>
                    <div className="mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-[#8B5CF6]" />
                      <h2 className="text-lg font-semibold text-[var(--text)]">
                        Publications & Patents
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {profile.publications?.map((pub, i) => (
                        <div
                          key={`pub-${i}`}
                          className="rounded-lg border border-[var(--border)] p-3"
                        >
                          <h3 className="font-medium text-[var(--text)]">{pub.title}</h3>
                          {pub.publisher && (
                            <p className="text-sm text-[var(--text-secondary)]">{pub.publisher}</p>
                          )}
                          {pub.authors && (
                            <p className="text-xs text-[var(--text-muted)]">
                              Authors: {pub.authors}
                            </p>
                          )}
                          {pub.publicationDate && (
                            <p className="text-xs text-[var(--text-muted)]">
                              {formatDate(pub.publicationDate)}
                            </p>
                          )}
                          {pub.description && (
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                              {pub.description}
                            </p>
                          )}
                          {pub.url && (
                            <a
                              href={pub.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary mt-1 inline-flex items-center gap-1 text-xs hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> View
                            </a>
                          )}
                        </div>
                      ))}
                      {profile.patents?.map((pat, i) => (
                        <div
                          key={`pat-${i}`}
                          className="rounded-lg border border-[var(--border)] p-3"
                        >
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-[var(--text)]">{pat.title}</h3>
                            {pat.status && (
                              <Badge variant="info" size="sm">
                                {PATENT_STATUS_LABELS[pat.status] || pat.status}
                              </Badge>
                            )}
                          </div>
                          {pat.patentOffice && (
                            <p className="text-sm text-[var(--text-secondary)]">
                              {pat.patentOffice}
                            </p>
                          )}
                          {pat.patentNumber && (
                            <p className="text-xs text-[var(--text-muted)]">
                              Patent #{pat.patentNumber}
                            </p>
                          )}
                          {pat.inventors && (
                            <p className="text-xs text-[var(--text-muted)]">
                              Inventors: {pat.inventors}
                            </p>
                          )}
                          <p className="text-xs text-[var(--text-muted)]">
                            {pat.filingDate && `Filed: ${formatFullDate(pat.filingDate)}`}
                            {pat.issueDate && ` · Issued: ${formatFullDate(pat.issueDate)}`}
                          </p>
                          {pat.description && (
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                              {pat.description}
                            </p>
                          )}
                          {pat.url && (
                            <a
                              href={pat.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary mt-1 inline-flex items-center gap-1 text-xs hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> View
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Awards */}
                {profile.awards && profile.awards.length > 0 && (
                  <Card>
                    <div className="mb-4 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-[var(--warning)]" />
                      <h2 className="text-lg font-semibold text-[var(--text)]">Awards</h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {profile.awards.map((award, i) => (
                        <div key={i} className="rounded-lg border border-[var(--border)] p-3">
                          <h3 className="font-medium text-[var(--text)]">{award.title}</h3>
                          {award.issuer && (
                            <p className="text-sm text-[var(--text-secondary)]">{award.issuer}</p>
                          )}
                          {award.date && (
                            <p className="text-xs text-[var(--text-muted)]">
                              {formatDate(award.date)}
                            </p>
                          )}
                          {award.description && (
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                              {award.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Courses & Test Scores */}
                {((profile.courses && profile.courses.length > 0) ||
                  (profile.testScores && profile.testScores.length > 0)) && (
                  <Card>
                    <div className="mb-4 flex items-center gap-2">
                      <GraduationCap className="text-primary h-5 w-5" />
                      <h2 className="text-lg font-semibold text-[var(--text)]">
                        Courses & Test Scores
                      </h2>
                    </div>
                    {profile.courses && profile.courses.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-[var(--text)]">
                          Courses Completed
                        </h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {profile.courses.map((course, i) => (
                            <div key={i} className="rounded border border-[var(--border)] p-2.5">
                              <p className="text-sm font-medium text-[var(--text)]">
                                {course.name}
                              </p>
                              {course.provider && (
                                <p className="text-xs text-[var(--text-secondary)]">
                                  {course.provider}
                                </p>
                              )}
                              {course.completionDate && (
                                <p className="text-xs text-[var(--text-muted)]">
                                  {formatDate(course.completionDate)}
                                </p>
                              )}
                              {course.url && (
                                <a
                                  href={course.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary text-xs hover:underline"
                                >
                                  View
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.testScores && profile.testScores.length > 0 && (
                      <div
                        className={`space-y-2 ${profile.courses && profile.courses.length > 0 ? 'mt-4' : ''}`}
                      >
                        <h3 className="text-sm font-medium text-[var(--text)]">Test Scores</h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {profile.testScores.map((test, i) => (
                            <div key={i} className="rounded border border-[var(--border)] p-2.5">
                              <p className="text-sm font-medium text-[var(--text)]">
                                {test.testName}
                              </p>
                              <p className="text-primary text-sm font-semibold">
                                Score: {test.score}
                              </p>
                              {test.dateOfExam && (
                                <p className="text-xs text-[var(--text-muted)]">
                                  {formatFullDate(test.dateOfExam)}
                                </p>
                              )}
                              {test.description && (
                                <p className="text-xs text-[var(--text-secondary)]">
                                  {test.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Volunteering */}
                {profile.volunteerExperience && profile.volunteerExperience.length > 0 && (
                  <Card>
                    <div className="mb-4 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-[var(--error)]" />
                      <h2 className="text-lg font-semibold text-[var(--text)]">Volunteering</h2>
                    </div>
                    <div className="space-y-3">
                      {profile.volunteerExperience.map((vol, i) => (
                        <div key={i} className="border-l-2 border-[var(--border)] pl-4">
                          <h3 className="font-medium text-[var(--text)]">{vol.role}</h3>
                          <p className="text-sm text-[var(--text-secondary)]">{vol.organization}</p>
                          {vol.cause && (
                            <p className="text-xs text-[var(--text-muted)]">Cause: {vol.cause}</p>
                          )}
                          <p className="text-xs text-[var(--text-muted)]">
                            {vol.startDate && formatDate(vol.startDate)}
                            {vol.startDate &&
                              (vol.isCurrent
                                ? ' — Present'
                                : vol.endDate
                                  ? ` — ${formatDate(vol.endDate)}`
                                  : '')}
                          </p>
                          {vol.description && (
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                              {vol.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Professional Memberships */}
                {profile.professionalMemberships && profile.professionalMemberships.length > 0 && (
                  <Card>
                    <div className="mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-[var(--info)]" />
                      <h2 className="text-lg font-semibold text-[var(--text)]">
                        Professional Memberships
                      </h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {profile.professionalMemberships.map((mem, i) => (
                        <div key={i} className="rounded-lg border border-[var(--border)] p-3">
                          <h3 className="font-medium text-[var(--text)]">{mem.organization}</h3>
                          {mem.role && (
                            <p className="text-sm text-[var(--text-secondary)]">{mem.role}</p>
                          )}
                          <p className="text-xs text-[var(--text-muted)]">
                            {mem.startDate && formatDate(mem.startDate)}
                            {mem.endDate && ` — ${formatDate(mem.endDate)}`}
                          </p>
                          {mem.membershipId && (
                            <p className="text-xs text-[var(--text-muted)]">
                              ID: {mem.membershipId}
                            </p>
                          )}
                          {mem.description && (
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                              {mem.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Sidebar (right 1/3) */}
              <div className="space-y-6">
                {/* Skills */}
                {profile.skills.length > 0 && (
                  <Card>
                    <div className="mb-3 flex items-center gap-2">
                      <Code className="text-primary h-5 w-5" />
                      <h2 className="text-base font-semibold text-[var(--text)]">Skills</h2>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map((skill) => (
                        <Tag key={skill} label={skill} variant="primary" />
                      ))}
                    </div>
                  </Card>
                )}

                {/* Skills with Proficiency */}
                {profile.skillsWithProficiency && profile.skillsWithProficiency.length > 0 && (
                  <Card>
                    <h2 className="mb-3 text-base font-semibold text-[var(--text)]">
                      Skill Proficiency
                    </h2>
                    <div className="space-y-2">
                      {profile.skillsWithProficiency.map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--text)]">{s.skill}</span>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                s.proficiency === 'EXPERT'
                                  ? 'success'
                                  : s.proficiency === 'ADVANCED'
                                    ? 'info'
                                    : 'neutral'
                              }
                              size="sm"
                            >
                              {s.proficiency}
                            </Badge>
                            {s.yearsOfExperience != null && (
                              <span className="text-xs text-[var(--text-muted)]">
                                {s.yearsOfExperience}yr
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* IT Skills */}
                {profile.itSkills && profile.itSkills.length > 0 && (
                  <Card>
                    <h2 className="mb-3 text-base font-semibold text-[var(--text)]">IT Skills</h2>
                    <div className="space-y-2">
                      {profile.itSkills.map((it, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--text)]">
                            {it.technology}
                            {it.version && (
                              <span className="text-[var(--text-muted)]"> v{it.version}</span>
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            {it.proficiency && (
                              <Badge variant="neutral" size="sm">
                                {it.proficiency}
                              </Badge>
                            )}
                            {it.experienceYears != null && (
                              <span className="text-xs text-[var(--text-muted)]">
                                {it.experienceYears}yr
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Work Details */}
                <Card>
                  <h2 className="mb-3 text-base font-semibold text-[var(--text)]">Work Details</h2>
                  <div className="space-y-2.5 text-sm">
                    {profile.currentIndustry && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Industry</span>
                        <span className="text-[var(--text)]">{profile.currentIndustry}</span>
                      </div>
                    )}
                    {profile.currentDepartment && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Department</span>
                        <span className="text-[var(--text)]">{profile.currentDepartment}</span>
                      </div>
                    )}
                    {profile.functionalArea && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Functional Area</span>
                        <span className="text-[var(--text)]">{profile.functionalArea}</span>
                      </div>
                    )}
                    {(profile.expectedSalaryMin || profile.expectedSalaryMax) && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Expected CTC</span>
                        <span className="font-medium text-[var(--text)]">
                          {(profile.salaryCurrency || 'INR').toUpperCase() === 'INR'
                            ? formatSalaryAsLPA(
                                profile.expectedSalaryMin,
                                profile.expectedSalaryMax,
                              )
                            : `${profile.expectedSalaryMin?.toLocaleString() || ''} - ${profile.expectedSalaryMax?.toLocaleString() || ''} ${profile.salaryCurrency}`}
                        </span>
                      </div>
                    )}
                    {profile.dateOfAvailability && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Available From</span>
                        <span className="text-[var(--text)]">
                          {formatFullDate(profile.dateOfAvailability)}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Preferences */}
                <Card>
                  <h2 className="mb-3 text-base font-semibold text-[var(--text)]">Preferences</h2>
                  <div className="space-y-3">
                    {profile.preferredJobType.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs text-[var(--text-muted)]">Job Types</p>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.preferredJobType.map((jt) => (
                            <Badge key={jt} variant="info" size="sm">
                              {JOB_TYPE_LABELS[jt] || jt}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.preferredWorkMode.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs text-[var(--text-muted)]">Work Modes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.preferredWorkMode.map((wm) => (
                            <Badge key={wm} variant="neutral" size="sm">
                              {WORK_MODE_LABELS[wm] || wm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.preferredShift && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">Shift</span>
                        <span className="text-[var(--text)]">
                          {SHIFT_TYPE_LABELS[profile.preferredShift]}
                        </span>
                      </div>
                    )}
                    {profile.preferredLocations.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs text-[var(--text-muted)]">Preferred Locations</p>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.preferredLocations.map((loc) => (
                            <Tag key={loc} label={loc} size="sm" />
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.preferredIndustries.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs text-[var(--text-muted)]">
                          Preferred Industries
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.preferredIndustries.map((ind) => (
                            <Tag key={ind} label={ind} size="sm" />
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.preferredRoleCategories.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs text-[var(--text-muted)]">Preferred Roles</p>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.preferredRoleCategories.map((rc) => (
                            <Tag key={rc} label={rc} size="sm" />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5 text-sm">
                      {profile.willingToRelocate && (
                        <p className="flex items-center gap-1 text-[var(--success)]">
                          <CheckCircle className="h-3.5 w-3.5" /> Willing to relocate
                        </p>
                      )}
                      {profile.travelWillingnessPercent != null &&
                        profile.travelWillingnessPercent > 0 && (
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Travel</span>
                            <span className="text-[var(--text)]">
                              {profile.travelWillingnessPercent}%
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </Card>

                {/* Additional Info */}
                {(profile.visaStatus ||
                  profile.workPermitStatus ||
                  profile.hasDrivingLicense ||
                  profile.drivingLicenseType ||
                  profile.ownVehicle ||
                  profile.isPhysicallyChallenged) && (
                  <Card>
                    <h2 className="mb-3 text-base font-semibold text-[var(--text)]">
                      Additional Info
                    </h2>
                    <div className="space-y-2 text-sm">
                      {profile.visaStatus && (
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Visa Status</span>
                          <span className="text-[var(--text)]">{profile.visaStatus}</span>
                        </div>
                      )}
                      {profile.workPermitStatus && (
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Work Permit</span>
                          <span className="text-[var(--text)]">{profile.workPermitStatus}</span>
                        </div>
                      )}
                      {profile.drivingLicenseType && profile.drivingLicenseType !== 'NONE' ? (
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Driving License</span>
                          <span className="text-[var(--text)]">
                            {DRIVING_LICENSE_TYPE_LABELS[profile.drivingLicenseType]}
                          </span>
                        </div>
                      ) : profile.hasDrivingLicense ? (
                        <p className="flex items-center gap-1 text-[var(--success)]">
                          <Car className="h-3.5 w-3.5" /> Has driving license
                        </p>
                      ) : null}
                      {profile.ownVehicle && (
                        <p className="flex items-center gap-1 text-[var(--text)]">
                          <Car className="h-3.5 w-3.5" /> Owns vehicle
                        </p>
                      )}
                      {profile.isPhysicallyChallenged && (
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Disability</span>
                          <span className="text-[var(--text)]">
                            {profile.disabilityType
                              ? DISABILITY_TYPE_LABELS[profile.disabilityType] ||
                                profile.disabilityType
                              : 'Yes'}
                            {profile.disabilityPercentage
                              ? ` (${profile.disabilityPercentage}%)`
                              : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Languages */}
                {profile.languageProficiency && profile.languageProficiency.length > 0 && (
                  <Card>
                    <div className="mb-3 flex items-center gap-2">
                      <Languages className="h-5 w-5 text-[var(--info)]" />
                      <h2 className="text-base font-semibold text-[var(--text)]">Languages</h2>
                    </div>
                    <div className="space-y-2">
                      {profile.languageProficiency.map((lang, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--text)]">{lang.language}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="neutral" size="sm">
                              {lang.proficiency}
                            </Badge>
                            {lang.readWrite && (
                              <span className="text-xs text-[var(--text-muted)]">
                                {lang.readWrite.replace(/_/g, ', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Interests & Hobbies */}
                {(profile.interests.length > 0 || profile.hobbies.length > 0) && (
                  <Card>
                    <div className="mb-3 flex items-center gap-2">
                      <Palette className="h-5 w-5 text-[var(--warning)]" />
                      <h2 className="text-base font-semibold text-[var(--text)]">
                        Interests & Hobbies
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.interests.map((i) => (
                        <Tag key={i} label={i} size="sm" variant="primary" />
                      ))}
                      {profile.hobbies.map((h) => (
                        <Tag key={h} label={h} size="sm" />
                      ))}
                    </div>
                  </Card>
                )}

                {/* Social Links */}
                {(profile.linkedinProfile ||
                  profile.githubProfile ||
                  profile.portfolioUrl ||
                  profile.stackOverflowProfile ||
                  profile.twitterProfile ||
                  profile.personalBlogUrl ||
                  profile.dribbbleProfile ||
                  profile.behanceProfile ||
                  profile.mediumProfile ||
                  profile.youtubeChannel) && (
                  <Card>
                    <div className="mb-3 flex items-center gap-2">
                      <Globe className="text-primary h-5 w-5" />
                      <h2 className="text-base font-semibold text-[var(--text)]">Social Links</h2>
                    </div>
                    <div className="space-y-2">
                      {profile.linkedinProfile && (
                        <a
                          href={profile.linkedinProfile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <Linkedin className="h-4 w-4 text-[#0A66C2]" /> LinkedIn
                        </a>
                      )}
                      {profile.githubProfile && (
                        <a
                          href={profile.githubProfile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <Github className="h-4 w-4" /> GitHub
                        </a>
                      )}
                      {profile.portfolioUrl && (
                        <a
                          href={profile.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <Globe className="text-primary h-4 w-4" /> Portfolio
                        </a>
                      )}
                      {profile.stackOverflowProfile && (
                        <a
                          href={profile.stackOverflowProfile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <Code className="h-4 w-4 text-[#F48024]" /> Stack Overflow
                        </a>
                      )}
                      {profile.twitterProfile && (
                        <a
                          href={profile.twitterProfile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <ExternalLink className="h-4 w-4" /> Twitter/X
                        </a>
                      )}
                      {profile.personalBlogUrl && (
                        <a
                          href={profile.personalBlogUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <ExternalLink className="h-4 w-4" /> Blog
                        </a>
                      )}
                      {profile.dribbbleProfile && (
                        <a
                          href={profile.dribbbleProfile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <Palette className="h-4 w-4 text-[#EA4C89]" /> Dribbble
                        </a>
                      )}
                      {profile.behanceProfile && (
                        <a
                          href={profile.behanceProfile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <Palette className="h-4 w-4 text-[#1769FF]" /> Behance
                        </a>
                      )}
                      {profile.mediumProfile && (
                        <a
                          href={profile.mediumProfile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <BookOpen className="h-4 w-4" /> Medium
                        </a>
                      )}
                      {profile.youtubeChannel && (
                        <a
                          href={profile.youtubeChannel}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <Video className="h-4 w-4 text-[#FF0000]" /> YouTube
                        </a>
                      )}
                    </div>
                  </Card>
                )}

                {/* Resume & Video */}
                {(profile.resume || profile.videoResumeUrl) && (
                  <Card>
                    <h2 className="mb-3 text-base font-semibold text-[var(--text)]">Documents</h2>
                    <div className="space-y-2">
                      {profile.resume && (
                        <button
                          type="button"
                          onClick={() => handleResumeDownload()}
                          className="flex w-full items-center gap-2 rounded-lg border border-[var(--border)] p-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                        >
                          <FileText className="text-primary h-4 w-4" />
                          <span className="flex-1 text-left">
                            {profile.resumeOriginalName || 'Resume'}
                          </span>
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      {profile.videoResumeUrl && (
                        <a
                          href={profile.videoResumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-[var(--border)] p-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                        >
                          <Video className="h-4 w-4 text-[var(--error)]" />
                          <span className="flex-1">Video Resume</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* Application History */}
            {candidateApplications.length > 0 && (
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="text-primary h-5 w-5" />
                  <h2 className="text-lg font-semibold text-[var(--text)]">Application History</h2>
                </div>
                <div className="space-y-3">
                  {candidateApplications.map((app) => {
                    const badgeColor =
                      statusColorMap[APPLICATION_STATUS_COLORS[app.status] || 'neutral'] ||
                      'neutral';
                    return (
                      <div
                        key={app.id}
                        className="flex flex-col gap-2 rounded-lg border border-[var(--border)] p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--text)]">
                            {app.job?.title || 'Unknown Job'}
                          </p>
                          <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                            {app.job?.location && <span>{app.job.location}</span>}
                            <span>Applied {formatRelativeDate(app.appliedAt)}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {app.matchScore !== null && (
                            <span className="text-primary text-xs font-medium">
                              {Math.round(app.matchScore)}% match
                            </span>
                          )}
                          <Badge variant={badgeColor} size="sm">
                            {APPLICATION_STATUS_LABELS[app.status] || app.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        ) : null}

        {/* Job Picker Modal */}
        {jobPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-[var(--bg)] shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
                <h3 className="text-lg font-semibold text-[var(--text)]">
                  {jobPickerAction === 'shortlist' ? 'Shortlist' : 'Select'} for Job
                </h3>
                <button
                  onClick={() => setJobPickerOpen(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <div className="relative mb-3">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search your jobs..."
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="focus:border-primary w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] py-2 pr-3 pl-10 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
                  />
                </div>
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {(myJobsData?.data?.items || [])
                    .filter(
                      (job: { title: string; status: string }) =>
                        job.status === 'OPEN' &&
                        job.title.toLowerCase().includes(jobSearch.toLowerCase()),
                    )
                    .map((job: { id: string; title: string; location: string }) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => {
                          if (jobPickerAction === 'shortlist') {
                            shortlistMutation.mutate(job.id);
                          } else {
                            selectMutation.mutate(job.id);
                          }
                        }}
                        disabled={shortlistMutation.isPending || selectMutation.isPending}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                      >
                        <div>
                          <p className="font-medium text-[var(--text)]">{job.title}</p>
                          <p className="text-xs text-[var(--text-muted)]">{job.location}</p>
                        </div>
                        <Star className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                      </button>
                    ))}
                  {(myJobsData?.data?.items || []).filter(
                    (job: { status: string; title: string }) =>
                      job.status === 'OPEN' &&
                      job.title.toLowerCase().includes(jobSearch.toLowerCase()),
                  ).length === 0 && (
                    <p className="py-8 text-center text-sm text-[var(--text-muted)]">
                      No open jobs found. Post a job first.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
