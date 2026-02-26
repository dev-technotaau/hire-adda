import type { Request, Response } from 'express';
import prisma from '../config/prisma';
import { redis } from '../config/redis';
import elasticClient from '../config/elasticsearch';

const startedAt = new Date().toISOString();

/**
 * Full health check — database, Redis, Elasticsearch + system metrics
 * GET /health
 */
export const checkHealth = async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {
    database: 'down',
    redis: 'down',
    elasticsearch: 'down',
  };

  // Check Database
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    checks.database = 'up';
  } catch {
    // Database is down
  }

  // Check Redis
  try {
    if (redis.status === 'ready') {
      checks.redis = 'up';
    }
  } catch {
    // Redis is down
  }

  // Check Elasticsearch
  try {
    const health = await elasticClient.cluster.health();
    if (health.status !== 'red') {
      checks.elasticsearch = 'up';
    }
  } catch {
    // Elasticsearch is down
  }

  const allUp = !Object.values(checks).includes('down');
  const mem = process.memoryUsage();

  res.status(allUp ? 200 : 503).json({
    status: allUp ? 'healthy' : 'degraded',
    checks,
    system: {
      uptime: Math.floor(process.uptime()),
      startedAt,
      memoryUsage: {
        rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
      },
      nodeVersion: process.version,
      pid: process.pid,
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Liveness probe — is the process alive and responding?
 * GET /health/live
 */
export const checkLiveness = (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
};

/**
 * Readiness probe — can we serve traffic? (DB + Redis must be up)
 * GET /health/ready
 */
export const checkReadiness = async (_req: Request, res: Response) => {
  let dbReady = false;
  let redisReady = false;

  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    dbReady = true;
  } catch {
    // DB not ready
  }

  try {
    redisReady = redis.status === 'ready';
  } catch {
    // Redis not ready
  }

  const ready = dbReady && redisReady;

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    checks: { database: dbReady ? 'up' : 'down', redis: redisReady ? 'up' : 'down' },
    timestamp: new Date().toISOString(),
  });
};
