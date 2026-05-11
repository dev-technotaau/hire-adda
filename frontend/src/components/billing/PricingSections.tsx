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
      {sections.map(({ category, icon: Icon, description }) => {
        const list = (grouped.get(category) ?? []).sort(
          (a, b) => a.displayOrder - b.displayOrder || a.basePricePaise - b.basePricePaise,
        );
        if (list.length === 0) return null;
        return (
          <section
            key={category}
            id={category.toLowerCase()}
            className="px-4 py-12 sm:px-6 lg:px-8"
          >
            <div className="mx-auto max-w-7xl">
              <div className="mb-8 flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-4">
                <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text)]">
                    {PLAN_CATEGORY_LABELS[category]}
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">{description}</p>
                </div>
              </div>
              <div
                className={
                  list.length === 1
                    ? 'mx-auto grid max-w-md grid-cols-1 gap-6'
                    : list.length === 2
                      ? 'mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2'
                      : 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
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
