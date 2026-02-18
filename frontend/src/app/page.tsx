import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
    ArrowRight, Briefcase, Users, Building2, Shield, Search, MapPin,
    Star, Zap, Target, Bell, FileText, CheckCircle, Lock, Eye, Award,
    ChevronDown, Code, PenTool, BarChart3, Headphones, GraduationCap,
    Stethoscope, Megaphone, Truck, Clock, BadgeCheck, UserCheck,
    MessageSquare, Globe,
} from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import Button from '@/components/ui/Button';
import StatsSection from '@/components/common/StatsSection';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
    title: 'Talent Bridge — India\'s Leading Job Portal & Recruitment Platform',
    description:
        'Find your dream job or hire top talent. Connect with 10,000+ companies and 50,000+ candidates on India\'s fastest-growing AI-powered recruitment platform. Verified employers, smart matching, and quick apply.',
    keywords: [
        'jobs', 'careers', 'recruitment', 'hiring', 'job portal', 'India jobs',
        'talent bridge', 'job search', 'hire talent', 'AI recruitment',
    ],
    openGraph: {
        title: 'Talent Bridge — Find Your Dream Job',
        description:
            'Connect with top companies and discover opportunities that match your skills. AI-powered matching, verified employers, quick apply.',
        type: 'website',
        images: [{ url: '/images/og-home.png', width: 1200, height: 630, alt: 'TalentBridge Home' }],
    },
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TalentBridge',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://talentbridge.com',
    description: 'India\'s leading job portal and recruitment platform.',
    potentialAction: {
        '@type': 'SearchAction',
        target: {
            '@type': 'EntryPoint',
            urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || 'https://talentbridge.com'}/candidate/jobs?keyword={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
    },
};

// ---------------------------------------------------------------------------
// Static Data
// ---------------------------------------------------------------------------

const companyLogos = [
    { name: 'TCS', src: '/images/logos/tcs.svg' },
    { name: 'Infosys', src: '/images/logos/infosys.svg' },
    { name: 'Wipro', src: '/images/logos/wipro.svg' },
    { name: 'Flipkart', src: '/images/logos/flipkart.svg' },
    { name: 'Razorpay', src: '/images/logos/razorpay.svg' },
    { name: 'Swiggy', src: '/images/logos/swiggy.svg' },
    { name: 'Zerodha', src: '/images/logos/zerodha.svg' },
    { name: 'Freshworks', src: '/images/logos/freshworks.svg' },
];

const howItWorks = [
    {
        step: '1',
        title: 'Create Your Profile',
        description:
            'Sign up for free and build your professional profile with your skills, experience, and career preferences. Upload your resume for AI-powered parsing.',
        icon: Users,
    },
    {
        step: '2',
        title: 'Discover Opportunities',
        description:
            'Browse thousands of verified jobs or let our AI matching engine find the perfect opportunities tailored to your skills and aspirations.',
        icon: Search,
    },
    {
        step: '3',
        title: 'Get Hired',
        description:
            'Apply with a single click, connect with employers directly, track your applications in real-time, and land your dream job.',
        icon: Award,
    },
];

const features = [
    {
        icon: Target,
        title: 'AI-Powered Matching',
        description: 'Our machine learning engine analyzes your profile to recommend the most relevant opportunities with precision.',
    },
    {
        icon: BadgeCheck,
        title: 'Verified Employers',
        description: 'Every company undergoes a thorough verification process to ensure a safe and trustworthy platform.',
    },
    {
        icon: Zap,
        title: 'Quick Apply',
        description: 'Apply to multiple jobs with a single click using your saved profile and parsed resume.',
    },
    {
        icon: FileText,
        title: 'AI Resume Parsing',
        description: 'Upload your resume and our Document AI extracts skills, experience, and qualifications automatically.',
    },
    {
        icon: Bell,
        title: 'Smart Job Alerts',
        description: 'Get notified instantly when new jobs match your criteria via email, push, or WhatsApp.',
    },
    {
        icon: BarChart3,
        title: 'Career Analytics',
        description: 'Track profile views, application status, and compare salaries with detailed insights.',
    },
    {
        icon: Lock,
        title: 'Privacy & Security',
        description: 'Enterprise-grade security with CSRF protection, encrypted data, and full GDPR compliance.',
    },
    {
        icon: MessageSquare,
        title: 'Real-Time Chat',
        description: 'Connect instantly with employers and candidates through our built-in messaging platform.',
    },
];

