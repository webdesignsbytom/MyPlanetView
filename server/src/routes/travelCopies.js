import { Router } from 'express';
import {
  approveCopyHandler,
  cancelCopyHandler,
  continueCopyHandler,
  declineCopyHandler,
  getCopyHandler,
} from '../controllers/travelCopies.js';
import { requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';

// Mounted at /api/travel-copies: one request to copy someone's travels to their own map
// (docs/API.md "Travel copies"). Asking and listing are on the map: /api/maps/:mapId/travel-copies.
const router = Router();

router.use(validateAuthentication);

router.get('/:id', getCopyHandler);
router.post('/:id/approve', verified, approveCopyHandler);
router.post('/:id/decline', verified, declineCopyHandler);
router.post('/:id/continue', verified, continueCopyHandler);
router.delete('/:id', verified, cancelCopyHandler);

export default router;
