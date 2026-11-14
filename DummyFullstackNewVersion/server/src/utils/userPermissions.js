// Constants
import { ROLES } from './constants/userConstants.js';
import { EVENT_MESSAGES } from './responses/responses.js';

export const ADMIN_ACTIONS = {
  changeRole: 'changeRole',
  deactivate: 'deactivate',
  reactivate: 'reactivate',
  delete: 'delete',
};

export const normalizeRole = (role) => String(role || '').trim().toUpperCase();

export const isValidRole = (role) => Object.values(ROLES).includes(normalizeRole(role));

const deny = (code, key) => ({ code, key, message: EVENT_MESSAGES[key] });

// Admin panel rules: null when allowed, else { code, key, message }
export const checkAdminAction = ({ actor, target, action, newRole }) => {
  const actorRole = normalizeRole(actor?.role);
  const targetRole = normalizeRole(target?.role);
  const nextRole = normalizeRole(newRole);
  const isDeveloper = actorRole === ROLES.DEVELOPER;

  if (!Object.values(ADMIN_ACTIONS).includes(action)) return deny(400, 'badRequest');
  if (action === ADMIN_ACTIONS.changeRole && !isValidRole(nextRole)) return deny(400, 'invalidRole');
  if (actorRole !== ROLES.ADMIN && !isDeveloper) return deny(403, 'adminRoleRequired');
  if (actor?.id && actor.id === target?.id) return deny(403, 'cannotActOnSelf');
  if (!isDeveloper && targetRole === ROLES.DEVELOPER) return deny(403, 'cannotActOnDeveloper');
  if (!isDeveloper && action === ADMIN_ACTIONS.changeRole && nextRole === ROLES.DEVELOPER) {
    return deny(403, 'developerRoleRestricted');
  }

  return null;
};
