import { Router } from 'express';
import { deleteGoalHandler, updateGoalHandler } from '../controllers/passport.js';
import { requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';

// Mounted at /api/goals. Listing and adding live under /api/maps/:mapId/goals.
// `verified`: every change needs a verified email address (see routes/maps.js).
const router = Router();

router.use(validateAuthentication);

router.patch('/:goalId', verified, updateGoalHandler);
router.delete('/:goalId', verified, deleteGoalHandler);

export default router;
