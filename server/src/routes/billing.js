import { Router } from 'express';
import {
  changePlanHandler,
  checkoutHandler,
  extraMapsHandler,
  getBillingHandler,
  portalHandler,
} from '../controllers/billing.js';
import { requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';
import { createDbRateLimiter, keyByUserId } from '../middleware/dbRateLimit.js';
import { BILLING_RATE_LIMIT } from '../utils/constants/rateLimitConstants.js';

// Mounted at /api/billing (docs/API.md, "Plans and billing"). Signed in; every write
// needs a verified email address and calls Stripe, so it's rate limited per user.
// The webhook (POST /api/billing/webhook) is mounted in server.js, before the JSON
// parser, as it needs the raw body.
const router = Router();
const billingLimiter = createDbRateLimiter({ ...BILLING_RATE_LIMIT, keyFor: keyByUserId });

router.use(validateAuthentication);

router.get('/', getBillingHandler);
router.post('/checkout', verified, billingLimiter, checkoutHandler);
router.post('/change-plan', verified, billingLimiter, changePlanHandler);
router.post('/extra-maps', verified, billingLimiter, extraMapsHandler);
router.post('/portal', verified, billingLimiter, portalHandler);

export default router;
