import { Router } from 'express';
import {
  createVsGroupHandler,
  deleteVsGroupHandler,
  getMyVsGroupsHandler,
  getVsGroupHandler,
  joinVsGroupHandler,
  leaveVsGroupHandler,
  previewVsGroupHandler,
  resetVsLinkHandler,
  setMyVsMapHandler,
  updateVsGroupHandler,
} from '../controllers/vs.js';
import { attachUserIfPresent, requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';
import { createDbRateLimiter, keyByUserId } from '../middleware/dbRateLimit.js';
import { VS_CREATE_DAILY_USER_LIMIT, VS_LOOKUP_RATE_LIMIT } from '../utils/constants/rateLimitConstants.js';

// Mounted at /api/vs (docs/API.md "Vs mode"), as the friends challenges are: signed in for
// everything but the link's preview, which anyone may open (rate limited per IP: codes would be
// guessed there). Starting, joining and changing need a verified email address (a joiner's name
// and numbers go in the comparison); leaving never does.
const router = Router();
const createDailyLimiter = createDbRateLimiter({ ...VS_CREATE_DAILY_USER_LIMIT, keyFor: keyByUserId });
const lookupLimiter = createDbRateLimiter(VS_LOOKUP_RATE_LIMIT);

// By the join link (before /:groupId)
router.get('/join/:code', attachUserIfPresent, lookupLimiter, previewVsGroupHandler);
router.post('/join/:code', validateAuthentication, verified, lookupLimiter, joinVsGroupHandler);

router.get('/', validateAuthentication, getMyVsGroupsHandler);
router.post('/', validateAuthentication, verified, createDailyLimiter, createVsGroupHandler);
router.get('/:groupId', validateAuthentication, getVsGroupHandler);
router.patch('/:groupId', validateAuthentication, verified, updateVsGroupHandler);
router.delete('/:groupId', validateAuthentication, verified, deleteVsGroupHandler);
router.post('/:groupId/reset-link', validateAuthentication, verified, resetVsLinkHandler);
router.patch('/:groupId/me', validateAuthentication, verified, setMyVsMapHandler);
router.delete('/:groupId/me', validateAuthentication, leaveVsGroupHandler);

export default router;
