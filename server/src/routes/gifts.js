import { Router } from 'express';
import { getGiftHandler, getMyGiftsHandler, redeemGiftHandler } from '../controllers/gifts.js';
import { attachUserIfPresent, requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';
import { createDbRateLimiter } from '../middleware/dbRateLimit.js';
import { GIFT_LOOKUP_RATE_LIMIT } from '../utils/constants/rateLimitConstants.js';

// Mounted at /api/gifts (docs/API.md "Gifts"). Buying is POST /api/billing/gift-checkout.
// A gift's page needs no account (whoever it's for may not have one yet); looking codes up
// and redeeming them share a per-IP limit, as codes could be guessed.
const router = Router();
const giftLookupLimiter = createDbRateLimiter(GIFT_LOOKUP_RATE_LIMIT);

router.get('/', validateAuthentication, getMyGiftsHandler);
router.post('/redeem', validateAuthentication, verified, giftLookupLimiter, redeemGiftHandler);
router.get('/:code', attachUserIfPresent, giftLookupLimiter, getGiftHandler);

export default router;
