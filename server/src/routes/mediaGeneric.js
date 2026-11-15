import { Router } from 'express';
import {
  presignUploadHandler,
  signViewHandler,
  deleteMediaHandler,
  confirmUploadHandler,
  cleanupOrphanUploadsHandler,
} from '../controllers/mediaGeneric.js';
import {
  validateAuthentication,
  attachUserIfPresent,
  requireVerifiedEmailForAccountUploads,
} from '../middleware/auth.js';
import { createDbRateLimiter } from '../middleware/dbRateLimit.js';
import { MEDIA_UPLOAD_RATE_LIMIT } from '../utils/constants/rateLimitConstants.js';

const router = Router();
// One count for presign and confirm (same name), per IP, in the database
const uploadLimiter = createDbRateLimiter(MEDIA_UPLOAD_RATE_LIMIT);

router.get('/ping', (req, res) => res.json({ ok: true }));

// Presign upload (auth checked per resource via MEDIA_CFG). A signed-in account needs a
// verified email for anything but a contact image (avatars).
router.post('/presign-url', uploadLimiter, attachUserIfPresent, requireVerifiedEmailForAccountUploads, presignUploadHandler);

// Confirm upload: HEADs the object and checks its real type and size. No login needed
// (contact form visitors), but an upload with an owner can only be confirmed by them.
router.post('/confirm-upload', uploadLimiter, attachUserIfPresent, confirmUploadHandler);

// Signed view URL (private resources)
router.get('/get-url', validateAuthentication, signViewHandler);

// Delete object (owner or admin/dev)
router.delete('/delete-object', validateAuthentication, deleteMediaHandler);

// Daily cron: remove uploads never attached to anything
router.get('/cron/cleanup-orphans', cleanupOrphanUploadsHandler);

export default router;
