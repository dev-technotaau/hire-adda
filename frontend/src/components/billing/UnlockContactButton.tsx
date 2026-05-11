'use client';

import { useState } from 'react';
import { Mail, Phone, Lock, Sparkles, Crown } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { cvUnlockService, type UnlockResult } from '@/services/cv-unlock.service';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useUpgradeModal } from '@/components/billing/UpgradeModal';
import type { ApiError } from '@/types/api';

interface UnlockContactButtonProps {
  candidateId: string;
  /** When the button is rendered next to existing locked-state placeholders. */
  className?: string;
}

/**
 * Reveals candidate email + phone after consuming 1 CV_UNLOCK quota unit.
 *
 * Behaviour:
 *   - When `feature.cv_db_access` not present → "Unlock contact" button that
 *     opens the upgrade modal pre-filled for `feature.contact_details`.
 *   - When CV_UNLOCK remaining = 0 → similar locked button → upgrade modal
 *     pre-filled for `feature.cv_db_access` (top-up via a CV plan).
 *   - Else: button → backend POST → reveals contact (cached if already unlocked).
 *
 * Backend dedup: server returns `cached: true` if this employer has
 * unlocked this candidate before — no quota consumed.
 */
export default function UnlockContactButton({ candidateId, className }: UnlockContactButtonProps) {
  const { hasFeature, remaining, refetch } = useEntitlements();
  const upgrade = useUpgradeModal();
  const [revealed, setRevealed] = useState<UnlockResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noFeature = !hasFeature('feature.cv_db_access') && !hasFeature('feature.contact_details');
  const noQuota = remaining('CV_UNLOCK') === 0 && !revealed;

  if (noFeature || noQuota) {
    const featureForModal = noFeature ? 'feature.contact_details' : 'feature.cv_db_access';
    return (
      <div className={className}>
        <Button variant="primary" onClick={() => upgrade.open({ feature: featureForModal })}>
          <Crown className="mr-2 h-4 w-4" /> Unlock contact
          <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
            {noFeature ? 'Upgrade required' : 'Top up'}
          </span>
        </Button>
        {upgrade.modal}
      </div>
    );
  }

  if (revealed) {
    return (
      <Card padding="md" className={`border-green-300 bg-green-50 ${className ?? ''}`}>
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 flex-none text-green-700" />
          <div className="text-sm">
            <p className="font-semibold text-green-900">
              Contact unlocked{revealed.cached ? ' (already used)' : ''}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-green-900">
              <Mail className="h-3 w-3" />{' '}
              <a href={`mailto:${revealed.email}`} className="underline">
                {revealed.email}
              </a>
            </p>
            {revealed.phone && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-green-900">
                <Phone className="h-3 w-3" />{' '}
                <a href={`tel:${revealed.phone}`} className="underline">
                  {revealed.phone}
                </a>
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  async function unlock() {
    setBusy(true);
    setError(null);
    try {
      const result = await cvUnlockService.unlock(candidateId);
      setRevealed(result);
      // Refresh entitlements snapshot so quota indicators update without waiting for socket
      void refetch();
    } catch (err) {
      const apiErr = err as unknown as ApiError;
      setError(apiErr?.message ?? 'Failed to unlock');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <Button variant="primary" onClick={() => void unlock()} isLoading={busy} disabled={busy}>
        <Lock className="mr-2 h-4 w-4" /> Unlock contact
        <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
          1 unlock · {remaining('CV_UNLOCK')} left
        </span>
      </Button>
      {error && (
        <p className="mt-2 text-xs text-[var(--error)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
