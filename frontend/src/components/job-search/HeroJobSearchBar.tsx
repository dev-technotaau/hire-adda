'use client';

/**
 * Homepage-hero job search bar — keyword + location + experience +
 * Search button. Built on the SAME primitives as the private candidate
 * dashboard / find-jobs page so authed and unauthed users get the
 * identical search experience:
 *
 *   - keyword       → `<SearchBar>` (Elasticsearch autosuggest dropdown,
 *                     search history when signed in, trending searches,
 *                     keyboard nav, debounced 250 ms — every feature the
 *                     candidate dashboard ships with)
 *   - location      → `<AutoSuggest>` driven by `useSuggestLocations`
 *                     with Popular Locations focus section + Recent
 *                     Locations focus section when signed in
 *   - experience    → `<ExperienceSelect>` with buckets + custom range
 *
 * Submitting navigates to `/jobs?q=&location=&experienceMin=&experienceMax=`
 * so users land on the public listing page with their filters applied.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import SearchBar from '@/components/ui/SearchBar';
import AutoSuggest, {
  type SuggestOption,
  type AdditionalSuggestSection,
} from '@/components/ui/AutoSuggest';
import ExperienceSelect, { type ExperienceValue } from '@/components/ui/ExperienceSelect';
import Button from '@/components/ui/Button';
import { useSuggestLocations } from '@/hooks/use-search';
import { useStaticSuggestions } from '@/hooks/use-suggestions';
import {
  useFieldHistory,
  useAddToFieldHistory,
  useClearFieldHistory,
} from '@/hooks/use-field-history';
import { useAuthStore } from '@/store/auth.store';
import type { AutocompleteResult } from '@/types/search';

interface Props {
  /** Override destination URL prefix. Default `/jobs`. */
  destination?: string;
  className?: string;
}

export default function HeroJobSearchBar({ destination = '/jobs', className }: Props) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  /* ---- state ---- */
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [experience, setExperience] = useState<ExperienceValue | null>(null);

  /* ---- location autosuggest (mirrors candidate/jobs/page.tsx) ---- */
  const { data: locationSuggestions, isLoading: isLoadingLocations } =
    useSuggestLocations(locationQuery);
  const { suggestions: popularLocations, isLoading: isLoadingPopular } = useStaticSuggestions(
    'location',
    8,
  );
  const { data: locationHistory } = useFieldHistory('location');
  const addLocationHistory = useAddToFieldHistory('location');
  const clearLocationHistory = useClearFieldHistory('location');

  const locationOptions: SuggestOption[] = useMemo(
    () =>
      (locationSuggestions?.data?.suggestions ?? []).map((s) => ({
        label: s.text,
        value: s.text,
        count: s.count,
      })),
    [locationSuggestions],
  );

  const locationFocusSections = useMemo(() => {
    const sections: AdditionalSuggestSection[] = [];
    const historyItems = locationHistory?.data?.history ?? [];
    if (isAuthenticated && historyItems.length > 0) {
      sections.push({
        label: 'Recent Locations',
        options: historyItems.map((h) => ({ label: h.value, value: h.value })),
        onClear: () => clearLocationHistory.mutate(),
      });
    }
    sections.push({
      label: 'Popular Locations',
      options: popularLocations.map((loc) => ({ label: loc, value: loc })),
      isLoading: isLoadingPopular,
    });
    return sections;
  }, [isAuthenticated, locationHistory, popularLocations, isLoadingPopular, clearLocationHistory]);

  /* ---- handlers ---- */
  function submit(opts?: { keyword?: string; location?: string }) {
    const kw = (opts?.keyword ?? keyword).trim();
    const loc = (opts?.location ?? location).trim();
    const sp = new URLSearchParams();
    if (kw) sp.set('q', kw);
    if (loc) {
      sp.set('location', loc);
      // Track in recent-locations history (only fires when signed in;
      // the mutation no-ops for guests).
      if (isAuthenticated) addLocationHistory.mutate(loc);
    }
    if (experience) {
      sp.set('experienceMin', String(experience.min));
      if (experience.max !== undefined) sp.set('experienceMax', String(experience.max));
    }
    const qs = sp.toString();
    router.push(qs ? `${destination}?${qs}` : destination);
  }

  function handleKeywordSearch(q: string) {
    setKeyword(q);
    submit({ keyword: q });
  }

  function handleKeywordSelect(item: AutocompleteResult) {
    setKeyword(item.text);
    submit({ keyword: item.text });
  }

  function handleLocationChange(v: string | string[]) {
    const val = Array.isArray(v) ? (v[0] ?? '') : v;
    setLocation(val);
  }

  return (
    <div
      className={`grid grid-cols-1 gap-2 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-md sm:grid-cols-[1.5fr_1fr_auto_auto] sm:items-stretch sm:gap-2 lg:grid-cols-[2fr_1.4fr_auto_auto] ${className ?? ''}`}
    >
      {/* Keyword — full-featured SearchBar (autosuggest, history, trending) */}
      <div className="min-w-0">
        <SearchBar
          placeholder="Job title, skills, or company"
          searchType="jobs"
          defaultValue={keyword}
          onSearch={handleKeywordSearch}
          onSelect={handleKeywordSelect}
          size="md"
          fullWidth
        />
      </div>

      {/* Location — AutoSuggest with ES suggestions + popular + recent (auth) */}
      <div className="min-w-0">
        <AutoSuggest
          placeholder="City or remote"
          value={location}
          onChange={handleLocationChange}
          suggestions={locationOptions}
          isLoading={isLoadingLocations}
          onInputChange={setLocationQuery}
          allowCreate
          createLabel={(q) => `Search in "${q}"`}
          minChars={2}
          inputSize="md"
          focusSections={locationFocusSections}
        />
      </div>

      {/* Experience — bucket picker with custom range */}
      <ExperienceSelect
        value={experience}
        onChange={setExperience}
        size="md"
        className="w-full sm:w-44"
      />

      {/* Submit */}
      <Button
        type="button"
        variant="primary"
        size="lg"
        leftIcon={<Search className="h-4 w-4" />}
        onClick={() => submit()}
      >
        Search
      </Button>
    </div>
  );
}
