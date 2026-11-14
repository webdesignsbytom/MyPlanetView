import { Router } from 'express';
import {
  presignUploadHandler,
  signViewHandler,
  deleteMediaHandler,
  confirmUploadHandler,
  cleanupOrphanUploadsHandler,
} from '../controllers/mediaGeneric.js';
import { validateAuthentication, attachUserIfPresent } from '../middleware/auth.js';
import { presignRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/ping', (req, res) => res.json({ ok: true }));

// Presign upload (auth checked per resource via MEDIA_CFG)
router.post('/presign-url', presignRateLimiter, attachUserIfPresent, presignUploadHandler);

// Confirm upload (checks real size in S3)
router.post('/confirm-upload', presignRateLimiter, confirmUploadHandler);

// Signed view URL (private resources)
router.get('/get-url', validateAuthentication, signViewHandler);

// Delete object (owner or admin/dev)
router.delete('/delete-object', validateAuthentication, deleteMediaHandler);

// Daily cron: remove uploads never attached to anything
router.get('/cron/cleanup-orphans', cleanupOrphanUploadsHandler);

export default router;
