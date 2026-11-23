import { Router } from 'express';
import { deleteFlightHandler } from '../controllers/flights.js';
import { requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';

// Mounted at /api/flights (docs/API.md "Flights"): deleting one (its map's editors). A map's
// flights are /api/maps/:mapId/flights.
const router = Router();
router.delete('/:flightId', validateAuthentication, verified, deleteFlightHandler);

export default router;
