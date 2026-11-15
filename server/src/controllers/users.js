// Auth
import { deleteUserMedia } from '../auth.js';
// Media
import { hardDeleteObject, isAllowedUploadType } from '../services/s3/mediaService.js';
// Background
import { runAfterResponse } from '../utils/background.js';
// Sanitization
import { sanitizeText, clampInt } from '../utils/sanitize.js';
// Permissions
import { ADMIN_ACTIONS, checkAdminAction, isValidRole, normalizeRole } from '../utils/userPermissions.js';
// Events
import { logEvent } from '../utils/events/logEvent.js';
import {
  createUserGetByIdSuccessEvent,
  createUserChangeRoleSuccessEvent,
  createUserUpdateSuccessEvent,
  createAdminDeleteUserSuccessEvent,
  createUserDeactivateSuccessEvent,
  createUserReactivateSuccessEvent,
} from '../event/userUtils.js';
// Domain
import {
  findUserById,
  findUsersPage,
  deleteUserById,
  updateUserRole,
  setUserActiveStatus,
  findOwnAvatarUpload,
  upsertUserAvatarWithMedia,
  clearUserAvatar,
} from '../domain/users.js';
// Responses
import {
  DOMAINS,
  EVENT_MESSAGES,
  sendDataResponse,
  sendMessageResponse,
} from '../utils/responses/responses.js';
// Errors
import {
  NotFoundEvent,
  ServerErrorEvent,
  BadRequestEvent,
  NoPermissionEvent,
  createGenericErrorEvent,
} from '../event/errorUtils.js';

const USER_STATUS_FILTERS = { active: true, inactive: false };

const fail = (res, errorEvent) => {
  logEvent(createGenericErrorEvent(errorEvent));
  return sendMessageResponse(res, errorEvent.code, errorEvent.message);
};

const failServer = (req, res, detail) =>
  fail(res, new ServerErrorEvent(req.user, DOMAINS.users, detail));

const notFound = (req) => new NotFoundEvent(req.user, DOMAINS.users, EVENT_MESSAGES.userNotFound);

// checkAdminAction result -> error event
const deniedEvent = (req, denied) =>
  denied.code === 400
    ? new BadRequestEvent(req.user, DOMAINS.users, denied.message)
    : new NoPermissionEvent(req.user, DOMAINS.users, denied.message);

// Load target + apply admin rules (returns the target, or sends the error)
const loadTargetFor = async (req, res, { userId, action, newRole }) => {
  const target = typeof userId === 'string' && userId ? await findUserById(userId) : null;
  if (!target) {
    fail(res, notFound(req));
    return null;
  }

  const denied = checkAdminAction({ actor: req.user, target, action, newRole });
  if (denied) {
    fail(res, deniedEvent(req, denied));
    return null;
  }

  return target;
};

// Admin list (paged + filtered)
export const getAllUsersHandler = async (req, res) => {
  const query = req.query || {};
  const page = clampInt(query.page, { min: 1, max: 100000, fallback: 1 });
  const pageSize = clampInt(query.pageSize, { min: 1, max: 100, fallback: 20 });
  const search = sanitizeText(query.search, { maxLength: 100 });
  const role = query.role ? normalizeRole(query.role) : '';
  const isActive = USER_STATUS_FILTERS[String(query.status || '').toLowerCase()];

  if (role && !isValidRole(role)) {
    return fail(res, new BadRequestEvent(req.user, DOMAINS.users, EVENT_MESSAGES.invalidRole));
  }

  try {
    const { users, total } = await findUsersPage({
      skip: (page - 1) * pageSize,
      take: pageSize,
      search,
      role: role || undefined,
      isActive,
    });

    return sendDataResponse(res, 200, { users, total, page, pageSize });
  } catch (err) {
    return failServer(req, res, `Get all users failed ${err.message}`);
  }
};

export const getUserByIdForAdminHandler = async (req, res) => {
  const { userId } = req.params;

  try {
    const foundUser = await findUserById(userId);
    if (!foundUser) return fail(res, notFound(req));

    logEvent(createUserGetByIdSuccessEvent({ user: req.user, target: foundUser }));
    return sendDataResponse(res, 200, { user: foundUser });
  } catch (err) {
    return failServer(req, res, `Get user by ID failed ${err.message}`);
  }
};

