'use client';

import { Plus, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SuggestionInput from '@/components/onboarding/SuggestionInput';
import Select, { type SelectOption } from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import {
  COURSE_TYPE_LABELS,
  GRADE_TYPE_LABELS,
  EDUCATION_LEVEL_LABELS,
  SPECIFIC_DEGREE_LABELS,
} from '@/constants/enums';
import {
  INSTITUTION_SUGGESTIONS,
  DEGREE_SUGGESTIONS,
  FIELD_OF_STUDY_SUGGESTIONS,
} from '@/constants/suggestions';
import type { ProfileSectionProps } from './types';
import type { EducationEntry, UpdateCandidateRequest } from '@/types/candidate';

function toSelectOptions(labels: Record<string, string>): SelectOption[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

export default function EducationSection({ form, updateField }: ProfileSectionProps) {
  const addEducation = () => {
    const newEd: EducationEntry = { institution: '', degree: '', field: '', startDate: '' };
    updateField('education', [...(form.education || []), newEd]);
  };

  const updateEducation = (index: number, updates: Partial<EducationEntry>) => {
    const updated = [...(form.education || [])];
    updated[index] = { ...updated[index], ...updates };
    updateField('education', updated);
  };

  const removeEducation = (index: number) => {
    updateField(
      'education',
      (form.education || []).filter((_, i) => i !== index),
    );
  };

  return (
    <Card
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text)]">Education</h2>
          <Button size="sm" variant="outline" onClick={addEducation}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Education Summary */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Highest Education Level"
            options={toSelectOptions(EDUCATION_LEVEL_LABELS)}
            value={form.highestEducationLevel || ''}
            onChange={(v) =>
              updateField(
                'highestEducationLevel',
                v as UpdateCandidateRequest['highestEducationLevel'],
              )
            }
            placeholder="Select level"
          />
          <Select
            label="Highest Degree"
            options={toSelectOptions(SPECIFIC_DEGREE_LABELS)}
            value={form.highestDegree || ''}
            onChange={(v) =>
              updateField('highestDegree', v as UpdateCandidateRequest['highestDegree'])
            }
            placeholder="Select degree"
          />
        </div>

        {(form.education || []).length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">
            No education entries. Click &quot;Add&quot; to add your education.
          </p>
        ) : (
          (form.education || []).map((edu, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-[var(--text)]">Education {i + 1}</h4>
                <button
                  onClick={() => removeEducation(i)}
                  className="text-[var(--error)] hover:text-[var(--error-dark)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <SuggestionInput
                  label="Institution"
                  value={edu.institution}
                  onChange={(val) => updateEducation(i, { institution: val })}
                  suggestions={INSTITUTION_SUGGESTIONS}
                  required
                />
                <SuggestionInput
                  label="Degree"
                  value={edu.degree}
                  onChange={(val) => updateEducation(i, { degree: val })}
                  suggestions={DEGREE_SUGGESTIONS}
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <SuggestionInput
                  label="Field of Study"
                  value={edu.field}
                  onChange={(val) => updateEducation(i, { field: val })}
                  suggestions={FIELD_OF_STUDY_SUGGESTIONS}
                  required
                />
                <DatePicker
                  label="Start Date"
                  mode="month"
                  value={edu.startDate}
                  onChange={(val) => updateEducation(i, { startDate: val })}
                  required
                />
                <DatePicker
                  label="End Date"
                  mode="month"
                  value={edu.endDate || ''}
                  onChange={(val) => updateEducation(i, { endDate: val })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Select
                  label="Course Type"
                  options={toSelectOptions(COURSE_TYPE_LABELS)}
                  value={edu.courseType || ''}
                  onChange={(v) =>
                    updateEducation(i, { courseType: v as EducationEntry['courseType'] })
                  }
                  placeholder="Select type"
                />
                <Input
                  label="Specialization"
                  value={edu.specialization || ''}
                  onChange={(e) => updateEducation(i, { specialization: e.target.value })}
                  placeholder="e.g. Machine Learning"
                />
                <Select
                  label="Grade Type"
                  options={toSelectOptions(GRADE_TYPE_LABELS)}
                  value={edu.gradeType || ''}
                  onChange={(v) =>
                    updateEducation(i, { gradeType: v as EducationEntry['gradeType'] })
                  }
                  placeholder="Select type"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Grade/GPA"
                  value={edu.grade || ''}
                  onChange={(e) => updateEducation(i, { grade: e.target.value })}
                />
                <Input
                  label="Activities"
                  value={edu.activities || ''}
                  onChange={(e) => updateEducation(i, { activities: e.target.value })}
                  placeholder="e.g. Student Council, Sports"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
