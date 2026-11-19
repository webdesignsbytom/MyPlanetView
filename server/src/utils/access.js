// Who may do what on maps, trips and photos (docs/API.md, "Access").
// Pure: callers load the rows, these decide.

export const ROLES = Object.freeze({ OWNER: 'OWNER', CO_OWNER: 'CO_OWNER', EDITOR: 'EDITOR', VIEWER: 'VIEWER' });
// What can be granted on a map, and on a trip. A co-owner (19 Nov 2026, the user's wish:
// couples and families, docs/API.md "Co-owners") is one of a map's travellers with their own
// login and every power the owner has on that map except deleting it, handing it over,
// paying for it and removing a co-owner. Maps only: a trip's people are editors or viewers.
export const SHARE_ROLES = Object.freeze(['VIEWER', 'EDITOR', 'CO_OWNER']);
export const TRIP_SHARE_ROLES = Object.freeze(['VIEWER', 'EDITOR']);
export const LINK_ACCESS = Object.freeze({ RESTRICTED: 'RESTRICTED', ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' });

const RANK = { VIEWER: 1, EDITOR: 2, CO_OWNER: 3, OWNER: 4 };

/** The higher of two roles (null when neither). */
export function higherRole(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return RANK[a] >= RANK[b] ? a : b;
}

/** Does `role` reach `needed`? */
export function hasAtLeast(role, needed) {
  return Boolean(role && RANK[role] >= RANK[needed]);
}

/**
 * A user's role on a map: owner, else their MapMember row, else none.
 * @param {{ ownerId: string } | null} map
 * @param {string | null | undefined} userId
 * @param {{ role: 'VIEWER' | 'EDITOR' | 'CO_OWNER' } | null | undefined} membership the user's MapMember row
 */
export function mapRoleFor(map, userId, membership) {
  if (!map) return null;
  if (userId && map.ownerId === userId) return ROLES.OWNER;
  return membership?.role ?? null;
}

/** A user's role on a trip: the higher of their map role and the trip's own TripMember row. */
export function tripRoleFor(mapRole, tripMembership) {
  return higherRole(mapRole, tripMembership?.role ?? null);
}

/** The role a share code gives anyone holding it. */
export function linkRoleFor(linkAccess) {
  return linkAccess === LINK_ACCESS.ANYONE_WITH_LINK ? ROLES.VIEWER : null;
}

export const canView = (role) => hasAtLeast(role, ROLES.VIEWER);
export const canEdit = (role) => hasAtLeast(role, ROLES.EDITOR);
/** The map's settings (name, kind, UK split, travellers) and its sharing: the owner or a co-owner. */
export const canManage = (role) => hasAtLeast(role, ROLES.CO_OWNER);
/** Deleting the map, handing it to someone, making it the main map, paying for it: the owner alone. */
export const isOwner = (role) => role === ROLES.OWNER;

/**
 * Deleting a trip: the map's owner or an editor of the map. Someone added to the trip
 * alone (a TripMember EDITOR) edits it, but can't remove it. `mapRole` is the caller's
 * role on the trip's map.
 */
export const canDeleteTrip = (mapRole) => canEdit(mapRole);

/** Viewers never see hidden photos. */
// A video shows below editor only once Stream has converted it (videoState READY)
export const canSeePhoto = (role, photo) =>
  canView(role) &&
  (!photo?.hidden || canEdit(role)) &&
  (photo?.kind !== 'VIDEO' || photo.videoState === 'READY' || canEdit(role));

/** GPS coordinates and originals: editors and the owner only. */
export const canSeeLocation = (role) => canEdit(role);

/**
 * Removing a member: the member leaving; the owner, anyone; a co-owner, anyone but another
 * co-owner. `targetRole` is the member's role now.
 */
export function canRemoveMember({ actorRole, actorId, targetUserId, targetRole }) {
  if (Boolean(actorId) && actorId === targetUserId) return true;
  if (isOwner(actorRole)) return true;
  return canManage(actorRole) && targetRole !== ROLES.CO_OWNER;
}

/**
 * Giving someone a role, or changing theirs: the owner, any; a co-owner, any but taking a
 * co-owner's away (only the owner removes a co-owner). `currentRole` is null for someone new.
 */
export function canSetMemberRole({ actorRole, currentRole, newRole }) {
  if (isOwner(actorRole)) return true;
  if (!canManage(actorRole)) return false;
  return currentRole !== ROLES.CO_OWNER || newRole === ROLES.CO_OWNER;
}

// Group trips (docs/API.md "Group trips")

/**
 * Showing a trip on one of your own maps ("Add to my map"): anyone on the trip (any trip
 * role: a TripMember, or any role on the trip's map), onto a map they own or edit.
 */
export const canAddTripToMap = ({ tripRole, targetMapRole }) => canView(tripRole) && canEdit(targetMapRole);

/** Taking a trip off a map it was added to: whoever added it, or that map's owner. */
export const canRemoveTripFromMap = ({ userId, addedById, targetMapOwnerId }) =>
  Boolean(userId) && (userId === addedById || userId === targetMapOwnerId);

// Moments (docs/API.md "Moments"): the same rules as photos

/**
 * A user's role on a moment: on a trip, their trip role (so a trip-only editor edits the
 * moments of their trip), else their map role. `tripMembership` is their TripMember row
 * on the moment's trip.
 */
export const momentRoleFor = (mapRole, tripMembership, momentTripId) =>
  momentTripId ? tripRoleFor(mapRole, tripMembership) : mapRole ?? null;

/** Viewers never see hidden moments (as hidden photos). */
export const canSeeMoment = (role, moment) => canSeePhoto(role, moment);

/**
 * Which photos someone writing a moment may attach: a map editor any photo on the map
 * (null), a trip-only editor only those of the moment's trip (its id).
 */
export const momentPhotoScope = (mapRole, momentTripId) => (canEdit(mapRole) ? null : momentTripId ?? null);

/**
 * A photo shown inside a moment, for someone who reached it with `mapRole` on the map,
 * and through `trip` (`{ id, role }`, the trip's list or a trip's share link) or not.
 * Someone with no role on the map sees only that trip's photos; hidden photos only show
 * to an editor of the map, or of the trip for the trip's own photos.
 */
export function canSeeMomentPhoto(photo, { mapRole = null, trip = null } = {}) {
  if (!photo) return false;
  const onTrip = Boolean(trip?.id) && photo.tripId === trip.id;
  if (!canView(mapRole) && !(onTrip && canView(trip.role))) return false;
  const editor = canEdit(mapRole) || (onTrip && canEdit(trip.role));
  // A video still converting (or failed) is the editors' only, as in canSeePhoto (19 Nov
  // 2026, the audit: a moment or pin visit gave link visitors its id)
  if (photo.kind === 'VIDEO' && photo.videoState !== 'READY' && !editor) return false;
  return !photo.hidden || editor;
}
