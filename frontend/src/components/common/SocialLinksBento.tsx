'use client';

/**
 * SocialLinksBento — bento-grid display of social / portfolio profile
 * links. Reusable for both candidate profiles (10 platforms via
 * dedicated columns: linkedinProfile, githubProfile, twitterProfile,
 * portfolioUrl, …) and employer profiles (single `socialLinks` JSON
 * field with linkedin / twitter / facebook / instagram / youtube /
 * glassdoor keys).
 *
 * The grid is an asymmetric bento (2 wide rows × 4 cols on lg, with
 * the primary platform spanning 2 cells). Each tile is colour-keyed
 * to the platform's brand. Tiles auto-hide when the URL is empty,
 * so the grid collapses gracefully on profiles with few links.
 *
 * Visual pattern:
 *   col-span-2 hero tile · two col-span-1 tiles · two col-span-1 tiles
 *   then a row of 4 col-span-1 tiles → varied, magazine-like layout.
 */

import {
  Linkedin,
  Github,
  Twitter,
  Globe,
  Code,
  Palette,
  Youtube,
  ExternalLink,
  Instagram,
  Facebook,
  Star,
  type LucideIcon,
} from 'lucide-react';

export interface SocialLink {
  /** Stable key — used for React reconciliation + sorting. */
  key: string;
  /** Display label rendered in the tile. */
  label: string;
  /** Absolute URL — opens in new tab. */
  url: string;
  /** lucide icon to render. */
  icon: LucideIcon;
  /** Brand colour (hex) — used as the tile accent. */
  brand: string;
  /** Width hint — bento grid uses these to vary tile sizes. */
  prominence: 'large' | 'small';
}

/**
 * Build the link list from a candidate-style profile shape (each
 * platform on its own column in the schema).
 */
export function candidateSocialLinks(profile: {
  linkedinProfile?: string | null;
  githubProfile?: string | null;
  portfolioUrl?: string | null;
  stackOverflowProfile?: string | null;
  twitterProfile?: string | null;
  personalBlogUrl?: string | null;
  dribbbleProfile?: string | null;
  behanceProfile?: string | null;
  mediumProfile?: string | null;
  youtubeChannel?: string | null;
}): SocialLink[] {
  const items: SocialLink[] = [];
  if (profile.linkedinProfile)
    items.push({
      key: 'linkedin',
      label: 'LinkedIn',
      url: profile.linkedinProfile,
      icon: Linkedin,
      brand: '#0A66C2',
      prominence: 'large',
    });
  if (profile.portfolioUrl)
    items.push({
      key: 'portfolio',
      label: 'Portfolio',
      url: profile.portfolioUrl,
      icon: Globe,
      brand: '#1E5CAF',
      prominence: 'large',
    });
  if (profile.githubProfile)
    items.push({
      key: 'github',
      label: 'GitHub',
      url: profile.githubProfile,
      icon: Github,
      brand: '#24292E',
      prominence: 'small',
    });
  if (profile.stackOverflowProfile)
    items.push({
      key: 'stackoverflow',
      label: 'Stack Overflow',
      url: profile.stackOverflowProfile,
      icon: Code,
      brand: '#F48024',
      prominence: 'small',
    });
  if (profile.twitterProfile)
    items.push({
      key: 'twitter',
      label: 'Twitter / X',
      url: profile.twitterProfile,
      icon: Twitter,
      brand: '#000000',
      prominence: 'small',
    });
  if (profile.dribbbleProfile)
    items.push({
      key: 'dribbble',
      label: 'Dribbble',
      url: profile.dribbbleProfile,
      icon: Palette,
      brand: '#EA4C89',
      prominence: 'small',
    });
  if (profile.behanceProfile)
    items.push({
      key: 'behance',
      label: 'Behance',
      url: profile.behanceProfile,
      icon: Palette,
      brand: '#1769FF',
      prominence: 'small',
    });
  if (profile.mediumProfile)
    items.push({
      key: 'medium',
      label: 'Medium',
      url: profile.mediumProfile,
      icon: ExternalLink,
      brand: '#000000',
      prominence: 'small',
    });
  if (profile.youtubeChannel)
    items.push({
      key: 'youtube',
      label: 'YouTube',
      url: profile.youtubeChannel,
      icon: Youtube,
      brand: '#FF0000',
      prominence: 'small',
    });
  if (profile.personalBlogUrl)
    items.push({
      key: 'blog',
      label: 'Blog',
      url: profile.personalBlogUrl,
      icon: ExternalLink,
      brand: '#6B7280',
      prominence: 'small',
    });
  return items;
}

