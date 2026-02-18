'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Building2, MapPin, Users, Globe, Calendar,
    ShieldCheck, Mail, Phone, User, Linkedin, ExternalLink,
    Heart, Trophy, Cpu, Quote, Camera, Rocket, Eye, Target,
    Gem, Handshake, Youtube, Instagram, Facebook,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { employerService } from '@/services/employer.service';
import { QUERY_KEYS } from '@/constants/config';
import { ROUTES } from '@/constants/routes';
import type { CompanyProfile } from '@/types/employer';

export default function CompanyProfilePreviewPage() {
    const router = useRouter();

    const { data: companyData, isLoading } = useQuery({
        queryKey: QUERY_KEYS.EMPLOYERS.COMPANY,
        queryFn: () => employerService.getCompany(),
    });

    const company = companyData?.data as CompanyProfile | undefined;

    return (
        <DashboardLayout requiredRole={['EMPLOYER']}>
            <div className="space-y-6">
                {/* Top Bar */}
                <div className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] p-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => router.push(ROUTES.EMPLOYER.PROFILE)}>
                            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Edit
                        </Button>
                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                            Profile Preview — This is how candidates see your company
                        </span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="space-y-6">
                        <Card><Skeleton variant="rect" height={200} /></Card>
                        <Card><Skeleton variant="rect" height={150} /></Card>
                        <Card><Skeleton variant="rect" height={200} /></Card>
                    </div>
                ) : company ? (
                    <>
                        {/* Company Header */}
                        <Card>
                            <div className="flex flex-col gap-6 sm:flex-row">
                                {/* Logo */}
                                <div className="flex shrink-0 items-start">
                                    {company.logo ? (
                                        <img
                                            src={company.logo}
                                            alt={`${company.companyName} logo`}
                                            className="h-28 w-28 rounded-xl border-2 border-[var(--bg-secondary)] object-contain"
                                        />
                                    ) : (
                                        <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-primary-light">
                                            <Building2 className="h-12 w-12 text-primary" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-2xl font-bold text-[var(--text)]">{company.companyName}</h1>
                                            {company.isVerified && (
                                                <Badge variant="success" size="sm">
                                                    <ShieldCheck className="mr-1 h-3 w-3" /> Verified
                                                </Badge>
                                            )}
                                        </div>
                                        {company.tagline && (
                                            <p className="mt-0.5 text-base text-[var(--text-secondary)]">{company.tagline}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
                                        {company.industry && (
                                            <span className="flex items-center gap-1">
                                                <Building2 className="h-4 w-4" /> {company.industry}
                                                {company.subIndustry ? ` · ${company.subIndustry}` : ''}
                                            </span>
                                        )}
                                        {company.companySize && (
                                            <span className="flex items-center gap-1">
                                                <Users className="h-4 w-4" /> {company.companySize}
                                                {company.employeeCount ? ` (${company.employeeCount.toLocaleString()})` : ''}
                                            </span>
                                        )}
                                        {(company.headquarters || company.city) && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" /> {company.headquarters || [company.city, company.state].filter(Boolean).join(', ')}
                                            </span>
                                        )}
                                        {company.foundedYear && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" /> Founded {company.foundedYear}
                                            </span>
                                        )}
                                    </div>

                                    {company.companyType && (
                                        <Badge variant="neutral" size="sm">{company.companyType.replace(/_/g, ' ')}</Badge>
                                    )}

                                    {company.website && (
                                        <a
                                            href={company.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                        >
                                            <Globe className="h-3.5 w-3.5" /> {company.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* About */}
                        {(company.description || company.whyWorkForUs) && (
                            <Card header={<h2 className="text-lg font-semibold text-[var(--text)]">About</h2>}>
                                <div className="space-y-4">
                                    {company.description && (
                                        <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
                                            {company.description}
                                        </p>
                                    )}
                                    {company.whyWorkForUs && (
                                        <div>
                                            <h3 className="mb-1 text-sm font-semibold text-[var(--text)]">Why Work With Us</h3>
                                            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
                                                {company.whyWorkForUs}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Mission & Vision */}
                        {(company.missionStatement || company.visionStatement) && (
                            <div className="grid gap-6 sm:grid-cols-2">
                                {company.missionStatement && (
                                    <Card
                                        header={
                                            <div className="flex items-center gap-2">
                                                <Target className="h-5 w-5 text-primary" />
                                                <h2 className="text-lg font-semibold text-[var(--text)]">Mission</h2>
                                            </div>
                                        }
                                    >
                                        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{company.missionStatement}</p>
                                    </Card>
                                )}
                                {company.visionStatement && (
                                    <Card
                                        header={
                                            <div className="flex items-center gap-2">
                                                <Eye className="h-5 w-5 text-[var(--info)]" />
                                                <h2 className="text-lg font-semibold text-[var(--text)]">Vision</h2>
                                            </div>
                                        }
                                    >
                                        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{company.visionStatement}</p>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Culture & Values */}
                        {(company.companyCulture || (company.coreValues && company.coreValues.length > 0) || company.diversityStatement) && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Heart className="h-5 w-5 text-[var(--error)]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Culture & Values</h2>
                                    </div>
                                }
                            >
                                <div className="space-y-4">
                                    {company.companyCulture && (
                                        <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
                                            {company.companyCulture}
                                        </p>
                                    )}
                                    {company.coreValues && company.coreValues.length > 0 && (
                                        <div>
                                            <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Core Values</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {company.coreValues.map((value) => (
                                                    <span
                                                        key={value}
                                                        className="inline-flex items-center rounded-lg bg-primary-light px-3 py-1.5 text-sm font-medium text-primary"
                                                    >
                                                        <Gem className="mr-1.5 h-3.5 w-3.5" /> {value}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {company.diversityStatement && (
                                        <div>
                                            <h3 className="mb-1 text-sm font-semibold text-[var(--text)]">Diversity & Inclusion</h3>
                                            <p className="text-sm text-[var(--text-secondary)]">{company.diversityStatement}</p>
                                        </div>
                                    )}
                                    {company.employeeResourceGroups && company.employeeResourceGroups.length > 0 && (
                                        <div>
                                            <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Employee Resource Groups</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {company.employeeResourceGroups.map((erg) => (
                                                    <Badge key={erg} variant="neutral" size="sm">{erg}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Benefits & Perks */}
                        {company.benefits && company.benefits.length > 0 && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Handshake className="h-5 w-5 text-[var(--success)]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Benefits & Perks</h2>
                                    </div>
                                }
                            >
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {company.benefits.map((benefit) => (
                                        <div
                                            key={benefit}
                                            className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)]"
                                        >
                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--success)]" />
                                            {benefit}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Products & Services */}
                        {company.productsServices && company.productsServices.length > 0 && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Rocket className="h-5 w-5 text-[var(--warning)]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Products & Services</h2>
                                    </div>
                                }
                            >
                                <div className="flex flex-wrap gap-2">
                                    {company.productsServices.map((ps) => (
                                        <Badge key={ps} variant="neutral" size="sm">{ps}</Badge>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Tech Stack */}
                        {company.techStack && company.techStack.length > 0 && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Cpu className="h-5 w-5 text-primary" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Tech Stack</h2>
                                    </div>
                                }
                            >
                                <div className="flex flex-wrap gap-2">
                                    {company.techStack.map((tech) => (
                                        <span
                                            key={tech}
                                            className="inline-flex items-center rounded-lg bg-primary-light px-3 py-1.5 text-sm font-medium text-primary"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Interview Process */}
                        {company.interviewProcess && (
                            <Card header={<h2 className="text-lg font-semibold text-[var(--text)]">Interview Process</h2>}>
                                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
                                    {company.interviewProcess}
                                </p>
                            </Card>
                        )}

                        {/* Leadership Team */}
                        {company.leadershipTeam && company.leadershipTeam.length > 0 && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-[var(--info)]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Leadership Team</h2>
                                    </div>
                                }
                            >
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {company.leadershipTeam.map((leader, i) => (
                                        <div key={i} className="flex gap-3 rounded-lg border border-[var(--border)] p-4">
                                            {leader.imageUrl ? (
                                                <img src={leader.imageUrl} alt={leader.name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
                                            ) : (
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
                                                    <User className="h-6 w-6 text-[var(--text-muted)]" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1">
                                                    <h3 className="truncate font-semibold text-[var(--text)]">{leader.name}</h3>
                                                    {leader.linkedinUrl && (
                                                        <a href={leader.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                                            <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />
                                                        </a>
                                                    )}
                                                </div>
                                                <p className="text-sm text-[var(--text-secondary)]">{leader.designation}</p>
                                                {leader.bio && (
                                                    <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{leader.bio}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Employee Testimonials */}
                        {company.employeeTestimonials && company.employeeTestimonials.length > 0 && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Quote className="h-5 w-5 text-[#8B5CF6]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Employee Testimonials</h2>
                                    </div>
                                }
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {company.employeeTestimonials.map((testimonial, i) => (
                                        <div key={i} className="rounded-lg border border-[var(--border)] p-4">
                                            <p className="text-sm italic text-[var(--text-secondary)]">&ldquo;{testimonial.quote}&rdquo;</p>
                                            <div className="mt-3 flex items-center gap-3">
                                                {testimonial.imageUrl ? (
                                                    <img src={testimonial.imageUrl} alt={testimonial.name} className="h-8 w-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
                                                        <User className="h-4 w-4 text-[var(--text-muted)]" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-[var(--text)]">{testimonial.name}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        {[testimonial.designation, testimonial.department].filter(Boolean).join(' · ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Awards & Recognitions */}
                        {company.awardsRecognitions && company.awardsRecognitions.length > 0 && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-[var(--warning)]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Awards & Recognitions</h2>
                                    </div>
                                }
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {company.awardsRecognitions.map((award, i) => (
                                        <div key={i} className="rounded-lg border border-[var(--border)] p-3">
                                            <h3 className="font-medium text-[var(--text)]">{award.title}</h3>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {[award.issuer, award.year].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Office Photos */}
                        {company.officePhotos && company.officePhotos.length > 0 && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Camera className="h-5 w-5 text-[var(--info)]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Office Photos</h2>
                                    </div>
                                }
                            >
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {company.officePhotos.map((photo, i) => (
                                        <div key={i} className="overflow-hidden rounded-lg border border-[var(--border)]">
                                            <img src={photo.url} alt={photo.caption || 'Office photo'} className="aspect-video w-full object-cover" />
                                            {(photo.caption || photo.location) && (
                                                <div className="px-3 py-2">
                                                    {photo.caption && <p className="text-sm text-[var(--text)]">{photo.caption}</p>}
                                                    {photo.location && (
                                                        <p className="text-xs text-[var(--text-muted)]">
                                                            <MapPin className="mr-0.5 inline h-3 w-3" />{photo.location}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Locations */}
                        {company.locations && company.locations.length > 0 && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-[var(--error)]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Office Locations</h2>
                                    </div>
                                }
                            >
                                <div className="flex flex-wrap gap-2">
                                    {company.locations.map((loc) => (
                                        <span
                                            key={loc}
                                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)]"
                                        >
                                            <MapPin className="h-3.5 w-3.5" /> {loc}
                                        </span>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Social Links */}
                        {company.socialLinks && Object.values(company.socialLinks).some(Boolean) && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-primary" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Social Links</h2>
                                    </div>
                                }
                            >
                                <div className="flex flex-wrap gap-3">
                                    {company.socialLinks?.linkedin && (
                                        <a href={company.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]">
                                            <Linkedin className="h-4 w-4 text-[#0A66C2]" /> LinkedIn
                                        </a>
                                    )}
                                    {company.socialLinks?.twitter && (
                                        <a href={company.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]">
                                            <ExternalLink className="h-4 w-4" /> Twitter/X
                                        </a>
                                    )}
                                    {company.socialLinks?.facebook && (
                                        <a href={company.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]">
                                            <Facebook className="h-4 w-4 text-[#1877F2]" /> Facebook
                                        </a>
                                    )}
                                    {company.socialLinks?.instagram && (
                                        <a href={company.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]">
                                            <Instagram className="h-4 w-4 text-[#E1306C]" /> Instagram
                                        </a>
                                    )}
                                    {company.socialLinks?.youtube && (
                                        <a href={company.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]">
                                            <Youtube className="h-4 w-4 text-[#FF0000]" /> YouTube
                                        </a>
                                    )}
                                    {company.socialLinks?.glassdoor && (
                                        <a href={company.socialLinks.glassdoor} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]">
                                            <ExternalLink className="h-4 w-4 text-[#0CAA41]" /> Glassdoor
                                        </a>
                                    )}
                                    {company.careersPageUrl && (
                                        <a href={company.careersPageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]">
                                            <ExternalLink className="h-4 w-4 text-primary" /> Careers Page
                                        </a>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Contact Information */}
                        {(company.contactEmail || company.contactPhone || company.contactPersonName) && (
                            <Card
                                header={
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-5 w-5 text-[var(--info)]" />
                                        <h2 className="text-lg font-semibold text-[var(--text)]">Contact Information</h2>
                                    </div>
                                }
                            >
                                <div className="flex flex-wrap gap-6 text-sm text-[var(--text-secondary)]">
                                    {company.contactPersonName && (
                                        <span className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-[var(--text-muted)]" />
                                            <span>
                                                {company.contactPersonName}
                                                {company.contactPersonDesignation && (
                                                    <span className="text-[var(--text-muted)]"> · {company.contactPersonDesignation}</span>
                                                )}
                                            </span>
                                        </span>
                                    )}
                                    {company.contactEmail && (
                                        <span className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-[var(--text-muted)]" /> {company.contactEmail}
                                        </span>
                                    )}
                                    {company.contactPhone && (
                                        <span className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-[var(--text-muted)]" /> {company.contactPhone}
                                        </span>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* CSR Initiatives */}
                        {company.csrInitiatives && (
                            <Card header={<h2 className="text-lg font-semibold text-[var(--text)]">CSR Initiatives</h2>}>
                                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
                                    {company.csrInitiatives}
                                </p>
                            </Card>
                        )}

                        {/* Specialties */}
                        {company.specialties && company.specialties.length > 0 && (
                            <Card header={<h2 className="text-lg font-semibold text-[var(--text)]">Specialties</h2>}>
                                <div className="flex flex-wrap gap-2">
                                    {company.specialties.map((spec) => (
                                        <Badge key={spec} variant="neutral" size="sm">{spec}</Badge>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </>
                ) : null}
            </div>
        </DashboardLayout>
    );
}
