import { bigqueryClient } from '../config/bigquery';
import { env } from '../config/env';
import logger from '../config/logger';
import { isFeatureEnabled } from '../config/feature-flags';

const DATASET_ID = 'talent_bridge_analytics';

function getDataset() {
  if (!bigqueryClient) return null;
  return bigqueryClient.dataset(DATASET_ID);
}

export const bigqueryService = {
  /**
   * Insert an analytics event row (fire-and-forget).
   */
  async insertEvent(table: string, data: Record<string, unknown>): Promise<void> {
    if (!(await isFeatureEnabled('enableBigQuery'))) return;
    const dataset = getDataset();
    if (!dataset) return;

    try {
      await dataset.table(table).insert([
        {
          ...data,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      // Don't fail on insert errors — analytics is best-effort
      logger.debug(`BigQuery insert to ${table} failed: ${(error as Error).message}`);
    }
  },

  /**
   * Query user registration growth over time.
   */
  async queryUserGrowth(startDate: string, endDate: string): Promise<any[]> {
    if (!(await isFeatureEnabled('enableBigQuery'))) return [];
    if (!bigqueryClient || !env.GOOGLE_CLOUD_PROJECT_ID) return [];

    try {
      const query = `
                SELECT
                    DATE(timestamp) as date,
                    COUNT(*) as registrations
                FROM \`${env.GOOGLE_CLOUD_PROJECT_ID}.${DATASET_ID}.user_events\`
                WHERE event_type = 'sign_up'
                    AND timestamp BETWEEN @startDate AND @endDate
                GROUP BY date
                ORDER BY date
            `;

      const [rows] = await bigqueryClient.query({
        query,
        params: { startDate, endDate },
      });
      return rows;
    } catch (error) {
      logger.debug(`BigQuery user growth query failed: ${(error as Error).message}`);
      return [];
    }
  },

  /**
   * Query application funnel — status transitions.
   */
  async queryApplicationFunnel(startDate: string, endDate: string): Promise<any[]> {
    if (!(await isFeatureEnabled('enableBigQuery'))) return [];
    if (!bigqueryClient || !env.GOOGLE_CLOUD_PROJECT_ID) return [];

    try {
      const query = `
                SELECT
                    status,
                    COUNT(*) as count
                FROM \`${env.GOOGLE_CLOUD_PROJECT_ID}.${DATASET_ID}.application_events\`
                WHERE timestamp BETWEEN @startDate AND @endDate
                GROUP BY status
                ORDER BY count DESC
            `;

      const [rows] = await bigqueryClient.query({
        query,
        params: { startDate, endDate },
      });
      return rows;
    } catch (error) {
      logger.debug(`BigQuery application funnel query failed: ${(error as Error).message}`);
      return [];
    }
  },

  /**
   * Query most popular/in-demand skills.
   */
  async queryPopularSkills(limit: number = 20): Promise<any[]> {
    if (!(await isFeatureEnabled('enableBigQuery'))) return [];
    if (!bigqueryClient || !env.GOOGLE_CLOUD_PROJECT_ID) return [];

    try {
      const query = `
                SELECT
                    skill,
                    COUNT(*) as demand_count
                FROM \`${env.GOOGLE_CLOUD_PROJECT_ID}.${DATASET_ID}.job_events\`,
                    UNNEST(skills) as skill
                WHERE event_type = 'job_posted'
                GROUP BY skill
                ORDER BY demand_count DESC
                LIMIT @limit
            `;

      const [rows] = await bigqueryClient.query({
        query,
        params: { limit },
      });
      return rows;
    } catch (error) {
      logger.debug(`BigQuery popular skills query failed: ${(error as Error).message}`);
      return [];
    }
  },

  /**
   * Query salary trends by industry/location.
   */
  async querySalaryTrends(industry?: string, location?: string): Promise<any[]> {
    if (!(await isFeatureEnabled('enableBigQuery'))) return [];
    if (!bigqueryClient || !env.GOOGLE_CLOUD_PROJECT_ID) return [];

    try {
      let where = 'WHERE salary_min IS NOT NULL';
      const params: Record<string, any> = {};

      if (industry) {
        where += ' AND industry = @industry';
        params.industry = industry;
      }
      if (location) {
        where += ' AND location = @location';
        params.location = location;
      }

      const query = `
                SELECT
                    DATE_TRUNC(timestamp, MONTH) as month,
                    AVG(salary_min) as avg_min_salary,
                    AVG(salary_max) as avg_max_salary,
                    COUNT(*) as job_count
                FROM \`${env.GOOGLE_CLOUD_PROJECT_ID}.${DATASET_ID}.job_events\`
                ${where}
                GROUP BY month
                ORDER BY month
            `;

      const [rows] = await bigqueryClient.query({ query, params });
      return rows;
    } catch (error) {
      logger.debug(`BigQuery salary trends query failed: ${(error as Error).message}`);
      return [];
    }
  },

  /**
   * Query job posting trends over time.
   */
  async queryJobPostingTrends(startDate: string, endDate: string): Promise<any[]> {
    if (!(await isFeatureEnabled('enableBigQuery'))) return [];
    if (!bigqueryClient || !env.GOOGLE_CLOUD_PROJECT_ID) return [];

    try {
      const query = `
                SELECT
                    DATE(timestamp) as date,
                    COUNT(*) as jobs_posted
                FROM \`${env.GOOGLE_CLOUD_PROJECT_ID}.${DATASET_ID}.job_events\`
                WHERE event_type = 'job_posted'
                    AND timestamp BETWEEN @startDate AND @endDate
                GROUP BY date
                ORDER BY date
            `;

      const [rows] = await bigqueryClient.query({
        query,
        params: { startDate, endDate },
      });
      return rows;
    } catch (error) {
      logger.debug(`BigQuery job trends query failed: ${(error as Error).message}`);
      return [];
    }
  },
};
