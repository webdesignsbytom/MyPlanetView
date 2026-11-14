import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth.js';
// Domain
import { findUserByIdForAuth } from '../domain/users.js';
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

// Optional auth (attach req.user if a session exists, never blocks)
export const attachUserIfPresent = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    const sessionUserId = session?.user?.id;
    if (!sessionUserId) return next();

    // Deactivated users stay anonymous
    const foundUser = await findUserByIdForAuth(sessionUserId);
    if (foundUser && foundUser.isActive !== false) {
      req.session = session;
      req.user = foundUser;
    }

    return next();
  } catch {
    // Fail open (identifies only, never authorizes)
    return next();
  }
};

// Auth (session cookie → BetterAuth → DB user)
export const validateAuthentication = async (req, res, next) => {
  try {
    // 1) Validate cookie session
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    const sessionUserId = session?.user?.id;

    if (!sessionUserId) {
      return reject(res, new NoValidationEvent(DOMAINS.auth, EVENT_MESSAGES.noValidSession));
    }

    // 2) Fetch REAL user from DB (this is where role lives)
    const foundUser = await findUserByIdForAuth(sessionUserId);

    if (!foundUser) {
      return reject(res, new NoValidationEvent(DOMAINS.auth, EVENT_MESSAGES.sessionUserNotFound));
    }

    // 3) Deactivated by an admin
    if (foundUser.isActive === false) {
      return reject(res, new DeactivatedUserEvent(foundUser, DOMAINS.auth, EVENT_MESSAGES.accountDeactivated));
    }

    // Attach session + real user
    req.session = session;
    req.user = foundUser;

    return next();
  } catch {
    // Generic message only (don't leak err.message)
    return reject(res, new NoValidationEvent(DOMAINS.auth));
  }
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
