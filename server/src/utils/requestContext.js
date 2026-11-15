import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { redactUrl } from './redactUrl.js';

// Per-request context (requestId/path/method) for events. The path is stored
// redacted: no share codes, tokens or query values (redactUrl.js).
const requestContextStorage = new AsyncLocalStorage();

export const requestContextMiddleware = (req, res, next) => {
  const requestId = randomUUID();
  res.setHeader('X-Request-Id', requestId);

  requestContextStorage.run(
    { requestId, path: redactUrl(req.originalUrl), method: req.method },
    () => next()
  );
};

export const getRequestContext = () => requestContextStorage.getStore() || {};
