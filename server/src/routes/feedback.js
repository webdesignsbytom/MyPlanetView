import { Router } from 'express';
import { presignScreenshotHandler, sendFeedbackHandler } from '../controllers/feedback.js';
import { validateAuthentication } from '../middleware/auth.js';
import { createDbRateLimiter, keyByUserId } from '../middleware/dbRateLimit.js';
import { FEEDBACK_RATE_LIMIT } from '../utils/constants/rateLimitConstants.js';

// Mounted at /api/feedback (docs/API.md "Feedback"): anyone signed in sends a report, with a
// screenshot uploaded first. No verified email needed. The admin's routes are under
// /api/users/admin/feedback.
const router = Router();
// Reports sent an hour, per user (a screenshot's presign is held to the unsent-uploads cap)
const feedbackLimiter = createDbRateLimiter({ ...FEEDBACK_RATE_LIMIT, keyFor: keyByUserId });

router.post('/screenshot/presign', validateAuthentication, presignScreenshotHandler);
router.post('/', validateAuthentication, feedbackLimiter, sendFeedbackHandler);

export default router;
