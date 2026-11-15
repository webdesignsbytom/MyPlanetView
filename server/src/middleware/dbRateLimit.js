// Rate limiting with counters in Postgres (the RateLimit table), so every Vercel
// instance shares one count. Ported from NextDummy's rateLimitShared. Every limit
// that matters uses these; rateLimit.js keeps only the in-memory global backstop.
import { ipKeyGenerator } from 'express-rate-limit';
import { prisma } from '../prisma.js';
import { sendMessageResponse } from '../utils/responses/responses.js';
import { IPV6_SUBNET } from '../utils/constants/rateLimitConstants.js';
import { rateLimitsOff } from './rateLimit.js';

export const TOO_MANY_REQUESTS_MESSAGE = 'Too many requests — please try again later.';

/**
 * The visitor's IP as a limit key: IPv4 as it is, an IPv4-mapped IPv6 address as
 * IPv4, any other IPv6 address as its /64 (e.g. "2001:db8:1:2::/64").
 */
export const clientIpKey = (ip) => (ip ? ipKeyGenerator(ip, IPV6_SUBNET) : 'unknown');

/** One fixed-window count: `{ ok, remaining, resetAt, retryAfterMs }`. Fails open. */
export async function rateLimitShared({ key, windowMs, max }) {
  const now = Date.now();
  // resetAt is TIMESTAMP(3) holding UTC, like every Prisma DateTime; the casts keep
  // the comparison right whatever the connection's time zone
  const nowUtc = new Date(now).toISOString();
  const resetUtc = new Date(now + windowMs).toISOString();

  let row;
  try {
    // One statement, so it's atomic: a new key starts at 1, a key whose window has
    // passed starts a new window at 1, anything else adds 1. Instances racing can't
    // both start a window or lose a count.
    [row] = await prisma.$queryRaw`
      INSERT INTO "rate_limit" ("key", "count", "resetAt")
      VALUES (${key}, 1, (${resetUtc}::timestamptz AT TIME ZONE 'UTC'))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "rate_limit"."resetAt" <= (${nowUtc}::timestamptz AT TIME ZONE 'UTC') THEN 1
          ELSE "rate_limit"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "rate_limit"."resetAt" <= (${nowUtc}::timestamptz AT TIME ZONE 'UTC') THEN EXCLUDED."resetAt"
          ELSE "rate_limit"."resetAt"
        END
      RETURNING "count", (EXTRACT(EPOCH FROM "resetAt") * 1000)::float8 AS "resetMs"`;
  } catch {
    return { ok: true, remaining: max, resetAt: now + windowMs, retryAfterMs: 0 };
  }
  if (!row) return { ok: true, remaining: max, resetAt: now + windowMs, retryAfterMs: 0 };

  const count = Number(row.count);
  const resetMs = Number(row.resetMs);
  if (count > max) {
    return { ok: false, remaining: 0, resetAt: resetMs, retryAfterMs: Math.max(0, resetMs - now) };
  }
  return { ok: true, remaining: Math.max(0, max - count), resetAt: resetMs, retryAfterMs: 0 };
}

/**
 * Express middleware: `name` keeps each limit's counters apart (two routes with
 * the same name share one count); the key is the visitor's IP, or its /64
 * (`trust proxy` is set in server.js). `when(req)`, if given, decides whether this
 * request counts at all. Off under test.
 */
export const createDbRateLimiter = ({ name, windowMs, max, keyFor = (req) => clientIpKey(req.ip), when }) =>
  async function dbRateLimiter(req, res, next) {
    if (rateLimitsOff()) return next();
    try {
      if (when && !(await when(req))) return next();
    } catch {
      // A failed check counts the request
    }
    const result = await rateLimitShared({ key: `${name}:${keyFor(req) || 'unknown'}`, windowMs, max });
    if (result.ok) return next();
    res.set('Retry-After', String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))));
    return sendMessageResponse(res, 429, TOO_MANY_REQUESTS_MESSAGE);
  };

/** Remove finished windows (run by the daily clean-up cron). */
export const deleteExpiredRateLimits = () =>
  prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });

/**
 * `keyFor` for a limit per signed-in user rather than per IP (mount it after
 * validateAuthentication). Without a user it falls back to the IP.
 */
export const keyByUserId = (req) => (req.user?.id ? `user:${req.user.id}` : `ip:${clientIpKey(req.ip)}`);
