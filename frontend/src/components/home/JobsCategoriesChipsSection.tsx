'use client';

/**
 * Section 1 — Jobs in Demand + Popular Categories chip widgets.
 *
 * Renders 12–13 chips in 2 rows. No section heading per the brief.
 * Each chip = title + icon. Click navigates the same way as the
 * header mega-menu and the footer mega-section (single source of
 * truth via `curatedHref`).
 *
 * Source mix:
 *   - Top 6 JOB_DEMAND entries (Fresher, Remote, WFH, Walk-in, …)
 *   - Top 7 JOB_CATEGORY entries (IT, Sales, Marketing, …)
 * Total 13 → fits cleanly into 2 rows of ~6–7 on desktop.
 */

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Building2,
  Code,
  Users,
  TrendingUp,
  Cpu,
  Headphones,
  Truck,
  Stethoscope,
  GraduationCap,
  HardHat,
  Factory,
  Globe,
  Zap,
  HomeIcon,
  Footprints,
  Moon,
  Clock,
  ShieldCheck,
  HeartHandshake,
  type LucideIcon,
} from 'lucide-react';
import { curatedService, type CuratedListing } from '@/services/curated.service';
import { curatedHref } from '@/lib/curated-href';

/** Maps slug → icon. Falls back to a generic icon for unmapped slugs. */
const ICON_BY_SLUG: Record<string, LucideIcon> = {
  // JOB_CATEGORY
  'it-jobs': Code,
  'sales-jobs': TrendingUp,
  'marketing-jobs': Globe,
  'data-science-jobs': Cpu,
  'engineering-jobs': HardHat,
  'hr-jobs': Users,
  'finance-jobs': Building2,
  'operations-jobs': Briefcase,
  'healthcare-jobs': Stethoscope,
  'teaching-jobs': GraduationCap,
  'bpo-jobs': Headphones,
  'logistics-jobs': Truck,
  // JOB_DEMAND
  'fresher-jobs': Zap,
  'mnc-jobs': Building2,
  'remote-jobs': Globe,
  'work-from-home': HomeIcon,
  'walk-in': Footprints,
  'part-time': Clock,
  'women-jobs': HeartHandshake,
  'full-time': Briefcase,
  'night-shift': Moon,
  internship: GraduationCap,
  contract: ShieldCheck,
  freelance: Factory,
};

function pickIcon(slug: string): LucideIcon {
  return ICON_BY_SLUG[slug] ?? Briefcase;
}

interface Props {
  /** Hard cap on chips rendered. Default = 13. */
  limit?: number;
  className?: string;
}

export default function JobsCategoriesChipsSection({ limit = 13, className }: Props) {
  const { data } = useQuery({
    queryKey: ['curated-menu-home-section1'],
    queryFn: () => curatedService.menu(),
    staleTime: 10 * 60 * 1000,
  });

  const demand = (data?.JOB_DEMAND ?? []) as CuratedListing[];
  const categories = (data?.JOB_CATEGORY ?? []) as CuratedListing[];

  // Mix: ~6 demand + ~7 category, capped at `limit`.
  const demandCount = Math.min(demand.length, Math.floor(limit / 2));
  const categoryCount = Math.min(categories.length, limit - demandCount);
  const items: CuratedListing[] = [
    ...demand.slice(0, demandCount),
    ...categories.slice(0, categoryCount),
  ].slice(0, limit);

  if (items.length === 0) return null;

  return (
    <section
      aria-label="Popular job categories"
      className={`mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 ${className ?? ''}`}
    >
      <ul
        role="list"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7"
      >
        {items.map((item) => {
          const Icon = pickIcon(item.slug);
          return (
            <li key={item.id} role="listitem">
              <Link
                href={curatedHref(item)}
                className="group flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:shadow-md"
              >
                <span className="text-primary flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)]/10 transition-colors group-hover:bg-[var(--primary)]/20">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="line-clamp-2 text-xs font-semibold text-[var(--text)] sm:text-sm">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
