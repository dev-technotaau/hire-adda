import { formatPaise } from '@/types/billing';
import { ArrowRight } from 'lucide-react';

interface UpgradeQuote {
  fromPlanName: string;
  toPlanName: string;
  unusedValuePaise: number;
  upgradeChargePaise: number;
  carryForward: Record<string, number>;
  newValidityDays: number;
  taxBreakdown?: { cgstPaise: number; sgstPaise: number; igstPaise: number };
}

interface Props {
  quote: UpgradeQuote;
}

export default function UpgradePreview({ quote }: Props) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
      <div className="flex items-center gap-3 text-base font-medium text-[var(--text)]">
        <span>{quote.fromPlanName}</span>
        <ArrowRight className="text-[var(--text-secondary)]" size={16} />
        <span>{quote.toPlanName}</span>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-[var(--text-secondary)]">Unused credit (pro-rated)</dt>
          <dd className="font-medium text-emerald-700 dark:text-emerald-400">
            − {formatPaise(quote.unusedValuePaise)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-[var(--border)] pt-3">
          <dt className="font-semibold text-[var(--text)]">Upgrade charge</dt>
          <dd className="text-lg font-bold text-[var(--text)]">
            {formatPaise(quote.upgradeChargePaise)}
          </dd>
        </div>
        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
          <dt>New validity</dt>
          <dd>{quote.newValidityDays} days</dd>
        </div>
      </dl>

      {Object.keys(quote.carryForward).length > 0 ? (
        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <h4 className="text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
            Credits carried forward
          </h4>
          <ul className="mt-2 space-y-1 text-sm">
            {Object.entries(quote.carryForward).map(([unit, qty]) => (
              <li key={unit} className="flex justify-between">
                <span className="text-[var(--text)]">{unit.replace(/_/g, ' ')}</span>
                <span className="font-medium text-[var(--text)]">+ {qty}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
