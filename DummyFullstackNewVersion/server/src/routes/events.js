import { Router } from 'express';
// Controllers
import {
  deleteAllEventsHandler,
  deleteEventByIdHandler,
  getAllEvents,
  getEventByIdHandler,
  getPaginatedEvents,
  updateEventStatusHandler,
} from '../controllers/events.js';
// Middleware
import {
  validateAuthentication,
  validateDeveloperRole,
} from '../middleware/auth.js';

const router = Router();

// Developer-only (hidden from admins)
router.get('/get-all-events', validateAuthentication, validateDeveloperRole, getAllEvents);
router.get('/get-paginated-events', validateAuthentication, validateDeveloperRole, getPaginatedEvents);
router.get('/get-event-by-id/:eventId', validateAuthentication, validateDeveloperRole, getEventByIdHandler);
router.patch(
  '/update-event-status/:eventId',
  validateAuthentication,
  validateDeveloperRole,
  updateEventStatusHandler
);
router.delete(
  '/delete-event/:eventId',
  validateAuthentication,
  validateDeveloperRole,
  deleteEventByIdHandler
);
router.delete(
  '/delete-all-events',
  validateAuthentication,
  validateDeveloperRole,
  deleteAllEventsHandler
);

export default router;
