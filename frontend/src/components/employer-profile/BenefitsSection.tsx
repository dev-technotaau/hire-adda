import { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Tag from '@/components/ui/Tag';
import SuggestionInput from '@/components/onboarding/SuggestionInput';
import { BENEFIT_SUGGESTIONS } from '@/constants/suggestions';
import type { EmployerProfileSectionProps } from './types';

const QUICK_BENEFITS = [
  'Health Insurance',
  'Work From Home',
  'Flexible Hours',
  'Stock Options (ESOPs)',
  'Free Meals',
  'Paid Vacation',
];

export default function BenefitsSection({
  form,
  addToArray,
  removeFromArray,
}: EmployerProfileSectionProps) {
  const [benefitInput, setBenefitInput] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
          Benefits & Perks
        </label>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Add the benefits you offer to employees. Type to search or click the popular ones below.
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <SuggestionInput
              placeholder="e.g. Health Insurance"
              value={benefitInput}
              onChange={setBenefitInput}
              suggestions={BENEFIT_SUGGESTIONS}
              onSelect={(v) => addToArray('benefits', v, setBenefitInput)}
            />
          </div>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => addToArray('benefits', benefitInput, setBenefitInput)}
            disabled={!benefitInput.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick-add chips */}
      <div>
        <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Popular benefits</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_BENEFITS.map((benefit) => {
            const isAdded = (form.benefits || []).includes(benefit);
            return (
              <button
                key={benefit}
                type="button"
                onClick={() => !isAdded && addToArray('benefits', benefit, () => {})}
                disabled={isAdded}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isAdded
                    ? 'border-primary/30 bg-primary-light text-primary cursor-default'
                    : 'hover:border-primary hover:text-primary border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)]'
                }`}
              >
                + {benefit}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected benefits */}
      {(form.benefits || []).length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
            Added benefits ({(form.benefits || []).length})
          </p>
          <div className="flex flex-wrap gap-2">
            {(form.benefits || []).map((b) => (
              <Tag
                key={b}
                label={b}
                variant="primary"
                onRemove={() => removeFromArray('benefits', b)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
