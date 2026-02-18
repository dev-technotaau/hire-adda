import { Client } from '@elastic/elasticsearch';
import { env } from './env';

// Elasticsearch Client
const elasticClient = new Client({
    node: env.ELASTICSEARCH_URL,
    auth: env.ELASTICSEARCH_API_KEY
        ? { apiKey: env.ELASTICSEARCH_API_KEY }
        : env.ELASTICSEARCH_USERNAME
            ? {
                username: env.ELASTICSEARCH_USERNAME,
                password: env.ELASTICSEARCH_PASSWORD || '',
            }
            : undefined,
});

export const checkElasticConnection = async () => {
    try {
        const health = await elasticClient.cluster.health();
        console.info(`✅ Elasticsearch connected: ${health.status}`);
    } catch (error) {
        console.error('❌ Elasticsearch connection failed:', error as Error);
        // Don't crash app if search is optional, but log it
    }
};

export default elasticClient;
