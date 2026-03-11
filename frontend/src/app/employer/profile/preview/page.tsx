'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Globe,
  Calendar,
  ShieldCheck,
  Mail,
  Phone,
  User,
  Linkedin,
  ExternalLink,
  Heart,
  Trophy,
  Cpu,
  Quote,
  Camera,
  Rocket,
  Eye,
  Target,
  Gem,
  Handshake,
  Youtube,
  Instagram,
  Facebook,
  Play,
  TrendingUp,
  DollarSign,
  Briefcase,
  BookOpen,
  Home,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { employerService } from '@/services/employer.service';
import { QUERY_KEYS } from '@/constants/config';
import { ROUTES } from '@/constants/routes';
import { FUNDING_STAGE_LABELS } from '@/constants/enums';
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
            <Button variant="ghost" size="sm" onClick={() => router.push(ROUTES.EMPLOYER.PROFILE)} tooltip="Back to edit profile">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Edit
            </Button>
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Profile Preview — This is how candidates see your company
            </span>
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
        ) : company ? (
          <>
            {/* Cover Image Banner */}
            {company.coverImage && (
              <div className="relative h-64 w-full overflow-hidden rounded-xl">
                <img
                  src={company.coverImage}
                  alt={`${company.companyName} cover`}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

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
                    <div className="bg-primary-light flex h-28 w-28 items-center justify-center rounded-xl">
                      <Building2 className="text-primary h-12 w-12" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-[var(--text)]">
                        {company.companyName}
                      </h1>
                      {company.isVerified ? (
                        <Badge variant="success" size="sm">
                          <ShieldCheck className="mr-1 h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Not Verified
                        </Badge>
                      )}
                    </div>
                    {company.tagline && (
                      <p className="mt-0.5 text-base text-[var(--text-secondary)]">
                        {company.tagline}
                      </p>
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
                        {company.employeeCount
                          ? ` (${company.employeeCount.toLocaleString()})`
                          : ''}
                      </span>
                    )}
                    {(company.headquarters || company.city) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />{' '}
                        {company.headquarters ||
                          [company.city, company.state].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {company.foundedYear && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Founded {company.foundedYear}
                      </span>
                    )}
                    {company.numberOfOffices && (
                      <span className="flex items-center gap-1">
                        <Home className="h-4 w-4" /> {company.numberOfOffices}{' '}
                        {company.numberOfOffices === 1 ? 'office' : 'offices'}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {company.companyType && (
                      <Badge variant="neutral" size="sm">
                        {company.companyType.replace(/_/g, ' ')}
                      </Badge>
                    )}
                    {company.parentCompany && (
                      <Badge variant="neutral" size="sm">
                        Subsidiary of {company.parentCompany}
                      </Badge>
                    )}
                    {company.stockTicker && (
                      <Badge variant="neutral" size="sm">
                        <TrendingUp className="mr-1 h-3 w-3" /> {company.stockTicker}
                      </Badge>
                    )}
                  </div>

                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Visit company website"
                      className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />{' '}
                      {company.website.replace(/^https?:\/\//, '')}
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
                    <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--text-secondary)]">
                      {company.description}
                    </p>
                  )}
                  {company.whyWorkForUs && (
                    <div>
                      <h3 className="mb-1 text-sm font-semibold text-[var(--text)]">
                        Why Work With Us
                      </h3>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--text-secondary)]">
                        {company.whyWorkForUs}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Company Video */}
            {company.companyVideoUrl && (
              <Card
                header={
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-[var(--error)]" />
                    <h2 className="text-lg font-semibold text-[var(--text)]">Company Video</h2>
                  </div>
                }
              >
                <a
                  href={company.companyVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Watch company video"
                  className="text-primary inline-flex items-center gap-2 text-sm hover:underline"
                >
                  <Play className="h-4 w-4" /> Watch our company video
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Card>
            )}

            {/* Mission & Vision */}
            {(company.missionStatement || company.visionStatement) && (
              <div className="grid gap-6 sm:grid-cols-2">
                {company.missionStatement && (
                  <Card
                    header={
                      <div className="flex items-center gap-2">
                        <Target className="text-primary h-5 w-5" />
                        <h2 className="text-lg font-semibold text-[var(--text)]">Mission</h2>
                      </div>
                    }
                  >
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                      {company.missionStatement}
                    </p>
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
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                      {company.visionStatement}
                    </p>
                  </Card>
                )}
              </div>
            )}

            {/* Culture & Values */}
            {(company.companyCulture ||
              (company.coreValues && company.coreValues.length > 0) ||
              company.diversityStatement) && (
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
                    <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--text-secondary)]">
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
                            className="bg-primary-light text-primary inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium"
                          >
                            <Gem className="mr-1.5 h-3.5 w-3.5" /> {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {company.diversityStatement && (
                    <div>
                      <h3 className="mb-1 text-sm font-semibold text-[var(--text)]">
                        Diversity & Inclusion
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {company.diversityStatement}
                      </p>
                    </div>
                  )}
                  {company.employeeResourceGroups && company.employeeResourceGroups.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">
                        Employee Resource Groups
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {company.employeeResourceGroups.map((erg) => (
                          <Badge key={erg} variant="neutral" size="sm">
                            {erg}
                          </Badge>
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
                <div className="space-y-6">
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

                  {/* Structured Perks by Category */}
                  {company.structuredPerks && company.structuredPerks.length > 0 && (
                    <div className="space-y-4">
                      {company.structuredPerks.map((cat) => (
                        <div key={cat.category}>
                          <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">
                            {cat.category}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {cat.perks.map((perk) => (
                              <span
                                key={perk}
                                className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)]"
                              >
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--success)]" />
                                {perk}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Structured Perks standalone (when no flat benefits) */}
            {(!company.benefits || company.benefits.length === 0) &&
              company.structuredPerks &&
              company.structuredPerks.length > 0 && (
                <Card
                  header={
                    <div className="flex items-center gap-2">
                      <Handshake className="h-5 w-5 text-[var(--success)]" />
                      <h2 className="text-lg font-semibold text-[var(--text)]">Perks</h2>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    {company.structuredPerks.map((cat) => (
                      <div key={cat.category}>
                        <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">
                          {cat.category}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {cat.perks.map((perk) => (
                            <span
                              key={perk}
                              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)]"
                            >
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--success)]" />
                              {perk}
                            </span>
                          ))}
                        </div>
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
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                      Products & Services
                    </h2>
                  </div>
                }
              >
                <div className="flex flex-wrap gap-2">
                  {company.productsServices.map((ps) => (
                    <Badge key={ps} variant="neutral" size="sm">
                      {ps}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Tech Stack */}
            {company.techStack && company.techStack.length > 0 && (
              <Card
                header={
                  <div className="flex items-center gap-2">
                    <Cpu className="text-primary h-5 w-5" />
                    <h2 className="text-lg font-semibold text-[var(--text)]">Tech Stack</h2>
                  </div>
                }
              >
                <div className="flex flex-wrap gap-2">
                  {company.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="bg-primary-light text-primary inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Interview Process */}
            {company.interviewProcess && (
              <Card
                header={
                  <h2 className="text-lg font-semibold text-[var(--text)]">Interview Process</h2>
                }
              >
                <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--text-secondary)]">
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
                    <div
                      key={i}
                      className="flex gap-3 rounded-lg border border-[var(--border)] p-4"
                    >
                      {leader.imageUrl ? (
                        <img
                          src={leader.imageUrl}
                          alt={leader.name}
                          className="h-12 w-12 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
                          <User className="h-6 w-6 text-[var(--text-muted)]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="truncate font-semibold text-[var(--text)]">
                            {leader.name}
                          </h3>
                          {leader.linkedinUrl && (
                            <a href={leader.linkedinUrl} target="_blank" rel="noopener noreferrer" title="View LinkedIn profile">
                              <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">{leader.designation}</p>
                        {leader.bio && (
                          <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                            {leader.bio}
                          </p>
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
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                      Employee Testimonials
                    </h2>
                  </div>
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {company.employeeTestimonials.map((testimonial, i) => (
                    <div key={i} className="rounded-lg border border-[var(--border)] p-4">
                      <p className="text-sm text-[var(--text-secondary)] italic">
                        &ldquo;{testimonial.quote}&rdquo;
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        {testimonial.imageUrl ? (
                          <img
                            src={testimonial.imageUrl}
                            alt={testimonial.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
                            <User className="h-4 w-4 text-[var(--text-muted)]" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-[var(--text)]">
                            {testimonial.name}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {[testimonial.designation, testimonial.department]
                              .filter(Boolean)
                              .join(' · ')}
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
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                      Awards & Recognitions
                    </h2>
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

            {/* Funding & Investors */}
            {(company.fundingStage ||
              company.totalFundingRaised ||
              company.annualRevenueRange ||
              (company.investors && company.investors.length > 0)) && (
              <Card
                header={
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[var(--success)]" />
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                      Funding & Investors
                    </h2>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                    {company.fundingStage && (
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium text-[var(--text)]">Stage:</span>{' '}
                        {FUNDING_STAGE_LABELS[company.fundingStage] || company.fundingStage}
                      </span>
                    )}
                    {company.totalFundingRaised && (
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium text-[var(--text)]">Total Raised:</span>{' '}
                        {company.totalFundingRaised}
                      </span>
                    )}
                    {company.annualRevenueRange && (
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium text-[var(--text)]">Annual Revenue:</span>{' '}
                        {company.annualRevenueRange}
                      </span>
                    )}
                  </div>
                  {company.investors && company.investors.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Investors</h3>
                      <div className="flex flex-wrap gap-2">
                        {company.investors.map((investor) => (
                          <Badge key={investor} variant="neutral" size="sm">
                            {investor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Workplace Policies */}
            {company.workplacePolicies && Object.keys(company.workplacePolicies).length > 0 && (
              <Card
                header={
                  <div className="flex items-center gap-2">
                    <Briefcase className="text-primary h-5 w-5" />
                    <h2 className="text-lg font-semibold text-[var(--text)]">Workplace Policies</h2>
                  </div>
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(company.workplacePolicies).map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-[var(--border)] px-3 py-2">
                      <span className="text-sm font-medium text-[var(--text)]">
                        {key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (s) => s.toUpperCase())
                          .trim()}
                      </span>
                      <p className="text-sm text-[var(--text-secondary)]">{value}</p>
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
                    <div
                      key={i}
                      className="overflow-hidden rounded-lg border border-[var(--border)]"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Office photo'}
                        className="aspect-video w-full object-cover"
                      />
                      {(photo.caption || photo.location) && (
                        <div className="px-3 py-2">
                          {photo.caption && (
                            <p className="text-sm text-[var(--text)]">{photo.caption}</p>
                          )}
                          {photo.location && (
                            <p className="text-xs text-[var(--text-muted)]">
                              <MapPin className="mr-0.5 inline h-3 w-3" />
                              {photo.location}
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
            {((company.locations && company.locations.length > 0) || company.addressLine1) && (
              <Card
                header={
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[var(--error)]" />
                    <h2 className="text-lg font-semibold text-[var(--text)]">Office Locations</h2>
                  </div>
                }
              >
                <div className="space-y-4">
                  {company.addressLine1 && (
                    <div className="text-sm text-[var(--text-secondary)]">
                      <h3 className="mb-1 text-sm font-semibold text-[var(--text)]">
                        Primary Address
                      </h3>
                      <p>
                        {[
                          company.addressLine1,
                          company.addressLine2,
                          company.city,
                          company.state,
                          company.pincode,
                          company.country,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  )}
                  {company.locations && company.locations.length > 0 && (
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
                  )}
                </div>
              </Card>
            )}

            {/* Social Links */}
            {company.socialLinks && Object.values(company.socialLinks).some(Boolean) && (
              <Card
                header={
                  <div className="flex items-center gap-2">
                    <Globe className="text-primary h-5 w-5" />
                    <h2 className="text-lg font-semibold text-[var(--text)]">Social Links</h2>
                  </div>
                }
              >
                <div className="flex flex-wrap gap-3">
                  {company.socialLinks?.linkedin && (
                    <a
                      href={company.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Visit LinkedIn page"
                      className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                    >
                      <Linkedin className="h-4 w-4 text-[#0A66C2]" /> LinkedIn
                    </a>
                  )}
                  {company.socialLinks?.twitter && (
                    <a
                      href={company.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Visit Twitter/X page"
                      className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                    >
                      <ExternalLink className="h-4 w-4" /> Twitter/X
                    </a>
                  )}
                  {company.socialLinks?.facebook && (
                    <a
                      href={company.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Visit Facebook page"
                      className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                    >
                      <Facebook className="h-4 w-4 text-[#1877F2]" /> Facebook
                    </a>
                  )}
                  {company.socialLinks?.instagram && (
                    <a
                      href={company.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Visit Instagram page"
                      className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                    >
                      <Instagram className="h-4 w-4 text-[#E1306C]" /> Instagram
                    </a>
                  )}
                  {company.socialLinks?.youtube && (
                    <a
                      href={company.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Visit YouTube channel"
                      className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                    >
                      <Youtube className="h-4 w-4 text-[#FF0000]" /> YouTube
                    </a>
                  )}
                  {company.socialLinks?.glassdoor && (
                    <a
                      href={company.socialLinks.glassdoor}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Visit Glassdoor page"
                      className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                    >
                      <ExternalLink className="h-4 w-4 text-[#0CAA41]" /> Glassdoor
                    </a>
                  )}
                  {company.careersPageUrl && (
                    <a
                      href={company.careersPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Visit careers page"
                      className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                    >
                      <ExternalLink className="text-primary h-4 w-4" /> Careers Page
                    </a>
                  )}
                  {company.blogUrl && (
                    <a
                      href={company.blogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Visit company blog"
                      className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                    >
                      <BookOpen className="h-4 w-4 text-[var(--warning)]" /> Blog
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
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                      Contact Information
                    </h2>
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
                          <span className="text-[var(--text-muted)]">
                            {' '}
                            · {company.contactPersonDesignation}
                          </span>
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
              <Card
                header={
                  <h2 className="text-lg font-semibold text-[var(--text)]">CSR Initiatives</h2>
                }
              >
                <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--text-secondary)]">
                  {company.csrInitiatives}
                </p>
              </Card>
            )}

            {/* Specialties */}
            {company.specialties && company.specialties.length > 0 && (
              <Card
                header={<h2 className="text-lg font-semibold text-[var(--text)]">Specialties</h2>}
              >
                <div className="flex flex-wrap gap-2">
                  {company.specialties.map((spec) => (
                    <Badge key={spec} variant="neutral" size="sm">
                      {spec}
                    </Badge>
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
