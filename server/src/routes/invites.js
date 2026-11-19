import { Router } from 'express';
import { acceptInviteHandler, getInviteHandler } from '../controllers/invites.js';
import { validateAuthentication } from '../middleware/auth.js';
import { createDbRateLimiter } from '../middleware/dbRateLimit.js';
import { SHARE_LOOKUP_RATE_LIMIT } from '../utils/constants/rateLimitConstants.js';

// Mounted at /api/invites
const router = Router();
// Same budget as share links: both look a secret up
const inviteLookupLimiter = createDbRateLimiter({ ...SHARE_LOOKUP_RATE_LIMIT, name: 'invite-accept' });

router.post('/accept', inviteLookupLimiter, validateAuthentication, acceptInviteHandler);
// The invite page, signed out too: whose invite, for what, to which address
router.get('/:token', inviteLookupLimiter, getInviteHandler);

export default router;
