import rateLimit from 'express-rate-limit';
import {
  GLOBAL_RATE_LIMIT,
  PRESIGN_RATE_LIMIT,
  STRICT_RATE_LIMIT,
} from '../utils/constants/rateLimitConstants.js';

const standardOptions = {
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
  // Same shape as sendMessageResponse so the client shows it
  message: { status: 'fail', message: 'Too many requests — please try again later.' },
  // Disabled under test
  skip: () => process.env.NODE_ENV === 'test',
};

export const globalRateLimiter = rateLimit({
  ...GLOBAL_RATE_LIMIT,
  ...standardOptions,
});

export const presignRateLimiter = rateLimit({
  ...PRESIGN_RATE_LIMIT,
  ...standardOptions,
});

// One counter per form, so one form can't lock out the others
export const createStrictRateLimiter = () =>
  rateLimit({
    ...STRICT_RATE_LIMIT,
    ...standardOptions,
  });
