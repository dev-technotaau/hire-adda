'use client';

/**
 * Big homepage-hero job search bar — keyword + location + experience +
 * prominent Search button. Submitting navigates to `/jobs?q=...` so
 * users land on the public listing page with their search pre-applied
 * and can refine further.
 *
 * Visual design mirrors the SearchBar already used in DashboardHeader
 * + /candidate/jobs (composed from `components/ui/SearchBar` +
 * ExperienceSelect) so authenticated users transitioning between
 * surfaces feel zero friction.
 */

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Briefcase } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Props {
  /** Override the destination URL prefix. Default `/jobs`. */
  destination?: string;
  className?: string;
}

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'Experience' },
  { value: '0-1', label: 'Fresher (0-1 yr)' },
  { value: '1-3', label: '1-3 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '5-8', label: '5-8 years' },
  { value: '8-12', label: '8-12 years' },
  { value: '12+', label: '12+ years' },
];

export default function HeroJobSearchBar({ destination = '/jobs', className }: Props) {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (keyword.trim()) sp.set('q', keyword.trim());
    if (location.trim()) sp.set('location', location.trim());
    if (experience) {
      // Translate "1-3" → experienceMin=1, "12+" → experienceMin=12
      if (experience.endsWith('+')) {
        sp.set('experienceMin', experience.slice(0, -1));
      } else {
        const [min, max] = experience.split('-');
        if (min) sp.set('experienceMin', min);
        if (max) sp.set('experienceMax', max);
      }
    }
    const qs = sp.toString();
    router.push(qs ? `${destination}?${qs}` : destination);
  };

  return (
    <form
      onSubmit={onSubmit}
      className={`flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-md sm:flex-row sm:items-center sm:gap-0 sm:p-1.5 ${className ?? ''}`}
    >
      {/* Keyword */}
      <div className="relative flex-1 sm:border-r sm:border-[var(--border)]">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          type="search"
          name="q"
          autoComplete="off"
          placeholder="Job title, skills, or company"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="h-12 w-full bg-transparent pr-3 pl-9 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
      </div>

      {/* Location */}
      <div className="relative flex-1 sm:border-r sm:border-[var(--border)]">
        <MapPin
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          type="search"
          name="location"
          autoComplete="off"
          placeholder="Location (e.g. Bengaluru, Remote)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-12 w-full bg-transparent pr-3 pl-9 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
      </div>

      {/* Experience */}
      <div className="relative flex-1 sm:max-w-[170px]">
        <Briefcase
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <select
          name="experience"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          className="h-12 w-full appearance-none bg-transparent pr-7 pl-9 text-sm text-[var(--text)] focus:outline-none"
        >
          {EXPERIENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="sm:ml-1"
        leftIcon={<Search className="h-4 w-4" />}
      >
        Search
      </Button>
    </form>
  );
}
