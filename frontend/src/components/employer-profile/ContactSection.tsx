import { Mail, Phone, UserCircle, Briefcase } from 'lucide-react';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import type { UpdateCompanyRequest } from '@/types/employer';

interface ContactSectionProps {
  form: UpdateCompanyRequest;
  updateField: <K extends keyof UpdateCompanyRequest>(
    key: K,
    value: UpdateCompanyRequest[K],
  ) => void;
}

export default function ContactSection({ form, updateField }: ContactSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Contact Email"
          type="email"
          leftIcon={<Mail className="h-4 w-4" />}
          value={form.contactEmail || ''}
          onChange={(e) => updateField('contactEmail', e.target.value)}
        />
        <PhoneInput
          label="Contact Phone"
          placeholder="9876xxxxxx"
          value={form.contactPhone || ''}
          onValueChange={(val) => updateField('contactPhone', val)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Contact Person Name"
          placeholder="e.g. Priya Sharma"
          value={form.contactPersonName || ''}
          onChange={(e) => updateField('contactPersonName', e.target.value)}
          leftIcon={<UserCircle className="h-4 w-4" />}
          helperText="Primary point of contact for candidates"
        />
        <Input
          label="Contact Person Designation"
          placeholder="e.g. HR Manager"
          value={form.contactPersonDesignation || ''}
          onChange={(e) => updateField('contactPersonDesignation', e.target.value)}
          leftIcon={<Briefcase className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
