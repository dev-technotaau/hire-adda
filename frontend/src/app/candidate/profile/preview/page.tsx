'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, MapPin, Briefcase, GraduationCap, Mail, Phone,
    Globe, Github, Linkedin, Code, Award, BookOpen, Calendar,
    Building2, Clock, CheckCircle, ExternalLink, Languages,
    Trophy, Heart, FolderKanban, Palette,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';
import { candidateService } from '@/services/candidate.service';
import { QUERY_KEYS } from '@/constants/config';
import { ROUTES } from '@/constants/routes';
import type { CandidateProfile } from '@/types/candidate';

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export default function ProfilePreviewPage() {
    const router = useRouter();

    const { data: profileData, isLoading } = useQuery({
        queryKey: QUERY_KEYS.CANDIDATES.PROFILE,
        queryFn: () => candidateService.getProfile(),
    });

    const { data: completenessData } = useQuery({
        queryKey: QUERY_KEYS.CANDIDATES.COMPLETENESS,
        queryFn: () => candidateService.getCompleteness(),
    });

    const profile = profileData?.data as CandidateProfile | undefined;
    const completeness = completenessData?.data;

    return (
        <DashboardLayout requiredRole={['CANDIDATE']}>
            <div className="space-y-6">
                {/* Top Bar */}
                <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] p-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => router.push(ROUTES.CANDIDATE.PROFILE)}>
                            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Edit
                        </Button>
                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                            Profile Preview — This is how employers see your profile
                        </span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="space-y-6">
                        <Card><Skeleton variant="rect" height={200} /></Card>
                        <Card><Skeleton variant="rect" height={150} /></Card>
                        <Card><Skeleton variant="rect" height={200} /></Card>
                    </div>
                ) : profile ? (
                    <>
                        {/* Profile Header */}
                        <Card>
                            <div className="flex flex-col gap-6 sm:flex-row">
                                {/* Avatar */}
                                <div className="flex shrink-0 flex-col items-center gap-3">
                                    {profile.profileImage ? (
                                        <img
                                            src={profile.profileImage}
                                            alt={`${profile.user?.firstName || 'Candidate'}'s photo`}
                                            className="h-28 w-28 rounded-full border-4 border-[var(--bg-secondary)] object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary-light text-3xl font-bold text-primary">
                                            {profile.user?.firstName?.[0] || 'C'}
                                        </div>
                                    )}
                                    {completeness && (
                                        <div className="w-28">
                                            <ProgressBar
                                                value={completeness.score}
                                                color={completeness.score >= 80 ? 'success' : completeness.score >= 50 ? 'warning' : 'error'}
                                                size="sm"
                                            />
                                            <p className="mt-1 text-center text-xs text-[var(--text-muted)]">{completeness.score}% complete</p>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <h1 className="text-2xl font-bold text-[var(--text)]">
                                            {profile.user?.firstName} {profile.user?.lastName}
                                        </h1>
                                        {profile.headline && (
                                            <p className="mt-0.5 text-base text-[var(--text-secondary)]">{profile.headline}</p>
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
                                            </span>
                                        )}
                                        {profile.currentCompany && (
                                            <span className="flex items-center gap-1">
                                                <Building2 className="h-4 w-4" /> {profile.currentCompany}
                                            </span>
                                        )}
                                        {profile.noticePeriod && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" /> {profile.noticePeriod.replace(/_/g, ' ')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {profile.openToWork === 'ACTIVELY_LOOKING' && (
                                            <Badge variant="success" size="sm">Open to Work</Badge>
                                        )}
                                        {profile.openToWork === 'OPEN_TO_OFFERS' && (
                                            <Badge variant="info" size="sm">Open to Offers</Badge>
                                        )}
                                        {profile.user?.isEmailVerified && (
                                            <Badge variant="success" size="sm">
                                                <CheckCircle className="mr-1 h-3 w-3" /> Email Verified
                                            </Badge>
                                        )}
                                        {profile.user?.isMobileVerified && (
                                            <Badge variant="success" size="sm">
                                                <CheckCircle className="mr-1 h-3 w-3" /> Mobile Verified
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Contact */}
                                    <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
                                        {profile.user?.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail className="h-3.5 w-3.5" /> {profile.user.email}
                                            </span>
                                        )}
                                        {profile.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3.5 w-3.5" /> {profile.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* About / Bio */}
                        {profile.bio && (
                            <Card header={<h2 className="text-lg font-semibold text-[var(--text)]">About</h2>}>
                                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
                                    {profile.bio}
                                </p>
                            </Card>
                        )}

                        {/* Skills */}
                        {profile.skills.length > 0 && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Code className="h-5 w-5 text-primary" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Skills</h2>
                                    </div>
                                }
                            >
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((skill) => (
                                        <span
                                            key={skill}
                                            className="inline-flex items-center rounded-lg bg-primary-light px-3 py-1.5 text-sm font-medium text-primary"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Experience */}
                        {profile.experience && profile.experience.length > 0 && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-[var(--info)]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Experience</h2>
                                    </div>
                                }
                            >
                                <div className="space-y-6">
                                    {profile.experience.map((exp, i) => (
                                        <div key={i} className="relative border-l-2 border-[var(--border)] pl-6">
                                            <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-[var(--border)] bg-white" />
                                            <h3 className="font-semibold text-[var(--text)]">{exp.role}</h3>
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                {exp.company} {exp.location ? `· ${exp.location}` : ''}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {formatDate(exp.startDate)} — {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                                            </p>
                                            {exp.description && (
                                                <p className="mt-2 text-sm text-[var(--text-secondary)]">{exp.description}</p>
                                            )}
                                            {exp.keyAchievements && exp.keyAchievements.length > 0 && (
                                                <ul className="mt-2 list-inside list-disc text-sm text-[var(--text-secondary)]">
                                                    {exp.keyAchievements.map((a, j) => <li key={j}>{a}</li>)}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Education */}
                        {profile.education && profile.education.length > 0 && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5 text-[var(--warning)]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Education</h2>
                                    </div>
                                }
                            >
                                <div className="space-y-4">
                                    {profile.education.map((edu, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--warning-light)]">
                                                <GraduationCap className="h-5 w-5 text-[var(--warning)]" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-[var(--text)]">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</h3>
                                                <p className="text-sm text-[var(--text-secondary)]">{edu.institution}</p>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                                                    {edu.grade ? ` · ${edu.gradeType || 'Grade'}: ${edu.grade}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Certifications */}
                        {profile.certifications && profile.certifications.length > 0 && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Award className="h-5 w-5 text-[var(--success)]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Certifications</h2>
                                    </div>
                                }
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {profile.certifications.map((cert, i) => (
                                        <div key={i} className="rounded-lg border border-[var(--border)] p-3">
                                            <h3 className="font-medium text-[var(--text)]">{cert.name}</h3>
                                            <p className="text-sm text-[var(--text-secondary)]">{cert.issuer}</p>
                                            {cert.issueDate && (
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {formatDate(cert.issueDate)}
                                                    {cert.expiryDate && !cert.doesNotExpire ? ` — ${formatDate(cert.expiryDate)}` : ''}
                                                    {cert.doesNotExpire ? ' · No expiry' : ''}
                                                </p>
                                            )}
                                            {cert.url && (
                                                <a href={cert.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                                    <ExternalLink className="h-3 w-3" /> View
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Projects */}
                        {profile.projects && profile.projects.length > 0 && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <FolderKanban className="h-5 w-5 text-primary" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Projects</h2>
                                    </div>
                                }
                            >
                                <div className="space-y-4">
                                    {profile.projects.map((proj, i) => (
                                        <div key={i} className="rounded-lg border border-[var(--border)] p-4">
                                            <div className="flex items-start justify-between">
                                                <h3 className="font-semibold text-[var(--text)]">{proj.name}</h3>
                                                {proj.url && (
                                                    <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </div>
                                            {proj.description && (
                                                <p className="mt-1 text-sm text-[var(--text-secondary)]">{proj.description}</p>
                                            )}
                                            {proj.technologies && proj.technologies.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {proj.technologies.map((tech) => (
                                                        <span key={tech} className="rounded bg-[var(--bg-secondary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Publications & Patents */}
                        {((profile.publications && profile.publications.length > 0) || (profile.patents && profile.patents.length > 0)) && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-[#8B5CF6]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Publications & Patents</h2>
                                    </div>
                                }
                            >
                                <div className="space-y-3">
                                    {profile.publications?.map((pub, i) => (
                                        <div key={`pub-${i}`} className="rounded-lg border border-[var(--border)] p-3">
                                            <h3 className="font-medium text-[var(--text)]">{pub.title}</h3>
                                            {pub.publisher && <p className="text-sm text-[var(--text-secondary)]">{pub.publisher}</p>}
                                            {pub.publicationDate && <p className="text-xs text-[var(--text-muted)]">{formatDate(pub.publicationDate)}</p>}
                                        </div>
                                    ))}
                                    {profile.patents?.map((pat, i) => (
                                        <div key={`pat-${i}`} className="rounded-lg border border-[var(--border)] p-3">
                                            <h3 className="font-medium text-[var(--text)]">{pat.title}</h3>
                                            {pat.patentNumber && <p className="text-sm text-[var(--text-secondary)]">Patent #{pat.patentNumber}</p>}
                                            {pat.status && <Badge variant="info" size="sm">{pat.status}</Badge>}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Awards */}
                        {profile.awards && profile.awards.length > 0 && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-[var(--warning)]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Awards</h2>
                                    </div>
                                }
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {profile.awards.map((award, i) => (
                                        <div key={i} className="rounded-lg border border-[var(--border)] p-3">
                                            <h3 className="font-medium text-[var(--text)]">{award.title}</h3>
                                            {award.issuer && <p className="text-sm text-[var(--text-secondary)]">{award.issuer}</p>}
                                            {award.date && <p className="text-xs text-[var(--text-muted)]">{formatDate(award.date)}</p>}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Languages */}
                        {profile.languageProficiency && profile.languageProficiency.length > 0 && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Languages className="h-5 w-5 text-[var(--info)]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Languages</h2>
                                    </div>
                                }
                            >
                                <div className="flex flex-wrap gap-3">
                                    {profile.languageProficiency.map((lang, i) => (
                                        <div key={i} className="rounded-lg border border-[var(--border)] px-4 py-2 text-center">
                                            <p className="font-medium text-[var(--text)]">{lang.language}</p>
                                            <p className="text-xs text-[var(--text-muted)]">{lang.proficiency}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Social Links */}
                        {(profile.linkedinProfile || profile.githubProfile || profile.portfolioUrl) && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-primary" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Social Links</h2>
                                    </div>
                                }
                            >
                                <div className="flex flex-wrap gap-3">
                                    {profile.linkedinProfile && (
                                        <a href={profile.linkedinProfile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]">
                                            <Linkedin className="h-4 w-4 text-[#0A66C2]" /> LinkedIn
                                        </a>
                                    )}
                                    {profile.githubProfile && (
                                        <a href={profile.githubProfile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]">
                                            <Github className="h-4 w-4" /> GitHub
                                        </a>
                                    )}
                                    {profile.portfolioUrl && (
                                        <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]">
                                            <Globe className="h-4 w-4 text-primary" /> Portfolio
                                        </a>
                                    )}
                                    {profile.stackOverflowProfile && (
                                        <a href={profile.stackOverflowProfile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]">
                                            <Code className="h-4 w-4 text-[#F48024]" /> Stack Overflow
                                        </a>
                                    )}
                                    {profile.twitterProfile && (
                                        <a href={profile.twitterProfile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]">
                                            <ExternalLink className="h-4 w-4" /> Twitter/X
                                        </a>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Profile Score with suggestions */}
                        {completeness && completeness.sections.some(s => !s.completed) && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Improve Your Profile</h2>
                                    </div>
                                }
                            >
                                <div className="space-y-2">
                                    <p className="text-sm text-[var(--text-muted)]">
                                        Complete these sections to increase your visibility to employers:
                                    </p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {completeness.sections
                                            .filter(s => !s.completed)
                                            .map(section => (
                                                <div
                                                    key={section.name}
                                                    className="flex items-center gap-2 rounded-lg bg-[var(--warning-light)] px-3 py-2 text-sm text-[var(--warning-dark)]"
                                                >
                                                    <Palette className="h-4 w-4 shrink-0" />
                                                    {section.name}
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </Card>
                        )}
                    </>
                ) : null}
            </div>
        </DashboardLayout>
    );
}
