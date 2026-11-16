// Auth (better-auth)
export const LOGIN_EMAIL_API = '/api/auth/sign-in/email';
export const SIGNOUT_API = '/api/auth/sign-out';
export const REGISTER_API = '/api/auth/sign-up/email';
export const RESET_PASSWORD_REQUEST_API = '/api/auth/request-password-reset';
export const RESET_PASSWORD_API = '/api/auth/reset-password';
export const VERIFY_EMAIL_API = '/api/auth/verify-email'; // ?token=
export const SEND_VERIFICATION_EMAIL_API = '/api/auth/send-verification-email';
export const CHANGE_PASSWORD_API = '/api/auth/change-password';
export const CHANGE_EMAIL_API = '/api/auth/change-email';
export const UPDATE_USER_API = '/api/auth/update-user';
export const REVOKE_OTHER_SESSIONS_API = '/api/auth/revoke-other-sessions';
export const DELETE_ACCOUNT_API = '/api/auth/delete-user';
// Current user
export const GET_LOGGED_IN_USER_API = '/api/users/user/get-logged-in-user';
export const CHANGE_OR_ADD_AVATAR_API =
  '/api/users/user/upload-or-change-avatar';
export const REMOVE_AVATAR_API = '/api/users/user/remove-avatar';

// Contact Form
export const SUBMIT_CONTACT_FORM_API = '/api/contact/create-new-contact-form';
export const GET_ALL_CONTACT_FROMS_API = '/api/contact/get-all-contact-forms';
export const DELETE_CONTACT_FORM_API = '/api/contact/delete-contact-form';
export const DELETE_ALL_CONTACT_FORM_API =
  '/api/contact/delete-all-contact-forms';

// Admin users
export const ADMIN_GET_ALL_USERS_API = '/api/users/admin/get-all-users'; // ?page=&pageSize=&search=&role=&status=
export const ADMIN_GET_USER_BY_ID_API = '/api/users/admin/get-user-by-id'; // append /:userId
export const ADMIN_CHANGE_USER_ROLE_API = '/api/users/admin/change-user-role'; // PATCH { userId, newRole }
export const ADMIN_DEACTIVATE_USER_API = '/api/users/admin/deactivate-user'; // PATCH /:userId
export const ADMIN_REACTIVATE_USER_API = '/api/users/admin/reactivate-user'; // PATCH /:userId
export const ADMIN_DELETE_USER_API = '/api/users/admin/delete-user-by-id'; // DELETE /:userId

// Audit log (developer only)
export const GET_PAGINATED_EVENTS_API = '/api/events/get-paginated-events'; // ?page=&pageSize=&level=&domain=&status=&search=
export const GET_EVENT_BY_ID_API = '/api/events/get-event-by-id'; // append /:eventId
export const UPDATE_EVENT_STATUS_API = '/api/events/update-event-status'; // PATCH /:eventId { status }
export const DELETE_EVENT_API = '/api/events/delete-event'; // DELETE /:eventId
export const DELETE_ALL_EVENTS_API = '/api/events/delete-all-events';

// Travel (docs/API.md). Paths below these bases are built in src/api/travelApi.js.
export const COUNTRIES_API = '/api/countries';
export const LANDMARKS_API = '/api/landmarks'; // ?country=JP
export const MAPS_API = '/api/maps'; // /:mapId, /:mapId/stats|travellers|visits|trips|photos|moments|sharing|members|invites
export const TRIPS_API = '/api/trips'; // /:tripId, /:tripId/stops|travellers|photos|moments|maps|sharing|members|invites, /shared-with-me
export const PHOTOS_API = '/api/photos'; // /:photoId, /:photoId/landmarks, /:photoId/move
export const MOMENTS_API = '/api/moments'; // /:momentId (PATCH, DELETE)
export const SHARED_API = '/api/shared'; // /:code, /:code/photos, /:code/photos/:photoId, /:code/moments
export const ACCEPT_INVITE_API = '/api/invites/accept'; // POST { token }
export const MAP_SETTINGS_API = '/api/users/map-settings'; // GET, PUT { mapSettings }

// Plans and billing (docs/API.md, "Plans and billing"). Paths below it are built in src/api/plansApi.js.
export const BILLING_API = '/api/billing'; // GET; POST /checkout, /change-plan, /extra-maps, /portal
// Leaving (docs/API.md, "Leaving")
export const LEAVING_OPTIONS_API = '/api/users/leaving-options'; // GET
export const LEAVING_PLAN_API = '/api/users/leaving-plan'; // PUT { maps, leavePhotos }
// Admin: complimentary memberships and moving a map
export const ADMIN_PLAN_GRANTS_API = '/api/users/admin/plan-grants'; // GET, POST /:userId
export const ADMIN_END_PLAN_GRANT_API = '/api/users/admin/end-plan-grant'; // PATCH /:grantId
export const ADMIN_TRANSFER_MAP_API = '/api/users/admin/transfer-map'; // POST { mapId, toEmail, keepOldOwnerAsEditor }

// Media Routes
export const PRESIGN_UPLOAD_API = '/api/media-services/presign-url'; // POST: get presigned PUT for upload
export const CONFIRM_UPLOAD_API = '/api/media-services/confirm-upload'; // POST: verify real size after upload
export const GET_MEDIA_URL_API = '/api/media-services/get-url'; // GET: presigned GET for a restricted-view object
export const DELETE_MEDIA_OBJECT_API = '/api/media-services/delete-object'; // DELETE: remove object by key
