import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

// Per-request context (requestId/path/method) for events
const requestContextStorage = new AsyncLocalStorage();

export const requestContextMiddleware = (req, res, next) => {
  const requestId = randomUUID();
  res.setHeader('X-Request-Id', requestId);

  requestContextStorage.run(
    { requestId, path: req.originalUrl, method: req.method },
    () => next()
  );
};

export const getRequestContext = () => requestContextStorage.getStore() || {};
