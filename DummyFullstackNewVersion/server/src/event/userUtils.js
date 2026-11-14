import { createAppEvent, levelFromStatusCode } from './events.js';

const DOMAIN = 'users';

// Normalizers
const normalizeUser = (user) => {
  if (user && typeof user === 'object') {
    return {
      id: user.id ?? null,
      email: user.email ?? 'anonymous',
      role: user.role ?? 'USER',
    };
  }
  return { id: null, email: 'anonymous', role: 'USER' };
};

const normalizeTarget = (t) => {
  const src = t || {};
  return {
    id: src.id ?? null,
    email: src.email ?? null,
    role: src.role ?? null,
    isVerified: typeof src.isVerified === 'boolean' ? src.isVerified : null,
    isActive: typeof src.isActive === 'boolean' ? src.isActive : null,
  };
};

const normalizePagination = ({ page, pageSize, total, totalPages } = {}) => ({
  page: page ? Number(page) : null,
  pageSize: pageSize ? Number(pageSize) : null,
  total: typeof total === 'number' ? total : null,
  totalPages: typeof totalPages === 'number' ? totalPages : null,
});

const mk = (action, actor, details = {}, statusCode = 200, extra = '') => {
  const u = normalizeUser(actor);
  const t = normalizeTarget(details?.target);
  const p = normalizePagination(details?.pagination);

  const parts = [
    action,
    t?.id ? `targetId=${t.id}` : null,
    t?.email ? `targetEmail=${t.email}` : null,
    t?.role ? `targetRole=${t.role}` : null,
    typeof t?.isVerified === 'boolean' ? `isVerified=${t.isVerified}` : null,
    typeof t?.isActive === 'boolean' ? `isActive=${t.isActive}` : null,
    p?.page != null ? `page=${p.page}` : null,
    p?.pageSize != null ? `size=${p.pageSize}` : null,
    p?.total != null ? `total=${p.total}` : null,
    p?.totalPages != null ? `pages=${p.totalPages}` : null,
    extra || null,
  ].filter(Boolean);

  const message = parts.join(' | ');

  return createAppEvent({
    level: levelFromStatusCode(statusCode),
    domain: DOMAIN,
    action,
    message,
    statusCode,
    actorId: u.id,
    // Deleted users can't be linked (FK)
    targetId: details?.linkTarget === false ? null : t.id,
    metadata: details?.metadata,
  });
};

// Get all
export const createUserGetAllRequestedEvent = async ({ user, query }) => {
  await mk('Get All Requested', user, { pagination: { page: query?.page, pageSize: query?.pageSize } }, 200);
};
export const createUserGetAllSuccessEvent = async ({ user, pagination }) => {
  await mk('Get All Success', user, { pagination }, 200);
};
export const createUserGetAllFailedEvent = async ({ user, error }) => {
  await mk('Get All Failed', user, {}, error?.status || 500, `error=${String(error?.message || error)}`);
};

// Get by id
export const createUserGetByIdRequestedEvent = async ({ user, target }) => {
  await mk('Get By Id Requested', user, { target }, 200);
};
export const createUserGetByIdSuccessEvent = async ({ user, target }) => {
  await mk('Get By Id Success', user, { target }, 200);
};
export const createUserGetByIdFailedEvent = async ({ user, target, error }) => {
  await mk('Get By Id Failed', user, { target }, error?.status || 500, `error=${String(error?.message || error)}`);
};

// Get logged in
export const createUserGetLoggedInRequestedEvent = async ({ user }) => {
  await mk('Get Me Requested', user, {}, 200);
};
export const createUserGetLoggedInSuccessEvent = async ({ user }) => {
  await mk('Get Me Success', user, {}, 200);
};
export const createUserGetLoggedInFailedEvent = async ({ user, error }) => {
  await mk('Get Me Failed', user, {}, error?.status || 500, `error=${String(error?.message || error)}`);
};

// Register
export const createUserRegisterRequestedEvent = async ({ email }) => {
  await mk('Register Requested', { email, role: 'USER' }, {}, 200, email ? `email=${email}` : '');
};
export const createUserRegisterSuccessEvent = async ({ target }) => {
  await mk('Register Success', target, { target }, 201);
};
export const createUserRegisterFailedEvent = async ({ email, error }) => {
  await mk('Register Failed', { email, role: 'USER' }, {}, error?.status || 500, `error=${String(error?.message || error)}`);
};

// Verify email
export const createUserVerifyEmailRequestedEvent = async ({ user, userId }) => {
  await mk('Verify Email Requested', user, { target: { id: userId } }, 200);
};
export const createUserVerifyEmailSuccessEvent = async ({ user, target }) => {
  await mk('Verify Email Success', user, { target }, 200);
};
export const createUserVerifyEmailFailedEvent = async ({ user, userId, error }) => {
  await mk('Verify Email Failed', user, { target: { id: userId } }, error?.status || 500, `error=${String(error?.message || error)}`);
};

// Resend verification
export const createUserResendVerificationRequestedEvent = async ({ user, userId, email }) => {
  await mk('Resend Verification Requested', user, { target: { id: userId, email } }, 200);
};
export const createUserResendVerificationSuccessEvent = async ({ user, userId, email }) => {
  await mk('Resend Verification Success', user, { target: { id: userId, email } }, 200);
};
export const createUserResendVerificationFailedEvent = async ({ user, userId, email, error }) => {
  await mk('Resend Verification Failed', user, { target: { id: userId, email } }, error?.status || 500, `error=${String(error?.message || error)}`);
};

