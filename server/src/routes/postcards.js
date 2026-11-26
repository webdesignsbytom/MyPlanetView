import { Router } from 'express';
import {
  deletePostcardHandler,
  getMyPostcardsHandler,
  openPostcardHandler,
  presignPostcardPictureHandler,
  resetPostcardLinkHandler,
  sendPostcardHandler,
} from '../controllers/postcards.js';
import { requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';
import { createDbRateLimiter, keyByUserId } from '../middleware/dbRateLimit.js';
import { POSTCARD_CREATE_DAILY_USER_LIMIT, POSTCARD_LOOKUP_RATE_LIMIT } from '../utils/constants/rateLimitConstants.js';

// Postcards (docs/API.md "Postcards"). Mounted at /api/postcards: the sender's own (signed in;
// sending, re-linking and deleting need a verified email address, as every write does; 30 sent a
// day). And at /api/postcard: a card by its link's code, for anyone (no sign-in), rate limited per
// IP as a share link's lookup is, as codes would be guessed there.
const sendDailyLimiter = createDbRateLimiter({ ...POSTCARD_CREATE_DAILY_USER_LIMIT, keyFor: keyByUserId });
const lookupLimiter = createDbRateLimiter(POSTCARD_LOOKUP_RATE_LIMIT);

export const postcardsRouter = Router();
postcardsRouter.get('/', validateAuthentication, getMyPostcardsHandler);
postcardsRouter.post('/picture/presign', validateAuthentication, verified, presignPostcardPictureHandler);
postcardsRouter.post('/', validateAuthentication, verified, sendDailyLimiter, sendPostcardHandler);
postcardsRouter.post('/:postcardId/reset-link', validateAuthentication, verified, resetPostcardLinkHandler);
postcardsRouter.delete('/:postcardId', validateAuthentication, verified, deletePostcardHandler);

export const postcardRouter = Router();
postcardRouter.get('/:code', lookupLimiter, openPostcardHandler);
