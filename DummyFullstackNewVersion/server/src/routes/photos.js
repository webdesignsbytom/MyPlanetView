import { Router } from 'express';
import {
  addPhotoLandmarkHandler,
  confirmPhotoLandmarkHandler,
  deletePhotoHandler,
  getPhotoHandler,
  removePhotoLandmarkHandler,
  updatePhotoHandler,
} from '../controllers/photos.js';
import { validateAuthentication } from '../middleware/auth.js';

// Mounted at /api/photos. Uploading and listing live under /api/maps/:mapId/photos.
const router = Router();

router.use(validateAuthentication);

router.get('/:photoId', getPhotoHandler);
router.patch('/:photoId', updatePhotoHandler);
router.delete('/:photoId', deletePhotoHandler);

// Landmark matches
router.post('/:photoId/landmarks', addPhotoLandmarkHandler);
router.patch('/:photoId/landmarks/:landmarkId', confirmPhotoLandmarkHandler);
router.delete('/:photoId/landmarks/:landmarkId', removePhotoLandmarkHandler);

export default router;
