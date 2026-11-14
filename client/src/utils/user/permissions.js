export const ROLES = {
  ADMIN: 'ADMIN',
  DEVELOPER: 'DEVELOPER',
  USER: 'USER',
};

// Simple role checker
export const hasRole = (user, ...roles) => {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
};

// Very simple "permission" system (optional)
export const hasPermission = (user, permission) => {
  if (!user) return false;
  // Example: check array of permissions on the user object
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
};

// Deactivated by an admin (server blocks them too)
export const isActive = (user) => {
  if (!user) return false;
  return user.isActive !== false;
};