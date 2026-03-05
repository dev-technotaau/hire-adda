import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('5000'),
    COOKIE_SECRET: z.string().min(32),

    // Database
    DATABASE_URL: z.string(),
    DATABASE_POOL_SIZE: z.string().default('10'),
    DATABASE_POOL_TIMEOUT: z.string().default('10'),

    // CSRF
    CSRF_SECRET: z.string().min(32),

    // BFF (Backend-For-Frontend) — shared secret for Next.js API route proxying
    BFF_SECRET: z.string().min(32).optional(),

    // Cookie maxAge (days) — controls how long auth cookies persist in the browser
    COOKIE_ACCESS_MAX_AGE_DAYS: z.string().default('7'),
    COOKIE_REFRESH_MAX_AGE_DAYS: z.string().default('30'),

    // JWT
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
    JWT_ALGORITHM: z.enum(['HS256', 'RS256']).default('RS256'),
    // For RS256 — required when JWT_ALGORITHM=RS256 (validated via superRefine below)
    JWT_PRIVATE_KEY: z.string().optional(),
    JWT_PUBLIC_KEY: z.string().optional(),

    // Redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().default('6379'),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_TLS: z.string().default('false'),
    REDIS_URL: z.string().optional(),
    REDIS_ENABLED: z.string().default('true'),

    // BullMQ
    BULLMQ_DEFAULT_JOB_OPTIONS_ATTEMPTS: z.string().default('3'),
    BULLMQ_DEFAULT_JOB_OPTIONS_BACKOFF: z.string().default('1000'),
    BULLMQ_REMOVE_ON_COMPLETE: z.string().default('100'),
    BULLMQ_REMOVE_ON_FAIL: z.string().default('500'),

    // Email
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    SMTP_FROM_NAME: z.string().default('Talent Bridge'),
    SMTP_SECURE: z.string().default('false'),
    EMAIL_MAX_SEND_PER_HOUR: z.string().default('100'),
    EMAIL_MAX_SEND_PER_DAY: z.string().default('300'),

    // File Upload
    UPLOAD_MAX_SIZE: z.string().default('5242880'), // 5MB
    UPLOAD_DIR: z.string().default('uploads'),

    // Frontend URL (for CORS)
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    CORS_ORIGIN: z.string().default('*'),

    // Sentry
    SENTRY_DSN: z.string().optional(),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    // Cloudflare R2
    CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().default('talent-bridge-resumes'),
    R2_PUBLIC_URL: z.string().optional(),

    // Cloudflare Turnstile
    CF_TURNSTILE_SECRET_KEY: z.string().optional(),

    // MFA Configuration
    MFA_ISSUER: z.string().default('TalentBridge'),
    MFA_ENABLED: z
      .string()
      .default('true')
      .transform((val) => val === 'true'),

    // WebAuthn (Passkeys)
    WEBAUTHN_RP_ID: z.string().default('localhost'),
    WEBAUTHN_RP_NAME: z.string().default('Talent Bridge'),
    WEBAUTHN_ORIGIN: z.string().default('http://localhost:3000'),

    // Breach Detection
    HIBP_ENABLED: z
      .string()
      .default('true')
      .transform((val) => val === 'true'),

    // Elasticsearch
    ELASTICSEARCH_URL: z.string().default('http://localhost:9200'),
    ELASTICSEARCH_USERNAME: z.string().optional(),
    ELASTICSEARCH_PASSWORD: z.string().optional(),
    ELASTICSEARCH_API_KEY: z.string().optional(),

    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALLBACK_URL: z.string().default('/api/auth/google/callback'),

    // LinkedIn OAuth
    LINKEDIN_CLIENT_ID: z.string().optional(),
    LINKEDIN_CLIENT_SECRET: z.string().optional(),
    LINKEDIN_CALLBACK_URL: z.string().default('/api/auth/linkedin/callback'),

    // Google Cloud Platform
    GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
    GOOGLE_CLOUD_LOCATION_ID: z.string().default('us-central1'),
    DOCUMENT_AI_PROCESSOR_ID: z.string().optional(),
    CLOUD_TALENT_TENANT_ID: z.string().optional(),

    // Google Analytics
    GA_MEASUREMENT_ID: z.string().optional(),
    GA_API_SECRET: z.string().optional(),

    // Firebase Cloud Messaging
    FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
    FIREBASE_DATABASE_URL: z.string().optional(),

    // Web Push (VAPID)
    VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_SUBJECT: z.string().optional(),

    // SMS & WhatsApp
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_PHONE_NUMBER: z.string().optional(),
    META_WHATSAPP_PHONE_ID: z.string().optional(),
    META_WHATSAPP_TOKEN: z.string().optional(),

    // SMS Cost Control — Essential SMS (OTP, security) always enabled
    // Transactional SMS (job matches, reminders) can be toggled
    ENABLE_TRANSACTIONAL_SMS: z.string().default('true'),

    // Apache Kafka
    KAFKA_BROKERS: z.string().default('localhost:9092'),
    KAFKA_CLIENT_ID: z.string().default(`talent-bridge-${process.env.NODE_ENV || 'development'}`),
    KAFKA_USERNAME: z.string().optional(),
    KAFKA_PASSWORD: z.string().optional(),
    KAFKA_SASL_MECHANISM: z.string().default('plain'),

    // OTP Configuration
    OTP_EXPIRY_MINUTES: z.string().default('10'),
    OTP_LENGTH: z
      .string()
      .default('6')
      .refine((v) => {
        const n = parseInt(v, 10);
        return n >= 4 && n <= 8;
      }, 'OTP_LENGTH must be between 4 and 8'),
    OTP_MAX_RESEND_ATTEMPTS: z.string().default('5'),
    OTP_RESEND_COOLDOWN_SECONDS: z.string().default('60'),

    // Password Reset
    PASSWORD_RESET_EXPIRY_HOURS: z.string().default('1'),
    PASSWORD_RESET_MAX_ATTEMPTS: z.string().default('5'),

    // Account Security
    MAX_LOGIN_ATTEMPTS: z.string().default('5'),
    ACCOUNT_LOCK_DURATION_MINUTES: z.string().default('15'),
    SESSION_TIMEOUT_HOURS: z.string().default('24'),
    MAX_SESSIONS_PER_USER: z.string().default('5'),

    // Password Validation
    PASSWORD_MIN_LENGTH: z.string().default('8'),
    PASSWORD_MAX_LENGTH: z.string().default('128'),
    PASSWORD_REQUIRE_UPPERCASE: z.string().default('true'),
    PASSWORD_REQUIRE_LOWERCASE: z.string().default('true'),
    PASSWORD_REQUIRE_NUMBER: z.string().default('true'),
    PASSWORD_REQUIRE_SPECIAL: z.string().default('true'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
    AUTH_RATE_LIMIT_WINDOW_MS: z.string().default('300000'), // 5 minutes
    AUTH_RATE_LIMIT_MAX_ATTEMPTS: z.string().default('10'),

    // Logging
    LOG_LEVEL: z
      .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
      .default('info'),

    // Webhooks
    WEBHOOK_SECRET: z.string().min(32, 'WEBHOOK_SECRET must be at least 32 characters').optional(),
    WEBHOOK_CALLBACK_URL: z.string().optional(),

    // Super Admin
    SUPER_ADMIN_EMAIL: z.string().email('SUPER_ADMIN_EMAIL must be a valid email').optional(),
    SUPER_ADMIN_PASSWORD: z
      .string()
      .min(8, 'SUPER_ADMIN_PASSWORD must be at least 8 characters')
      .optional(),

    // OpenTelemetry
    OTEL_ENABLED: z.string().default('true'),
    OTEL_SERVICE_NAME: z.string().default('talent-bridge-api'),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default('http://localhost:4318/v1/traces'),
    OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),

    // Geocoding
    GEOCODING_PROVIDER: z.enum(['nominatim', 'google']).default('nominatim'),
    NOMINATIM_BASE_URL: z.string().default('https://nominatim.openstreetmap.org'),
    NOMINATIM_USER_AGENT: z.string().default('TalentBridge/1.0'),
    GOOGLE_GEOCODING_API_KEY: z.string().optional(),

    // Database Security
    DATABASE_SSL_MODE: z
      .enum(['disable', 'require', 'verify-ca', 'verify-full'])
      .default('require'),

    // Field-Level Encryption (AES-256-GCM, 32-byte hex key)
    FIELD_ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-fA-F]{64}$/, 'FIELD_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)')
      .optional(),

    // Centralized Log Aggregation
    LOG_AGGREGATION_URL: z.string().optional(),
    LOG_AGGREGATION_TOKEN: z.string().optional(),

    // Backup Configuration
    BACKUP_DIR: z.string().default('./backups'),
    BACKUP_RETENTION_DAYS: z.coerce.number().default(30),
    OPENSEARCH_SNAPSHOT_REPO: z.string().default('talent_bridge_repo'),
  })
  .superRefine((data, ctx) => {
    // RS256 requires both private and public keys
    if (data.JWT_ALGORITHM === 'RS256') {
      if (!data.JWT_PRIVATE_KEY) {
        ctx.addIssue({
          code: 'custom',
          message: 'JWT_PRIVATE_KEY is required when JWT_ALGORITHM is RS256',
          path: ['JWT_PRIVATE_KEY'],
        });
      }
      if (!data.JWT_PUBLIC_KEY) {
        ctx.addIssue({
          code: 'custom',
          message: 'JWT_PUBLIC_KEY is required when JWT_ALGORITHM is RS256',
          path: ['JWT_PUBLIC_KEY'],
        });
      }
    }

    // Validate Firebase service account JSON if provided
    if (data.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const parsed = JSON.parse(data.FIREBASE_SERVICE_ACCOUNT);
        if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
          ctx.addIssue({
            code: 'custom',
            message:
              'FIREBASE_SERVICE_ACCOUNT JSON must contain project_id, private_key, and client_email',
            path: ['FIREBASE_SERVICE_ACCOUNT'],
          });
        }
      } catch {
        ctx.addIssue({
          code: 'custom',
          message: 'FIREBASE_SERVICE_ACCOUNT must be valid JSON',
          path: ['FIREBASE_SERVICE_ACCOUNT'],
        });
      }
    }

    // Super admin: if email is set, password must also be set
    if (data.SUPER_ADMIN_EMAIL && !data.SUPER_ADMIN_PASSWORD) {
      ctx.addIssue({
        code: 'custom',
        message: 'SUPER_ADMIN_PASSWORD is required when SUPER_ADMIN_EMAIL is set',
        path: ['SUPER_ADMIN_PASSWORD'],
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// Helper to get numeric values
export const getPort = (): number => parseInt(env.PORT, 10);
export const getRedisPort = (): number => parseInt(env.REDIS_PORT, 10);
export const getMaxUploadSize = (): number => parseInt(env.UPLOAD_MAX_SIZE, 10);
export const isRedisTlsEnabled = (): boolean => env.REDIS_TLS === 'true';

// BullMQ helpers
export const getBullMQAttempts = (): number =>
  parseInt(env.BULLMQ_DEFAULT_JOB_OPTIONS_ATTEMPTS, 10);
export const getBullMQBackoff = (): number => parseInt(env.BULLMQ_DEFAULT_JOB_OPTIONS_BACKOFF, 10);
export const getBullMQRemoveOnComplete = (): number => parseInt(env.BULLMQ_REMOVE_ON_COMPLETE, 10);
export const getBullMQRemoveOnFail = (): number => parseInt(env.BULLMQ_REMOVE_ON_FAIL, 10);

// Security helpers
export const getOtpExpiryMinutes = (): number => parseInt(env.OTP_EXPIRY_MINUTES, 10);
export const getOtpLength = (): number => parseInt(env.OTP_LENGTH, 10);
export const getOtpMaxResendAttempts = (): number => parseInt(env.OTP_MAX_RESEND_ATTEMPTS, 10);
export const getOtpResendCooldown = (): number => parseInt(env.OTP_RESEND_COOLDOWN_SECONDS, 10);
export const getPasswordResetExpiryHours = (): number =>
  parseInt(env.PASSWORD_RESET_EXPIRY_HOURS, 10);
export const getMaxLoginAttempts = (): number => parseInt(env.MAX_LOGIN_ATTEMPTS, 10);
export const getAccountLockDuration = (): number => parseInt(env.ACCOUNT_LOCK_DURATION_MINUTES, 10);
export const getSessionTimeout = (): number => parseInt(env.SESSION_TIMEOUT_HOURS, 10);
export const getPasswordResetMaxAttempts = (): number =>
  parseInt(env.PASSWORD_RESET_MAX_ATTEMPTS, 10);
export const getMaxSessionsPerUser = (): number => parseInt(env.MAX_SESSIONS_PER_USER, 10);

// Password validation helpers
export const getPasswordMinLength = (): number => parseInt(env.PASSWORD_MIN_LENGTH, 10);
export const getPasswordMaxLength = (): number => parseInt(env.PASSWORD_MAX_LENGTH, 10);
export const getPasswordRequireUppercase = (): boolean => env.PASSWORD_REQUIRE_UPPERCASE === 'true';
export const getPasswordRequireLowercase = (): boolean => env.PASSWORD_REQUIRE_LOWERCASE === 'true';
export const getPasswordRequireNumber = (): boolean => env.PASSWORD_REQUIRE_NUMBER === 'true';
export const getPasswordRequireSpecial = (): boolean => env.PASSWORD_REQUIRE_SPECIAL === 'true';

// Email helpers
export const getEmailMaxSendPerHour = (): number => parseInt(env.EMAIL_MAX_SEND_PER_HOUR, 10);
export const getEmailMaxSendPerDay = (): number => parseInt(env.EMAIL_MAX_SEND_PER_DAY, 10);
export const isSmtpSecure = (): boolean => env.SMTP_SECURE === 'true';

// Rate Limit helpers
export const getRateLimitWindowMs = (): number => parseInt(env.RATE_LIMIT_WINDOW_MS, 10);
export const getRateLimitMaxRequests = (): number => parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10);
export const getAuthRateLimitWindowMs = (): number => parseInt(env.AUTH_RATE_LIMIT_WINDOW_MS, 10);
export const getAuthRateLimitMaxAttempts = (): number =>
  parseInt(env.AUTH_RATE_LIMIT_MAX_ATTEMPTS, 10);

export type Env = z.infer<typeof envSchema>;
