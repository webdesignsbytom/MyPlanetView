import { createAppEvent, levelFromStatusCode } from './events.js';

const DOMAIN = 'contact';

// Events never keep an email address: the form's id points at it, and the form
// (with its address) can be deleted, while events stay for 90 days
const normalizeUser = (user) => {
  if (user && typeof user === 'object') {
    return { id: user.id ?? null, role: user.role ?? 'USER' };
  }
  return { id: null, role: 'USER' };
};

const mk = (action, actor, details = {}, statusCode = 200, extra = '') => {
  const u = normalizeUser(actor);

  const parts = [
    action,
    details?.id ? `id=${details.id}` : null,
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

export const createContactCreateRequestedEvent = async ({ user }) => {
  await mk('Create Requested', user, {}, 200);
};

export const createContactCreateSuccessEvent = async ({ user, id }) => {
  await mk('Create Success', user, { id }, 201);
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
