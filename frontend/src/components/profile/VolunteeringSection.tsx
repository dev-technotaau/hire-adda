'use client';

import { Plus, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import Textarea from '@/components/ui/Textarea';
import SuggestionInput from '@/components/onboarding/SuggestionInput';
import DatePicker from '@/components/ui/DatePicker';
import { COMPANY_NAME_SUGGESTIONS, VOLUNTEER_CAUSE_SUGGESTIONS } from '@/constants/suggestions';
import type { ProfileSectionProps } from './types';
import type { VolunteerEntry, ReferenceEntry } from '@/types/candidate';

export default function VolunteeringSection({ form, updateField }: ProfileSectionProps) {
  // Volunteering
  const addVolunteer = () =>
    updateField('volunteerExperience', [
      ...(form.volunteerExperience || []),
      { organization: '', role: '' },
    ]);
  const updateVolunteer = (index: number, updates: Partial<VolunteerEntry>) => {
    const updated = [...(form.volunteerExperience || [])];
    updated[index] = { ...updated[index], ...updates };
    updateField('volunteerExperience', updated);
  };
  const removeVolunteer = (index: number) =>
    updateField(
      'volunteerExperience',
      (form.volunteerExperience || []).filter((_, i) => i !== index),
    );

  // References
  const addReference = () => updateField('references', [...(form.references || []), { name: '' }]);
  const updateReference = (index: number, updates: Partial<ReferenceEntry>) => {
    const updated = [...(form.references || [])];
    updated[index] = { ...updated[index], ...updates };
    updateField('references', updated);
  };
  const removeReference = (index: number) =>
    updateField(
      'references',
      (form.references || []).filter((_, i) => i !== index),
    );

  return (
    <div className="space-y-6">
      {/* Volunteer Experience */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text)]">Volunteer Experience</h2>
            <Button size="sm" variant="outline" onClick={addVolunteer}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {(form.volunteerExperience || []).length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">
              No volunteer experience added yet.
            </p>
          ) : (
            (form.volunteerExperience || []).map((vol, i) => (
              <div key={i} className="space-y-3 rounded-lg border border-[var(--border)] p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[var(--text)]">Volunteer {i + 1}</h4>
                  <button
                    onClick={() => removeVolunteer(i)}
                    className="text-[var(--error)] hover:text-[var(--error-dark)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SuggestionInput
                    label="Organization"
                    value={vol.organization}
                    onChange={(val) => updateVolunteer(i, { organization: val })}
                    suggestions={COMPANY_NAME_SUGGESTIONS}
                    required
                  />
                  <Input
                    label="Role"
                    value={vol.role}
                    onChange={(e) => updateVolunteer(i, { role: e.target.value })}
                    required
                  />
                </div>
                <SuggestionInput
                  label="Cause"
                  value={vol.cause || ''}
                  onChange={(val) => updateVolunteer(i, { cause: val })}
                  suggestions={VOLUNTEER_CAUSE_SUGGESTIONS}
                  placeholder="e.g. Education, Environment"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <DatePicker
                    label="Start Date"
                    mode="month"
                    value={vol.startDate || ''}
                    onChange={(val) => updateVolunteer(i, { startDate: val })}
                  />
                  <DatePicker
                    label="End Date"
                    mode="month"
                    value={vol.endDate || ''}
                    onChange={(val) => updateVolunteer(i, { endDate: val })}
                    disabled={vol.isCurrent}
                    helperText={vol.isCurrent ? 'Present' : ''}
                  />
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={vol.isCurrent || false}
                    onChange={(e) =>
                      updateVolunteer(i, {
                        isCurrent: e.target.checked,
                        endDate: e.target.checked ? undefined : vol.endDate,
                      })
                    }
                    className="text-primary h-4 w-4 rounded border-[var(--border)]"
                  />
                  <span className="text-sm text-[var(--text)]">I currently volunteer here</span>
                </label>
                <Textarea
                  label="Description"
                  value={vol.description || ''}
                  onChange={(e) => updateVolunteer(i, { description: e.target.value })}
                  rows={2}
                />
              </div>
            ))
          )}
        </div>
      </Card>

      {/* References */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text)]">References</h2>
            <Button size="sm" variant="outline" onClick={addReference}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {(form.references || []).length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">
              No references added yet.
            </p>
          ) : (
            (form.references || []).map((ref, i) => (
              <div key={i} className="space-y-3 rounded-lg border border-[var(--border)] p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[var(--text)]">Reference {i + 1}</h4>
                  <button
                    onClick={() => removeReference(i)}
                    className="text-[var(--error)] hover:text-[var(--error-dark)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Name"
                    value={ref.name}
                    onChange={(e) => updateReference(i, { name: e.target.value })}
                    required
                  />
                  <Input
                    label="Designation"
                    value={ref.designation || ''}
                    onChange={(e) => updateReference(i, { designation: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Organization"
                    value={ref.organization || ''}
                    onChange={(e) => updateReference(i, { organization: e.target.value })}
                  />
                  <Input
                    label="Relationship"
                    value={ref.relationship || ''}
                    onChange={(e) => updateReference(i, { relationship: e.target.value })}
                    placeholder="e.g. Manager, Colleague"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Email"
                    type="email"
                    value={ref.email || ''}
                    onChange={(e) => updateReference(i, { email: e.target.value })}
                  />
                  <PhoneInput
                    label="Phone"
                    placeholder="9876543210"
                    value={ref.phone || ''}
                    onValueChange={(val) => updateReference(i, { phone: val })}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
