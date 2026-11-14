import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

console.log('[BOOT] prisma.js loaded from', import.meta.url);
const { Pool } = pg;

const globalForPrisma = globalThis;

// IMPORTANT: this satisfies engineType="client"
function makePrisma() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // optional: Vercel can reuse connections, don't go crazy
    max: Number(process.env.DB_POOL_MAX) || 5,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;