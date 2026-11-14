import { Router } from 'express';

import {
  createNewContactFormHandler,
  getAllContactFormsHandler,
  deleteContactFormHandler,
  deleteAllContactFormsHandler,
} from '../controllers/contact.js';

import { validateAuthentication, validateAdminRole } from '../middleware/auth.js';
import { createStrictRateLimiter } from '../middleware/rateLimit.js';

const router = Router();
const contactFormLimiter = createStrictRateLimiter();

// Public (strict limiter)
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
