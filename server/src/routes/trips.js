import { Router } from 'express';
import {
  addTripToMapHandler,
  createStopHandler,
  deleteStopHandler,
  deleteTripHandler,
  getTripHandler,
  getTripsSharedWithMeHandler,
  putTripTravellersHandler,
  removeTripFromMapHandler,
  reorderStopsHandler,
  updateStopHandler,
  updateTripHandler,
} from '../controllers/trips.js';
import { getTripPhotosHandler } from '../controllers/photos.js';
import { getTripMomentsHandler } from '../controllers/moments.js';
import { sharingHandlers } from '../controllers/sharing.js';
import { requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';
import { createDbRateLimiter, keyByUserId } from '../middleware/dbRateLimit.js';
import {
  MEMBER_INVITE_DAILY_USER_LIMIT,
  MEMBER_INVITE_RATE_LIMIT,
} from '../utils/constants/rateLimitConstants.js';

// Mounted at /api/trips. Everything needs a signed-in user; roles are checked per trip.
// `verified`: every change needs a verified email address (see routes/maps.js).
const router = Router();
const sharing = sharingHandlers('trips');
const memberInviteLimiter = createDbRateLimiter(MEMBER_INVITE_RATE_LIMIT);
// Shared with the maps router (same name): one daily count per user for both
const memberInviteDailyLimiter = createDbRateLimiter({ ...MEMBER_INVITE_DAILY_USER_LIMIT, keyFor: keyByUserId });

router.use(validateAuthentication);

// Trips added to the user directly (before /:tripId)
router.get('/shared-with-me', getTripsSharedWithMeHandler);

// One trip
router.get('/:tripId', getTripHandler);
router.patch('/:tripId', verified, updateTripHandler);
router.delete('/:tripId', verified, deleteTripHandler);
router.put('/:tripId/travellers', verified, putTripTravellersHandler);
router.get('/:tripId/photos', getTripPhotosHandler);
router.get('/:tripId/moments', getTripMomentsHandler);

// Group trips: showing the trip on your own maps ("Add to my map")
router.post('/:tripId/maps', verified, addTripToMapHandler);
router.delete('/:tripId/maps/:mapId', verified, removeTripFromMapHandler);

// Stops (/order before /:stopId)
router.post('/:tripId/stops', verified, createStopHandler);
router.put('/:tripId/stops/order', verified, reorderStopsHandler);
router.patch('/:tripId/stops/:stopId', verified, updateStopHandler);
router.delete('/:tripId/stops/:stopId', verified, deleteStopHandler);

// Sharing
router.get('/:id/sharing', sharing.get);
router.patch('/:id/sharing', verified, sharing.update);
router.post('/:id/sharing/reset-link', verified, sharing.resetLink);
router.post('/:id/members', verified, memberInviteLimiter, memberInviteDailyLimiter, sharing.addMember);
router.patch('/:id/members/:userId', verified, sharing.updateMember);
router.delete('/:id/members/:userId', verified, sharing.removeMember);
router.delete('/:id/invites/:inviteId', verified, sharing.deleteInvite);

export default router;
