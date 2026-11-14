// Roles someone can be given on a map or trip (the owner is not one of them).
export const SHARE_ROLE_OPTIONS = [
  { value: 'VIEWER', label: 'Viewer' },
  { value: 'EDITOR', label: 'Editor' },
];

export const ROLE_LABELS = { OWNER: 'Owner', EDITOR: 'Editor', VIEWER: 'Viewer' };

export const LINK_ACCESS_OPTIONS = [
  { value: 'RESTRICTED', label: 'Restricted', hint: 'Only people added here can open it' },
  { value: 'ANYONE_WITH_LINK', label: 'Anyone with the link', hint: 'Anyone with the link can view it, without signing in' },
];

export const canEditRole = (role) => role === 'OWNER' || role === 'EDITOR';