// Password change (authed)
export const createUserPasswordChangeRequestedEvent = async ({ user }) => {
  await mk('Password Change Requested', user, {}, 200);
};
export const createUserPasswordChangeSuccessEvent = async ({ user, target }) => {
  await mk('Password Change Success', user, { target }, 200);
};
export const createUserPasswordChangeFailedEvent = async ({ user, error }) => {
  await mk('Password Change Failed', user, {}, error?.status || 500, `error=${String(error?.message || error)}`);
};

// Password reset request
export const createUserPasswordResetRequestRequestedEvent = async ({ email }) => {
  await mk('Password Reset Request Requested', { email, role: 'USER' }, {}, 200, `email=${email}`);
};
export const createUserPasswordResetRequestSuccessEvent = async ({ user }) => {
  await mk('Password Reset Request Success', user, {}, 201);
};
export const createUserPasswordResetRequestFailedEvent = async ({ email, error }) => {
  await mk('Password Reset Request Failed', { email, role: 'USER' }, {}, error?.status || 500, `error=${String(error?.message || error)}`);
};

// Password reset perform
export const createUserPasswordResetPerformRequestedEvent = async ({ userId }) => {
  await mk('Password Reset Perform Requested', { id: userId }, { target: { id: userId } }, 200);
};
export const createUserPasswordResetPerformSuccessEvent = async ({ userId }) => {
  await mk('Password Reset Perform Success', { id: userId }, { target: { id: userId } }, 200);
};
export const createUserPasswordResetPerformFailedEvent = async ({ userId, error }) => {
  await mk('Password Reset Perform Failed', { id: userId }, { target: { id: userId } }, error?.status || 500, `error=${String(error?.message || error)}`);
};

// Update
export const createUserUpdateRequestedEvent = async ({ user, next }) => {
  const extra = next?.email ? `email=${next.email}` : '';
  await mk('Update Requested', user, {}, 200, extra);
};
export const createUserUpdateSuccessEvent = async ({ user, target }) => {
  await mk('Update Success', user, { target }, 201);
};
export const createUserUpdateFailedEvent = async ({ user, error }) => {
  await mk('Update Failed', user, {}, error?.status || 500, `error=${String(error?.message || error)}`);
};

// Role
export const createUserChangeRoleRequestedEvent = async ({ user, userId, newRole }) => {
  await mk('Change Role Requested', user, { target: { id: userId, role: newRole } }, 200);
};
export const createUserChangeRoleSuccessEvent = async ({ user, target, previousRole }) => {
  await mk('Change Role Success', user, {
    target,
    metadata: { previousRole: previousRole ?? null, newRole: target?.role ?? null },
  }, 200);
};
export const createUserChangeRoleFailedEvent = async ({ user, userId, newRole, error }) => {
  await mk('Change Role Failed', user, { target: { id: userId, role: newRole } }, error?.status || 500, `error=${String(error?.message || error)}`);
};

// Delete (self)
export const createUserDeleteRequestedEvent = async ({ user }) => {
  await mk('Delete Requested', user, { target: { id: user?.id, email: user?.email } }, 200);
};
export const createUserDeleteSuccessEvent = async ({ user }) => {
  await mk('Delete Success', user, {}, 200);
};
export const createUserDeleteFailedEvent = async ({ user, error }) => {
  await mk('Delete Failed', user, {}, error?.status || 500, `error=${String(error?.message || error)}`);
};

// Admin delete
export const createAdminDeleteUserRequestedEvent = async ({ admin, userId }) => {
  await mk('Admin Delete Requested', admin, { target: { id: userId } }, 200);
};
export const createAdminDeleteUserSuccessEvent = async ({ admin, target }) => {
  await mk('Admin Delete Success', admin, {
    target,
    linkTarget: false,
    metadata: { deletedUserId: target?.id ?? null, email: target?.email ?? null, role: target?.role ?? null },
  }, 200);
};
export const createAdminDeleteUserFailedEvent = async ({ admin, userId, error }) => {
  await mk('Admin Delete Failed', admin, { target: { id: userId } }, error?.status || 500, `error=${String(error?.message || error)}`);
};

// Active state
export const createUserDeactivateRequestedEvent = async ({ user }) => {
  await mk('Deactivate Requested', user, {}, 200);
};
export const createUserDeactivateSuccessEvent = async ({ user, target }) => {
  await mk('Deactivate Success', user, { target, metadata: { sessionsRevoked: true } }, 200);
};
export const createUserDeactivateFailedEvent = async ({ user, error }) => {
  await mk('Deactivate Failed', user, {}, error?.status || 500, `error=${String(error?.message || error)}`);
};

export const createUserReactivateRequestedEvent = async ({ user }) => {
  await mk('Reactivate Requested', user, {}, 200);
};
export const createUserReactivateSuccessEvent = async ({ user, target }) => {
  await mk('Reactivate Success', user, { target }, 200);
};
export const createUserReactivateFailedEvent = async ({ user, error }) => {
  await mk('Reactivate Failed', user, {}, error?.status || 500, `error=${String(error?.message || error)}`);
};
