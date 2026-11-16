// Who may do what on maps, trips and photos (docs/API.md, "Access").
// Pure: callers load the rows, these decide.

export const ROLES = Object.freeze({ OWNER: 'OWNER', EDITOR: 'EDITOR', VIEWER: 'VIEWER' });
export const SHARE_ROLES = Object.freeze(['VIEWER', 'EDITOR']); // what can be granted
export const LINK_ACCESS = Object.freeze({ RESTRICTED: 'RESTRICTED', ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' });

const RANK = { VIEWER: 1, EDITOR: 2, OWNER: 3 };

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
 * @param {{ role: 'VIEWER' | 'EDITOR' } | null | undefined} membership the user's MapMember row
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
export const canManage = (role) => role === ROLES.OWNER;

/**
 * Deleting a trip: the map's owner or an editor of the map. Someone added to the trip
 * alone (a TripMember EDITOR) edits it, but can't remove it. `mapRole` is the caller's
 * role on the trip's map.
 */
export const canDeleteTrip = (mapRole) => canEdit(mapRole);

/** Viewers never see hidden photos. */
export const canSeePhoto = (role, photo) => canView(role) && (!photo?.hidden || canEdit(role));

/** GPS coordinates and originals: editors and the owner only. */
export const canSeeLocation = (role) => canEdit(role);

/** Removing a member: the owner, or the member leaving. */
export function canRemoveMember({ actorRole, actorId, targetUserId }) {
  return canManage(actorRole) || (Boolean(actorId) && actorId === targetUserId);
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
  return !photo.hidden || canEdit(mapRole) || (onTrip && canEdit(trip.role));
}
