import { Router } from 'express';
import {
  getSharedHandler,
  getSharedPhotoHandler,
  getSharedPhotosHandler,
} from '../controllers/shared.js';
import { attachUserIfPresent } from '../middleware/auth.js';
import { createDbRateLimiter } from '../middleware/dbRateLimit.js';
import {
  SHARE_BROWSE_RATE_LIMIT,
  SHARE_LOOKUP_RATE_LIMIT,
} from '../utils/constants/rateLimitConstants.js';

// Mounted at /api/shared. Anyone may open a share link; a signed-in member keeps their role.
// Opening a link has the tight limit (that's where codes would be guessed); browsing an
// open one has its own, looser count so a visitor isn't blocked after a few photos.
const router = Router();
const shareLookupLimiter = createDbRateLimiter(SHARE_LOOKUP_RATE_LIMIT);
const shareBrowseLimiter = createDbRateLimiter(SHARE_BROWSE_RATE_LIMIT);

router.use(attachUserIfPresent);

router.get('/:code', shareLookupLimiter, getSharedHandler);
router.get('/:code/photos', shareBrowseLimiter, getSharedPhotosHandler);
router.get('/:code/photos/:photoId', shareBrowseLimiter, getSharedPhotoHandler);

export default router;
