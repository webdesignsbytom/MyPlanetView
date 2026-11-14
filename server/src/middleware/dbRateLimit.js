// Rate limiting with counters in Postgres (the RateLimit table), so every Vercel
// instance shares one count. Ported from NextDummy's rateLimitShared. The
// in-memory express-rate-limit limiters in rateLimit.js stay for the template's
// own routes; the travel routes use these.
import { prisma } from '../prisma.js';
import { sendMessageResponse } from '../utils/responses/responses.js';

/** One fixed-window count: `{ ok, remaining, resetAt, retryAfterMs }`. Fails open. */
export async function rateLimitShared({ key, windowMs, max }) {
  const now = Date.now();
  const resetAt = new Date(now + windowMs);

  let row;
  try {
    // One upsert with an atomic increment: two instances racing can't both read the same count
    row = await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, resetAt },
      update: { count: { increment: 1 } },
    });
  } catch {
    return { ok: true, remaining: max, resetAt: now + windowMs, retryAfterMs: 0 };
  }

  // The window has passed: this request starts a new one
  if (row.resetAt.getTime() <= now) {
    await prisma.rateLimit.update({ where: { key }, data: { count: 1, resetAt } }).catch(() => {});
    return { ok: true, remaining: max - 1, resetAt: now + windowMs, retryAfterMs: 0 };
  }

  const resetMs = row.resetAt.getTime();
  if (row.count > max) {
    return { ok: false, remaining: 0, resetAt: resetMs, retryAfterMs: resetMs - now };
  }
  return { ok: true, remaining: Math.max(0, max - row.count), resetAt: resetMs, retryAfterMs: 0 };
}

/**
 * Express middleware: `name` keeps each limit's counters apart; the key is the
 * visitor's IP (`trust proxy` is set in server.js). Off under test.
 */
export const createDbRateLimiter = ({ name, windowMs, max, keyFor = (req) => req.ip }) =>
  async function dbRateLimiter(req, res, next) {
    if (process.env.NODE_ENV === 'test') return next();
    const result = await rateLimitShared({ key: `${name}:${keyFor(req) || 'unknown'}`, windowMs, max });
    if (result.ok) return next();
    res.set('Retry-After', String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))));
    return sendMessageResponse(res, 429, 'Too many requests — please try again later.');
  };

/** Remove finished windows (run by the daily clean-up cron). */
export const deleteExpiredRateLimits = () =>
  prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
