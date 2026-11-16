import { Router } from 'express';
import {
  createChallengeHandler,
  deleteChallengeHandler,
  getChallengeHandler,
  getMyChallengesHandler,
  joinChallengeHandler,
  leaveChallengeHandler,
  previewChallengeHandler,
  resetChallengeLinkHandler,
  setMyChallengeMapHandler,
  updateChallengeHandler,
} from '../controllers/challenges.js';
import { attachUserIfPresent, requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';
import { createDbRateLimiter, keyByUserId } from '../middleware/dbRateLimit.js';
import { CHALLENGE_CREATE_DAILY_USER_LIMIT, CHALLENGE_LOOKUP_RATE_LIMIT } from '../utils/constants/rateLimitConstants.js';

// Mounted at /api/challenges (docs/API.md, "Friends challenges"). Signed in for everything
// but the link's preview, which anyone may open (rate limited per IP: codes would be
// guessed there). `verified`: starting, joining and changing need a verified email address
// (a joiner's name goes on the leaderboard); leaving never does.
const router = Router();
const createDailyLimiter = createDbRateLimiter({ ...CHALLENGE_CREATE_DAILY_USER_LIMIT, keyFor: keyByUserId });
const lookupLimiter = createDbRateLimiter(CHALLENGE_LOOKUP_RATE_LIMIT);

// By the join link (before /:challengeId)
router.get('/join/:code', attachUserIfPresent, lookupLimiter, previewChallengeHandler);
router.post('/join/:code', validateAuthentication, verified, lookupLimiter, joinChallengeHandler);

router.get('/', validateAuthentication, getMyChallengesHandler);
router.post('/', validateAuthentication, verified, createDailyLimiter, createChallengeHandler);
router.get('/:challengeId', validateAuthentication, getChallengeHandler);
router.patch('/:challengeId', validateAuthentication, verified, updateChallengeHandler);
router.delete('/:challengeId', validateAuthentication, verified, deleteChallengeHandler);
router.post('/:challengeId/reset-link', validateAuthentication, verified, resetChallengeLinkHandler);
router.patch('/:challengeId/me', validateAuthentication, verified, setMyChallengeMapHandler);
router.delete('/:challengeId/me', validateAuthentication, leaveChallengeHandler);

export default router;
