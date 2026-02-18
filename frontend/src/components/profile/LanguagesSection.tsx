'use client';

import { Plus, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SuggestionInput from '@/components/onboarding/SuggestionInput';
import Select from '@/components/ui/Select';
import { LANGUAGE_SUGGESTIONS } from '@/constants/suggestions';
import type { ProfileSectionProps } from './types';
import type { LanguageEntry } from '@/types/candidate';

export default function LanguagesSection({ form, updateField }: ProfileSectionProps) {
    const addLanguage = () => {
        const newLang: LanguageEntry = { language: '', proficiency: 'BASIC' };
        updateField('languageProficiency', [...(form.languageProficiency || []), newLang]);
    };

    const updateLanguage = (index: number, field: keyof LanguageEntry, value: string) => {
        const updated = [...(form.languageProficiency || [])];
        updated[index] = { ...updated[index], [field]: value } as LanguageEntry;
        updateField('languageProficiency', updated);
    };

    const removeLanguage = (index: number) => {
        updateField('languageProficiency', (form.languageProficiency || []).filter((_, i) => i !== index));
    };

    return (
        <Card header={
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text)]">Languages</h2>
                <Button size="sm" variant="outline" onClick={addLanguage}>
                    <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
            </div>
        }>
            <div className="space-y-4">
                {(form.languageProficiency || []).length === 0 ? (
                    <p className="py-8 text-center text-sm text-[var(--text-muted)]">
                        No languages added. Click &quot;Add&quot; to add your language proficiencies.
                    </p>
                ) : (
                    (form.languageProficiency || []).map((lang, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="flex-1">
                                <SuggestionInput
                                    label={i === 0 ? 'Language' : undefined}
                                    placeholder="e.g. English, Hindi"
                                    value={lang.language}
                                    onChange={(val) => updateLanguage(i, 'language', val)}
                                    suggestions={LANGUAGE_SUGGESTIONS}
                                />
                            </div>
                            <div className="w-44">
                                <Select
                                    label={i === 0 ? 'Proficiency' : undefined}
                                    options={[
                                        { value: 'BASIC', label: 'Basic' },
                                        { value: 'INTERMEDIATE', label: 'Intermediate' },
                                        { value: 'FLUENT', label: 'Fluent' },
                                        { value: 'NATIVE', label: 'Native' },
                                    ]}
                                    value={lang.proficiency}
                                    onChange={(v) => updateLanguage(i, 'proficiency', v)}
                                />
                            </div>
                            <button
                                onClick={() => removeLanguage(i)}
                                className={`text-[var(--error)] hover:text-[var(--error-dark)] ${i === 0 ? 'mt-6' : ''}`}
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
