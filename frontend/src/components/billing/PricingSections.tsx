import PlanCard from '@/components/billing/PlanCard';
import { PLAN_CATEGORY_LABELS, type Plan, type PlanCategory } from '@/types/billing';
import { Building2, GraduationCap, Headphones, Search, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface PricingSectionConfig {
  category: PlanCategory;
  icon: LucideIcon;
  description: string;
}

/** Default ordering + copy used by the full /pricing page. */
export const ALL_PRICING_SECTIONS: PricingSectionConfig[] = [
  {
    category: 'EMPLOYER_JOB_POST',
    icon: Building2,
    description: 'Post jobs and reach the right candidates fast.',
  },
  {
    category: 'EMPLOYER_CV_DATABASE',
    icon: Search,
    description: 'Search and unlock candidate CVs from the Talent Vault / HireDex database.',
  },
  {
    category: 'EMPLOYER_CV_ENTERPRISE_CUSTOM',
    icon: Search,
    description: 'Bespoke CV access for enterprise hiring teams.',
  },
  {
    category: 'EMPLOYER_ASSISTED_HIRING',
    icon: Headphones,
    description: 'Our team sources matching CVs for your role.',
  },
  {
    category: 'VENDOR_CONNECT',
    icon: Users,
    description: 'Recruitment partners — receive hiring requirements monthly.',
  },
  {
    category: 'CANDIDATE_PREMIUM',
    icon: GraduationCap,
    description: 'Boost your profile, get verified & stand out to recruiters.',
  },
];

/** Employer-only subset (excludes Vendor Connect + Candidate Premium). */
export const EMPLOYER_PRICING_SECTIONS: PricingSectionConfig[] = ALL_PRICING_SECTIONS.filter(
  (s) =>
    s.category === 'EMPLOYER_JOB_POST' ||
    s.category === 'EMPLOYER_CV_DATABASE' ||
    s.category === 'EMPLOYER_CV_ENTERPRISE_CUSTOM' ||
    s.category === 'EMPLOYER_ASSISTED_HIRING',
);

/** Candidate-only subset. */
export const CANDIDATE_PRICING_SECTIONS: PricingSectionConfig[] = ALL_PRICING_SECTIONS.filter(
  (s) => s.category === 'CANDIDATE_PREMIUM',
);

interface PricingSectionsProps {
  plans: Plan[];
  sections: PricingSectionConfig[];
  /** Adds `?upgrade=1` mode to PlanCard CTAs (used by upgrade flow). */
  upgradeMode?: boolean;
  /** Adds `?from=onboarding` mode for the post-employer-onboarding banner. */
  onboardingMode?: boolean;
}

export default function PricingSections({
  plans,
  sections,
  upgradeMode = false,
  onboardingMode = false,
}: PricingSectionsProps) {
  const grouped = new Map<PlanCategory, Plan[]>();
  for (const plan of plans) {
    const list = grouped.get(plan.category) ?? [];
    list.push(plan);
    grouped.set(plan.category, list);
  }

  return (
    <>
      {sections.map(({ category, icon: Icon, description }, sectionIndex) => {
        const list = (grouped.get(category) ?? []).sort(
          (a, b) => a.displayOrder - b.displayOrder || a.basePricePaise - b.basePricePaise,
        );
        if (list.length === 0) return null;
        // Alternate background between sections so adjacent groupings
        // read as distinct without needing visible dividers.
        const alternate = sectionIndex % 2 === 1;
        return (
          <section
            key={category}
            id={category.toLowerCase()}
            className={`px-4 py-14 sm:px-6 sm:py-16 lg:px-8 ${
              alternate ? 'bg-[var(--bg-secondary)]/40' : 'bg-white'
            }`}
          >
            <div className="mx-auto max-w-7xl">
              {/* Section header — centered icon chip, bold title, supporting line.
                  Centered layout reads cleaner across all viewport widths and
                  gives the card grid below a calmer anchor. */}
              <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
                <div className="bg-primary/10 text-primary ring-primary/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl ring-1">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
                  {PLAN_CATEGORY_LABELS[category]}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                  {description}
                </p>
              </header>

              {/* Card grid — keeps the same 1/2/3-col responsive behaviour
                  as before, but uses `items-stretch` + `pt-4` so the
                  highlighted-card scale doesn't visually clip the badge
                  ribbon at the top of taller cards. */}
              <div
                className={
                  list.length === 1
                    ? 'mx-auto grid max-w-md grid-cols-1 gap-6 pt-4'
                    : list.length === 2
                      ? 'mx-auto grid max-w-4xl grid-cols-1 items-stretch gap-6 pt-4 md:grid-cols-2'
                      : 'grid grid-cols-1 items-stretch gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3'
                }
              >
                {list.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    upgradeMode={upgradeMode}
                    onboardingMode={onboardingMode}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
