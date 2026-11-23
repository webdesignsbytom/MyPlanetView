// Roles someone can be given on a map or trip (the owner is not one of them). A co-owner
// (19 Nov 2026, docs/API.md "Co-owners") is one of a map's travellers with their own login:
// everything the owner can do on that map but delete it, hand it over, pay for it or remove a
// co-owner. Maps only; a trip's people are viewers or editors.
export const SHARE_ROLE_OPTIONS = [
  { value: 'VIEWER', label: 'Viewer' },
  { value: 'EDITOR', label: 'Editor' },
];

export const MAP_SHARE_ROLE_OPTIONS = [...SHARE_ROLE_OPTIONS, { value: 'CO_OWNER', label: 'Co-owner' }];

export const ROLE_LABELS = { OWNER: 'Owner', CO_OWNER: 'Co-owner', EDITOR: 'Editor', VIEWER: 'Viewer' };

// "a viewer", "an editor", "a co-owner"
export const ROLE_WITH_ARTICLE = { OWNER: 'the owner', CO_OWNER: 'a co-owner', EDITOR: 'an editor', VIEWER: 'a viewer' };

export const LINK_ACCESS_OPTIONS = [
  { value: 'RESTRICTED', label: 'Restricted', hint: 'Only people added here can open it' },
  { value: 'ANYONE_WITH_LINK', label: 'Anyone with the link', hint: 'Anyone with the link can view it in their browser: no app or account needed' },
];

export const canEditRole = (role) => role === 'OWNER' || role === 'CO_OWNER' || role === 'EDITOR';

/** The map's settings and its sharing: the owner or a co-owner. */
export const canManageRole = (role) => role === 'OWNER' || role === 'CO_OWNER';

/**
 * The travellers a new co-owner could be: no login yet, and not waiting on a co-owner invite.
 * `room` is how many more co-owners the map takes (one fewer than its travellers, the owner
 * keeping one). -> `{ options: [{ value, label }], room }`
 */
export function coOwnerChoices(travellers = [], sharing = null) {
  const invited = new Set((sharing?.invites || []).map((i) => i.travellerId).filter(Boolean));
  const coOwners =
    (sharing?.members || []).filter((m) => m.role === 'CO_OWNER').length +
    (sharing?.invites || []).filter((i) => i.role === 'CO_OWNER').length;
  const options = travellers.filter((t) => !t.userId && !invited.has(t.id)).map((t) => ({ value: t.id, label: t.name }));
  return { options, room: Math.max(0, travellers.length - 1 - coOwners) };
}
