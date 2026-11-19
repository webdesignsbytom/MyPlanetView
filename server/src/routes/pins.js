import { Router } from 'express';
import {
  addPinVisitHandler,
  deletePinHandler,
  deletePinVisitHandler,
  getPinHandler,
  updatePinHandler,
  updatePinVisitHandler,
} from '../controllers/countryMaps.js';
import { requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';

// Mounted at /api/pins: one of a country map's pins and its visits (docs/API.md "Country
// maps"). Listing and adding pins live under /api/maps/:mapId/pins. `verified`: every change
// needs a verified email address (see routes/maps.js).
const router = Router();

router.use(validateAuthentication);

router.get('/:pinId', getPinHandler);
router.patch('/:pinId', verified, updatePinHandler);
router.delete('/:pinId', verified, deletePinHandler);
router.post('/:pinId/visits', verified, addPinVisitHandler);
router.patch('/:pinId/visits/:visitId', verified, updatePinVisitHandler);
router.delete('/:pinId/visits/:visitId', verified, deletePinVisitHandler);

export default router;
