import { Router } from 'express';
import { memoryPhotoHandler, onThisDayCronHandler, unsubscribeHandler } from '../controllers/emails.js';
import { createDbRateLimiter } from '../middleware/dbRateLimit.js';
import { EMAIL_LINK_RATE_LIMIT } from '../utils/constants/rateLimitConstants.js';

// Mounted at /api/emails (docs/API.md "Emails"): "On this day"'s daily run (Vercel's cron,
// with CRON_SECRET), and the links in its emails: the picture and unsubscribing. The links are
// signed and need no sign-in; they're rate limited per IP.
const router = Router();
const emailLinkLimiter = createDbRateLimiter(EMAIL_LINK_RATE_LIMIT);

router.get('/on-this-day/cron', onThisDayCronHandler);
router.get('/photos/:photoId', emailLinkLimiter, memoryPhotoHandler);
router.post('/unsubscribe', emailLinkLimiter, unsubscribeHandler);

export default router;
