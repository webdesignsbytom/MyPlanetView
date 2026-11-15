import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { attachDatabasePool } from '@vercel/functions';
import pg from 'pg';

const { Pool } = pg;

const globalForPrisma = globalThis;

// IMPORTANT: this satisfies engineType="client"
function makePrisma() {
  // Every Vercel function instance has its own pool, so keep it small and point
  // DATABASE_URL at the provider's pooled (transaction-mode) URL. The adapter
  // sends unnamed statements, which transaction-mode poolers accept.
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DB_POOL_MAX) || 5,
    // Fail a request after 5 s without a connection instead of hanging
    connectionTimeoutMillis: 5000,
    // Close idle connections soon, so a suspended instance doesn't keep them
    idleTimeoutMillis: 5000,
  });
  // On Vercel, keeps the instance alive until idle connections are closed
  // (does nothing elsewhere)
  attachDatabasePool(pool);

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;