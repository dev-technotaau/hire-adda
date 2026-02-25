import logger from '../config/logger';
import type { ParsedResumeData } from './resume-parser.service';

/**
 * Post-processing utilities for resume parsing
 * Validates, normalizes, and enhances extracted data
 */

interface PostprocessResult {
    data: ParsedResumeData;
    confidence: {
        overall: number;
        fields: {
            name?: number;
            email?: number;
            phone?: number;
            skills?: number;
            experience?: number;
            education?: number;
        };
    };
    warnings: string[];
}

/**
 * Normalize and validate email address
 */
function normalizeEmail(email: string | null): string | null {
    if (!email) return null;

    const trimmed = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
        logger.warn(`Invalid email format: ${trimmed}`);
        return null;
    }

    return trimmed;
}

/**
 * Normalize phone number to international format
 */
function normalizePhone(phone: string | null): string | null {
    if (!phone) return null;

    // Remove all non-digit characters except + at start
    let cleaned = phone.replace(/[^\d+]/g, '');

    // If starts with +, keep it
    if (phone.trim().startsWith('+')) {
        cleaned = '+' + cleaned.replace(/\+/g, '');
    }

    // Indian number normalization
    if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
        cleaned = '+91' + cleaned;
    }

    // US number normalization
    if (cleaned.length === 10 && !cleaned.startsWith('+')) {
        cleaned = '+1' + cleaned;
    }

    // Validate length (international numbers are typically 10-15 digits)
    const digitCount = cleaned.replace(/\+/g, '').length;
    if (digitCount < 10 || digitCount > 15) {
        logger.warn(`Invalid phone length: ${phone}`);
        return phone.trim(); // Return original if can't normalize
    }

    return cleaned;
}

/**
 * Normalize person name (title case, remove extra spaces)
 */
function normalizeName(name: string | null): string | null {
    if (!name) return null;

    const trimmed = name.trim();

    // Remove common prefixes/suffixes
    let cleaned = trimmed
        .replace(/^(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?)\s+/i, '')
        .replace(/\s+(Jr\.?|Sr\.?|II|III|IV)$/i, '');

    // Title case each word
    cleaned = cleaned
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    // Validate: should be 2-4 words, each 2+ characters
    const words = cleaned.split(/\s+/);
    if (words.length < 2 || words.length > 4) {
        logger.warn(`Name has unusual word count: ${cleaned}`);
    }

    if (words.some(w => w.length < 2)) {
        logger.warn(`Name has very short word: ${cleaned}`);
    }

    return cleaned;
}

/**
 * Normalize and deduplicate skills
 */
function normalizeSkills(skills: string[]): string[] {
    if (!skills || skills.length === 0) return [];

    const normalized = skills
        .map(skill => {
            // Trim and normalize case
            let s = skill.trim();

            // Common skill name mappings
            const mappings: Record<string, string> = {
                'javascript': 'JavaScript',
                'typescript': 'TypeScript',
                'nodejs': 'Node.js',
                'reactjs': 'React',
                'react.js': 'React',
                'vuejs': 'Vue.js',
                'vue.js': 'Vue.js',
                'angularjs': 'Angular',
                'nextjs': 'Next.js',
                'next.js': 'Next.js',
                'mongodb': 'MongoDB',
                'postgresql': 'PostgreSQL',
                'mysql': 'MySQL',
                'aws': 'AWS',
                'gcp': 'Google Cloud',
                'azure': 'Microsoft Azure',
                'docker': 'Docker',
                'kubernetes': 'Kubernetes',
                'git': 'Git',
                'github': 'GitHub',
                'python': 'Python',
                'java': 'Java',
                'c++': 'C++',
                'csharp': 'C#',
                'c#': 'C#',
                'dotnet': '.NET',
                '.net': '.NET',
            };

            const lowerSkill = s.toLowerCase();
            if (mappings[lowerSkill]) {
                return mappings[lowerSkill];
            }

            // Title case for multi-word skills
            if (s.includes(' ')) {
                return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            }

            return s;
        })
        .filter(s => s.length >= 2); // Remove very short skills

    // Deduplicate (case-insensitive)
    const seen = new Set<string>();
    const unique: string[] = [];

    for (const skill of normalized) {
        const lower = skill.toLowerCase();
        if (!seen.has(lower)) {
            seen.add(lower);
            unique.push(skill);
        }
    }

    return unique;
}

