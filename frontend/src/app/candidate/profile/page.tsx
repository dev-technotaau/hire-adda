'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    User, Briefcase, GraduationCap, Code, FileText,
    Globe, Save, Upload, Languages, Settings,
    Download, Eye, Sparkles, Calendar, Loader2,
    FolderKanban, Brain, CheckCircle2, ChevronDown,
    Award, BookOpen, Trophy, Users, Heart, Palette,
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import FileUpload from '@/components/ui/FileUpload';
import Skeleton from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import { candidateService } from '@/services/candidate.service';
import { QUERY_KEYS, FILE_LIMITS } from '@/constants/config';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/use-auth';
import type { UpdateCandidateRequest } from '@/types/candidate';
import type { ApiError } from '@/types/api';
import type { ParsedResumeData } from '@/types/resume-parse';

import PersonalSection from '@/components/profile/PersonalSection';
import ExperienceSection from '@/components/profile/ExperienceSection';
import EducationSection from '@/components/profile/EducationSection';
import SkillsSection from '@/components/profile/SkillsSection';
import CertificationsSection from '@/components/profile/CertificationsSection';
import ProjectsSection from '@/components/profile/ProjectsSection';
import LanguagesSection from '@/components/profile/LanguagesSection';
import PreferencesSection from '@/components/profile/PreferencesSection';
import SocialSection from '@/components/profile/SocialSection';
import PublicationsSection from '@/components/profile/PublicationsSection';
import AwardsSection from '@/components/profile/AwardsSection';
import CoursesSection from '@/components/profile/CoursesSection';
import MembershipsSection from '@/components/profile/MembershipsSection';
import VolunteeringSection from '@/components/profile/VolunteeringSection';
import InterestsSection from '@/components/profile/InterestsSection';

type Section = 'personal' | 'experience' | 'education' | 'skills' | 'certifications' | 'projects' | 'languages' | 'resume' | 'preferences' | 'social' | 'publications' | 'awards' | 'courses' | 'memberships' | 'volunteering' | 'interests';

const sections: { key: Section; label: string; icon: React.ElementType }[] = [
    { key: 'personal', label: 'Personal Info', icon: User },
    { key: 'experience', label: 'Experience', icon: Briefcase },
    { key: 'education', label: 'Education', icon: GraduationCap },
    { key: 'skills', label: 'Skills', icon: Code },
    { key: 'certifications', label: 'Certifications', icon: Award },
    { key: 'projects', label: 'Projects', icon: FolderKanban },
    { key: 'publications', label: 'Publications & Patents', icon: BookOpen },
    { key: 'awards', label: 'Awards', icon: Trophy },
    { key: 'courses', label: 'Courses & Tests', icon: GraduationCap },
    { key: 'memberships', label: 'Memberships', icon: Users },
    { key: 'volunteering', label: 'Volunteering & Refs', icon: Heart },
    { key: 'interests', label: 'Interests & Hobbies', icon: Palette },
    { key: 'languages', label: 'Languages', icon: Languages },
    { key: 'resume', label: 'Resume', icon: FileText },
    { key: 'preferences', label: 'Preferences', icon: Settings },
    { key: 'social', label: 'Social Links', icon: Globe },
];

