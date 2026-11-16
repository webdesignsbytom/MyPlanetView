import { Router } from 'express';
import { deleteMomentHandler, updateMomentHandler } from '../controllers/moments.js';
import { requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';

// Mounted at /api/moments. Listing and adding live under /api/maps/:mapId/moments (and a
// trip's under /api/trips/:tripId/moments). `verified`: every change needs a verified
// email address (see routes/maps.js).
const router = Router();

router.use(validateAuthentication);

router.patch('/:momentId', verified, updateMomentHandler);
router.delete('/:momentId', verified, deleteMomentHandler);

export default router;
