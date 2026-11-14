import { Router } from 'express';
import {
  createStopHandler,
  deleteStopHandler,
  deleteTripHandler,
  getTripHandler,
  getTripsSharedWithMeHandler,
  putTripTravellersHandler,
  reorderStopsHandler,
  updateStopHandler,
  updateTripHandler,
} from '../controllers/trips.js';
import { getTripPhotosHandler } from '../controllers/photos.js';
import { sharingHandlers } from '../controllers/sharing.js';
import { validateAuthentication } from '../middleware/auth.js';
import { createDbRateLimiter } from '../middleware/dbRateLimit.js';
import { MEMBER_INVITE_RATE_LIMIT } from '../utils/constants/rateLimitConstants.js';

// Mounted at /api/trips. Everything needs a signed-in user; roles are checked per trip.
const router = Router();
const sharing = sharingHandlers('trips');
const memberInviteLimiter = createDbRateLimiter(MEMBER_INVITE_RATE_LIMIT);

router.use(validateAuthentication);

// Trips added to the user directly (before /:tripId)
router.get('/shared-with-me', getTripsSharedWithMeHandler);

// One trip
router.get('/:tripId', getTripHandler);
router.patch('/:tripId', updateTripHandler);
router.delete('/:tripId', deleteTripHandler);
router.put('/:tripId/travellers', putTripTravellersHandler);
router.get('/:tripId/photos', getTripPhotosHandler);

// Stops (/order before /:stopId)
router.post('/:tripId/stops', createStopHandler);
router.put('/:tripId/stops/order', reorderStopsHandler);
router.patch('/:tripId/stops/:stopId', updateStopHandler);
router.delete('/:tripId/stops/:stopId', deleteStopHandler);

// Sharing
router.get('/:id/sharing', sharing.get);
router.patch('/:id/sharing', sharing.update);
router.post('/:id/sharing/reset-link', sharing.resetLink);
router.post('/:id/members', memberInviteLimiter, sharing.addMember);
router.patch('/:id/members/:userId', sharing.updateMember);
router.delete('/:id/members/:userId', sharing.removeMember);
router.delete('/:id/invites/:inviteId', sharing.deleteInvite);

export default router;