const candidateBenefits = [
    'AI-powered job recommendations based on your skills and preferences',
    'One-click Quick Apply with your saved profile and resume',
    'Real-time application tracking and status updates',
    'Salary insights and career growth analytics',
    'Smart job alerts via email, push notifications, and WhatsApp',
    'Resume parsing powered by Google Document AI',
];

const employerBenefits = [
    'Post jobs and reach thousands of qualified candidates instantly',
    'AI-powered candidate matching and ranking',
    'Verified employer badge to build trust with candidates',
    'Advanced search filters with Elasticsearch integration',
    'Real-time analytics dashboard with hiring funnel metrics',
    'Webhook integrations with your existing ATS and tools',
];

const jobCategories = [
    { icon: Code, title: 'Technology & IT', count: '2,500+', color: 'bg-blue-50 text-blue-600' },
    { icon: BarChart3, title: 'Finance & Accounting', count: '1,200+', color: 'bg-emerald-50 text-emerald-600' },
    { icon: PenTool, title: 'Design & Creative', count: '800+', color: 'bg-purple-50 text-purple-600' },
    { icon: Megaphone, title: 'Marketing & Sales', count: '1,500+', color: 'bg-orange-50 text-orange-600' },
    { icon: Headphones, title: 'Customer Support', count: '900+', color: 'bg-pink-50 text-pink-600' },
    { icon: GraduationCap, title: 'Education & Training', count: '600+', color: 'bg-yellow-50 text-yellow-700' },
    { icon: Stethoscope, title: 'Healthcare & Pharma', count: '700+', color: 'bg-red-50 text-red-600' },
    { icon: Truck, title: 'Operations & Logistics', count: '500+', color: 'bg-teal-50 text-teal-600' },
];

const featuredJobs = [
    { title: 'Senior Full-Stack Developer', company: 'Razorpay', location: 'Bangalore, KA', type: 'Full-Time', salary: '18-28 LPA', posted: '2 days ago', initials: 'RZ' },
    { title: 'Product Designer', company: 'Swiggy', location: 'Bangalore, KA', type: 'Full-Time', salary: '15-22 LPA', posted: '1 day ago', initials: 'SW' },
    { title: 'Data Scientist', company: 'Flipkart', location: 'Bangalore, KA', type: 'Full-Time', salary: '20-30 LPA', posted: '3 days ago', initials: 'FK' },
    { title: 'DevOps Engineer', company: 'Freshworks', location: 'Chennai, TN', type: 'Full-Time', salary: '16-24 LPA', posted: '1 day ago', initials: 'FW' },
    { title: 'Marketing Manager', company: 'Zerodha', location: 'Bangalore, KA', type: 'Full-Time', salary: '14-20 LPA', posted: '4 days ago', initials: 'ZR' },
    { title: 'Frontend Engineer', company: 'PhonePe', location: 'Pune, MH', type: 'Remote', salary: '12-18 LPA', posted: '2 days ago', initials: 'PP' },
];

