import { consumer } from '../config/kafka';
import logger from '../config/logger';
import { ConsolidatedTopics, KafkaTopics } from './producer';

// Handler functions use dynamic imports to avoid circular dependencies

async function handleUserRegistered(data: any): Promise<void> {
    const { notificationService } = await import('../services/notification.service');
    await notificationService.send({
        userId: data.userId,
        title: 'Welcome to Talent Bridge!',
        message: 'Complete your profile to get started and find your perfect match.',
        type: 'INFO',
        category: 'onboarding',
        channels: ['in_app'],
    });
    logger.info(`Welcome notification sent for user ${data.userId}`);
}

async function handleUserLogin(data: any): Promise<void> {
    const prisma = (await import('../config/prisma')).default;
    await prisma.user.update({
        where: { id: data.userId },
        data: { lastActiveAt: new Date() },
    });
}

async function handleJobPosted(data: any): Promise<void> {
    const { matchingQueue } = await import('../jobs/matching.queue');
    await matchingQueue.add('match-candidates-for-job', {
        jobId: data.jobId,
        companyId: data.companyId,
    });
    logger.info(`Matching queue triggered for new job ${data.jobId}`);
}

async function handleJobUpdated(data: any): Promise<void> {
    const { searchService } = await import('../services/search.service');
    const prisma = (await import('../config/prisma')).default;
    const job = await prisma.jobPost.findUnique({
        where: { id: data.jobId },
        include: { company: true },
    });
    if (job) {
        await searchService.indexJob(job);
        logger.info(`Reindexed updated job ${data.jobId} in Elasticsearch`);
    }
}

async function handleJobClosed(data: any): Promise<void> {
    const { searchService } = await import('../services/search.service');
    await searchService.deleteJob(data.jobId);
    logger.info(`Removed closed job ${data.jobId} from Elasticsearch`);
}

