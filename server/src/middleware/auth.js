import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth.js';
// Events
import { logEvent } from '../utils/events/logEvent.js';
// Errors
import {
  DeactivatedUserEvent,
  NoPermissionEvent,
  NoValidationEvent,
  createGenericErrorEvent,
} from '../event/errorUtils.js';
// Responses
import {
  DOMAINS,
  EVENT_MESSAGES,
  sendMessageResponse,
} from '../utils/responses/responses.js';
// Constants
import { ROLES } from '../utils/constants/userConstants.js';
import { normalizeRole } from '../utils/userPermissions.js';

const reject = (res, errorEvent) => {
  logEvent(createGenericErrorEvent(errorEvent));
  return sendMessageResponse(res, errorEvent.code, errorEvent.message);
};

// The session and its user, read from the database on every call: better-auth's
// cookie cache is off (auth.js), and role and isActive are declared there as user
// fields, so they come with the user and a change applies to the next request.
// One lookup (session + user) instead of a second read of the user row.
const readSession = (req) => auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

// Optional auth (attach req.user if a session exists, never blocks)
export const attachUserIfPresent = async (req, res, next) => {
  try {
    const session = await readSession(req);
    const user = session?.user;
    if (!user?.id) return next();

    // Deactivated users stay anonymous
    if (user.isActive !== false) {
      req.session = session;
      req.user = user;
    }

    return next();
  } catch {
    // Fail open (identifies only, never authorizes)
    return next();
  }
};

// Auth (session cookie → better-auth → the user row, with role and isActive)
export const validateAuthentication = async (req, res, next) => {
  try {
    const session = await readSession(req);
    const user = session?.user;

    // No session, or one whose user is gone (better-auth returns null for both)
    if (!user?.id) {
      return reject(res, new NoValidationEvent(DOMAINS.auth, EVENT_MESSAGES.noValidSession));
    }

    // Deactivated by an admin
    if (user.isActive === false) {
      return reject(res, new DeactivatedUserEvent(user, DOMAINS.auth, EVENT_MESSAGES.accountDeactivated));
    }

    req.session = session;
    req.user = user;

    return next();
  } catch {
    // Generic message only (don't leak err.message)
    return reject(res, new NoValidationEvent(DOMAINS.auth));
  }
};

// Adding or changing content (countries, trips, photos, new maps, sharing, avatars) needs
// a verified email address. Setting up your map (its name, group and travellers) and your
// account don't, so the welcome page works straight after sign-up. Runs after
// validateAuthentication and before any lookup: the answer is the same 403 for every id,
// real or not, so it reveals nothing about other people's maps.
export const requireVerifiedEmail = (req, res, next) => {
  if (req.user?.emailVerified === true) return next();
  return reject(res, new NoPermissionEvent(req.user, DOMAINS.auth, EVENT_MESSAGES.contentNeedsVerifiedEmail));
};

// The generic presign takes visitors too (the contact form). A signed-in account with an
// unverified address may still attach a contact image, but nothing else (avatars).
export const requireVerifiedEmailForAccountUploads = (req, res, next) => {
  if (!req.user || req.body?.resource === 'contact') return next();
  return requireVerifiedEmail(req, res, next);
};

// Admin role
export async function validateAdminRole(req, res, next) {
  if (!req.user) {
    return reject(res, new NoValidationEvent(DOMAINS.auth, EVENT_MESSAGES.adminActionNoSession));
  }

  const role = normalizeRole(req.user.role);

  if (role !== ROLES.ADMIN && role !== ROLES.DEVELOPER) {
    return reject(res, new NoPermissionEvent(req.user, DOMAINS.auth, EVENT_MESSAGES.adminRoleRequired));
  }

  return next();
}

// Developer role
export async function validateDeveloperRole(req, res, next) {
  if (!req.user) {
    return reject(res, new NoValidationEvent(DOMAINS.auth, EVENT_MESSAGES.developerActionNoSession));
  }

  const role = normalizeRole(req.user.role);

  if (role !== ROLES.DEVELOPER) {
    return reject(res, new NoPermissionEvent(req.user, DOMAINS.auth, EVENT_MESSAGES.developerRoleRequired));
  }

  return next();
}
