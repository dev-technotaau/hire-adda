import { producer } from '../config/kafka';
import logger from '../config/logger';
import { validateEvent } from './schemas';

/**
 * Event types used across the application.
 * These are mapped to consolidated Kafka topics to stay within Aiven's free plan (5 topics).
 */
export enum KafkaTopics {
  // Original events
  USER_REGISTERED = 'user.registered',
  USER_LOGIN = 'user.login',
  JOB_POSTED = 'job.posted',
  JOB_UPDATED = 'job.updated',
  JOB_CLOSED = 'job.closed',
  APPLICATION_SUBMITTED = 'application.submitted',
  APPLICATION_STATUS_CHANGED = 'application.status_changed',
  PROFILE_UPDATED = 'profile.updated',
  NOTIFICATION_SENT = 'notification.sent',

  // Company events
  COMPANY_VERIFIED = 'company.verified',
  COMPANY_PROFILE_UPDATED = 'company.profile_updated',

  // Search events
  SEARCH_PERFORMED = 'search.performed',

  // Verification events
  VERIFICATION_SUBMITTED = 'verification.submitted',
  VERIFICATION_APPROVED = 'verification.approved',
  VERIFICATION_REJECTED = 'verification.rejected',

  // Admin events
  ADMIN_USER_SUSPENDED = 'admin.user_suspended',
  ADMIN_JOB_REJECTED = 'admin.job_rejected',
  ADMIN_ROLE_CHANGED = 'admin.role_changed',

  // Session events
  SESSION_CREATED = 'session.created',
  SESSION_REVOKED = 'session.revoked',

  // File events
  RESUME_UPLOADED = 'resume.uploaded',
  AVATAR_CHANGED = 'avatar.changed',
}

/**
 * Consolidated Aiven topics (free plan: max 5 topics).
 * Multiple event types are routed to the same physical topic.
 */
export const ConsolidatedTopics = {
  USERS: 'tb.users',
  JOBS: 'tb.jobs',
  APPLICATIONS: 'tb.applications',
  NOTIFICATIONS: 'tb.notifications',
} as const;

/**
 * Maps each event type to its consolidated Aiven topic.
 */
const EVENT_TO_TOPIC: Record<KafkaTopics, string> = {
  [KafkaTopics.USER_REGISTERED]: ConsolidatedTopics.USERS,
  [KafkaTopics.USER_LOGIN]: ConsolidatedTopics.USERS,
  [KafkaTopics.PROFILE_UPDATED]: ConsolidatedTopics.USERS,
  [KafkaTopics.COMPANY_VERIFIED]: ConsolidatedTopics.USERS,
  [KafkaTopics.COMPANY_PROFILE_UPDATED]: ConsolidatedTopics.USERS,
  [KafkaTopics.VERIFICATION_SUBMITTED]: ConsolidatedTopics.USERS,
  [KafkaTopics.VERIFICATION_APPROVED]: ConsolidatedTopics.USERS,
  [KafkaTopics.VERIFICATION_REJECTED]: ConsolidatedTopics.USERS,
  [KafkaTopics.ADMIN_USER_SUSPENDED]: ConsolidatedTopics.USERS,
  [KafkaTopics.ADMIN_ROLE_CHANGED]: ConsolidatedTopics.USERS,
  [KafkaTopics.SESSION_CREATED]: ConsolidatedTopics.USERS,
  [KafkaTopics.SESSION_REVOKED]: ConsolidatedTopics.USERS,
  [KafkaTopics.RESUME_UPLOADED]: ConsolidatedTopics.USERS,
  [KafkaTopics.AVATAR_CHANGED]: ConsolidatedTopics.USERS,
  [KafkaTopics.JOB_POSTED]: ConsolidatedTopics.JOBS,
  [KafkaTopics.JOB_UPDATED]: ConsolidatedTopics.JOBS,
  [KafkaTopics.JOB_CLOSED]: ConsolidatedTopics.JOBS,
  [KafkaTopics.SEARCH_PERFORMED]: ConsolidatedTopics.JOBS,
  [KafkaTopics.ADMIN_JOB_REJECTED]: ConsolidatedTopics.JOBS,
  [KafkaTopics.APPLICATION_SUBMITTED]: ConsolidatedTopics.APPLICATIONS,
  [KafkaTopics.APPLICATION_STATUS_CHANGED]: ConsolidatedTopics.APPLICATIONS,
  [KafkaTopics.NOTIFICATION_SENT]: ConsolidatedTopics.NOTIFICATIONS,
};

/**
 * Publish an event to the appropriate consolidated Kafka topic.
 * The eventType is embedded in the message payload for consumer-side routing.
 */
export const publishEvent = async (
  eventType: KafkaTopics,
  key: string,
  data: any
): Promise<void> => {
  if (!producer) {
    logger.debug(`Kafka producer not available - skipping event: ${eventType}`);
    return;
  }

  const topic = EVENT_TO_TOPIC[eventType];
  const payload = {
    ...data,
    eventType,
    timestamp: new Date().toISOString(),
    source: 'talent-bridge-api',
  };

  // Schema validation — warn on failure but still publish
  const validation = validateEvent(eventType, payload);
  if (!validation.valid) {
    logger.warn(`Kafka producer schema validation failed for ${eventType}: ${validation.errors.join(', ')}`);
  }

  const message = {
    topic,
    messages: [
      {
        key,
        value: JSON.stringify(payload),
      },
    ],
  };

  try {
    await producer.send(message);
    logger.debug(`Kafka event published: ${eventType} → ${topic} [${key}]`);

    // Store event for replay capability (fire-and-forget)
    void import('../services/kafka-replay.service')
      .then(({ kafkaReplayService }) => kafkaReplayService.storeEvent(eventType, key, payload))
      .catch(() => {});
  } catch (error: any) {
    // If disconnected, reconnect once and retry
    if (error?.name === 'KafkaJSError' && error?.message?.includes('disconnected')) {
      try {
        await producer.connect();
        await producer.send(message);
        logger.debug(`Kafka event published (after reconnect): ${eventType} → ${topic} [${key}]`);
        return;
      } catch (retryError) {
        logger.error(`Failed to publish Kafka event ${eventType} after reconnect:`, retryError);
        return;
      }
    }
    // Non-disconnection errors — log and move on
    logger.error(`Failed to publish Kafka event ${eventType}:`, error);
  }
};
