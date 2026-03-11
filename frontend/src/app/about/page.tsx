import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Lightbulb, ShieldCheck, Heart, Award, Linkedin, Twitter } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import StatsSection from '@/components/common/StatsSection';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about Talent Bridge — our mission to connect talent with opportunity across India. Meet our team and discover our values.',
  keywords: ['about talent bridge', 'job portal India', 'recruitment platform', 'our mission'],
};

const values = [
  {
    icon: Lightbulb,
    title: 'Innovation',
    description:
      'We continuously push the boundaries of recruitment technology, leveraging AI-powered matching and smart search to create better outcomes for candidates and employers alike.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust',
    description:
      'Every company on our platform is verified, and every interaction is secured. We believe trust is the foundation of meaningful professional connections.',
  },
  {
    icon: Heart,
    title: 'Inclusion',
    description:
      'We are committed to building a platform where everyone has equal access to opportunities, regardless of background, gender, location, or experience level.',
  },
  {
    icon: Award,
    title: 'Excellence',
    description:
      'From the quality of our job listings to the responsiveness of our support team, we strive for excellence in every aspect of the TalentBridge experience.',
  },
];

const team = [
  {
    name: 'Arjun Mehta',
    role: 'Chief Executive Officer',
    bio: 'Former VP at Naukri.com with 15+ years in HR tech. Passionate about democratizing access to career opportunities across India.',
  },
  {
    name: 'Priya Sharma',
    role: 'Chief Technology Officer',
    bio: 'Ex-Google engineer with deep expertise in AI/ML and distributed systems. Leads the engineering team building the next generation of recruitment technology.',
  },
  {
    name: 'Rohan Kapoor',
    role: 'Head of Product',
    bio: 'Product leader with experience at LinkedIn and Flipkart. Obsessed with building intuitive, user-first experiences that solve real problems.',
  },
  {
    name: 'Ananya Reddy',
    role: 'Head of Design',
    bio: 'Award-winning designer who previously led design at Swiggy. Champions accessible, beautiful design that makes complex workflows feel effortless.',
  },
];

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="from-primary-50 relative overflow-hidden bg-gradient-to-br via-white to-[var(--accent-light)]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl">
              About <span className="text-primary">TalentBridge</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-secondary)] sm:text-xl">
              We are on a mission to transform how India hires. By bridging the gap between
              exceptional talent and forward-thinking companies, we are building a future where
              every professional finds work that matters.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">Our Mission</h2>
              <p className="mt-6 text-lg leading-relaxed text-[var(--text-secondary)]">
                At TalentBridge, we believe that the right job can change a life, and the right hire
                can transform a business. Our mission is to connect talent with opportunity across
                India, making the recruitment process smarter, faster, and more equitable for
                everyone involved.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
                Founded in 2024, we set out to solve the inefficiencies that plague traditional
                hiring. From AI-powered job matching to verified employer profiles, every feature we
                build is designed to create meaningful connections between candidates and companies.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
                Whether you are a fresh graduate looking for your first opportunity or a seasoned
                professional seeking your next challenge, TalentBridge is here to help you take the
                next step in your career journey.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8 sm:p-12">
              <blockquote className="text-lg leading-relaxed text-[var(--text-secondary)] italic">
                &ldquo;We envision an India where geography, background, and connections no longer
                determine career outcomes. TalentBridge exists to level the playing field and let
                merit shine.&rdquo;
              </blockquote>
              <div className="mt-6">
                <p className="font-semibold text-[var(--text)]">Arjun Mehta</p>
                <p className="text-sm text-[var(--text-muted)]">CEO & Co-Founder, TalentBridge</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-[var(--border)] bg-[var(--bg-secondary)] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
              Our Impact in Numbers
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
              Growing every day as more professionals and companies trust TalentBridge
            </p>
          </div>
          <StatsSection variant="card" />
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">Our Values</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
              The principles that guide everything we do at TalentBridge
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="hover:border-primary/30 rounded-xl border border-[var(--border)] bg-white p-6 transition-all hover:shadow-md"
              >
                <div className="bg-primary-light mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                  <value.icon className="text-primary h-6 w-6" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-[var(--text)]">{value.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-[var(--bg-secondary)] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">Meet Our Team</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
              The people behind TalentBridge, working to reshape hiring in India
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-xl border border-[var(--border)] bg-white p-6 text-center transition-shadow hover:shadow-md"
              >
                <div className="bg-primary-light mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                  <span className="text-primary text-2xl font-bold">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[var(--text)]">{member.name}</h3>
                <p className="text-primary mt-1 text-sm font-medium">{member.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {member.bio}
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <span className="hover:bg-primary-light hover:text-primary flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors">
                    <Linkedin className="h-4 w-4" />
                  </span>
                  <span className="hover:bg-primary-light hover:text-primary flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors">
                    <Twitter className="h-4 w-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Join Our Growing Community</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Be part of India&apos;s fastest-growing talent platform. Whether you are looking for
            your next role or your next hire, TalentBridge is the place to start.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Tooltip content="Create your free TalentBridge account">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="text-primary bg-white hover:bg-white/90"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Get Started Free
                </Button>
              </Link>
            </Tooltip>
            <Tooltip content="Get in touch with our team">
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Contact Us
                </Button>
              </Link>
            </Tooltip>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
