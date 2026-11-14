import { createAppEvent, levelFromStatusCode } from './events.js';

const DOMAIN = 'contact';

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

const mk = (action, actor, details = {}, statusCode = 200, extra = '') => {
  const u = normalizeUser(actor);

  const parts = [
    action,
    details?.id ? `id=${details.id}` : null,
    details?.email ? `email=${details.email}` : null,
    details?.count != null ? `count=${details.count}` : null,
    extra || null,
  ].filter(Boolean);

  const message = parts.join(' | ');

  return createAppEvent({
    level: levelFromStatusCode(statusCode),
    domain: DOMAIN,
    action,
    message,
    statusCode,
    actorId: u.id,
  });
};

// Contact

export const createContactCreateRequestedEvent = async ({ user, email }) => {
  await mk('Create Requested', user, { email }, 200);
};

export const createContactCreateSuccessEvent = async ({ user, id, email }) => {
  await mk('Create Success', user, { id, email }, 201);
};

export const createContactGetAllRequestedEvent = async ({ user }) => {
  await mk('Get All Requested', user, {}, 200);
};

export const createContactGetAllSuccessEvent = async ({ user, count }) => {
  await mk('Get All Success', user, { count }, 200);
};

export const createContactDeleteRequestedEvent = async ({ user, id }) => {
  await mk('Delete Requested', user, { id }, 200);
};

export const createContactDeleteSuccessEvent = async ({ user, id }) => {
  await mk('Delete Success', user, { id }, 200);
};

export const createContactDeleteAllRequestedEvent = async ({ user }) => {
  await mk('Delete All Requested', user, {}, 200);
};

export const createContactDeleteAllSuccessEvent = async ({ user, count }) => {
  await mk('Delete All Success', user, { count }, 200);
};
