import { documentAIClient } from '../config/document-ai';
import { env } from '../config/env';
import logger from '../config/logger';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('resume-parser-service');

export interface ParsedResumeData {
    name: string | null;
    email: string | null;
    phone: string | null;
    skills: string[];
    experience: {
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        description: string | null;
    }[];
    education: {
        institution: string;
        degree: string;
        field: string | null;
        startDate: string | null;
        endDate: string | null;
    }[];
    certifications: string[];
    summary: string | null;
}

/**
 * Parse a resume using Google Document AI.
 * Returns null if Document AI is not configured.
 */
export async function parseResume(
    fileBuffer: Buffer,
    mimeType: string
): Promise<ParsedResumeData | null> {
    if (!documentAIClient || !env.GOOGLE_CLOUD_PROJECT_ID || !env.DOCUMENT_AI_PROCESSOR_ID) {
        logger.debug('Document AI not configured — skipping resume parse');
        return null;
    }

    const processorName = `projects/${env.GOOGLE_CLOUD_PROJECT_ID}/locations/${env.GOOGLE_CLOUD_LOCATION_ID}/processors/${env.DOCUMENT_AI_PROCESSOR_ID}`;

    return tracer.startActiveSpan('documentai.parseResume', async (span) => {
        span.setAttribute('ai.service', 'document-ai');
        span.setAttribute('ai.mime_type', mimeType);
        try {
            const [result] = await documentAIClient!.processDocument({
                name: processorName,
                rawDocument: {
                    content: fileBuffer.toString('base64'),
                    mimeType,
                },
            });

            const document = result.document;
            if (!document || !document.text) {
                logger.warn('Document AI returned empty document');
                span.setStatus({ code: SpanStatusCode.OK });
                span.end();
                return null;
            }

            const text = document.text;
            const entities = document.entities || [];

            const parsed: ParsedResumeData = {
                name: extractEntity(entities, 'person_name') || extractEntity(entities, 'name'),
                email: extractEntity(entities, 'email') || extractEmailFromText(text),
                phone: extractEntity(entities, 'phone_number') || extractPhoneFromText(text),
                skills: extractMultipleEntities(entities, 'skill'),
                experience: extractExperience(entities),
                education: extractEducation(entities),
                certifications: extractMultipleEntities(entities, 'certification'),
                summary: extractEntity(entities, 'summary') || extractEntity(entities, 'objective'),
            };

            span.setAttribute('ai.skills_found', parsed.skills.length);
            span.setAttribute('ai.experience_entries', parsed.experience.length);
            logger.info(`Resume parsed: ${parsed.skills.length} skills, ${parsed.experience.length} experience entries`);
            span.setStatus({ code: SpanStatusCode.OK });
            span.end();
            return parsed;
        } catch (error) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
            span.end();
            logger.error('Document AI resume parsing failed:', error);
            return null;
        }
    });
}

function extractEntity(entities: any[], type: string): string | null {
    const entity = entities.find((e) => e.type === type);
    return entity?.mentionText?.trim() || null;
}

function extractMultipleEntities(entities: any[], type: string): string[] {
    return entities
        .filter((e) => e.type === type)
        .map((e) => e.mentionText?.trim())
        .filter(Boolean);
}

function extractExperience(entities: any[]): ParsedResumeData['experience'] {
    return entities
        .filter((e) => e.type === 'work_experience' || e.type === 'experience')
        .map((e) => {
            const props = e.properties || [];
            return {
                company: findProp(props, 'company') || findProp(props, 'employer') || e.mentionText?.trim() || '',
                role: findProp(props, 'job_title') || findProp(props, 'role') || '',
                startDate: findProp(props, 'start_date'),
                endDate: findProp(props, 'end_date'),
                description: findProp(props, 'description'),
            };
        });
}

function extractEducation(entities: any[]): ParsedResumeData['education'] {
    return entities
        .filter((e) => e.type === 'education')
        .map((e) => {
            const props = e.properties || [];
            return {
                institution: findProp(props, 'institution') || findProp(props, 'school') || e.mentionText?.trim() || '',
                degree: findProp(props, 'degree') || '',
                field: findProp(props, 'field_of_study') || findProp(props, 'major'),
                startDate: findProp(props, 'start_date'),
                endDate: findProp(props, 'end_date'),
            };
        });
}

function findProp(props: any[], type: string): string | null {
    const prop = props.find((p: any) => p.type === type);
    return prop?.mentionText?.trim() || null;
}

function extractEmailFromText(text: string): string | null {
    const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return match ? match[0] : null;
}

function extractPhoneFromText(text: string): string | null {
    const match = text.match(/[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{7,15}/);
    return match ? match[0].trim() : null;
}
