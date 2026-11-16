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
import { getLeavingOptionsHandler, putLeavingPlanHandler } from '../controllers/leaving.js';
import {
  adminTransferMapHandler,
  createGrantHandler,
  endGrantHandler,
  listGrantsHandler,
} from '../controllers/planAdmin.js';
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

// Leaving: what happens to your maps and photos when you delete your account
// (docs/API.md, "Leaving"). An account change, so no verified email needed.
router.get('/leaving-options', validateAuthentication, getLeavingOptionsHandler);
router.put('/leaving-plan', validateAuthentication, putLeavingPlanHandler);

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

// Admin: complimentary memberships, and moving a map whose owner can't
router.get('/admin/plan-grants/:userId', validateAuthentication, validateAdminRole, listGrantsHandler);
router.post('/admin/plan-grants/:userId', validateAuthentication, validateAdminRole, createGrantHandler);
router.patch('/admin/end-plan-grant/:grantId', validateAuthentication, validateAdminRole, endGrantHandler);
router.post('/admin/transfer-map', validateAuthentication, validateAdminRole, adminTransferMapHandler);

export default router;