/**
 * Normalize date string to ISO format
 */
function normalizeDate(dateStr: string | null): string | null {
    if (!dateStr) return null;

    const trimmed = dateStr.trim();

    // Handle "Present", "Current", "Now"
    if (/^(present|current|now|ongoing)$/i.test(trimmed)) {
        return null; // Represent as null for current
    }

    // Try parsing common formats
    const formats = [
        // YYYY-MM-DD
        /^(\d{4})-(\d{2})-(\d{2})$/,
        // MM/YYYY
        /^(\d{2})\/(\d{4})$/,
        // YYYY
        /^(\d{4})$/,
        // Month YYYY (e.g., "January 2020")
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})$/i,
    ];

    for (const format of formats) {
        const match = trimmed.match(format);
        if (match) {
            if (match.length === 4 && !match[0].includes('-')) {
                // MM/YYYY format
                const year = match[2];
                const month = match[1];
                return `${year}-${month}-01`;
            } else if (match.length === 2) {
                // YYYY only
                return `${match[1]}-01-01`;
            } else if (match.length === 3 && /^[A-Za-z]/.test(match[1])) {
                // Month YYYY
                const monthMap: Record<string, string> = {
                    jan: '01', feb: '02', mar: '03', apr: '04',
                    may: '05', jun: '06', jul: '07', aug: '08',
                    sep: '09', oct: '10', nov: '11', dec: '12',
                };
                const monthName = match[1].toLowerCase().slice(0, 3);
                const month = monthMap[monthName] || '01';
                return `${match[2]}-${month}-01`;
            }
            // Already ISO format
            return trimmed;
        }
    }

    logger.warn(`Could not parse date: ${dateStr}`);
    return trimmed; // Return original if can't parse
}

/**
 * Validate experience entry
 */
function validateExperience(exp: ParsedResumeData['experience'][0]): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (!exp.company && !exp.role) {
        warnings.push('Experience missing both company and role');
        return { valid: false, warnings };
    }

    // Check date logic
    if (exp.startDate && exp.endDate) {
        const start = new Date(exp.startDate);
        const end = new Date(exp.endDate);

        if (end < start) {
            warnings.push(`End date before start date: ${exp.company || exp.role}`);
        }

        // Check for unreasonably long duration
        const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (years > 50) {
            warnings.push(`Unreasonably long duration (${Math.round(years)} years): ${exp.company || exp.role}`);
        }
    }

    return { valid: true, warnings };
}

/**
 * Validate education entry
 */
function validateEducation(edu: ParsedResumeData['education'][0]): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (!edu.institution && !edu.degree) {
        warnings.push('Education missing both institution and degree');
        return { valid: false, warnings };
    }

    // Check date logic
    if (edu.startDate && edu.endDate) {
        const start = new Date(edu.startDate);
        const end = new Date(edu.endDate);

        if (end < start) {
            warnings.push(`End date before start date: ${edu.institution || edu.degree}`);
        }
    }

    return { valid: true, warnings };
}

/**
 * Calculate confidence scores for extracted fields
 */
