// Audit events for the travel features (writes only; reads aren't logged).
import { createAppEvent, levelFromStatusCode } from './events.js';
import { DOMAINS } from '../utils/responses/responses.js';

const actorId = (user) => (user && typeof user === 'object' ? user.id ?? null : null);

const mk = (domain) => async ({ user, action, id, detail, statusCode = 200, targetId }) => {
  const message = [action, id ? `id=${id}` : null, detail || null].filter(Boolean).join(' | ');
  await createAppEvent({
    level: levelFromStatusCode(statusCode),
    domain,
    action,
    message,
    statusCode,
    actorId: actorId(user),
    targetId: targetId ?? null,
  });
};

// e.g. createMapEvent({ user, action: 'Create Success', id: map.id, statusCode: 201 })
export const createMapEvent = mk(DOMAINS.maps);
export const createTripEvent = mk(DOMAINS.trips);
export const createPhotoEvent = mk(DOMAINS.photos);
export const createSharingEvent = mk(DOMAINS.sharing);
