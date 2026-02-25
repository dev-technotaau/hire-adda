'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import SuggestionInput from '@/components/onboarding/SuggestionInput';
import Tag from '@/components/ui/Tag';
import { HOBBY_SUGGESTIONS, INTEREST_SUGGESTIONS } from '@/constants/suggestions';
import type { ProfileSectionProps } from './types';

export default function InterestsSection({ form, updateField }: ProfileSectionProps) {
  const [hobbyInput, setHobbyInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  const addHobby = (val: string) => {
    const current = form.hobbies || [];
    if (val.trim() && !current.includes(val.trim()))
      updateField('hobbies', [...current, val.trim()]);
  };
  const addInterest = (val: string) => {
    const current = form.interests || [];
    if (val.trim() && !current.includes(val.trim()))
      updateField('interests', [...current, val.trim()]);
  };

  return (
    <Card
      header={<h2 className="text-lg font-semibold text-[var(--text)]">Interests & Hobbies</h2>}
    >
      <div className="space-y-6">
        {/* Hobbies */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">Hobbies</h3>
          <SuggestionInput
            placeholder="Add a hobby..."
            value={hobbyInput}
            onChange={setHobbyInput}
            suggestions={HOBBY_SUGGESTIONS}
            onSelect={(val) => {
              addHobby(val);
              setHobbyInput('');
            }}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(form.hobbies || []).map((h) => (
              <Tag
                key={h}
                label={h}
                variant="primary"
                onRemove={() =>
                  updateField(
                    'hobbies',
                    (form.hobbies || []).filter((x) => x !== h),
                  )
                }
              />
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">Interests</h3>
          <SuggestionInput
            placeholder="Add an interest..."
            value={interestInput}
            onChange={setInterestInput}
            suggestions={INTEREST_SUGGESTIONS}
            onSelect={(val) => {
              addInterest(val);
              setInterestInput('');
            }}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(form.interests || []).map((i) => (
              <Tag
                key={i}
                label={i}
                variant="primary"
                onRemove={() =>
                  updateField(
                    'interests',
                    (form.interests || []).filter((x) => x !== i),
                  )
                }
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
