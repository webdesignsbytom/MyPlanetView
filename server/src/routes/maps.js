import { Router } from 'express';
import {
  createMapHandler,
  createTravellerHandler,
  deleteMapHandler,
  deleteTravellerHandler,
  deleteVisitHandler,
  getMapHandler,
  getMapStatsHandler,
  getMyMapsHandler,
  putVisitHandler,
  updateMapHandler,
  updateTravellerHandler,
} from '../controllers/maps.js';
import { createTripHandler, getMapTripsHandler } from '../controllers/trips.js';
import { createPhotoHandler, getMapPhotosHandler, presignPhotoHandler } from '../controllers/photos.js';
import { sharingHandlers } from '../controllers/sharing.js';
import { requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';
import { createDbRateLimiter, keyByUserId } from '../middleware/dbRateLimit.js';
import {
  MAP_CREATE_DAILY_USER_LIMIT,
  MEMBER_INVITE_DAILY_USER_LIMIT,
  MEMBER_INVITE_RATE_LIMIT,
  PHOTO_PRESIGN_RATE_LIMIT,
} from '../utils/constants/rateLimitConstants.js';

// Mounted at /api/maps. Everything needs a signed-in user; roles are checked per map.
// `verified`: adding or changing content needs a verified email address. Setting up the
// map (PATCH, travellers) doesn't, so the welcome page works straight after sign-up.
const router = Router();
const sharing = sharingHandlers('maps');
const photoPresignLimiter = createDbRateLimiter(PHOTO_PRESIGN_RATE_LIMIT);
const memberInviteLimiter = createDbRateLimiter(MEMBER_INVITE_RATE_LIMIT);
// Shared with the trips router (same name): one daily count per user for both
const memberInviteDailyLimiter = createDbRateLimiter({ ...MEMBER_INVITE_DAILY_USER_LIMIT, keyFor: keyByUserId });
// New maps a day, per user
const mapCreateDailyLimiter = createDbRateLimiter({ ...MAP_CREATE_DAILY_USER_LIMIT, keyFor: keyByUserId });

router.use(validateAuthentication);

// Maps
router.get('/', getMyMapsHandler);
router.post('/', verified, mapCreateDailyLimiter, createMapHandler);
router.get('/:mapId', getMapHandler);
router.patch('/:mapId', updateMapHandler);
router.delete('/:mapId', verified, deleteMapHandler);
router.get('/:mapId/stats', getMapStatsHandler);

// Travellers
router.post('/:mapId/travellers', createTravellerHandler);
router.patch('/:mapId/travellers/:travellerId', updateTravellerHandler);
router.delete('/:mapId/travellers/:travellerId', deleteTravellerHandler);

// Countries visited
router.put('/:mapId/visits/:countryCode', verified, putVisitHandler);
router.delete('/:mapId/visits/:countryCode', verified, deleteVisitHandler);

// Trips on the map
router.get('/:mapId/trips', getMapTripsHandler);
router.post('/:mapId/trips', verified, createTripHandler);

// Photos on the map
router.post('/:mapId/photos/presign', verified, photoPresignLimiter, presignPhotoHandler);
router.post('/:mapId/photos', verified, createPhotoHandler);
router.get('/:mapId/photos', getMapPhotosHandler);

// Sharing
router.get('/:id/sharing', sharing.get);
router.patch('/:id/sharing', verified, sharing.update);
router.post('/:id/sharing/reset-link', verified, sharing.resetLink);
router.post('/:id/members', verified, memberInviteLimiter, memberInviteDailyLimiter, sharing.addMember);
router.patch('/:id/members/:userId', verified, sharing.updateMember);
router.delete('/:id/members/:userId', verified, sharing.removeMember);
router.delete('/:id/invites/:inviteId', verified, sharing.deleteInvite);

export default router;
