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
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({
    connectionString,
    // Supabase free tier has ~20 connection limit — keep pool small
    max: parseInt(process.env.DATABASE_POOL_SIZE || '5', 10),
    // Keep idle connections longer to avoid constant reconnects
    idleTimeoutMillis: 120_000,
    // Allow 30s for connection (Supabase free tier can be slow to wake)
    connectionTimeoutMillis: parseInt(process.env.DATABASE_POOL_TIMEOUT || '30', 10) * 1000,
    // Keep connections alive so Supabase doesn't terminate them
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    // Allow creating new connections even if all are busy (up to max)
    allowExitOnIdle: false,
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