async function handleApplicationSubmitted(data: any): Promise<void> {
    const prisma = (await import('../config/prisma')).default;
    const application = await prisma.jobApplication.findUnique({
        where: { id: data.applicationId },
        include: {
            job: { include: { company: true } },
            candidate: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
    });
    if (!application) return;

    const { notificationService } = await import('../services/notification.service');
    await notificationService.send({
        userId: application.job.company.userId,
        title: 'New Application Received',
        message: `${application.candidate.user.firstName} ${application.candidate.user.lastName} applied for "${application.job.title}".`,
        type: 'INFO',
        category: 'application',
        link: `/employer/applications/${application.id}`,
        channels: ['in_app'],
    });
    logger.info(`Employer notified about application ${data.applicationId}`);
}

async function handleApplicationStatusChanged(data: any): Promise<void> {
    const prisma = (await import('../config/prisma')).default;
    const application = await prisma.jobApplication.findUnique({
        where: { id: data.applicationId },
        include: {
            job: { select: { title: true } },
            candidate: { select: { userId: true } },
        },
    });
    if (!application) return;

    const { notificationService } = await import('../services/notification.service');
    await notificationService.send({
        userId: application.candidate.userId,
        title: 'Application Status Updated',
        message: `Your application for "${application.job.title}" has been updated to ${data.newStatus}.`,
        type: 'INFO',
        category: 'application',
        link: `/candidate/applications/${application.id}`,
        channels: ['in_app'],
    });
    logger.info(`Candidate notified about status change for application ${data.applicationId}`);
}

async function handleProfileUpdated(data: any): Promise<void> {
    const { matchingQueue } = await import('../jobs/matching.queue');
    await matchingQueue.add('match-jobs', { userId: data.userId });
    logger.info(`Matching queue triggered for updated profile ${data.userId}`);
}

/**
 * Dispatch webhook events for relevant Kafka topics (fire-and-forget).
 */
async function dispatchWebhook(eventType: string, data: any): Promise<void> {
    const eventMap: Record<string, string> = {
        [KafkaTopics.JOB_POSTED]: 'job.posted',
        [KafkaTopics.JOB_UPDATED]: 'job.updated',
        [KafkaTopics.JOB_CLOSED]: 'job.closed',
        [KafkaTopics.APPLICATION_SUBMITTED]: 'application.submitted',
        [KafkaTopics.APPLICATION_STATUS_CHANGED]: 'application.status_changed',
        [KafkaTopics.PROFILE_UPDATED]: 'candidate.profile_updated',
    };

    const webhookEvent = eventMap[eventType];
    if (webhookEvent) {
        const { webhookService } = await import('../services/webhook.service');
        webhookService.dispatch(webhookEvent, data).catch(() => {});
    }
}

/**
 * Route a message to the appropriate handler based on the eventType field.
 */
/**
 * Stream events to BigQuery for analytics (fire-and-forget).
 */
async function streamToBigQuery(eventType: string, data: any): Promise<void> {
    const tableMap: Record<string, string> = {
        [KafkaTopics.USER_REGISTERED]: 'user_events',
        [KafkaTopics.USER_LOGIN]: 'user_events',
        [KafkaTopics.JOB_POSTED]: 'job_events',
        [KafkaTopics.JOB_UPDATED]: 'job_events',
        [KafkaTopics.JOB_CLOSED]: 'job_events',
        [KafkaTopics.APPLICATION_SUBMITTED]: 'application_events',
        [KafkaTopics.APPLICATION_STATUS_CHANGED]: 'application_events',
    };

    const table = tableMap[eventType];
    if (table) {
        const { bigqueryService } = await import('../services/bigquery.service');
        bigqueryService.insertEvent(table, { event_type: eventType, ...data }).catch(() => {});
    }
}

/**
 * Increment Firestore live counters (fire-and-forget).
 */
async function incrementFirestoreCounters(eventType: string): Promise<void> {
    const counterMap: Record<string, string> = {
        [KafkaTopics.USER_REGISTERED]: 'newUsersToday',
        [KafkaTopics.USER_LOGIN]: 'activeUsers',
        [KafkaTopics.JOB_POSTED]: 'jobsPostedToday',
        [KafkaTopics.APPLICATION_SUBMITTED]: 'applicationsToday',
    };

    const metric = counterMap[eventType];
    if (metric) {
        const { firestoreCountersService } = await import('../services/firestore-counters.service');
        firestoreCountersService.incrementCounter(metric as any).catch(() => {});
    }
}

/**
 * Push event to in-memory ring buffer for admin event viewer.
 */
function pushToEventBuffer(eventType: string, topic: string, key: string | null): void {
    import('../services/kafka-events.service').then(({ kafkaEventsService }) => {
        kafkaEventsService.push({
            eventType,
            topic,
            key,
            timestamp: new Date().toISOString(),
        });
    }).catch(() => {});
}

async function routeByEventType(eventType: string, data: any): Promise<void> {
    // Dispatch webhook events (fire-and-forget)
    dispatchWebhook(eventType, data).catch(() => {});
    // Stream to BigQuery (fire-and-forget)
    streamToBigQuery(eventType, data).catch(() => {});
    // Increment Firestore counters (fire-and-forget)
    incrementFirestoreCounters(eventType).catch(() => {});

    switch (eventType) {
        case KafkaTopics.USER_REGISTERED:
            await handleUserRegistered(data);
            break;
        case KafkaTopics.USER_LOGIN:
            await handleUserLogin(data);
            break;
        case KafkaTopics.JOB_POSTED:
            await handleJobPosted(data);
            break;
        case KafkaTopics.JOB_UPDATED:
            await handleJobUpdated(data);
            break;
        case KafkaTopics.JOB_CLOSED:
            await handleJobClosed(data);
            break;
        case KafkaTopics.APPLICATION_SUBMITTED:
            await handleApplicationSubmitted(data);
            break;
        case KafkaTopics.APPLICATION_STATUS_CHANGED:
            await handleApplicationStatusChanged(data);
            break;
        case KafkaTopics.PROFILE_UPDATED:
            await handleProfileUpdated(data);
            break;
        case KafkaTopics.NOTIFICATION_SENT:
            logger.debug(`Notification delivered: ${data.notificationId || data.userId}`);
            break;
        default:
            logger.debug(`Unhandled Kafka event type: ${eventType}`);
    }
}

export const startKafkaConsumer = async (): Promise<void> => {
    if (!consumer) {
        logger.warn('Kafka consumer not available - skipping consumer start');
        return;
    }

    try {
        await consumer.connect();

        // Subscribe to all 4 consolidated topics
        const topics = Object.values(ConsolidatedTopics);
        for (const topic of topics) {
            await consumer.subscribe({ topic, fromBeginning: false });
        }

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const value = message.value?.toString();
                    if (!value) return;

                    const data = JSON.parse(value);
                    const eventType = data.eventType;

                    logger.debug(`Kafka message received: ${topic} → ${eventType} [partition: ${partition}]`, {
                        key: message.key?.toString(),
                        timestamp: data.timestamp,
                    });

                    if (!eventType) {
                        logger.warn(`Kafka message on ${topic} missing eventType field, skipping`);
                        return;
                    }

                    // Push to event buffer for admin viewer
                    pushToEventBuffer(eventType, topic, message.key?.toString() || null);

                    await routeByEventType(eventType, data);
                } catch (error) {
                    logger.error(`Error processing Kafka message on topic ${topic}:`, error);
                }
            },
        });

        logger.info(`Kafka consumer started, subscribed to: ${topics.join(', ')}`);
    } catch (error) {
        logger.error('Failed to start Kafka consumer:', error);
    }
};

export const stopKafkaConsumer = async (): Promise<void> => {
    if (!consumer) return;
    try {
        await consumer.disconnect();
        logger.info('Kafka consumer disconnected');
    } catch (error) {
        logger.error('Error disconnecting Kafka consumer:', error);
    }
};
