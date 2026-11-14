import { createAppEvent, levelFromStatusCode } from './events.js';

const DOMAIN = 'events';

const normalizeUser = (user) => {
  if (user && typeof user === 'object') {
    return { id: user.id ?? null, email: user.email ?? 'anonymous', role: user.role ?? 'USER' };
  }
  return { id: null, email: 'anonymous', role: 'USER' };
};

const mk = (action, actor, details = {}, status = 200) => {
  const u = normalizeUser(actor);
  const parts = [
    details.eventId ? `eventId=${details.eventId}` : null,
    typeof details.count === 'number' ? `count=${details.count}` : null,
    details.status ? `status=${details.status}` : null,
  ].filter(Boolean);
  const message = parts.length ? `${action} | ${parts.join(' | ')}` : action;

  return createAppEvent({
    level: levelFromStatusCode(status),
    domain: DOMAIN,
    action,
    message,
    statusCode: status,
    actorId: u.id,
  });
};

// Reads aren't logged (viewing the log would flood it)

// Status
export const createEventsUpdateStatusSuccessEvent = async ({ user, eventId, status }) =>
  mk('Update Status Success', user, { eventId, status }, 200);

// Delete By Id
export const createEventsDeleteByIdSuccessEvent = async ({ user, eventId }) =>
  mk('Delete By Id Success', user, { eventId }, 200);

// Delete All
export const createEventsDeleteAllSuccessEvent = async ({ user, count }) =>
  mk('Delete All Success', user, { count }, 200);
