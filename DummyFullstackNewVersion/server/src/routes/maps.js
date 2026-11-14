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
import { validateAuthentication } from '../middleware/auth.js';
import { createDbRateLimiter } from '../middleware/dbRateLimit.js';
import {
  MEMBER_INVITE_RATE_LIMIT,
  PHOTO_PRESIGN_RATE_LIMIT,
} from '../utils/constants/rateLimitConstants.js';

// Mounted at /api/maps. Everything needs a signed-in user; roles are checked per map.
const router = Router();
const sharing = sharingHandlers('maps');
const photoPresignLimiter = createDbRateLimiter(PHOTO_PRESIGN_RATE_LIMIT);
const memberInviteLimiter = createDbRateLimiter(MEMBER_INVITE_RATE_LIMIT);

router.use(validateAuthentication);

// Maps
router.get('/', getMyMapsHandler);
router.post('/', createMapHandler);
router.get('/:mapId', getMapHandler);
router.patch('/:mapId', updateMapHandler);
router.delete('/:mapId', deleteMapHandler);
router.get('/:mapId/stats', getMapStatsHandler);

// Travellers
router.post('/:mapId/travellers', createTravellerHandler);
router.patch('/:mapId/travellers/:travellerId', updateTravellerHandler);
router.delete('/:mapId/travellers/:travellerId', deleteTravellerHandler);

// Countries visited
router.put('/:mapId/visits/:countryCode', putVisitHandler);
router.delete('/:mapId/visits/:countryCode', deleteVisitHandler);

// Trips on the map
router.get('/:mapId/trips', getMapTripsHandler);
router.post('/:mapId/trips', createTripHandler);

// Photos on the map
router.post('/:mapId/photos/presign', photoPresignLimiter, presignPhotoHandler);
router.post('/:mapId/photos', createPhotoHandler);
router.get('/:mapId/photos', getMapPhotosHandler);

// Sharing
router.get('/:id/sharing', sharing.get);
router.patch('/:id/sharing', sharing.update);
router.post('/:id/sharing/reset-link', sharing.resetLink);
router.post('/:id/members', memberInviteLimiter, sharing.addMember);
router.patch('/:id/members/:userId', sharing.updateMember);
router.delete('/:id/members/:userId', sharing.removeMember);
router.delete('/:id/invites/:inviteId', sharing.deleteInvite);

export default router;
