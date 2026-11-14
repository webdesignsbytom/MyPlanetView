// Delete uploads never attached to anything (same job as the Vercel cron)
// Usage: npm run media:cleanup [-- --hours 24]
import 'dotenv/config';
import { prisma } from '../src/prisma.js';
import { deleteOrphanUploads } from '../src/services/s3/mediaService.js';

const hoursFlag = process.argv.indexOf('--hours');
const olderThanHours = hoursFlag > -1 ? Number(process.argv[hoursFlag + 1]) : undefined;

try {
  const { checked, deleted } = await deleteOrphanUploads({ olderThanHours });
  console.log(`Checked ${checked} unlinked upload(s), deleted ${deleted}.`);
} catch (err) {
  console.error('Orphan cleanup failed:', err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