function calculateConfidence(data: ParsedResumeData): PostprocessResult['confidence'] {
    const scores: PostprocessResult['confidence']['fields'] = {};

    // Name confidence
    if (data.name) {
        const words = data.name.split(/\s+/);
        if (words.length >= 2 && words.every(w => w.length >= 2 && /^[A-Z]/.test(w))) {
            scores.name = 0.95;
        } else if (words.length >= 2) {
            scores.name = 0.75;
        } else {
            scores.name = 0.5;
        }
    }

    // Email confidence (regex validation)
    if (data.email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        scores.email = emailRegex.test(data.email) ? 0.98 : 0.6;
    }

    // Phone confidence
    if (data.phone) {
        const hasCountryCode = data.phone.startsWith('+');
        const digitCount = data.phone.replace(/\D/g, '').length;
        if (hasCountryCode && digitCount >= 10 && digitCount <= 15) {
            scores.phone = 0.95;
        } else if (digitCount >= 10) {
            scores.phone = 0.8;
        } else {
            scores.phone = 0.5;
        }
    }

    // Skills confidence (based on count and quality)
    if (data.skills.length > 0) {
        const avgSkillLength = data.skills.reduce((sum, s) => sum + s.length, 0) / data.skills.length;
        if (data.skills.length >= 5 && avgSkillLength >= 3) {
            scores.skills = 0.9;
        } else if (data.skills.length >= 3) {
            scores.skills = 0.75;
        } else {
            scores.skills = 0.6;
        }
    }

    // Experience confidence
    if (data.experience.length > 0) {
        const hasValidExperience = data.experience.every(exp => exp.company || exp.role);
        const hasDetails = data.experience.some(exp => exp.startDate && exp.role && exp.company);
        if (hasValidExperience && hasDetails) {
            scores.experience = 0.9;
        } else if (hasValidExperience) {
            scores.experience = 0.75;
        } else {
            scores.experience = 0.6;
        }
    }

    // Education confidence
    if (data.education.length > 0) {
        const hasValidEducation = data.education.every(edu => edu.institution || edu.degree);
        const hasDetails = data.education.some(edu => edu.degree && edu.institution);
        if (hasValidEducation && hasDetails) {
            scores.education = 0.95;
        } else if (hasValidEducation) {
            scores.education = 0.8;
        } else {
            scores.education = 0.65;
        }
    }

    // Overall confidence (weighted average)
    const weights = {
        name: 0.15,
        email: 0.15,
        phone: 0.1,
        skills: 0.2,
        experience: 0.25,
        education: 0.15,
    };

    let overall = 0;
    let totalWeight = 0;

    for (const [field, weight] of Object.entries(weights)) {
        const score = scores[field as keyof typeof scores];
        if (score !== undefined) {
            overall += score * weight;
            totalWeight += weight;
        }
    }

    return {
        overall: totalWeight > 0 ? overall / totalWeight : 0,
        fields: scores,
    };
}

/**
 * Post-process parsed resume data
 */
export async function postprocessResume(data: ParsedResumeData): Promise<PostprocessResult> {
    const warnings: string[] = [];

    try {
        // Normalize basic fields
        const normalizedName = normalizeName(data.name);
        const normalizedEmail = normalizeEmail(data.email);
        const normalizedPhone = normalizePhone(data.phone);
        const normalizedSkills = normalizeSkills(data.skills);

        // Normalize and validate experience
        const normalizedExperience = data.experience
            .map(exp => ({
                ...exp,
                startDate: normalizeDate(exp.startDate),
                endDate: normalizeDate(exp.endDate),
            }))
            .filter(exp => {
                const validation = validateExperience(exp);
                warnings.push(...validation.warnings);
                return validation.valid;
            });

        // Normalize and validate education
        const normalizedEducation = data.education
            .map(edu => ({
                ...edu,
                startDate: normalizeDate(edu.startDate),
                endDate: normalizeDate(edu.endDate),
            }))
            .filter(edu => {
                const validation = validateEducation(edu);
                warnings.push(...validation.warnings);
                return validation.valid;
            });

        // Build normalized data
        const normalized: ParsedResumeData = {
            name: normalizedName,
            email: normalizedEmail,
            phone: normalizedPhone,
            skills: normalizedSkills,
            experience: normalizedExperience,
            education: normalizedEducation,
            certifications: data.certifications.filter(c => c.length >= 3), // Remove very short certs
            summary: data.summary?.trim() || null,
        };

        // Calculate confidence scores
        const confidence = calculateConfidence(normalized);

        // Add warnings for low confidence fields
        if (confidence.fields.name && confidence.fields.name < 0.7) {
            warnings.push('Low confidence in name extraction');
        }
        if (confidence.fields.email && confidence.fields.email < 0.8) {
            warnings.push('Low confidence in email extraction');
        }
        if (confidence.overall < 0.7) {
            warnings.push('Overall parsing confidence is low - manual review recommended');
        }

        logger.info(`Resume postprocessed: confidence=${(confidence.overall * 100).toFixed(1)}%, warnings=${warnings.length}`);

        return {
            data: normalized,
            confidence,
            warnings,
        };
    } catch (error) {
        logger.error('Resume postprocessing failed:', error);
        warnings.push('Postprocessing failed - using raw data');

        return {
            data,
            confidence: {
                overall: 0.5,
                fields: {},
            },
            warnings,
        };
    }
}

export { normalizeEmail, normalizePhone, normalizeName, normalizeSkills, normalizeDate };
