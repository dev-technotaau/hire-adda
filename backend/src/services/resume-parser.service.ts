import { documentAIClient } from '../config/document-ai';
import { env } from '../config/env';
import logger from '../config/logger';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { preprocessResume } from './resume-preprocessing.service';
import { postprocessResume } from './resume-postprocessing.service';
import { isFeatureEnabled } from '../config/feature-flags';

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

export interface ParsedResumeResult {
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
  metadata: {
    originalSize: number;
    processedSize: number;
    mimeType: string;
    hasImages?: boolean;
  };
}

/**
 * Parse a resume using Google Document AI with pre and post processing.
 * Returns null if Document AI is not configured.
 */
export async function parseResume(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ParsedResumeResult | null> {
  if (!(await isFeatureEnabled('enableDocumentAI'))) {
    logger.debug('Document AI disabled via feature flag — skipping resume parse');
    return null;
  }

  if (!documentAIClient || !env.GOOGLE_CLOUD_PROJECT_ID || !env.DOCUMENT_AI_PROCESSOR_ID) {
    logger.debug('Document AI not configured — skipping resume parse');
    return null;
  }

  return tracer.startActiveSpan('documentai.parseResume', async (span) => {
    try {
      // Step 1: Pre-process the resume
      span.addEvent('preprocessing.start');
      const preprocessed = await preprocessResume(fileBuffer, mimeType);
      span.setAttribute('ai.mime_type', preprocessed.mimeType);
      span.setAttribute('ai.original_size', preprocessed.metadata.originalSize);
      span.setAttribute('ai.has_images', preprocessed.metadata.hasImages || false);
      span.addEvent('preprocessing.complete');

      // Step 2: Send to Document AI
      const processorName = `projects/${env.GOOGLE_CLOUD_PROJECT_ID}/locations/${env.GOOGLE_CLOUD_LOCATION_ID}/processors/${env.DOCUMENT_AI_PROCESSOR_ID}`;

      span.addEvent('documentai.request.start');
      const [result] = await documentAIClient!.processDocument({
        name: processorName,
        rawDocument: {
          content: preprocessed.buffer.toString('base64'),
          mimeType: preprocessed.mimeType,
        },
      });
      span.addEvent('documentai.request.complete');

      const document = result.document;
      if (!document || !document.text) {
        logger.warn('Document AI returned empty document');
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return null;
      }

      const text = document.text;
      const entities = (document.entities || []).filter(Boolean);

      // Step 3: Extract raw data from Document AI response
      const rawParsed: ParsedResumeData = {
        name: extractEntity(entities, 'person_name') || extractEntity(entities, 'name'),
        email: extractEntity(entities, 'email') || extractEmailFromText(text),
        phone: extractEntity(entities, 'phone_number') || extractPhoneFromText(text),
        skills: extractMultipleEntities(entities, 'skill'),
        experience: extractExperience(entities),
        education: extractEducation(entities),
        certifications: extractMultipleEntities(entities, 'certification'),
        summary: extractEntity(entities, 'summary') || extractEntity(entities, 'objective'),
      };

      // Step 4: Post-process the extracted data
      span.addEvent('postprocessing.start');
      const postprocessed = await postprocessResume(rawParsed);
      span.addEvent('postprocessing.complete');

      // Add telemetry attributes
      span.setAttribute('ai.skills_found', postprocessed.data.skills.length);
      span.setAttribute('ai.experience_entries', postprocessed.data.experience.length);
      span.setAttribute('ai.education_entries', postprocessed.data.education.length);
      span.setAttribute('ai.confidence.overall', postprocessed.confidence.overall);
      span.setAttribute('ai.warnings', postprocessed.warnings.length);

      logger.info(
        `Resume parsed: ${postprocessed.data.skills.length} skills, ` +
          `${postprocessed.data.experience.length} experience, ` +
          `confidence=${(postprocessed.confidence.overall * 100).toFixed(1)}%, ` +
          `warnings=${postprocessed.warnings.length}`
      );

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return {
        data: postprocessed.data,
        confidence: postprocessed.confidence,
        warnings: postprocessed.warnings,
        metadata: {
          originalSize: preprocessed.metadata.originalSize,
          processedSize: preprocessed.metadata.processedSize,
          mimeType: preprocessed.mimeType,
          hasImages: preprocessed.metadata.hasImages,
        },
      };
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
        company:
          findProp(props, 'company') || findProp(props, 'employer') || e.mentionText?.trim() || '',
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
        institution:
          findProp(props, 'institution') ||
          findProp(props, 'school') ||
          e.mentionText?.trim() ||
          '',
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
  const match = text.match(/[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}/);
  return match ? match[0].trim() : null;
}
