import { Router } from 'express';
import { checkPromoCodeHandler } from '../controllers/promoCodes.js';
import { createDbRateLimiter } from '../middleware/dbRateLimit.js';
import { PROMO_LOOKUP_RATE_LIMIT } from '../utils/constants/rateLimitConstants.js';

// Mounted at /api/promo-codes: the sign-up page checks a code before the account is made
// (no account needed). Lookups are rate limited per IP, as codes could be guessed. The
// admin's routes are under /api/users/admin/promo-codes.
const router = Router();
const promoLookupLimiter = createDbRateLimiter(PROMO_LOOKUP_RATE_LIMIT);

router.get('/:code', promoLookupLimiter, checkPromoCodeHandler);

export default router;
