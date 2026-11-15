import { describe, it, expect } from 'vitest';
import {
  mapRoleFor,
  tripRoleFor,
  linkRoleFor,
  higherRole,
  canView,
  canEdit,
  canManage,
  canSeePhoto,
  canSeeLocation,
  canRemoveMember,
  canDeleteTrip,
} from '../src/utils/access.js';

const map = { ownerId: 'owner' };

describe('mapRoleFor', () => {
  it('makes the owner OWNER', () => {
    expect(mapRoleFor(map, 'owner', null)).toBe('OWNER');
  });

  it('uses the member row for everyone else', () => {
    expect(mapRoleFor(map, 'friend', { role: 'VIEWER' })).toBe('VIEWER');
    expect(mapRoleFor(map, 'partner', { role: 'EDITOR' })).toBe('EDITOR');
  });

  it('gives no role to strangers, anonymous visitors or a missing map', () => {
    expect(mapRoleFor(map, 'stranger', null)).toBeNull();
    expect(mapRoleFor(map, null, null)).toBeNull();
    expect(mapRoleFor(null, 'owner', null)).toBeNull();
  });
});

describe('tripRoleFor', () => {
  it('takes the higher of the map role and the trip role', () => {
    expect(tripRoleFor('VIEWER', { role: 'EDITOR' })).toBe('EDITOR');
    expect(tripRoleFor('OWNER', { role: 'VIEWER' })).toBe('OWNER');
    expect(tripRoleFor(null, { role: 'VIEWER' })).toBe('VIEWER');
    expect(tripRoleFor('EDITOR', null)).toBe('EDITOR');
    expect(tripRoleFor(null, null)).toBeNull();
  });
});

describe('links', () => {
  it('only "anyone with the link" gives a role, and only VIEWER', () => {
    expect(linkRoleFor('ANYONE_WITH_LINK')).toBe('VIEWER');
    expect(linkRoleFor('RESTRICTED')).toBeNull();
  });

  it('a link never lowers a member', () => {
    expect(higherRole('EDITOR', linkRoleFor('ANYONE_WITH_LINK'))).toBe('EDITOR');
  });
});

describe('permissions', () => {
  it('ranks view < edit < manage', () => {
    expect([canView('VIEWER'), canEdit('VIEWER'), canManage('VIEWER')]).toEqual([true, false, false]);
    expect([canView('EDITOR'), canEdit('EDITOR'), canManage('EDITOR')]).toEqual([true, true, false]);
    expect([canView('OWNER'), canEdit('OWNER'), canManage('OWNER')]).toEqual([true, true, true]);
    expect([canView(null), canEdit(null), canManage(null)]).toEqual([false, false, false]);
  });

  it('hides hidden photos and locations from viewers only', () => {
    expect(canSeePhoto('VIEWER', { hidden: true })).toBe(false);
    expect(canSeePhoto('VIEWER', { hidden: false })).toBe(true);
    expect(canSeePhoto('EDITOR', { hidden: true })).toBe(true);
    expect(canSeePhoto(null, { hidden: false })).toBe(false);
    expect(canSeeLocation('VIEWER')).toBe(false);
    expect(canSeeLocation('EDITOR')).toBe(true);
  });

  it('lets the owner remove anyone and a member remove only themselves', () => {
    expect(canRemoveMember({ actorRole: 'OWNER', actorId: 'owner', targetUserId: 'friend' })).toBe(true);
    expect(canRemoveMember({ actorRole: 'VIEWER', actorId: 'friend', targetUserId: 'friend' })).toBe(true);
    expect(canRemoveMember({ actorRole: 'EDITOR', actorId: 'partner', targetUserId: 'friend' })).toBe(false);
  });

  it("lets only the map's owner and editors delete a trip, not someone added to the trip alone", () => {
    // The argument is the role on the trip's map: a trip-only member has none
    expect(canDeleteTrip('OWNER')).toBe(true);
    expect(canDeleteTrip('EDITOR')).toBe(true);
    expect(canDeleteTrip('VIEWER')).toBe(false);
    expect(canDeleteTrip(null)).toBe(false);
    // A map viewer who edits the trip still can't delete it
    expect(canDeleteTrip(mapRoleFor(map, 'friend', { role: 'VIEWER' }))).toBe(false);
    expect(tripRoleFor(mapRoleFor(map, 'friend', { role: 'VIEWER' }), { role: 'EDITOR' })).toBe('EDITOR');
  });
});