const testimonials = [
    {
        quote: 'TalentBridge\'s AI matching found me a role that perfectly aligned with my skills. I got 3 interview calls within the first week of signing up!',
        name: 'Kavitha Nair',
        role: 'Software Engineer',
        company: 'Now at Razorpay',
        rating: 5,
    },
    {
        quote: 'As an HR head, I\'ve tried many platforms. TalentBridge stands out with verified candidates, smart search, and real-time analytics. Our time-to-hire dropped by 40%.',
        name: 'Rajesh Iyer',
        role: 'Head of HR',
        company: 'Freshworks',
        rating: 5,
    },
    {
        quote: 'The Quick Apply feature and job alerts saved me hours every week. I landed my dream product role in just 3 weeks. Highly recommend!',
        name: 'Sneha Gupta',
        role: 'Product Manager',
        company: 'Now at PhonePe',
        rating: 5,
    },
];

const securityPoints = [
    { icon: Lock, title: 'End-to-End Encryption', description: 'All data is encrypted in transit and at rest using AES-256 encryption.' },
    { icon: Shield, title: 'GDPR & Data Privacy Compliant', description: 'Full compliance with data protection regulations. You control your data.' },
    { icon: UserCheck, title: 'Verified Employers Only', description: 'Every employer undergoes document verification before posting jobs.' },
    { icon: Eye, title: 'Transparent Data Practices', description: 'Clear privacy policy with full visibility into how your data is used.' },
];

const trustBadges = [
    { icon: Shield, value: '99.9%', label: 'Uptime SLA' },
    { icon: Lock, value: 'AES-256', label: 'Encryption Standard' },
    { icon: Globe, value: 'GDPR', label: 'Privacy Compliant' },
    { icon: CheckCircle, value: 'SOC 2', label: 'Security Certified' },
];

