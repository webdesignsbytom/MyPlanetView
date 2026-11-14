import { describe, it, expect } from 'vitest';
import {
  ADMIN_ACTIONS,
  checkAdminAction,
  isValidRole,
  normalizeRole,
} from '../src/utils/userPermissions.js';

const admin = { id: 'admin-1', role: 'ADMIN' };
const developer = { id: 'dev-1', role: 'DEVELOPER' };
const user = { id: 'user-1', role: 'USER' };
const otherAdmin = { id: 'admin-2', role: 'ADMIN' };
const otherDeveloper = { id: 'dev-2', role: 'DEVELOPER' };

const keyOf = (args) => checkAdminAction(args)?.key ?? null;

describe('normalizeRole / isValidRole', () => {
  it('uppercases and trims', () => {
    expect(normalizeRole(' admin ')).toBe('ADMIN');
    expect(normalizeRole(null)).toBe('');
  });

  it('accepts only known roles', () => {
    expect(isValidRole('user')).toBe(true);
    expect(isValidRole('Developer')).toBe(true);
    expect(isValidRole('OWNER')).toBe(false);
    expect(isValidRole('')).toBe(false);
  });
});

describe('checkAdminAction — role changes', () => {
  it('lets an admin promote a user to admin (any casing)', () => {
    expect(checkAdminAction({ actor: admin, target: user, action: ADMIN_ACTIONS.changeRole, newRole: 'admin' })).toBeNull();
  });

  it('rejects unknown roles with 400', () => {
    const denied = checkAdminAction({ actor: admin, target: user, action: ADMIN_ACTIONS.changeRole, newRole: 'OWNER' });
    expect(denied).toMatchObject({ code: 400, key: 'invalidRole' });
    expect(typeof denied.message).toBe('string');
  });

  it('blocks changing your own role', () => {
    expect(keyOf({ actor: admin, target: admin, action: ADMIN_ACTIONS.changeRole, newRole: 'USER' })).toBe('cannotActOnSelf');
    expect(keyOf({ actor: developer, target: developer, action: ADMIN_ACTIONS.changeRole, newRole: 'ADMIN' })).toBe('cannotActOnSelf');
  });

  it('blocks an admin from granting developer', () => {
    const denied = checkAdminAction({ actor: admin, target: user, action: ADMIN_ACTIONS.changeRole, newRole: 'developer' });
    expect(denied).toMatchObject({ code: 403, key: 'developerRoleRestricted' });
  });

  it('blocks an admin from changing a developer', () => {
    expect(keyOf({ actor: admin, target: otherDeveloper, action: ADMIN_ACTIONS.changeRole, newRole: 'USER' })).toBe('cannotActOnDeveloper');
  });

  it('lets a developer grant and remove developer', () => {
    expect(checkAdminAction({ actor: developer, target: user, action: ADMIN_ACTIONS.changeRole, newRole: 'DEVELOPER' })).toBeNull();
    expect(checkAdminAction({ actor: developer, target: otherDeveloper, action: ADMIN_ACTIONS.changeRole, newRole: 'USER' })).toBeNull();
  });

  it('lets an admin demote another admin', () => {
    expect(checkAdminAction({ actor: admin, target: otherAdmin, action: ADMIN_ACTIONS.changeRole, newRole: 'USER' })).toBeNull();
  });
});

describe('checkAdminAction — status and delete', () => {
  it('blocks deactivating or deleting yourself', () => {
    expect(keyOf({ actor: admin, target: admin, action: ADMIN_ACTIONS.deactivate })).toBe('cannotActOnSelf');
    expect(keyOf({ actor: developer, target: developer, action: ADMIN_ACTIONS.delete })).toBe('cannotActOnSelf');
  });

  it('blocks an admin from deactivating or deleting a developer', () => {
    expect(keyOf({ actor: admin, target: otherDeveloper, action: ADMIN_ACTIONS.deactivate })).toBe('cannotActOnDeveloper');
    expect(keyOf({ actor: admin, target: otherDeveloper, action: ADMIN_ACTIONS.reactivate })).toBe('cannotActOnDeveloper');
    expect(keyOf({ actor: admin, target: otherDeveloper, action: ADMIN_ACTIONS.delete })).toBe('cannotActOnDeveloper');
  });

  it('lets admins and developers manage users', () => {
    expect(checkAdminAction({ actor: admin, target: user, action: ADMIN_ACTIONS.deactivate })).toBeNull();
    expect(checkAdminAction({ actor: admin, target: user, action: ADMIN_ACTIONS.reactivate })).toBeNull();
    expect(checkAdminAction({ actor: admin, target: user, action: ADMIN_ACTIONS.delete })).toBeNull();
    expect(checkAdminAction({ actor: developer, target: otherDeveloper, action: ADMIN_ACTIONS.delete })).toBeNull();
  });

  it('treats lowercase stored roles the same', () => {
    expect(keyOf({ actor: { id: 'a', role: 'admin' }, target: { id: 'd', role: 'developer' }, action: ADMIN_ACTIONS.delete })).toBe('cannotActOnDeveloper');
  });
});

describe('checkAdminAction — guards', () => {
  it('rejects non-admin actors and unknown actions', () => {
    expect(keyOf({ actor: user, target: otherAdmin, action: ADMIN_ACTIONS.delete })).toBe('adminRoleRequired');
    expect(keyOf({ actor: admin, target: user, action: 'promoteToGod' })).toBe('badRequest');
  });
});
