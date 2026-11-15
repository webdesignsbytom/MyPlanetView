// CSRF guard for the cookie-authenticated API (audit A1). The session cookie is
// SameSite=None in production, so a page on any site could otherwise make the
// browser send a write with the user's cookie. CORS alone doesn't stop that: a
// refused origin only loses the CORS headers, and the request still runs.
//
// For POST, PUT, PATCH and DELETE:
// - an Origin header must be one of FRONTEND_ORIGINS;
// - with no Origin, a browser's `Sec-Fetch-Site: cross-site` is refused;
// - anything else passes (curl, server-to-server tools, supertest).
// Reads are never refused: they change nothing, and CORS keeps their replies from
// other sites.
import { FRONTEND_ORIGINS } from '../utils/config.js';
import { sendMessageResponse } from '../utils/responses/responses.js';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const CROSS_SITE_MESSAGE = 'This request came from another website, so it was refused.';

/** The middleware for a given list of allowed origins (exported for tests). */
export function createOriginCheck(allowedOrigins = FRONTEND_ORIGINS) {
  const allowed = new Set(allowedOrigins);

  return function originCheck(req, res, next) {
    if (!WRITE_METHODS.has(req.method)) return next();

    const origin = req.get('origin');
    if (origin) {
      if (allowed.has(origin)) return next();
      console.warn('[CSRF] refused', req.method, req.path, 'from origin', origin);
      return sendMessageResponse(res, 403, CROSS_SITE_MESSAGE);
    }

    if (req.get('sec-fetch-site') === 'cross-site') {
      console.warn('[CSRF] refused', req.method, req.path, 'with Sec-Fetch-Site: cross-site');
      return sendMessageResponse(res, 403, CROSS_SITE_MESSAGE);
    }

    return next();
  };
}

export const originCheck = createOriginCheck();
