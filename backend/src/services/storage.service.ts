import { r2Client, R2_BUCKET_NAME } from '../config/r2';
import logger from '../config/logger';
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('storage-service');

/**
 * Uploads a file to Cloudflare R2
 * @param fileBuffer The file buffer
 * @param originalFilename The original filename
 * @param folder The folder in the bucket (e.g. 'resumes', 'avatars')
 * @returns The public URL or key of the uploaded file
 */
export const uploadFileToR2 = async (
  fileBuffer: Buffer,
  originalFilename: string,
  folder: string = 'uploads',
  mimetype: string
): Promise<{ key: string; url: string }> => {
  const ext = path.extname(originalFilename);
  const key = `${folder}/${uuidv4()}${ext}`;

  if (!r2Client) throw new Error('R2 storage is not configured');

  return tracer.startActiveSpan('r2.upload', async (span) => {
    span.setAttribute('storage.system', 'cloudflare-r2');
    span.setAttribute('storage.bucket', R2_BUCKET_NAME);
    span.setAttribute('storage.key', key);
    span.setAttribute('storage.content_type', mimetype);
    try {
      const upload = new Upload({
        client: r2Client!,
        params: {
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: fileBuffer,
          ContentType: mimetype,
        },
      });

      await upload.done();

      // Generate public URL
      let url = `/${key}`;

      if (process.env.R2_PUBLIC_URL) {
        const baseUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
        const cleanKey = key.replace(/^\//, '');
        url = `${baseUrl}/${cleanKey}`;
      }

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return { key, url };
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
      span.end();
      logger.error('R2 Upload Error:', error);
      throw new Error('Failed to upload file to storage');
    }
  });
};

/**
 * Generates a full URL for a stored file key
 */
export const getFileUrl = (key: string): string => {
  if (process.env.R2_PUBLIC_URL) {
    const baseUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
    const cleanKey = key.replace(/^\//, '');
    return `${baseUrl}/${cleanKey}`;
  }
  return `/${key}`;
};

/**
 * Extracts the R2 key from a full public URL.
 * e.g. "https://r2.example.com/resumes/abc.pdf" → "resumes/abc.pdf"
 * Returns null if the URL doesn't match the R2 public URL pattern.
 */
export const extractR2KeyFromUrl = (url: string): string | null => {
  if (!process.env.R2_PUBLIC_URL) return null;
  const baseUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
  if (!url.startsWith(baseUrl)) return null;
  return url.slice(baseUrl.length + 1); // +1 for the "/"
};

/**
 * Deletes a file from Cloudflare R2
 * @param key The file key in the bucket
 */
export const deleteFileFromR2 = async (key: string): Promise<void> => {
  if (!r2Client) throw new Error('R2 storage is not configured');
  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    logger.error('R2 Delete Error:', error);
    throw new Error('Failed to delete file from storage');
  }
};

/**
 * Generates a signed URL for temporary access to a private file
 * @param key The file key in the bucket
 * @param expiresInSeconds Duration in seconds (default 3600 = 1 hour)
 */
export const getSignedDownloadUrl = async (
  key: string,
  expiresInSeconds: number = 3600
): Promise<string> => {
  if (!r2Client) throw new Error('R2 storage is not configured');
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    // Generate signed URL
    const url = await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
    return url;
  } catch (error) {
    logger.error('R2 Signed URL Error:', error);
    throw new Error('Failed to generate signed URL');
  }
};
