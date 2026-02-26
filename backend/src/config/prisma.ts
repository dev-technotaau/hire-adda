import dotenv from 'dotenv';
dotenv.config();

import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
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

  // Strip ?pgbouncer=true — that's a Prisma-only param, pg Pool doesn't understand it
  const url = new URL(connectionString);
  url.searchParams.delete('pgbouncer');
  connectionString = url.toString();

  // Detect if connecting to Supabase (needs SSL)
  const isSupabase = connectionString.includes('supabase');
  const isLocalhost =
    connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

  const pool = new Pool({
    connectionString,
    // Keep pool small for managed DB services
    max: parseInt(process.env.DATABASE_POOL_SIZE || '5', 10),
    // Don't hold idle connections — Supabase/Supavisor kills them
    idleTimeoutMillis: 30_000,
    // Allow 30s for initial connection (managed DBs can be slow to wake)
    connectionTimeoutMillis: parseInt(process.env.DATABASE_POOL_TIMEOUT || '30', 10) * 1000,
    // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    allowExitOnIdle: false,
    // Supabase requires SSL from external hosts
    ...(isSupabase || !isLocalhost ? { ssl: { rejectUnauthorized: false } } : {}),
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
