import { getEmailPreferencesHandler, putEmailPreferencesHandler } from '../controllers/emails.js';
import { createReferralHandler, getReferralHandler } from '../controllers/referrals.js';
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
  getExportHandler,
  getMapExportHandler,
  getMapPhotosExportHandler,
  getUploadsExportHandler,
} from '../controllers/dataExport.js';
import {
  adminTransferMapHandler,
  createGrantHandler,
  endGrantHandler,
  listGrantsHandler,
} from '../controllers/planAdmin.js';
import { createPromoCodeHandler, listPromoCodesHandler, updatePromoCodeHandler } from '../controllers/promoCodes.js';
import { createThemeHandler, deleteThemeHandler, listThemesHandler, updateThemeHandler } from '../controllers/themes.js';
import {
  createOfferHandler,
  deleteOfferHandler,
  importOffersHandler,
  listAdminOffersHandler,
  updateOfferHandler,
} from '../controllers/offers.js';
// Middleware
import {
  validateAuthentication,
  validateAdminRole,
  requireVerifiedEmail,
} from '../middleware/auth.js';
import { createDbRateLimiter, keyByUserId } from '../middleware/dbRateLimit.js';
import { DATA_EXPORT_RATE_LIMIT } from '../utils/constants/rateLimitConstants.js';

const router = Router();

// Other account actions: better-auth (/api/auth/*)

// Map viewing preferences (docs/API.md, "Map settings")
// Emails people can stop (docs/API.md "Emails")
router.get('/email-preferences', validateAuthentication, getEmailPreferencesHandler);
router.put('/email-preferences', validateAuthentication, putEmailPreferencesHandler);
// Give a month, get a month: the member's own invite code (docs/API.md); making one needs a verified address
router.get('/referral', validateAuthentication, getReferralHandler);
router.post('/referral', validateAuthentication, requireVerifiedEmail, createReferralHandler);
router.get('/map-settings', validateAuthentication, getMapSettingsHandler);
router.put('/map-settings', validateAuthentication, putMapSettingsHandler);

// Leaving: what happens to your maps and photos when you delete your account
// (docs/API.md, "Leaving"). An account change, so no verified email needed.
router.get('/leaving-options', validateAuthentication, getLeavingOptionsHandler);
router.put('/leaving-plan', validateAuthentication, putLeavingPlanHandler);

// "Download my data" (docs/API.md, "Your data"): the parts of one file, read only, your
// own data only, on every plan
const dataExportLimiter = createDbRateLimiter({ ...DATA_EXPORT_RATE_LIMIT, keyFor: keyByUserId });
router.get('/export', validateAuthentication, dataExportLimiter, getExportHandler);
router.get('/export/uploads', validateAuthentication, dataExportLimiter, getUploadsExportHandler);
router.get('/export/maps/:mapId', validateAuthentication, dataExportLimiter, getMapExportHandler);
router.get('/export/maps/:mapId/photos', validateAuthentication, dataExportLimiter, getMapPhotosExportHandler);

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

// Influencer codes (docs/API.md, "Promo codes")
router.get('/admin/promo-codes', validateAuthentication, validateAdminRole, listPromoCodesHandler);
router.post('/admin/promo-codes', validateAuthentication, validateAdminRole, createPromoCodeHandler);
router.patch('/admin/promo-codes/:promoCodeId', validateAuthentication, validateAdminRole, updatePromoCodeHandler);

// Travel offers (docs/API.md, "Travel offers"): the ad cards and the Travel Desk
router.get('/admin/offers', validateAuthentication, validateAdminRole, listAdminOffersHandler);
router.post('/admin/offers', validateAuthentication, validateAdminRole, createOfferHandler);
router.post('/admin/offers/import', validateAuthentication, validateAdminRole, importOffersHandler);
router.patch('/admin/offers/:offerId', validateAuthentication, validateAdminRole, updateOfferHandler);
router.delete('/admin/offers/:offerId', validateAuthentication, validateAdminRole, deleteOfferHandler);

// Monthly photo themes (docs/API.md, "Photo themes"): one a month, set in advance
router.get('/admin/themes', validateAuthentication, validateAdminRole, listThemesHandler);
router.post('/admin/themes', validateAuthentication, validateAdminRole, createThemeHandler);
router.patch('/admin/themes/:themeId', validateAuthentication, validateAdminRole, updateThemeHandler);
router.delete('/admin/themes/:themeId', validateAuthentication, validateAdminRole, deleteThemeHandler);

export default router;