const faqs = [
    {
        question: 'Is TalentBridge free for job seekers?',
        answer: 'Yes, TalentBridge is completely free for job seekers. You can create a profile, search for jobs, apply to unlimited positions, and access career insights at no cost whatsoever.',
    },
    {
        question: 'How does the AI-powered job matching work?',
        answer: 'Our matching engine analyzes your profile, skills, experience, and preferences, then uses machine learning algorithms to rank and recommend jobs that best fit your career goals. The more you use the platform, the smarter the recommendations become.',
    },
    {
        question: 'Are all employers verified on the platform?',
        answer: 'Yes, every employer on TalentBridge undergoes a verification process that includes document checks and business validation. Verified employers display a blue badge on their profile, giving you confidence that the job listings are legitimate.',
    },
    {
        question: 'How can I post a job as an employer?',
        answer: 'Register as an employer, complete your company profile, and submit it for verification. Once verified, you can post jobs from your dashboard. We offer a free plan with up to 3 active job postings, and premium plans for unlimited access and advanced features.',
    },
    {
        question: 'What makes TalentBridge different from other job portals?',
        answer: 'TalentBridge combines AI-powered matching, verified employers, real-time analytics, and multi-channel notifications (email, push, WhatsApp) in one platform. Our focus on trust, technology, and user experience sets us apart from traditional job boards.',
    },
    {
        question: 'Can I track my application status in real-time?',
        answer: 'Absolutely. Your dashboard shows real-time status updates for every application you submit. You will also receive instant notifications via email, push, or WhatsApp when an employer views your profile, shortlists you, or schedules an interview.',
    },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function Home() {
    return (
        <PublicLayout>
            {/* Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* ================================================================
                SECTION 1: Hero (Enhanced)
            ================================================================ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary-100 via-white to-accent-light">
                {/* Decorative blobs */}
                <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
                    <div className="grid items-center gap-12 lg:grid-cols-2">
                        {/* Left: Text */}
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
                                <Zap className="h-3.5 w-3.5" /> #1 AI-Powered Job Portal in India
                            </span>

                            <h1 className="mt-6 text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl">
                                Find Your{' '}
                                <span className="text-primary">Dream Job</span>,{' '}
                                <br className="hidden sm:block" />
                                Build Your Future
                            </h1>

                            <p className="mt-6 max-w-xl text-lg text-[var(--text-secondary)] sm:text-xl">
                                Connect with top companies and discover opportunities that match your skills.
                                Whether you&apos;re hiring or looking for your next role, TalentBridge has you covered.
                            </p>

                            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
                                <Link href="/auth/register">
                                    <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                                        Get Started
                                    </Button>
                                </Link>
                                <Link href="/auth/register?role=employer">
                                    <Button variant="outline" size="lg">
                                        Post a Job
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust badges */}
                            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--text-muted)]">
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle className="h-4 w-4 text-[var(--success)]" /> 10,000+ Companies
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle className="h-4 w-4 text-[var(--success)]" /> 50,000+ Candidates
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Shield className="h-4 w-4 text-[var(--success)]" /> Verified & Secure
                                </span>
                            </div>
                        </div>

                        {/* Right: Hero illustration */}
                        <div className="hidden lg:block">
                            <Image
                                src="/images/hero-illustration.svg"
                                alt="TalentBridge platform preview"
                                width={600}
                                height={500}
                                className="w-full"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ================================================================
                SECTION 2: Stats (Card Variant)
            ================================================================ */}
            <section className="border-y border-[var(--border)] bg-white py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
                            Trusted by Thousands Across India
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
                            Growing every day as more professionals and companies choose TalentBridge
                        </p>
                    </div>
                    <StatsSection variant="card" />
                </div>
            </section>

            {/* ================================================================
                SECTION 3: Trusted By / Company Logos
            ================================================================ */}
            <section className="bg-[var(--bg-secondary)] py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <p className="mb-8 text-center text-sm font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Trusted by leading companies across India
                    </p>
                    <div className="grid grid-cols-2 items-center gap-8 sm:grid-cols-4 lg:grid-cols-8">
                        {companyLogos.map((logo) => (
                            <div key={logo.name} className="flex items-center justify-center">
                                <Image
                                    src={logo.src}
                                    alt={logo.name}
                                    width={120}
                                    height={40}
                                    className="h-8 w-auto opacity-40 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================================================================
                SECTION 4: How It Works (Improved)
            ================================================================ */}
            <section className="bg-white py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
                            Simple Process
                        </span>
                        <h2 className="mt-4 text-3xl font-bold text-[var(--text)] sm:text-4xl">
                            How TalentBridge Works
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
                            Get started in just three simple steps &mdash; whether you&apos;re looking for a job or hiring talent
                        </p>
                    </div>
                    <div className="relative grid gap-8 md:grid-cols-3">
                        {/* Connecting dashed line (desktop only) */}
                        <div className="absolute left-[16.67%] right-[16.67%] top-10 hidden h-0.5 border-t-2 border-dashed border-[var(--border)] md:block" />

                        {howItWorks.map((item) => (
                            <div key={item.step} className="relative text-center">
                                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-light shadow-sm">
                                    <item.icon className="h-9 w-9 text-primary" />
                                </div>
                                <span className="mb-2 inline-block rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-white">
                                    Step {item.step}
                                </span>
                                <h3 className="mb-3 text-xl font-semibold text-[var(--text)]">{item.title}</h3>
                                <p className="text-[var(--text-secondary)]">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================================================================
                SECTION 5: Features (Expanded to 8)
            ================================================================ */}
            <section className="bg-[var(--bg-secondary)] py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
                            Platform Features
                        </span>
                        <h2 className="mt-4 text-3xl font-bold text-[var(--text)] sm:text-4xl">
                            Why Choose TalentBridge?
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
                            Enterprise-grade tools and features for a seamless hiring experience
                        </p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="rounded-xl border border-[var(--border)] bg-white p-6 transition-all hover:border-primary/30 hover:shadow-md"
                            >
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                                    <feature.icon className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-[var(--text)]">{feature.title}</h3>
                                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================================================================
                SECTION 6: For Candidates / For Employers
            ================================================================ */}
            <section className="bg-white py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
                            Built for Everyone in the Hiring Journey
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
                            Whether you&apos;re looking for your next opportunity or your next great hire
                        </p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* For Candidates */}
                        <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-primary-50 to-white p-8 sm:p-10">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-light">
                                <Users className="h-7 w-7 text-primary" />
                            </div>
                            <h3 className="mb-2 text-2xl font-bold text-[var(--text)]">For Job Seekers</h3>
                            <p className="mb-6 text-[var(--text-secondary)]">
                                Everything you need to find and land your dream job
                            </p>
                            <ul className="mb-8 space-y-3">
                                {candidateBenefits.map((b) => (
                                    <li key={b} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                        {b}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/auth/register">
                                <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                                    Start Your Job Search
                                </Button>
                            </Link>
                        </div>

                        {/* For Employers */}
                        <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-accent-light to-white p-8 sm:p-10">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-accent-light">
                                <Building2 className="h-7 w-7 text-accent" />
                            </div>
                            <h3 className="mb-2 text-2xl font-bold text-[var(--text)]">For Employers</h3>
                            <p className="mb-6 text-[var(--text-secondary)]">
                                Powerful tools to find, evaluate, and hire the best talent
                            </p>
                            <ul className="mb-8 space-y-3">
                                {employerBenefits.map((b) => (
                                    <li key={b} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                                        {b}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/auth/register?role=employer">
                                <Button size="lg" className="bg-accent text-white hover:bg-accent-hover" rightIcon={<ArrowRight className="h-5 w-5" />}>
                                    Start Hiring Today
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================================================================
                SECTION 7: Popular Job Categories
            ================================================================ */}
            <section className="bg-[var(--bg-secondary)] py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
                            Popular Job Categories
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
                            Explore opportunities across India&apos;s fastest-growing industries
                        </p>
                    </div>
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                        {jobCategories.map((cat) => {
                            const [bgColor, textColor] = cat.color.split(' ');
                            return (
                                <Link
                                    href="/auth/register"
                                    key={cat.title}
                                    className="group rounded-xl border border-[var(--border)] bg-white p-5 transition-all hover:border-primary/30 hover:shadow-md"
                                >
                                    <div className={cn('mb-3 flex h-11 w-11 items-center justify-center rounded-lg', bgColor)}>
                                        <cat.icon className={cn('h-5 w-5', textColor)} />
                                    </div>
                                    <h3 className="font-semibold text-[var(--text)] transition-colors group-hover:text-primary">
                                        {cat.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-[var(--text-muted)]">{cat.count} jobs</p>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ================================================================
                SECTION 8: Featured Jobs Preview
            ================================================================ */}
            <section className="bg-white py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
                            <Briefcase className="h-3.5 w-3.5" /> Hot Openings
                        </span>
                        <h2 className="mt-4 text-3xl font-bold text-[var(--text)] sm:text-4xl">
                            Featured Job Opportunities
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
                            Discover handpicked roles from top companies across India
                        </p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {featuredJobs.map((job) => (
                            <div
                                key={job.title + job.company}
                                className="rounded-xl border border-[var(--border)] bg-white p-5 transition-all hover:border-primary/30 hover:shadow-md"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                                        <span className="text-sm font-bold text-primary">{job.initials}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-[var(--text)] line-clamp-1">{job.title}</h3>
                                        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{job.company}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="flex items-center gap-1 text-[var(--text-muted)]">
                                        <MapPin className="h-3.5 w-3.5" /> {job.location}
                                    </span>
                                    <span className="rounded-full bg-primary-light px-2 py-0.5 font-medium text-primary">
                                        {job.type}
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-[var(--text)]">{job.salary}</span>
                                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                        <Clock className="h-3 w-3" /> {job.posted}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-10 text-center">
                        <Link href="/auth/register">
                            <Button size="lg" variant="outline" rightIcon={<ArrowRight className="h-5 w-5" />}>
                                View All Jobs
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ================================================================
                SECTION 9: Testimonials
            ================================================================ */}
            <section className="bg-[var(--bg-secondary)] py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
                            What Our Users Say
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
                            Hear from professionals and employers who found success on TalentBridge
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {testimonials.map((t) => (
                            <div
                                key={t.name}
                                className="rounded-xl border border-[var(--border)] bg-white p-6 sm:p-8"
                            >
                                {/* Star rating */}
                                <div className="mb-4 flex gap-0.5">
                                    {Array.from({ length: t.rating }).map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-[var(--warning)] text-[var(--warning)]" />
                                    ))}
                                </div>
                                <blockquote className="leading-relaxed text-[var(--text-secondary)]">
                                    &ldquo;{t.quote}&rdquo;
                                </blockquote>
                                <div className="mt-6 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                                        <span className="text-sm font-bold text-primary">
                                            {t.name.split(' ').map((n) => n[0]).join('')}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--text)]">{t.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {t.role} &middot; {t.company}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================================================================
                SECTION 10: Security & Trust
            ================================================================ */}
            <section className="bg-white py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid items-center gap-12 lg:grid-cols-2">
                        {/* Left: Text */}
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success-light)] px-3 py-1 text-xs font-semibold text-[var(--success-dark)]">
                                <Shield className="h-3.5 w-3.5" /> Enterprise-Grade Security
                            </span>
                            <h2 className="mt-4 text-3xl font-bold text-[var(--text)] sm:text-4xl">
                                Your Data is Safe With Us
                            </h2>
                            <p className="mt-4 text-lg text-[var(--text-secondary)]">
                                TalentBridge is built with enterprise-level security from the ground up.
                                We protect your personal information and career data with industry-leading practices.
                            </p>
                            <ul className="mt-8 space-y-4">
                                {securityPoints.map((point) => (
                                    <li key={point.title} className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--success-light)]">
                                            <point.icon className="h-4 w-4 text-[var(--success)]" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-[var(--text)]">{point.title}</h4>
                                            <p className="text-sm text-[var(--text-secondary)]">{point.description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Right: Trust badges */}
                        <div className="grid grid-cols-2 gap-4">
                            {trustBadges.map((badge) => (
                                <div
                                    key={badge.label}
                                    className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center"
                                >
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                                        <badge.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="text-2xl font-bold text-[var(--text)]">{badge.value}</div>
                                    <div className="mt-1 text-xs text-[var(--text-muted)]">{badge.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ================================================================
                SECTION 11: FAQ
            ================================================================ */}
            <section className="bg-[var(--bg-secondary)] py-16 sm:py-24">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
                            Frequently Asked Questions
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
                            Got questions? We have answers. If you can&apos;t find what you&apos;re looking for,{' '}
                            <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
                        </p>
                    </div>
                    <div className="space-y-3">
                        {faqs.map((faq) => (
                            <details
                                key={faq.question}
                                className="group rounded-xl border border-[var(--border)] bg-white transition-shadow hover:shadow-sm"
                            >
                                <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 font-medium text-[var(--text)] [&::-webkit-details-marker]:hidden">
                                    {faq.question}
                                    <ChevronDown className="h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-180" />
                                </summary>
                                <div className="border-t border-[var(--border)] px-6 py-4">
                                    <p className="leading-relaxed text-[var(--text-secondary)]">{faq.answer}</p>
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================================================================
                SECTION 12: Final CTA
            ================================================================ */}
            <section className="bg-primary py-16 sm:py-20">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
                    <h2 className="text-3xl font-bold text-white sm:text-4xl">
                        Ready to Take the Next Step?
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
                        Join thousands of professionals and companies who trust TalentBridge
                        for smarter hiring and career growth.
                    </p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link href="/auth/register">
                            <Button
                                size="lg"
                                className="bg-white text-primary hover:bg-white/90"
                                rightIcon={<ArrowRight className="h-5 w-5" />}
                            >
                                Create Free Account
                            </Button>
                        </Link>
                        <Link href="/auth/register?role=employer">
                            <Button
                                variant="outline"
                                size="lg"
                                className="border-white/30 text-white hover:bg-white/10"
                            >
                                Hire Talent
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
