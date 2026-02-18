import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

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

    return new Pool({
        connectionString,
        max: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10', 10) * 1000,
    });
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
