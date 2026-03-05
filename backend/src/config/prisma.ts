import dotenv from 'dotenv';
dotenv.config();

import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// Ensure Decimal fields serialize as numbers in JSON responses (not strings)
(Prisma.Decimal.prototype as any).toJSON = function () {
  return Number(this);
};

// Singleton pattern for PrismaClient
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Create postgres connection pool
const createPool = () => {
  let connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Strip stray quotes (common copy-paste mistake in env dashboards)
  connectionString = connectionString.replace(/^["']+|["']+$/g, '');

  // Strip ?pgbouncer=true — Prisma-only param that pg Pool doesn't understand
  connectionString = connectionString
    .replace(/[?&]pgbouncer=true/gi, '')
    .replace(/\?$/, '');

  // Detect if connecting to a remote/managed DB (Neon, Supabase, Railway, etc.)
  const isLocalhost =
    connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const isRemote = !isLocalhost;

  const pool = new Pool({
    connectionString,
    // Keep pool small for managed DB services
    max: parseInt(process.env.DATABASE_POOL_SIZE || '5', 10),
    // Don't hold idle connections — managed DB poolers may reclaim them
    idleTimeoutMillis: 30_000,
    // Allow 30s for initial connection (managed DBs can be slow to wake)
    connectionTimeoutMillis: parseInt(process.env.DATABASE_POOL_TIMEOUT || '30', 10) * 1000,
    // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    allowExitOnIdle: false,
    // Remote/managed PostgreSQL providers require SSL
    ...(isRemote ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  // Set statement timeout on every new connection to prevent hung queries
  pool.on('connect', (client) => {
    client.query('SET statement_timeout = 30000').catch(() => {});
  });

  // Prevent unhandled pool errors from crashing the process
  pool.on('error', (err) => {
    console.error('Unexpected PG pool error:', err.message);
  });

  return pool;
};

// Get or create pool
const pool = globalForPrisma.pool ?? createPool();

// Create adapter with pool
const adapter = new PrismaPg(pool);

// Create Prisma client with adapter
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

// Graceful shutdown helper
export const disconnectPrisma = async (): Promise<void> => {
  await prisma.$disconnect();
  await pool.end();
};

export default prisma;
