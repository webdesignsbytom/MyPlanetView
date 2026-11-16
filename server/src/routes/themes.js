import { Router } from 'express';
import { getThemesHandler } from '../controllers/themes.js';

// Mounted at /api/themes (docs/API.md, "Photo themes"): the theme running this month and
// the recent ones, for anyone. A map's albums are under /api/maps/:mapId/themes, entering
// a photo under /api/photos/:photoId/themes, and the admin's under /api/users/admin/themes.
const router = Router();

router.get('/', getThemesHandler);

export default router;
