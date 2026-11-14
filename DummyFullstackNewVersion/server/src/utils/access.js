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

/** Viewers never see hidden photos. */
export const canSeePhoto = (role, photo) => canView(role) && (!photo?.hidden || canEdit(role));

/** GPS coordinates and originals: editors and the owner only. */
export const canSeeLocation = (role) => canEdit(role);

/** Removing a member: the owner, or the member leaving. */
export function canRemoveMember({ actorRole, actorId, targetUserId }) {
  return canManage(actorRole) || (Boolean(actorId) && actorId === targetUserId);
}
