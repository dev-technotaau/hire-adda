import { useState } from 'react';
import {
  Building2,
  Globe,
  Briefcase,
  Calendar,
  Users as UsersIcon,
  Plus,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import Input from '@/components/ui/Input';
import Select, { type SelectOption } from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Tag from '@/components/ui/Tag';
import SuggestionInput from '@/components/onboarding/SuggestionInput';
import { COMPANY_TYPE_LABELS } from '@/constants/enums';
import {
  INDUSTRY_SUGGESTIONS,
  SUB_INDUSTRY_SUGGESTIONS,
  SKILL_SUGGESTIONS,
} from '@/constants/suggestions';
import type { UpdateCompanyRequest } from '@/types/employer';
import type { EmployerProfileSectionProps } from './types';

function toSelectOptions(labels: Record<string, string>): SelectOption[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

const companySizeOptions: SelectOption[] = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001-5000', label: '1001-5000 employees' },
  { value: '5001-10000', label: '5001-10000 employees' },
  { value: '10000+', label: '10000+ employees' },
];

export default function CompanyInfoSection({
  form,
  updateField,
  addToArray,
  removeFromArray,
}: EmployerProfileSectionProps) {
  const [specialtyInput, setSpecialtyInput] = useState('');

  return (
    <div className="space-y-4">
      <Input
        label="Company Name"
        value={form.companyName || ''}
        onChange={(e) => updateField('companyName', e.target.value)}
        leftIcon={<Building2 className="h-4 w-4" />}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Company Type"
          options={toSelectOptions(COMPANY_TYPE_LABELS)}
          value={form.companyType || ''}
          onChange={(v) => updateField('companyType', v as UpdateCompanyRequest['companyType'])}
          placeholder="Select type"
        />
        <SuggestionInput
          label="Industry"
          placeholder="e.g. Information Technology"
          value={form.industry || ''}
          onChange={(v) => updateField('industry', v)}
          suggestions={INDUSTRY_SUGGESTIONS}
          onSelect={(v) => updateField('industry', v)}
          leftIcon={<Briefcase className="h-4 w-4" />}
          required
        />
      </div>
      <SuggestionInput
        label="Sub-Industry"
        placeholder="e.g. SaaS, AI/ML, Payments"
        value={form.subIndustry || ''}
        onChange={(v) => updateField('subIndustry', v)}
        suggestions={SUB_INDUSTRY_SUGGESTIONS}
        onSelect={(v) => updateField('subIndustry', v)}
      />

      {/* Specialties */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Specialties</label>
        <p className="mb-3 text-xs text-[var(--text-muted)]">Areas your company specializes in</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <SuggestionInput
              placeholder="e.g. Cloud Computing, DevOps"
              value={specialtyInput}
              onChange={setSpecialtyInput}
              suggestions={SKILL_SUGGESTIONS}
              onSelect={(v) => addToArray('specialties', v, setSpecialtyInput)}
            />
          </div>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => addToArray('specialties', specialtyInput, setSpecialtyInput)}
            disabled={!specialtyInput.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {(form.specialties || []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {(form.specialties || []).map((s) => (
              <Tag
                key={s}
                label={s}
                variant="primary"
                onRemove={() => removeFromArray('specialties', s)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Company Size"
          options={companySizeOptions}
          value={form.companySize || ''}
          onChange={(v) => updateField('companySize', v)}
          placeholder="Select size"
        />
        <Input
          label="Employee Count"
          type="number"
          placeholder="e.g. 250"
          value={form.employeeCount?.toString() || ''}
          onChange={(e) =>
            updateField('employeeCount', e.target.value ? Number(e.target.value) : undefined)
          }
          leftIcon={<UsersIcon className="h-4 w-4" />}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Number of Offices"
          type="number"
          placeholder="e.g. 5"
          value={form.numberOfOffices?.toString() || ''}
          onChange={(e) =>
            updateField('numberOfOffices', e.target.value ? Number(e.target.value) : undefined)
          }
          leftIcon={<MapPin className="h-4 w-4" />}
        />
        <Input
          label="Founded Year"
          type="number"
          placeholder="e.g. 2015"
          value={form.foundedYear?.toString() || ''}
          onChange={(e) =>
            updateField('foundedYear', e.target.value ? Number(e.target.value) : undefined)
          }
          leftIcon={<Calendar className="h-4 w-4" />}
        />
      </div>
      <Input
        label="Website"
        type="url"
        placeholder="https://www.company.com"
        leftIcon={<Globe className="h-4 w-4" />}
        value={form.website || ''}
        onChange={(e) => updateField('website', e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Parent Company"
          placeholder="e.g. Alphabet Inc."
          value={form.parentCompany || ''}
          onChange={(e) => updateField('parentCompany', e.target.value)}
          leftIcon={<Building2 className="h-4 w-4" />}
          helperText="Leave blank if not a subsidiary"
        />
        <Input
          label="Stock Ticker"
          placeholder="e.g. GOOG, TCS"
          value={form.stockTicker || ''}
          onChange={(e) => updateField('stockTicker', e.target.value)}
          leftIcon={<TrendingUp className="h-4 w-4" />}
          helperText="Only if publicly listed"
        />
      </div>
    </div>
  );
}
