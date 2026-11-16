import { Router } from 'express';
import {
  getSharedBadgesHandler,
  getSharedGoalsHandler,
  getSharedHandler,
  getSharedMomentsHandler,
  getSharedPassportHandler,
  getSharedPhotoHandler,
  getSharedPhotosHandler,
} from '../controllers/shared.js';
import { attachUserIfPresent } from '../middleware/auth.js';
import { createDbRateLimiter } from '../middleware/dbRateLimit.js';
import { shareCodeMatchesNothing } from '../middleware/shareLookup.js';
import {
  SHARE_BROWSE_RATE_LIMIT,
  SHARE_LOOKUP_RATE_LIMIT,
} from '../utils/constants/rateLimitConstants.js';

// Mounted at /api/shared. Anyone may open a share link; a signed-in member keeps their role.
// Every route is under the lookup limit, where codes would be guessed: opening a link
// always counts, a photo or moment request only when its code matches nothing (one
// count for both). Browsing an open link has its own, looser count.
const router = Router();
const shareLookupLimiter = createDbRateLimiter(SHARE_LOOKUP_RATE_LIMIT);
const failedLookupLimiter = createDbRateLimiter({
  ...SHARE_LOOKUP_RATE_LIMIT,
  when: (req) => shareCodeMatchesNothing(req.params.code),
});
const shareBrowseLimiter = createDbRateLimiter(SHARE_BROWSE_RATE_LIMIT);

router.use(attachUserIfPresent);

router.get('/:code', shareLookupLimiter, getSharedHandler);
router.get('/:code/photos', failedLookupLimiter, shareBrowseLimiter, getSharedPhotosHandler);
router.get('/:code/photos/:photoId', failedLookupLimiter, shareBrowseLimiter, getSharedPhotoHandler);
router.get('/:code/moments', failedLookupLimiter, shareBrowseLimiter, getSharedMomentsHandler);
router.get('/:code/passport', failedLookupLimiter, shareBrowseLimiter, getSharedPassportHandler);
router.get('/:code/badges', failedLookupLimiter, shareBrowseLimiter, getSharedBadgesHandler);
router.get('/:code/goals', failedLookupLimiter, shareBrowseLimiter, getSharedGoalsHandler);

export default router;
