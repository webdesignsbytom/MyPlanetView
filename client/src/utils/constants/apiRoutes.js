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
// "Download my data" (docs/API.md, "Your data"): /export, /export/maps/:mapId,
// /export/maps/:mapId/photos?cursor=, /export/uploads?cursor=
export const DATA_EXPORT_API = '/api/users/export';

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
export const MAPS_API = '/api/maps'; // /:mapId, /:mapId/stats|travellers|visits|trips|photos|videos|moments|passport|badges|goals|sharing|members|invites
export const TRIPS_API = '/api/trips'; // /:tripId, /:tripId/stops|travellers|photos|moments|maps|sharing|members|invites, /shared-with-me
export const PHOTOS_API = '/api/photos'; // /:photoId, /:photoId/landmarks, /:photoId/move
export const MOMENTS_API = '/api/moments'; // /:momentId (PATCH, DELETE)
// Taking your travels with you (docs/API.md, "Travel copies"): one request, /:id (GET, DELETE),
// /:id/approve|decline|continue. Choosing and asking are on the map: MAPS_API/:mapId/travel-copy-choices, /travel-copies
export const TRAVEL_COPIES_API = '/api/travel-copies';
export const PINS_API = '/api/pins'; // /:pinId (GET, PATCH, DELETE), /:pinId/visits, /:pinId/visits/:visitId
export const GOALS_API = '/api/goals'; // /:goalId (PATCH, DELETE)
export const SHARED_API = '/api/shared'; // /:code, /:code/photos, /:code/photos/:photoId, /:code/moments|passport|badges|goals
export const PROMO_CODES_API = '/api/promo-codes'; // GET /:code (before signing up)
export const OFFERS_API = '/api/offers'; // GET: every live travel offer (docs/API.md, "Travel offers")
export const THEMES_API = '/api/themes'; // GET: this month's photo theme and the recent ones (docs/API.md, "Photo themes")
export const ADMIN_THEMES_API = '/api/users/admin/themes'; // GET, POST, POST /suggested, PATCH|DELETE /:themeId
export const FEEDBACK_API = '/api/feedback'; // POST a report; POST /screenshot/presign (docs/API.md, "Feedback")
export const ADMIN_FEEDBACK_API = '/api/users/admin/feedback'; // GET ?status=&kind=&cursor=; GET, PATCH, DELETE /:feedbackId
// The admin's overview, gifts by code and referral rewards (docs/API.md, "Admin")
export const ADMIN_OVERVIEW_API = '/api/users/admin/overview'; // GET
export const ADMIN_GIFTS_API = '/api/users/admin/gifts'; // GET ?code=
export const ADMIN_REFERRALS_API = '/api/users/admin/referrals'; // GET
export const CHALLENGES_API = '/api/challenges'; // GET, POST, /:challengeId (GET, PATCH, DELETE), /reset-link, /me, /join/:code (docs/API.md, "Friends challenges")
// "Guess where I was" (docs/API.md): a game by its link's code (anyone): /:code, /:code/plays, /:code/plays/:playId (PATCH), /:code/plays/:playId/guesses.
// A map's games are MAPS_API/:mapId/guess-games; deleting one GUESS_GAMES_API/:gameId
export const GUESS_API = '/api/guess';
export const GUESS_GAMES_API = '/api/guess-games';
// Slideshows of chosen photos (docs/API.md "Photo slideshows"): one by its link's code
// (SHOW_API/:code, /:code/photos), and changing one (PHOTO_SHOWS_API/:showId, /reset-link);
// a map's are MAPS_API/:mapId/photo-shows
export const SHOW_API = '/api/show';
export const PHOTO_SHOWS_API = '/api/photo-shows';
// Postcards (docs/API.md "Postcards"): the sender's own (POSTCARDS_API, /picture/presign,
// /:postcardId/reset-link), and one by its link's code (POSTCARD_API/:code, anyone)
export const POSTCARDS_API = '/api/postcards';
export const POSTCARD_API = '/api/postcard';
// Vs mode (docs/API.md "Vs mode"): mine, one, its link (/join/:code)
export const VS_API = '/api/vs';
// The flight log (docs/API.md "Flights"): a map's are MAPS_API/:mapId/flights; deleting one FLIGHTS_API/:flightId
export const FLIGHTS_API = '/api/flights';
export const OFFER_CLICK_PATH = '/go'; // /:offerId?p=&dest=&country=&from=&to= on the API's host (a card's link)
export const ACCEPT_INVITE_API = '/api/invites/accept'; // POST { token }
export const inviteApi = (token) => `/api/invites/${encodeURIComponent(token)}`; // GET: what an invite is for, signed out too
export const MAP_SETTINGS_API = '/api/users/map-settings'; // GET, PUT { mapSettings }

// Plans and billing (docs/API.md, "Plans and billing"). Paths below it are built in src/api/plansApi.js.
export const BILLING_API = '/api/billing'; // GET; POST /checkout, /change-plan, /extra-maps, /portal, /gift-checkout
export const GIFTS_API = '/api/gifts'; // GET (yours); GET /:code; POST /redeem
// Leaving (docs/API.md, "Leaving")
export const LEAVING_OPTIONS_API = '/api/users/leaving-options'; // GET
export const LEAVING_PLAN_API = '/api/users/leaving-plan'; // PUT { maps, leavePhotos }
// Admin: complimentary memberships and moving a map
export const ADMIN_PLAN_GRANTS_API = '/api/users/admin/plan-grants'; // GET, POST /:userId
export const ADMIN_END_PLAN_GRANT_API = '/api/users/admin/end-plan-grant'; // PATCH /:grantId
export const ADMIN_TRANSFER_MAP_API = '/api/users/admin/transfer-map'; // POST { mapId, toEmail, keepOldOwnerAsEditor }
// Admin: influencer codes (docs/API.md, "Promo codes")
export const ADMIN_PROMO_CODES_API = '/api/users/admin/promo-codes'; // GET, POST, PATCH /:promoCodeId
// Admin: travel offers (docs/API.md, "Travel offers")
export const ADMIN_OFFERS_API = '/api/users/admin/offers'; // GET, POST, POST /import, PATCH|DELETE /:offerId

// Media Routes
export const PRESIGN_UPLOAD_API = '/api/media-services/presign-url'; // POST: get presigned PUT for upload
export const CONFIRM_UPLOAD_API = '/api/media-services/confirm-upload'; // POST: verify real size after upload
export const GET_MEDIA_URL_API = '/api/media-services/get-url'; // GET: presigned GET for a restricted-view object
export const DELETE_MEDIA_OBJECT_API = '/api/media-services/delete-object'; // DELETE: remove object by key
