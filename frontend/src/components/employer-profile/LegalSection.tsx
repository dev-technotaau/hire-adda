import { Shield } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select, { type SelectOption } from '@/components/ui/Select';
import { REVENUE_RANGE_OPTIONS } from '@/constants/suggestions';
import type { UpdateCompanyRequest } from '@/types/employer';

const revenueOptions: SelectOption[] = REVENUE_RANGE_OPTIONS.map((r) => ({ value: r, label: r }));

interface LegalSectionProps {
    form: UpdateCompanyRequest;
    updateField: <K extends keyof UpdateCompanyRequest>(key: K, value: UpdateCompanyRequest[K]) => void;
}

export default function LegalSection({ form, updateField }: LegalSectionProps) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)]">These details are optional and kept private. They help verify your company and are not shown publicly.</p>
            <div className="grid gap-4 sm:grid-cols-2">
                <Input label="GST Number" placeholder="e.g. 22AAAAA0000A1Z5" value={form.gstNumber || ''} onChange={(e) => updateField('gstNumber', e.target.value)} leftIcon={<Shield className="h-4 w-4" />} />
                <Input label="CIN Number" placeholder="e.g. U12345MH2000PTC123456" value={form.cinNumber || ''} onChange={(e) => updateField('cinNumber', e.target.value)} leftIcon={<Shield className="h-4 w-4" />} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <Input label="PAN Number" placeholder="e.g. AAAAA1234A" value={form.panNumber || ''} onChange={(e) => updateField('panNumber', e.target.value)} leftIcon={<Shield className="h-4 w-4" />} />
                <Select label="Annual Revenue Range" options={revenueOptions} value={form.annualRevenueRange || ''} onChange={(v) => updateField('annualRevenueRange', v)} placeholder="Select revenue range" />
            </div>
        </div>
    );
}
