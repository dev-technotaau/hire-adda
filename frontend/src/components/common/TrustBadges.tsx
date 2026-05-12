import Image from 'next/image';
import Tooltip from '@/components/ui/Tooltip';
import { Lock, ShieldCheck } from 'lucide-react';

/**
 * Compact trust + credibility row for the public footer + About page.
 *
 * Six tiles, each linking to a credible source where applicable:
 *   - Razorpay  — "Powered by Razorpay (PCI-DSS Level 1)"
 *   - PCI-DSS   — payment industry compliance
 *   - SSL/TLS   — "256-bit TLS / Secure"
 *   - GSTIN     — "GST Registered Business"
 *   - Make in India / MSME / Startup India — corporate credibility
 *
 * Uses the assets already shipped under /public/icons/payments/.
 * Designed to be visually quiet — small badges, no shouting copy.
 */

interface Badge {
  slug: string;
  label: string;
  helper: string;
  width: number;
  height: number;
  /**
   * Optional Tailwind height override for the rendered <Image>. Defaults
   * to `h-6 w-auto` (24 px tall). Badges whose SVG ships with thick
   * internal whitespace (PCI-DSS, SSL, GST, Udyam, Startup-India,
   * Make-in-India) need a taller render so the visible artwork fills
   * the 44 px tile like the Razorpay logo does.
   */
  imgClassName?: string;
}

// 36 px (h-9) inside a 44 px (h-11) tile = ~82% fill. The flagged SVGs
// have heavy internal whitespace, so anything smaller than this still
// reads as tiny no matter how wide the tile is.
const BADGE_IMG_CLASS_LARGE = 'h-9 w-auto';

const BADGES: Badge[] = [
  {
    slug: 'razorpay',
    label: 'Powered by Razorpay',
    helper: 'Secure payment processing — RBI-licensed PA',
    width: 100,
    height: 32,
  },
  {
    slug: 'pci-dss',
    label: 'PCI-DSS Level 1',
    helper: 'Card data is never stored on Hire Adda servers',
    width: 60,
    height: 32,
    imgClassName: BADGE_IMG_CLASS_LARGE,
  },
  {
    slug: 'ssl-secure',
    label: '256-bit TLS Encrypted',
    helper: 'Every payment + login secured by TLS 1.3',
    width: 56,
    height: 32,
    imgClassName: BADGE_IMG_CLASS_LARGE,
  },
  {
    slug: 'gstin-verified',
    label: 'GST Registered',
    helper: 'GSTIN-verified seller — tax invoice on every order',
    width: 56,
    height: 32,
    imgClassName: BADGE_IMG_CLASS_LARGE,
  },
  {
    slug: 'msme-udyam',
    label: 'MSME / Udyam Registered',
    helper: 'Recognised Indian small-business entity',
    width: 70,
    height: 32,
    imgClassName: BADGE_IMG_CLASS_LARGE,
  },
  {
    slug: 'startup-india',
    label: 'Startup India',
    helper: 'DPIIT-recognised startup',
    width: 80,
    height: 32,
    imgClassName: BADGE_IMG_CLASS_LARGE,
  },
  {
    slug: 'make-in-india',
    label: 'Make in India',
    helper: 'Built in Bharat, for Bharat',
    width: 80,
    height: 32,
    imgClassName: BADGE_IMG_CLASS_LARGE,
  },
];

interface Props {
  /** Compact removes the helper line; full shows the small italic byline. */
  variant?: 'full' | 'compact';
  className?: string;
}

export default function TrustBadges({ variant = 'full', className = '' }: Props) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {BADGES.map((b) => (
          <Tooltip key={b.slug} content={b.helper}>
            <span
              className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--border)] bg-white px-3 transition hover:border-[var(--text-muted)] hover:shadow-sm"
              aria-label={b.label}
            >
              <Image
                src={`/icons/payments/${b.slug}.svg`}
                alt={b.label}
                width={b.width}
                height={b.height}
                className={b.imgClassName ?? 'h-6 w-auto'}
                unoptimized
              />
            </span>
          </Tooltip>
        ))}
      </div>

      {variant === 'full' && (
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-center text-xs text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <Lock size={12} className="text-emerald-600" />
            256-bit TLS · PCI-DSS Level 1
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-emerald-600" />
            No card data stored on our servers
          </span>
        </p>
      )}
    </div>
  );
}
