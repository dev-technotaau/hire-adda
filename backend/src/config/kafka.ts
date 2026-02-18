import fs from 'fs';
import { Consumer, Kafka, logLevel, Producer } from 'kafkajs';
import path from 'path';
import { env } from './env';
import logger from './logger';

let kafka: Kafka | null = null;
let producer: Producer | null = null;
let consumer: Consumer | null = null;

try {
    const brokers = env.KAFKA_BROKERS ? env.KAFKA_BROKERS.split(',') : ['localhost:9092'];

    const kafkaConfig: any = {
        clientId: env.KAFKA_CLIENT_ID,
        brokers: brokers,
        logLevel: logLevel.ERROR,
    };

    // Add SASL authentication if username/password are present
    if (env.KAFKA_USERNAME && env.KAFKA_PASSWORD) {
        // Load Aiven CA certificate for TLS if available
        const caPath = path.resolve(__dirname, '../../certs/aiven-ca.pem');
        const caExists = fs.existsSync(caPath);

        kafkaConfig.ssl = caExists
            ? { ca: [fs.readFileSync(caPath, 'utf-8')] }
            : true;

        kafkaConfig.sasl = {
            mechanism: (env.KAFKA_SASL_MECHANISM as 'plain' | 'scram-sha-256' | 'scram-sha-512') || 'plain',
            username: env.KAFKA_USERNAME,
            password: env.KAFKA_PASSWORD,
        };

        if (caExists) {
            logger.info('🔐 Kafka TLS: Using Aiven CA certificate');
        }
    }

    kafka = new Kafka(kafkaConfig);
    logger.info(`✅ Kafka client initialized with brokers: ${brokers.join(', ')}`);

    producer = kafka.producer();
    consumer = kafka.consumer({ groupId: 'talent-bridge-backend-group' });

} catch (error) {
    logger.error('❌ Kafka initialization failed:', error);
}

export const connectKafka = async () => {
    if (!producer || !consumer) return;

    try {
        await producer.connect();
        logger.info('✅ Kafka Producer connected');

        // Example subscription (can be moved to a separate worker)
        // await consumer.connect();
        // await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });
        // logger.info('✅ Kafka Consumer connected');
    } catch (error) {
        logger.error('❌ Failed to connect to Kafka:', error);
    }
};

export { consumer, kafka, producer };

