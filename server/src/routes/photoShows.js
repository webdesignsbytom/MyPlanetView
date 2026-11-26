import { Router } from 'express';
import {
  deletePhotoShowHandler,
  getPhotoShowHandler,
  getPhotoShowPhotosHandler,
  resetPhotoShowLinkHandler,
  updatePhotoShowHandler,
} from '../controllers/photoShows.js';
import { requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';
import { createDbRateLimiter } from '../middleware/dbRateLimit.js';
import { showCodeMatchesNothing } from '../middleware/shareLookup.js';
import { SHARE_BROWSE_RATE_LIMIT, SHARE_LOOKUP_RATE_LIMIT } from '../utils/constants/rateLimitConstants.js';

// Slideshows of chosen photos (docs/API.md "Photo slideshows"). Mounted at /api/show: a show by
// its link's code, for anyone (no sign-in), under the share links' limits: opening one always
// counts against the lookup limit, where codes would be guessed (the same count as a share
// link's), its photos only when the code matches nothing, else the looser browsing limit.
// And at /api/photo-shows: changing, re-linking and deleting one (its map's editors). Making
// one and listing a map's are /api/maps/:mapId/photo-shows.
const lookupLimiter = createDbRateLimiter(SHARE_LOOKUP_RATE_LIMIT);
const failedLookupLimiter = createDbRateLimiter({ ...SHARE_LOOKUP_RATE_LIMIT, when: (req) => showCodeMatchesNothing(req.params.code) });
const browseLimiter = createDbRateLimiter(SHARE_BROWSE_RATE_LIMIT);

export const showRouter = Router();
showRouter.get('/:code', lookupLimiter, getPhotoShowHandler);
showRouter.get('/:code/photos', failedLookupLimiter, browseLimiter, getPhotoShowPhotosHandler);

export const photoShowRouter = Router();
photoShowRouter.patch('/:showId', validateAuthentication, verified, updatePhotoShowHandler);
photoShowRouter.post('/:showId/reset-link', validateAuthentication, verified, resetPhotoShowLinkHandler);
photoShowRouter.delete('/:showId', validateAuthentication, verified, deletePhotoShowHandler);