// Current user (runs on every page load, so no audit event)
export const getLoggedInUserHandler = async (req, res) => {
  const user = req.user;

  if (!user?.id) {
    return sendMessageResponse(res, 401, EVENT_MESSAGES.noValidSession);
  }

  return sendDataResponse(res, 200, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
};

// Avatar: the user's own upload, confirmed (real type and size checked in the bucket)
// and of an allowed image type
export const uploadOrChangeAvatarHandler = async (req, res) => {
  const userId = req.user.id;
  const { key, alt, focalX, focalY } = req.body || {};

  try {
    const media = typeof key === 'string' ? await findOwnAvatarUpload(userId, key) : null;
    if (!media || !isAllowedUploadType('avatar', media.contentType)) {
      const badRequest = new BadRequestEvent(req.user, DOMAINS.users, EVENT_MESSAGES.avatarInvalid);
      logEvent(createGenericErrorEvent(badRequest));
      return sendMessageResponse(res, badRequest.code, badRequest.message);
    }

    const { avatar, oldKey } = await upsertUserAvatarWithMedia({
      userId,
      media,
      alt: sanitizeText(alt, { maxLength: 200 }),
      focalX: typeof focalX === 'number' ? focalX : null,
      focalY: typeof focalY === 'number' ? focalY : null,
    });

    if (oldKey) runAfterResponse(hardDeleteObject({ key: oldKey, user: req.user }));

    logEvent(createUserUpdateSuccessEvent({ user: req.user, target: { id: userId } }));

    return sendDataResponse(res, 200, { avatar });
  } catch (err) {
    const serverError = new ServerErrorEvent(
      req.user,
      DOMAINS.users,
      `Update user avatar failed ${err.message}`
    );
    logEvent(createGenericErrorEvent(serverError));
    return sendMessageResponse(res, serverError.code, serverError.message);
  }
};

export const removeAvatarHandler = async (req, res) => {
  try {
    const oldKey = await clearUserAvatar(req.user.id);

    if (oldKey) runAfterResponse(hardDeleteObject({ key: oldKey, user: req.user }));

    logEvent(createUserUpdateSuccessEvent({ user: req.user, target: { id: req.user.id } }));

    return sendDataResponse(res, 200, { message: 'Avatar removed.' });
  } catch (err) {
    const serverError = new ServerErrorEvent(
      req.user,
      DOMAINS.users,
      `Remove user avatar failed ${err.message}`
    );
    logEvent(createGenericErrorEvent(serverError));
    return sendMessageResponse(res, serverError.code, serverError.message);
  }
};

export const changeUserRoleHandler = async (req, res) => {
  const { userId, newRole } = req.body || {};

  if (!userId || !newRole) {
    return fail(res, new BadRequestEvent(req.user, DOMAINS.users, EVENT_MESSAGES.missingFields));
  }

  try {
    const target = await loadTargetFor(req, res, { userId, action: ADMIN_ACTIONS.changeRole, newRole });
    if (!target) return;

    const updatedUser = await updateUserRole(target.id, normalizeRole(newRole));

    logEvent(createUserChangeRoleSuccessEvent({
      user: req.user,
      target: updatedUser,
      previousRole: target.role,
    }));
    return sendDataResponse(res, 200, { user: updatedUser });
  } catch (err) {
    if (err?.code === 'P2025') return fail(res, notFound(req));
    return failServer(req, res, `${EVENT_MESSAGES.updateUserRoleError} ${err.message}`);
  }
};

// Admin delete (target is :userId, not the caller)
export const adminDeleteUserHandler = async (req, res) => {
  try {
    const target = await loadTargetFor(req, res, { userId: req.params.userId, action: ADMIN_ACTIONS.delete });
    if (!target) return;

    // Avatar files go before the user row (ownership is lost after)
    await deleteUserMedia(target);
    await deleteUserById(target.id);

    logEvent(createAdminDeleteUserSuccessEvent({ admin: req.user, target }));
    return sendDataResponse(res, 200, {
      message: `User ${target.email} deleted.`,
      id: target.id,
    });
  } catch (err) {
    if (err?.code === 'P2025') return fail(res, notFound(req));
    return failServer(req, res, `${EVENT_MESSAGES.deleteUserError} ${err.message}`);
  }
};

// Deactivate (also revokes every session) / reactivate
const setActiveHandler = (isActive) => async (req, res) => {
  const action = isActive ? ADMIN_ACTIONS.reactivate : ADMIN_ACTIONS.deactivate;
  const failMessage = isActive ? EVENT_MESSAGES.reactivateUserError : EVENT_MESSAGES.deactivateUserError;

  try {
    const target = await loadTargetFor(req, res, { userId: req.params.userId, action });
    if (!target) return;

    const updatedUser = await setUserActiveStatus(target.id, isActive);

    const createEvent = isActive ? createUserReactivateSuccessEvent : createUserDeactivateSuccessEvent;
    logEvent(createEvent({ user: req.user, target: updatedUser }));

    return sendDataResponse(res, 200, { user: updatedUser });
  } catch (err) {
    if (err?.code === 'P2025') return fail(res, notFound(req));
    return failServer(req, res, `${failMessage} ${err.message}`);
  }
};

export const deactivateUserHandler = setActiveHandler(false);
export const reactivateUserHandler = setActiveHandler(true);
