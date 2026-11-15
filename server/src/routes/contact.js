import { Router } from 'express';

import {
  createNewContactFormHandler,
  getAllContactFormsHandler,
  deleteContactFormHandler,
  deleteAllContactFormsHandler,
} from '../controllers/contact.js';

import { validateAuthentication, validateAdminRole } from '../middleware/auth.js';
import { createDbRateLimiter } from '../middleware/dbRateLimit.js';
import { CONTACT_FORM_RATE_LIMIT } from '../utils/constants/rateLimitConstants.js';

const router = Router();
// Each form emails the inbox: 5 per 15 minutes per IP, counted in the database
const contactFormLimiter = createDbRateLimiter(CONTACT_FORM_RATE_LIMIT);

// Public (strict limit)
router.post('/create-new-contact-form', contactFormLimiter, createNewContactFormHandler);

// Admin read (auth + admin)
router.get(
  '/get-all-contact-forms',
  validateAuthentication,
  validateAdminRole,
  getAllContactFormsHandler
);

// Admin destructive (auth + admin)
router.delete(
  '/delete-contact-form/:contactFormId',
  validateAuthentication,
  validateAdminRole,
  deleteContactFormHandler
);

router.delete(
  '/delete-all-contact-forms',
  validateAuthentication,
  validateAdminRole,
  deleteAllContactFormsHandler
);

export default router;
