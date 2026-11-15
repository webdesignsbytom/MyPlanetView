import { Router } from 'express';
import {
  addPhotoLandmarkHandler,
  confirmPhotoLandmarkHandler,
  deletePhotoHandler,
  getPhotoHandler,
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

// Landmark matches
router.post('/:photoId/landmarks', verified, addPhotoLandmarkHandler);
router.patch('/:photoId/landmarks/:landmarkId', verified, confirmPhotoLandmarkHandler);
router.delete('/:photoId/landmarks/:landmarkId', verified, removePhotoLandmarkHandler);

export default router;