/**
 * Build the link list from a company-style profile shape (single
 * `socialLinks` JSON field with named keys).
 */
export function companySocialLinks(
  socialLinks: Record<string, unknown> | null | undefined,
): SocialLink[] {
  if (!socialLinks || typeof socialLinks !== 'object') return [];
  const sl = socialLinks as Record<string, string | null | undefined>;
  const items: SocialLink[] = [];
  if (sl.linkedin)
    items.push({
      key: 'linkedin',
      label: 'LinkedIn',
      url: sl.linkedin,
      icon: Linkedin,
      brand: '#0A66C2',
      prominence: 'large',
    });
  if (sl.twitter)
    items.push({
      key: 'twitter',
      label: 'Twitter / X',
      url: sl.twitter,
      icon: Twitter,
      brand: '#000000',
      prominence: 'small',
    });
  if (sl.facebook)
    items.push({
      key: 'facebook',
      label: 'Facebook',
      url: sl.facebook,
      icon: Facebook,
      brand: '#1877F2',
      prominence: 'small',
    });
  if (sl.instagram)
    items.push({
      key: 'instagram',
      label: 'Instagram',
      url: sl.instagram,
      icon: Instagram,
      brand: '#E4405F',
      prominence: 'small',
    });
  if (sl.youtube)
    items.push({
      key: 'youtube',
      label: 'YouTube',
      url: sl.youtube,
      icon: Youtube,
      brand: '#FF0000',
      prominence: 'large',
    });
  if (sl.glassdoor)
    items.push({
      key: 'glassdoor',
      label: 'Glassdoor',
      url: sl.glassdoor,
      icon: Star,
      brand: '#0CAA41',
      prominence: 'small',
    });
  return items;
}

interface Props {
  links: SocialLink[];
  /** Optional heading rendered above the grid. */
  heading?: string;
  className?: string;
}

export default function SocialLinksBento({ links, heading, className }: Props) {
  if (!links || links.length === 0) return null;

  return (
    <section
      aria-label={heading ?? 'Social links'}
      className={`rounded-2xl border border-[var(--border)] bg-white p-5 ${className ?? ''}`}
    >
      {heading && (
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--text)]">
          <Globe className="text-primary h-4 w-4" />
          {heading}
        </h3>
      )}
      <ul
        role="list"
        className="grid auto-rows-[80px] grid-cols-2 gap-3 sm:grid-cols-4 lg:auto-rows-[88px]"
      >
        {links.map((link) => {
          const Icon = link.icon;
          // Bento sizing — `large` spans 2 cols on lg+, `small` is 1 col.
          // On mobile every tile is 1 col so the grid stays usable.
          const span = link.prominence === 'large' ? 'sm:col-span-2' : 'sm:col-span-1';
          return (
            <li key={link.key} role="listitem" className={`min-w-0 ${span}`}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${link.label} profile in a new tab`}
                title={`Visit ${link.label}`}
                className="group flex h-full w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                style={{
                  // Brand-coloured left border on hover for subtle accent.
                  borderLeftColor: link.brand,
                  borderLeftWidth: '3px',
                }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${link.brand}15`, color: link.brand }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text)]">{link.label}</p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {(() => {
                      try {
                        return new URL(link.url).hostname.replace(/^www\./, '');
                      } catch {
                        return link.url;
                      }
                    })()}
                  </p>
                </div>
                <ExternalLink className="h-3 w-3 shrink-0 text-[var(--text-muted)] transition-colors group-hover:text-[var(--text)]" />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