export default function CandidateProfilePage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeSection, setActiveSection] = useState<Section>('personal');
    const [form, setForm] = useState<UpdateCandidateRequest>({});
    const [resumeFile, setResumeFile] = useState<File[]>([]);

    const { data: profileData, isLoading } = useQuery({
        queryKey: QUERY_KEYS.CANDIDATES.PROFILE,
        queryFn: () => candidateService.getProfile(),
    });

    const { data: completenessData } = useQuery({
        queryKey: QUERY_KEYS.CANDIDATES.COMPLETENESS,
        queryFn: () => candidateService.getCompleteness(),
    });

    const profile = profileData?.data;
    const completeness = completenessData?.data;

    useEffect(() => {
        if (profile) {
            setForm({
                headline: profile.headline || '',
                pronouns: profile.pronouns || '',
                gender: profile.gender || undefined,
                dob: profile.dob || '',
                maritalStatus: profile.maritalStatus || undefined,
                nationality: profile.nationality || '',
                hometown: profile.hometown || '',
                category: profile.category || undefined,
                bio: profile.bio || '',
                videoResumeUrl: profile.videoResumeUrl || '',
                addressLine1: profile.addressLine1 || '',
                addressLine2: profile.addressLine2 || '',
                city: profile.city || '',
                state: profile.state || '',
                pincode: profile.pincode || '',
                country: profile.country || 'India',
                currentLocation: profile.currentLocation || '',
                preferredLocations: profile.preferredLocations || [],
                phone: profile.phone || '',
                alternatePhone: profile.alternatePhone || '',
                alternateEmail: profile.alternateEmail || '',
                experienceYears: profile.experienceYears || 0,
                totalExperienceMonths: profile.totalExperienceMonths || undefined,
                currentCompany: profile.currentCompany || '',
                currentRole: profile.currentRole || '',
                currentIndustry: profile.currentIndustry || '',
                currentDepartment: profile.currentDepartment || '',
                functionalArea: profile.functionalArea || '',
                currSalary: profile.currSalary || undefined,
                expectedSalaryMin: profile.expectedSalaryMin || undefined,
                expectedSalaryMax: profile.expectedSalaryMax || undefined,
                salaryCurrency: profile.salaryCurrency || 'INR',
                noticePeriod: profile.noticePeriod || undefined,
                servingNoticePeriod: profile.servingNoticePeriod || false,
                workStatus: profile.workStatus || undefined,
                hasCareerBreak: profile.hasCareerBreak || false,
                careerBreakType: profile.careerBreakType || undefined,
                careerBreakReason: profile.careerBreakReason || '',
                openToWork: profile.openToWork || undefined,
                preferredJobType: profile.preferredJobType || [],
                preferredWorkMode: profile.preferredWorkMode || [],
                preferredShift: profile.preferredShift || undefined,
                preferredIndustries: profile.preferredIndustries || [],
                preferredRoleCategories: profile.preferredRoleCategories || [],
                dateOfAvailability: profile.dateOfAvailability || '',
                willingToRelocate: profile.willingToRelocate || false,
                travelWillingnessPercent: profile.travelWillingnessPercent || undefined,
                visaStatus: profile.visaStatus || '',
                workPermitStatus: profile.workPermitStatus || '',
                passportNumber: profile.passportNumber || '',
                passportExpiryDate: profile.passportExpiryDate || '',
                hasDrivingLicense: profile.hasDrivingLicense || false,
                ownVehicle: profile.ownVehicle || false,
                isVeteran: profile.isVeteran || false,
                blockedCompanies: profile.blockedCompanies || [],
                skills: profile.skills || [],
                itSkills: profile.itSkills || [],
                education: profile.education || [],
                experience: profile.experience || [],
                certifications: profile.certifications || [],
                projects: profile.projects || [],
                publications: profile.publications || [],
                patents: profile.patents || [],
                awards: profile.awards || [],
                volunteerExperience: profile.volunteerExperience || [],
                professionalMemberships: profile.professionalMemberships || [],
                courses: profile.courses || [],
                testScores: profile.testScores || [],
                references: profile.references || [],
                languageProficiency: profile.languageProficiency || [],
                skillsWithProficiency: profile.skillsWithProficiency || [],
                interests: profile.interests || [],
                hobbies: profile.hobbies || [],
                isPhysicallyChallenged: profile.isPhysicallyChallenged || false,
                disabilityType: profile.disabilityType || undefined,
                disabilityPercentage: profile.disabilityPercentage || undefined,
                githubProfile: profile.githubProfile || '',
                linkedinProfile: profile.linkedinProfile || '',
                portfolioUrl: profile.portfolioUrl || '',
                stackOverflowProfile: profile.stackOverflowProfile || '',
                twitterProfile: profile.twitterProfile || '',
                personalBlogUrl: profile.personalBlogUrl || '',
                dribbbleProfile: profile.dribbbleProfile || '',
                behanceProfile: profile.behanceProfile || '',
                mediumProfile: profile.mediumProfile || '',
                youtubeChannel: profile.youtubeChannel || '',
            });
        }
    }, [profile]);

    const updateMutation = useMutation({
        mutationFn: (data: UpdateCandidateRequest) => candidateService.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CANDIDATES.PROFILE });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CANDIDATES.COMPLETENESS });
            showToast.success('Profile updated successfully!');
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to update profile');
        },
    });

    const resumeMutation = useMutation({
        mutationFn: (file: File) => candidateService.uploadResume(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CANDIDATES.PROFILE });
            showToast.success('Resume uploaded!');
            setResumeFile([]);
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to upload resume');
        },
    });

    const generateResumeMutation = useMutation({
        mutationFn: () => candidateService.generateResume(),
        onSuccess: (blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${user?.firstName || 'candidate'}_${user?.lastName || ''}_resume.pdf`.replace(/\s+/g, '_');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast.success('Resume generated and downloaded!');
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to generate resume');
        },
    });

    const handleSave = () => {
        const payload = {
            ...form,
            dob: form.dob ? new Date(form.dob).toISOString() : undefined,
            dateOfAvailability: form.dateOfAvailability ? new Date(form.dateOfAvailability).toISOString() : undefined,
            passportExpiryDate: form.passportExpiryDate ? new Date(form.passportExpiryDate).toISOString() : undefined,
        };
        updateMutation.mutate(payload);
    };

    const handleUploadResume = () => {
        if (resumeFile.length > 0) {
            resumeMutation.mutate(resumeFile[0]);
        }
    };

    const updateField = <K extends keyof UpdateCandidateRequest>(key: K, value: UpdateCandidateRequest[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    if (isLoading) {
        return (
            <DashboardLayout requiredRole={['CANDIDATE']}>
                <div className="space-y-6">
                    <Skeleton variant="rect" height={60} />
                    <div className="grid gap-6 lg:grid-cols-4">
                        <Skeleton variant="rect" height={300} />
                        <div className="lg:col-span-3"><Skeleton variant="text" lines={10} /></div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout requiredRole={['CANDIDATE']}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text)]">My Profile</h1>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Keep your profile updated to get better job matches
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={ROUTES.CANDIDATE.PROFILE_PREVIEW}>
                            <Button variant="outline">
                                <Eye className="mr-1.5 h-4 w-4" /> Preview as Employer
                            </Button>
                        </Link>
                        <Button onClick={handleSave} isLoading={updateMutation.isPending}>
                            <Save className="mr-1.5 h-4 w-4" /> Save Changes
                        </Button>
                    </div>
                </div>

                {/* Completeness */}
                {completeness && completeness.score < 100 && (
                    <Card padding="sm">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-[var(--text)]">Profile Completeness: {completeness.score}%</p>
                                <ProgressBar
                                    value={completeness.score}
                                    color={completeness.score >= 80 ? 'success' : completeness.score >= 50 ? 'warning' : 'error'}
                                    size="sm"
                                    className="mt-2"
                                />
                            </div>
                        </div>
                    </Card>
                )}

                <div className="grid gap-6 lg:grid-cols-4">
                    {/* Sidebar Nav */}
                    <div className="lg:col-span-1">
                        <Card padding="sm">
                            <nav className="space-y-1">
                                {sections.map(({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setActiveSection(key)}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                            activeSection === key
                                                ? 'bg-primary-light text-primary'
                                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {label}
                                    </button>
                                ))}
                            </nav>
                        </Card>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {activeSection === 'personal' && (
                            <PersonalSection form={form} updateField={updateField} profile={profile} />
                        )}

                        {activeSection === 'experience' && (
                            <ExperienceSection form={form} updateField={updateField} />
                        )}

                        {activeSection === 'education' && (
                            <EducationSection form={form} updateField={updateField} />
                        )}

                        {activeSection === 'skills' && (
                            <SkillsSection form={form} updateField={updateField} />
                        )}

                        {activeSection === 'certifications' && (
                            <CertificationsSection form={form} updateField={updateField} />
                        )}

                        {activeSection === 'projects' && (
                            <ProjectsSection form={form} updateField={updateField} />
                        )}

                        {activeSection === 'publications' && (
                            <PublicationsSection form={form} updateField={updateField} />
                        )}

                        {activeSection === 'awards' && (
                            <AwardsSection form={form} updateField={updateField} />
                        )}

                        {activeSection === 'courses' && (
                            <CoursesSection form={form} updateField={updateField} />
                        )}

                        {activeSection === 'memberships' && (
                            <MembershipsSection form={form} updateField={updateField} />
                        )}

                        {activeSection === 'volunteering' && (
                            <VolunteeringSection form={form} updateField={updateField} />
                        )}

                        {activeSection === 'interests' && (
                            <InterestsSection form={form} updateField={updateField} />
                        )}

                        {activeSection === 'languages' && (
                            <LanguagesSection form={form} updateField={updateField} />
                        )}

                        {activeSection === 'resume' && (
                            <div className="space-y-6">
                                {/* Current Resume Preview */}
                                <Card header={<h2 className="text-lg font-semibold text-[var(--text)]">Current Resume</h2>}>
                                    {profile?.resume ? (
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                                    <FileText className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate text-sm font-semibold text-[var(--text)]">
                                                        {(() => {
                                                            try {
                                                                const url = new URL(profile.resume);
                                                                const segments = url.pathname.split('/');
                                                                const filename = segments[segments.length - 1];
                                                                return decodeURIComponent(filename) || 'Resume';
                                                            } catch {
                                                                return 'Resume';
                                                            }
                                                        })()}
                                                    </p>
                                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>
                                                            Uploaded {profile.updatedAt
                                                                ? new Date(profile.updatedAt).toLocaleDateString('en-IN', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                })
                                                                : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => window.open(profile.resume!, '_blank', 'noopener,noreferrer')}
                                                    >
                                                        <Eye className="mr-1.5 h-4 w-4" /> Preview
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            const link = document.createElement('a');
                                                            link.href = profile.resume!;
                                                            link.target = '_blank';
                                                            link.rel = 'noopener noreferrer';
                                                            link.click();
                                                        }}
                                                    >
                                                        <Download className="mr-1.5 h-4 w-4" /> Download
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] py-10">
                                            <FileText className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
                                            <p className="text-sm font-medium text-[var(--text)]">No resume uploaded yet</p>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                Upload a resume or generate one from your profile data
                                            </p>
                                        </div>
                                    )}
                                </Card>

                                {/* AI Resume Parser */}
                                {profile?.resume && (
                                    <ResumeParserSection form={form} updateField={updateField} />
                                )}

                                {/* Upload Resume */}
                                <Card header={<h2 className="text-lg font-semibold text-[var(--text)]">Upload Resume</h2>}>
                                    <div className="space-y-4">
                                        <FileUpload
                                            label="Select a file to upload"
                                            accept={{
                                                'application/pdf': ['.pdf'],
                                                'application/msword': ['.doc'],
                                                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                                            }}
                                            maxSize={FILE_LIMITS.RESUME_MAX_SIZE}
                                            onDrop={setResumeFile}
                                            files={resumeFile}
                                            onRemove={() => setResumeFile([])}
                                            disabled={resumeMutation.isPending}
                                        />
                                        <p className="text-xs text-[var(--text-muted)]">
                                            Accepted formats: PDF, DOC, DOCX
                                        </p>
                                        {resumeFile.length > 0 && (
                                            <Button onClick={handleUploadResume} isLoading={resumeMutation.isPending}>
                                                <Upload className="mr-1.5 h-4 w-4" /> Upload Resume
                                            </Button>
                                        )}
                                    </div>
                                </Card>

                                {/* Generate Resume from Profile */}
                                <Card header={<h2 className="text-lg font-semibold text-[var(--text)]">Generate Resume</h2>}>
                                    <div className="space-y-4">
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            Generate a professionally formatted PDF resume from your profile information.
                                            Make sure your profile details (experience, education, skills) are up to date before generating.
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => generateResumeMutation.mutate()}
                                            isLoading={generateResumeMutation.isPending}
                                        >
                                            {generateResumeMutation.isPending ? (
                                                <>
                                                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-1.5 h-4 w-4" /> Generate Resume from Profile
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeSection === 'preferences' && (
                            <PreferencesSection form={form} updateField={updateField} />
                        )}

                        {activeSection === 'social' && (
                            <SocialSection form={form} updateField={updateField} />
                        )}

                        {/* Save Button (bottom) */}
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

function ResumeParserSection({
    form,
    updateField,
}: {
    form: UpdateCandidateRequest;
    updateField: <K extends keyof UpdateCandidateRequest>(key: K, value: UpdateCandidateRequest[K]) => void;
}) {
    const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
    const [showParsed, setShowParsed] = useState(false);

    const { data: existingParsed } = useQuery({
        queryKey: ['candidate', 'parsed-resume'],
        queryFn: () => candidateService.getParsedResumeData(),
    });

    useEffect(() => {
        if (existingParsed?.data) {
            setParsedData(existingParsed.data);
        }
    }, [existingParsed]);

    const parseMutation = useMutation({
        mutationFn: () => candidateService.parseResume(),
        onSuccess: () => {
            showToast.success('Resume parsing started! This may take a moment.');
            setTimeout(() => {
                setParsedData(null);
                setShowParsed(true);
            }, 2000);
        },
        onError: (err) => {
            const error = err as unknown as ApiError;
            showToast.error(error.message || 'Failed to parse resume');
        },
    });

    const applyField = (field: string, value: unknown) => {
        switch (field) {
            case 'skills':
                updateField('skills', value as string[]);
                showToast.success('Skills applied to profile');
                break;
            case 'experience':
                updateField('experience', (value as ParsedResumeData['experience']).map(exp => ({
                    company: exp.company,
                    role: exp.role,
                    startDate: exp.startDate || '',
                    endDate: exp.endDate || undefined,
                    description: exp.description || undefined,
                })));
                showToast.success('Experience applied to profile');
                break;
            case 'education':
                updateField('education', (value as ParsedResumeData['education']).map(edu => ({
                    institution: edu.institution,
                    degree: edu.degree,
                    field: edu.field || '',
                    startDate: edu.startDate || '',
                    endDate: edu.endDate || undefined,
                })));
                showToast.success('Education applied to profile');
                break;
            case 'certifications':
                updateField('certifications', (value as string[]).map(name => ({
                    name,
                    issuer: '',
                })));
                showToast.success('Certifications applied to profile');
                break;
        }
    };

    const applyAll = () => {
        if (!parsedData) return;
        if (parsedData.skills.length) applyField('skills', parsedData.skills);
        if (parsedData.experience.length) applyField('experience', parsedData.experience);
        if (parsedData.education.length) applyField('education', parsedData.education);
        if (parsedData.certifications.length) applyField('certifications', parsedData.certifications);
        showToast.success('All parsed data applied to profile!');
    };

    return (
        <Card header={
            <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-[var(--text)]">AI Resume Parser</h2>
            </div>
        }>
            <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                    Use AI to extract information from your uploaded resume and auto-fill your profile fields.
                </p>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => parseMutation.mutate()}
                        isLoading={parseMutation.isPending}
                    >
                        <Brain className="mr-1.5 h-4 w-4" />
                        {parsedData ? 'Re-parse Resume' : 'Parse with AI'}
                    </Button>

                    {parsedData && (
                        <Button onClick={applyAll}>
                            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Apply All to Profile
                        </Button>
                    )}
                </div>

                {parsedData && (
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => setShowParsed(!showParsed)}
                            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                            <ChevronDown className={`h-4 w-4 transition-transform ${showParsed ? 'rotate-180' : ''}`} />
                            {showParsed ? 'Hide' : 'Show'} Parsed Results
                        </button>

                        {showParsed && (
                            <div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                                {parsedData.name && (
                                    <div>
                                        <p className="text-xs font-medium uppercase text-[var(--text-muted)]">Name</p>
                                        <p className="text-sm text-[var(--text)]">{parsedData.name}</p>
                                    </div>
                                )}

                                {parsedData.email && (
                                    <div>
                                        <p className="text-xs font-medium uppercase text-[var(--text-muted)]">Email</p>
                                        <p className="text-sm text-[var(--text)]">{parsedData.email}</p>
                                    </div>
                                )}

                                {parsedData.summary && (
                                    <div>
                                        <p className="text-xs font-medium uppercase text-[var(--text-muted)]">Summary</p>
                                        <p className="text-sm text-[var(--text)]">{parsedData.summary}</p>
                                    </div>
                                )}

                                {parsedData.skills.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-medium uppercase text-[var(--text-muted)]">
                                                Skills ({parsedData.skills.length})
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => applyField('skills', parsedData.skills)}
                                                className="text-xs font-medium text-primary hover:underline"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {parsedData.skills.map((skill) => (
                                                <span key={skill} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {parsedData.experience.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-medium uppercase text-[var(--text-muted)]">
                                                Experience ({parsedData.experience.length})
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => applyField('experience', parsedData.experience)}
                                                className="text-xs font-medium text-primary hover:underline"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                        <div className="mt-1 space-y-2">
                                            {parsedData.experience.map((exp, i) => (
                                                <div key={i} className="rounded border border-[var(--border)] bg-white p-2">
                                                    <p className="text-sm font-medium text-[var(--text)]">{exp.role}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        {exp.company}
                                                        {exp.startDate && ` | ${exp.startDate}`}
                                                        {exp.endDate && ` - ${exp.endDate}`}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {parsedData.education.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-medium uppercase text-[var(--text-muted)]">
                                                Education ({parsedData.education.length})
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => applyField('education', parsedData.education)}
                                                className="text-xs font-medium text-primary hover:underline"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                        <div className="mt-1 space-y-2">
                                            {parsedData.education.map((edu, i) => (
                                                <div key={i} className="rounded border border-[var(--border)] bg-white p-2">
                                                    <p className="text-sm font-medium text-[var(--text)]">{edu.degree}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        {edu.institution}
                                                        {edu.field && ` - ${edu.field}`}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {parsedData.certifications.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-medium uppercase text-[var(--text-muted)]">
                                                Certifications ({parsedData.certifications.length})
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => applyField('certifications', parsedData.certifications)}
                                                className="text-xs font-medium text-primary hover:underline"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                        <ul className="mt-1 space-y-1">
                                            {parsedData.certifications.map((cert, i) => (
                                                <li key={i} className="text-sm text-[var(--text)]">• {cert}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}
