import { Router } from 'express';
import {
  addPhotoLandmarkHandler,
  confirmPhotoLandmarkHandler,
  deletePhotoHandler,
  getPhotoHandler,
  movePhotoHandler,
  removePhotoLandmarkHandler,
  updatePhotoHandler,
} from '../controllers/photos.js';
import { requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';

// Mounted at /api/photos. Uploading and listing live under /api/maps/:mapId/photos.
// `verified`: every change needs a verified email address (see routes/maps.js).
const router = Router();

router.use(validateAuthentication);

router.get('/:photoId', getPhotoHandler);
router.patch('/:photoId', verified, updatePhotoHandler);
router.delete('/:photoId', verified, deletePhotoHandler);
// Rearranging a gallery (its country's on the map, or its trip's)
router.post('/:photoId/move', verified, movePhotoHandler);

// Landmark matches
router.post('/:photoId/landmarks', verified, addPhotoLandmarkHandler);
router.patch('/:photoId/landmarks/:landmarkId', verified, confirmPhotoLandmarkHandler);
router.delete('/:photoId/landmarks/:landmarkId', verified, removePhotoLandmarkHandler);

export default router;
