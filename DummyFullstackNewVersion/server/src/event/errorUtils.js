// Response strings
import { RESPONSE_MESSAGES } from '../utils/responses/responses.js';
import { createAppEvent, levelFromStatusCode } from './events.js';

// Safe helpers
const normalizeUser = (user) => {
  if (user && typeof user === 'object') {
    return {
      id: user.id ?? null,
      email: user.email ?? 'anonymous',
      role: user.role ?? 'USER',
    };
  }
  return { id: null, email: 'anonymous', role: 'USER' };
};

// Generic error event creator
export const createGenericErrorEvent = async (errorEvent) => {
  const u = normalizeUser(errorEvent?.user || {});
  const statusCode = errorEvent?.code || 500;
  // Prefer internal logMessage over client-facing message
  const persistedMessage =
    errorEvent?.logMessage ||
    errorEvent?.message ||
    `An unknown error occurred for ${u.email}`;

  await createAppEvent({
    level: levelFromStatusCode(statusCode),
    domain: errorEvent?.domain || 'system',
    action: errorEvent?.action || 'unhandled-error',
    message: persistedMessage,
    statusCode,
    actorId: u.id,
    // Stack captured in the constructor
    stack: errorEvent?.stack,
  });
};

// Error event classes: (user, domain, message)
class ErrorEventBase {
  constructor(user, domain, action) {
    this.user = user;
    this.domain = domain;
    this.action = action;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestEvent extends ErrorEventBase {
  constructor(user, domain, message) {
    super(user, domain, 'bad-request');
    this.code = 400;
    this.message = message || RESPONSE_MESSAGES.BadRequestEvent;
  }
}

export class NoValidationEvent extends ErrorEventBase {
  constructor(domain = 'auth', message) {
    // No `user` param — this fires before a session/user is established.
    super(null, domain, 'no-validation');
    this.code = 401;
    this.message = message || RESPONSE_MESSAGES.NoValidationEvent;
  }
}

export class NoPermissionEvent extends ErrorEventBase {
  constructor(user, domain, message) {
    super(user, domain, 'no-permission');
    this.code = 403;
    this.message = message || RESPONSE_MESSAGES.NoPermissionEvent;
  }
}

export class NotFoundEvent extends ErrorEventBase {
  constructor(user, domain, message) {
    super(user, domain, 'not-found');
    this.code = 404;
    this.message = message || RESPONSE_MESSAGES.NotFoundEvent;
  }
}

export class ConflictEvent extends ErrorEventBase {
  constructor(user, domain, message) {
    super(user, domain, 'conflict');
    this.code = 409;
    this.message = message || RESPONSE_MESSAGES.ConflictEvent;
  }
}

export class DeactivatedUserEvent extends ErrorEventBase {
  constructor(user, domain, message) {
    super(user, domain, 'deactivated-user');
    // 403 (account state, not a bad request)
    this.code = 403;
    this.message = message || RESPONSE_MESSAGES.DeactivatedUserEvent;
  }
}

export class ServerErrorEvent extends ErrorEventBase {
  constructor(user = 'visitor', domain, logDetail) {
    super(user, domain, 'server-error');
    this.code = 500;
    // Generic client message; detail kept in logMessage
    this.message = RESPONSE_MESSAGES.ServerErrorEvent;
    this.logMessage = logDetail || this.message;
  }
}

// Custom code/message/action escape hatch
export class OtherErrorEvent extends ErrorEventBase {
  constructor(user, domain, code, message, action = 'other') {
    super(user, domain, action);
    this.code = code;
    this.message = message;
  }
}
