'use client';

import { useState, useMemo } from 'react';
import {
    Sparkles, CheckCircle2, ChevronDown, ChevronUp,
    Briefcase, GraduationCap, Code, Award, Phone, FileText,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { ParsedResumeData, ApplyableResumeFields } from '@/types/resume-parse';

type FieldKey = 'summary' | 'phone' | 'skills' | 'experience' | 'education' | 'certifications';

interface ResumeParseReviewProps {
    parsedData: ParsedResumeData;
    onApplyFields: (fields: Partial<ApplyableResumeFields>) => void;
    onCancel: () => void;
}

const FIELD_META: Record<FieldKey, { label: string; icon: typeof Sparkles }> = {
    summary: { label: 'Professional Summary', icon: FileText },
    phone: { label: 'Phone Number', icon: Phone },
    skills: { label: 'Skills', icon: Code },
    experience: { label: 'Work Experience', icon: Briefcase },
    education: { label: 'Education', icon: GraduationCap },
    certifications: { label: 'Certifications', icon: Award },
};

export default function ResumeParseReview({ parsedData, onApplyFields, onCancel }: ResumeParseReviewProps) {
    // Determine which fields have data
    const availableFields = useMemo(() => {
        const fields: FieldKey[] = [];
        if (parsedData.summary) fields.push('summary');
        if (parsedData.phone) fields.push('phone');
        if (parsedData.skills.length > 0) fields.push('skills');
        if (parsedData.experience.length > 0) fields.push('experience');
        if (parsedData.education.length > 0) fields.push('education');
        if (parsedData.certifications.length > 0) fields.push('certifications');
        return fields;
    }, [parsedData]);

    const [selected, setSelected] = useState<Set<FieldKey>>(() => new Set(availableFields));
    const [expandedSections, setExpandedSections] = useState<Set<FieldKey>>(() => new Set(availableFields));

    const allSelected = availableFields.length > 0 && availableFields.every(f => selected.has(f));
    const noneSelected = selected.size === 0;

    function toggleField(field: FieldKey) {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(field)) next.delete(field);
            else next.add(field);
            return next;
        });
    }

    function toggleAll() {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(availableFields));
        }
    }

    function toggleSection(field: FieldKey) {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(field)) next.delete(field);
            else next.add(field);
            return next;
        });
    }

    function buildApplyPayload(): Partial<ApplyableResumeFields> {
        const payload: Partial<ApplyableResumeFields> = {};

        if (selected.has('summary') && parsedData.summary) {
            payload.bio = parsedData.summary;
        }
        if (selected.has('phone') && parsedData.phone) {
            payload.phone = parsedData.phone;
        }
        if (selected.has('skills') && parsedData.skills.length > 0) {
            payload.skills = parsedData.skills;
        }
        if (selected.has('experience') && parsedData.experience.length > 0) {
            payload.experience = parsedData.experience.map(exp => ({
                company: exp.company,
                role: exp.role,
                location: '',
                startDate: exp.startDate || '',
                endDate: exp.endDate || '',
                isCurrent: false,
                description: exp.description || '',
            }));
        }
        if (selected.has('education') && parsedData.education.length > 0) {
            payload.education = parsedData.education.map(edu => ({
                institution: edu.institution,
                degree: edu.degree,
                field: edu.field || '',
                startDate: edu.startDate || '',
                endDate: edu.endDate || '',
                grade: '',
            }));
        }
        if (selected.has('certifications') && parsedData.certifications.length > 0) {
            payload.certifications = parsedData.certifications.map(name => ({
                name,
                issuer: '',
                issueDate: '',
                expiryDate: '',
                credentialId: '',
                url: '',
            }));
        }

        return payload;
    }

    function handleApply() {
        const payload = buildApplyPayload();
        if (Object.keys(payload).length > 0) {
            onApplyFields(payload);
        }
    }

    function handleApplyAll() {
        setSelected(new Set(availableFields));
        // Build with all fields
        const allPayload: Partial<ApplyableResumeFields> = {};
        if (parsedData.summary) allPayload.bio = parsedData.summary;
        if (parsedData.phone) allPayload.phone = parsedData.phone;
        if (parsedData.skills.length > 0) allPayload.skills = parsedData.skills;
        if (parsedData.experience.length > 0) {
            allPayload.experience = parsedData.experience.map(exp => ({
                company: exp.company, role: exp.role, location: '',
                startDate: exp.startDate || '', endDate: exp.endDate || '',
                isCurrent: false, description: exp.description || '',
            }));
        }
        if (parsedData.education.length > 0) {
            allPayload.education = parsedData.education.map(edu => ({
                institution: edu.institution, degree: edu.degree, field: edu.field || '',
                startDate: edu.startDate || '', endDate: edu.endDate || '', grade: '',
            }));
        }
        if (parsedData.certifications.length > 0) {
            allPayload.certifications = parsedData.certifications.map(name => ({
                name, issuer: '', issueDate: '', expiryDate: '', credentialId: '', url: '',
            }));
        }
        onApplyFields(allPayload);
    }

    if (availableFields.length === 0) {
        return (
            <Card>
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <FileText className="h-10 w-10 text-[var(--text-muted)]" />
                    <p className="text-sm text-[var(--text-secondary)]">
                        No extractable data found in your resume. Try uploading a different format.
                    </p>
                    <Button variant="ghost" size="sm" onClick={onCancel}>Dismiss</Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold text-[var(--text)]">AI-Parsed Resume Data</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
                Select which fields to apply to your profile. You can customize them later.
            </p>

            {/* Select All */}
            <label className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5">
                <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-[var(--border)] text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-[var(--text)]">
                    Select All ({availableFields.length} fields)
                </span>
            </label>

            {/* Field Sections */}
            <div className="space-y-2">
                {availableFields.map(field => {
                    const meta = FIELD_META[field];
                    const Icon = meta.icon;
                    const isExpanded = expandedSections.has(field);
                    const isChecked = selected.has(field);

                    return (
                        <div key={field} className="rounded-lg border border-[var(--border)] bg-white overflow-hidden">
                            {/* Field header */}
                            <div className="flex items-center gap-3 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleField(field)}
                                    className="h-4 w-4 rounded border-[var(--border)] text-primary focus:ring-primary"
                                />
                                <Icon className="h-4 w-4 text-[var(--text-muted)]" />
                                <span className="flex-1 text-sm font-medium text-[var(--text)]">
                                    {meta.label}
                                    {field === 'skills' && <span className="ml-1 text-[var(--text-muted)]">({parsedData.skills.length})</span>}
                                    {field === 'experience' && <span className="ml-1 text-[var(--text-muted)]">({parsedData.experience.length})</span>}
                                    {field === 'education' && <span className="ml-1 text-[var(--text-muted)]">({parsedData.education.length})</span>}
                                    {field === 'certifications' && <span className="ml-1 text-[var(--text-muted)]">({parsedData.certifications.length})</span>}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => toggleSection(field)}
                                    className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors"
                                >
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                            </div>

                            {/* Field content (collapsible) */}
                            {isExpanded && (
                                <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
                                    {field === 'summary' && parsedData.summary && (
                                        <p className="text-sm text-[var(--text-secondary)] line-clamp-4">{parsedData.summary}</p>
                                    )}

                                    {field === 'phone' && parsedData.phone && (
                                        <p className="text-sm text-[var(--text)]">{parsedData.phone}</p>
                                    )}

                                    {field === 'skills' && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {parsedData.skills.map(skill => (
                                                <span
                                                    key={skill}
                                                    className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {field === 'experience' && (
                                        <div className="space-y-2">
                                            {parsedData.experience.map((exp, i) => (
                                                <div key={i} className="rounded border border-[var(--border)] bg-white p-2.5">
                                                    <p className="text-sm font-medium text-[var(--text)]">{exp.role || 'Untitled Role'}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        {exp.company}
                                                        {exp.startDate && ` | ${exp.startDate}`}
                                                        {exp.endDate && ` - ${exp.endDate}`}
                                                    </p>
                                                    {exp.description && (
                                                        <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">{exp.description}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {field === 'education' && (
                                        <div className="space-y-2">
                                            {parsedData.education.map((edu, i) => (
                                                <div key={i} className="rounded border border-[var(--border)] bg-white p-2.5">
                                                    <p className="text-sm font-medium text-[var(--text)]">{edu.degree || 'Degree'}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        {edu.institution}
                                                        {edu.field && ` - ${edu.field}`}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {field === 'certifications' && (
                                        <ul className="space-y-1">
                                            {parsedData.certifications.map((cert, i) => (
                                                <li key={i} className="text-sm text-[var(--text)]">{cert}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button onClick={handleApply} disabled={noneSelected}>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Apply Selected ({selected.size})
                </Button>
                <Button variant="outline" onClick={handleApplyAll}>
                    Apply All
                </Button>
                <Button variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
