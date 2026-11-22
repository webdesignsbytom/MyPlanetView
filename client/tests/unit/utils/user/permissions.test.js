import { describe, expect, it } from 'vitest';
import { ROLES, hasPermission, hasRole, isActive } from '@/utils/user/permissions';

describe('permissions', () => {
  it('names the roles', () => {
    expect(ROLES).toEqual({ ADMIN: 'ADMIN', DEVELOPER: 'DEVELOPER', USER: 'USER' });
  });

  it('checks a user’s role against any of several', () => {
    expect(hasRole({ role: 'ADMIN' }, ROLES.ADMIN, ROLES.DEVELOPER)).toBe(true);
    expect(hasRole({ role: 'USER' }, ROLES.ADMIN, ROLES.DEVELOPER)).toBe(false);
    expect(hasRole({ role: 'ADMIN' })).toBe(false);
    expect(hasRole({}, ROLES.USER)).toBe(false);
    expect(hasRole(null, ROLES.USER)).toBe(false);
  });

  it('checks a permission in the user’s list', () => {
    expect(hasPermission({ permissions: ['offers:edit'] }, 'offers:edit')).toBe(true);
    expect(hasPermission({ permissions: ['offers:edit'] }, 'users:edit')).toBe(false);
    expect(hasPermission({ permissions: 'offers:edit' }, 'offers:edit')).toBe(false);
    expect(hasPermission(null, 'offers:edit')).toBe(false);
  });

  it('counts a user as active unless deactivated', () => {
    expect(isActive({})).toBe(true);
    expect(isActive({ isActive: true })).toBe(true);
    expect(isActive({ isActive: false })).toBe(false);
    expect(isActive(null)).toBe(false);
  });
});
