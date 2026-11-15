import rateLimit from 'express-rate-limit';
import { GLOBAL_RATE_LIMIT, IPV6_SUBNET } from '../utils/constants/rateLimitConstants.js';

/**
 * Every limiter (this one, dbRateLimit.js and better-auth's) is off under test,
 * except in a test that turns them on (tests/integration/rateLimits.test.js).
 */
export const rateLimitsOff = () =>
  process.env.NODE_ENV === 'test' && process.env.RATE_LIMITS_IN_TESTS !== 'true';

// The only in-memory limiter left: a coarse backstop for the whole API. Each
// Vercel instance counts on its own, so anything that matters is on the database
// (dbRateLimit.js, and better-auth's in auth.js).
export const globalRateLimiter = rateLimit({
  ...GLOBAL_RATE_LIMIT,
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
  // An IPv6 visitor counts per /64 (the library's default is /56)
  ipv6Subnet: IPV6_SUBNET,
  // Same shape as sendMessageResponse so the client shows it
  message: { status: 'fail', message: 'Too many requests — please try again later.' },
  skip: rateLimitsOff,
});
