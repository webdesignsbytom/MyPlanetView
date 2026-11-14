import { prisma } from '../prisma.js';
import { getRequestContext } from '../utils/requestContext.js';

// Persist an AppEvent (always pass a single object)
export const createAppEvent = async ({
  level = 'INFO',
  domain = 'system',
  action,
  message,
  statusCode,
  actorId,
  targetId,
  path,
  method,
  stack,
  requestId,
  metadata,
}) => {
  const ctx = getRequestContext();

  return prisma.appEvent.create({
    data: {
      level,
      domain,
      action: action || 'unknown',
      message: message || action || 'No message provided',
      statusCode: statusCode ?? null,
      actorId: actorId ?? null,
      targetId: targetId ?? null,
      path: path ?? ctx.path ?? null,
      method: method ?? ctx.method ?? null,
      stack: stack ?? null,
      requestId: requestId ?? ctx.requestId ?? null,
      metadata: metadata ?? undefined,
    },
  });
};

/** Severity level from a status code */
export const levelFromStatusCode = (statusCode) => {
  const code = Number(statusCode) || 0;
  if (code >= 500) return 'ERROR';
  if (code >= 400) return 'WARNING';
  return 'INFO';
};
