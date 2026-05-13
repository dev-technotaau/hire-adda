/**
 * Server-safe helpers for the social-links bento grid.
 *
 * Lives in a plain `.ts` module (no `'use client'`) so it can be
 * imported from BOTH server components (e.g. the public company-
 * detail page) AND client components (e.g. profile previews).
 * Without this split, Next.js 16 raises:
 *
 *   "Attempted to call companySocialLinks() from the server but
 *    companySocialLinks is on the client."
 *
 * Pure data shaping only — the visual grid component itself stays
 * in `SocialLinksBento.tsx` and continues to live behind `'use client'`.
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
