import { Router } from 'express';
import { getCountriesHandler, getLandmarksHandler } from '../controllers/places.js';

// Public reference data, mounted at /api
const router = Router();

router.get('/countries', getCountriesHandler);
router.get('/landmarks', getLandmarksHandler);

export default router;
