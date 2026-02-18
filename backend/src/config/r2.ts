import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

// Cloudflare R2 Client (S3 Compatible)
export const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
    },
});

// Resume bucket name
export const R2_BUCKET_NAME = env.R2_BUCKET_NAME;
