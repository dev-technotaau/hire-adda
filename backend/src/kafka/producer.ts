import { producer } from '../config/kafka';
import logger from '../config/logger';

/**
 * Event types used across the application.
 * These are mapped to consolidated Kafka topics to stay within Aiven's free plan (5 topics).
 */
export enum KafkaTopics {
    USER_REGISTERED = 'user.registered',
    USER_LOGIN = 'user.login',
    JOB_POSTED = 'job.posted',
    JOB_UPDATED = 'job.updated',
    JOB_CLOSED = 'job.closed',
    APPLICATION_SUBMITTED = 'application.submitted',
    APPLICATION_STATUS_CHANGED = 'application.status_changed',
    PROFILE_UPDATED = 'profile.updated',
    NOTIFICATION_SENT = 'notification.sent',
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
    [KafkaTopics.JOB_POSTED]: ConsolidatedTopics.JOBS,
    [KafkaTopics.JOB_UPDATED]: ConsolidatedTopics.JOBS,
    [KafkaTopics.JOB_CLOSED]: ConsolidatedTopics.JOBS,
    [KafkaTopics.APPLICATION_SUBMITTED]: ConsolidatedTopics.APPLICATIONS,
    [KafkaTopics.APPLICATION_STATUS_CHANGED]: ConsolidatedTopics.APPLICATIONS,
    [KafkaTopics.NOTIFICATION_SENT]: ConsolidatedTopics.NOTIFICATIONS,
};

/**
 * Publish an event to the appropriate consolidated Kafka topic.
 * The eventType is embedded in the message payload for consumer-side routing.
 */
export const publishEvent = async (eventType: KafkaTopics, key: string, data: any): Promise<void> => {
    try {
        if (!producer) {
            logger.debug(`Kafka producer not available - skipping event: ${eventType}`);
            return;
        }

        const topic = EVENT_TO_TOPIC[eventType];

        await producer.send({
            topic,
            messages: [{
                key,
                value: JSON.stringify({
                    ...data,
                    eventType,
                    timestamp: new Date().toISOString(),
                    source: 'talent-bridge-api',
                }),
            }],
        });

        logger.debug(`Kafka event published: ${eventType} → ${topic} [${key}]`);
    } catch (error) {
        // Kafka publish failures should not break the main flow
        logger.error(`Failed to publish Kafka event ${eventType}:`, error);
    }
};
