import { describe, it, expect } from 'vitest';
import {
  mapRoleFor,
  tripRoleFor,
  linkRoleFor,
  higherRole,
  canView,
  canEdit,
  canManage,
  isOwner,
  canSetMemberRole,
  canSeePhoto,
  canSeeLocation,
  canRemoveMember,
  canDeleteTrip,
  canAddTripToMap,
  canRemoveTripFromMap,
  momentRoleFor,
  canSeeMoment,
  momentPhotoScope,
  canSeeMomentPhoto,
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

  it("gives a co-owner the owner's powers on the map except the owner's own", () => {
    expect([canView('CO_OWNER'), canEdit('CO_OWNER'), canManage('CO_OWNER')]).toEqual([true, true, true]);
    expect([isOwner('OWNER'), isOwner('CO_OWNER'), isOwner('EDITOR'), isOwner(null)]).toEqual([true, false, false, false]);
    expect(higherRole('CO_OWNER', 'EDITOR')).toBe('CO_OWNER');
    expect(higherRole('CO_OWNER', 'OWNER')).toBe('OWNER');
    // A map's co-owner is a co-owner of its trips too (their sharing included)
    expect(tripRoleFor('CO_OWNER', { role: 'EDITOR' })).toBe('CO_OWNER');
  });

  it('lets a co-owner share, but only the owner take a co-owner away', () => {
    expect(canSetMemberRole({ actorRole: 'OWNER', currentRole: 'CO_OWNER', newRole: 'EDITOR' })).toBe(true);
    expect(canSetMemberRole({ actorRole: 'CO_OWNER', currentRole: null, newRole: 'CO_OWNER' })).toBe(true);
    expect(canSetMemberRole({ actorRole: 'CO_OWNER', currentRole: 'VIEWER', newRole: 'EDITOR' })).toBe(true);
    expect(canSetMemberRole({ actorRole: 'CO_OWNER', currentRole: 'CO_OWNER', newRole: 'EDITOR' })).toBe(false);
    expect(canSetMemberRole({ actorRole: 'CO_OWNER', currentRole: 'CO_OWNER', newRole: 'CO_OWNER' })).toBe(true);
    expect(canSetMemberRole({ actorRole: 'EDITOR', currentRole: null, newRole: 'VIEWER' })).toBe(false);

    expect(canRemoveMember({ actorRole: 'CO_OWNER', actorId: 'partner', targetUserId: 'friend', targetRole: 'EDITOR' })).toBe(true);
    expect(canRemoveMember({ actorRole: 'CO_OWNER', actorId: 'partner', targetUserId: 'mum', targetRole: 'CO_OWNER' })).toBe(false);
    expect(canRemoveMember({ actorRole: 'OWNER', actorId: 'owner', targetUserId: 'mum', targetRole: 'CO_OWNER' })).toBe(true);
    // Leaving is always allowed
    expect(canRemoveMember({ actorRole: 'CO_OWNER', actorId: 'mum', targetUserId: 'mum', targetRole: 'CO_OWNER' })).toBe(true);
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

describe('group trips', () => {
  it('lets anyone on the trip add it to a map they own or edit', () => {
    for (const tripRole of ['VIEWER', 'EDITOR', 'OWNER']) {
      expect(canAddTripToMap({ tripRole, targetMapRole: 'OWNER' })).toBe(true);
      expect(canAddTripToMap({ tripRole, targetMapRole: 'EDITOR' })).toBe(true);
      expect(canAddTripToMap({ tripRole, targetMapRole: 'VIEWER' })).toBe(false);
      expect(canAddTripToMap({ tripRole, targetMapRole: null })).toBe(false);
    }
    // Someone not on the trip can't, even onto their own map
    expect(canAddTripToMap({ tripRole: null, targetMapRole: 'OWNER' })).toBe(false);
  });

  it('lets whoever added it, or the map owner, take it off', () => {
    expect(canRemoveTripFromMap({ userId: 'adder', addedById: 'adder', targetMapOwnerId: 'owner' })).toBe(true);
    expect(canRemoveTripFromMap({ userId: 'owner', addedById: 'adder', targetMapOwnerId: 'owner' })).toBe(true);
    expect(canRemoveTripFromMap({ userId: 'editor', addedById: 'adder', targetMapOwnerId: 'owner' })).toBe(false);
    // Added by an account since deleted: only the owner
    expect(canRemoveTripFromMap({ userId: 'editor', addedById: null, targetMapOwnerId: 'owner' })).toBe(false);
    expect(canRemoveTripFromMap({ userId: null, addedById: null, targetMapOwnerId: null })).toBe(false);
  });
});

describe('moments', () => {
  it('gives the trip role on a trip, else the map role', () => {
    // A trip-only editor edits the moments of their trip...
    expect(momentRoleFor(null, { role: 'EDITOR' }, 'trip-1')).toBe('EDITOR');
    // ...but has no role on the map's other moments
    expect(momentRoleFor(null, { role: 'EDITOR' }, null)).toBeNull();
    expect(momentRoleFor('VIEWER', { role: 'EDITOR' }, 'trip-1')).toBe('EDITOR');
    expect(momentRoleFor('VIEWER', null, null)).toBe('VIEWER');
    expect(momentRoleFor('EDITOR', null, 'trip-1')).toBe('EDITOR');
    expect(momentRoleFor(undefined, undefined, null)).toBeNull();
  });

  it('hides hidden moments from viewers only', () => {
    expect(canSeeMoment('VIEWER', { hidden: true })).toBe(false);
    expect(canSeeMoment('VIEWER', { hidden: false })).toBe(true);
    expect(canSeeMoment('EDITOR', { hidden: true })).toBe(true);
    expect(canSeeMoment(null, { hidden: false })).toBe(false);
  });

  it("limits a trip-only editor's photos to the moment's trip", () => {
    expect(momentPhotoScope('OWNER', 'trip-1')).toBeNull();
    expect(momentPhotoScope('EDITOR', null)).toBeNull();
    expect(momentPhotoScope(null, 'trip-1')).toBe('trip-1');
    expect(momentPhotoScope('VIEWER', 'trip-1')).toBe('trip-1');
  });

  describe('photos shown inside a moment', () => {
    const onTrip = { tripId: 'trip-1', hidden: false };
    const onTripHidden = { tripId: 'trip-1', hidden: true };
    const elsewhere = { tripId: null, hidden: false };
    const elsewhereHidden = { tripId: 'trip-2', hidden: true };

    it('shows map viewers the visible ones, and map editors every one', () => {
      const viewer = { mapRole: 'VIEWER' };
      expect([onTrip, onTripHidden, elsewhere, elsewhereHidden].map((p) => canSeeMomentPhoto(p, viewer))).toEqual([true, false, true, false]);
      const editor = { mapRole: 'EDITOR' };
      expect([onTrip, onTripHidden, elsewhere, elsewhereHidden].map((p) => canSeeMomentPhoto(p, editor))).toEqual([true, true, true, true]);
    });

    it('shows someone on the trip alone only its photos (hidden ones to its editors)', () => {
      const tripViewer = { mapRole: null, trip: { id: 'trip-1', role: 'VIEWER' } };
      expect([onTrip, onTripHidden, elsewhere, elsewhereHidden].map((p) => canSeeMomentPhoto(p, tripViewer))).toEqual([true, false, false, false]);
      const tripEditor = { mapRole: null, trip: { id: 'trip-1', role: 'EDITOR' } };
      expect([onTrip, onTripHidden, elsewhere, elsewhereHidden].map((p) => canSeeMomentPhoto(p, tripEditor))).toEqual([true, true, false, false]);
    });

    it("lets a map viewer who edits the trip see the trip's hidden photos, not the map's", () => {
      const access = { mapRole: 'VIEWER', trip: { id: 'trip-1', role: 'EDITOR' } };
      expect([onTrip, onTripHidden, elsewhere, elsewhereHidden].map((p) => canSeeMomentPhoto(p, access))).toEqual([true, true, true, false]);
    });

    it('shows nothing to someone with no role', () => {
      expect(canSeeMomentPhoto(onTrip, {})).toBe(false);
      expect(canSeeMomentPhoto(onTrip, { mapRole: null, trip: { id: 'trip-1', role: null } })).toBe(false);
      expect(canSeeMomentPhoto(null, { mapRole: 'OWNER' })).toBe(false);
    });
  });
});
