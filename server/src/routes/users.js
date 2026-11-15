import { Router } from 'express';
// Controllers
import {
  getAllUsersHandler,
  adminDeleteUserHandler,
  changeUserRoleHandler,
  deactivateUserHandler,
  reactivateUserHandler,
  getLoggedInUserHandler,
  getUserByIdForAdminHandler,
  uploadOrChangeAvatarHandler,
  removeAvatarHandler,
} from '../controllers/users.js';
import { getMapSettingsHandler, putMapSettingsHandler } from '../controllers/mapSettings.js';
// Middleware
import {
  validateAuthentication,
  validateAdminRole,
  requireVerifiedEmail,
} from '../middleware/auth.js';

const router = Router();

// Other account actions: better-auth (/api/auth/*)

// Map viewing preferences (docs/API.md, "Map settings")
router.get('/map-settings', validateAuthentication, getMapSettingsHandler);
router.put('/map-settings', validateAuthentication, putMapSettingsHandler);

// Current user
router.get(
  '/user/get-logged-in-user',
  validateAuthentication,
  getLoggedInUserHandler
);

// Avatar
router.post(
  '/user/upload-or-change-avatar',
  validateAuthentication,
  requireVerifiedEmail,
  uploadOrChangeAvatarHandler
);
router.delete(
  '/user/remove-avatar',
  validateAuthentication,
  removeAvatarHandler
);

// Admin (rules in utils/userPermissions.js)
router.get(
  '/admin/get-user-by-id/:userId',
  validateAuthentication,
  validateAdminRole,
  getUserByIdForAdminHandler
);
router.get(
  '/admin/get-all-users',
  validateAuthentication,
  validateAdminRole,
  getAllUsersHandler
);
router.patch(
  '/admin/change-user-role',
  validateAuthentication,
  validateAdminRole,
  changeUserRoleHandler
);
router.patch(
  '/admin/deactivate-user/:userId',
  validateAuthentication,
  validateAdminRole,
  deactivateUserHandler
);
router.patch(
  '/admin/reactivate-user/:userId',
  validateAuthentication,
  validateAdminRole,
  reactivateUserHandler
);
router.delete(
  '/admin/delete-user-by-id/:userId',
  validateAuthentication,
  validateAdminRole,
  adminDeleteUserHandler
);

export default router;
