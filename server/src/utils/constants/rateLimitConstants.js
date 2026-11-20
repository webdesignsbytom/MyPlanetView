// Rate limit windows/caps
const MINUTES = 60 * 1000;
const DAY = 24 * 60 * MINUTES;

// IPv6 visitors are counted per /64 (one home or phone gets a whole /64, so
// counting single addresses would let one visitor rotate through billions)
export const IPV6_SUBNET = 64;

// The whole API, in memory per instance (middleware/rateLimit.js): only a coarse
// backstop. An app session (map, stats, trips, photo pages, edits) makes far more
// calls than the marketing site this template started as, so 300 was too low.
export const GLOBAL_RATE_LIMIT = {
  windowMs: 15 * MINUTES,
  max: 1000, // requests per IP per window
};

// Database-backed limits (middleware/dbRateLimit.js), shared by every Vercel
// instance. Per IP unless the route keys them by user (keyByUserId).

// The public contact form: each one emails the site's inbox
export const CONTACT_FORM_RATE_LIMIT = {
  name: 'contact-form',
  windowMs: 15 * MINUTES,
  max: 5,
};

// Generic uploads (avatars, contact images): presign and confirm share this count,
// so one upload uses two
export const MEDIA_UPLOAD_RATE_LIMIT = {
  name: 'media-upload',
  windowMs: 15 * MINUTES,
  max: 20,
};

// Looking a share code up: opening a link (GET /api/shared/:code) always counts,
// and so does a photo request whose code matches nothing, so codes can't be
// guessed through any /shared route faster than this
export const SHARE_LOOKUP_RATE_LIMIT = {
  name: 'share-lookup',
  windowMs: 15 * MINUTES,
  max: 30,
};

// Offer clicks counted per IP (GET /go/:offerId). Beyond it the click still goes through,
// it just isn't counted, so nobody can pad an offer's tally
export const OFFER_CLICK_COUNT_LIMIT = {
  name: 'offer-click',
  windowMs: 15 * MINUTES,
  max: 60,
};

// Looking up a promo code before signing up (GET /api/promo-codes/:code)
export const PROMO_LOOKUP_RATE_LIMIT = {
  name: 'promo-lookup',
  windowMs: 15 * MINUTES,
  max: 30,
};

// Browsing an open share link (its photo pages and photos): one visit makes many
export const SHARE_BROWSE_RATE_LIMIT = {
  name: 'share-browse',
  windowMs: 15 * MINUTES,
  max: 300,
};

export const PHOTO_PRESIGN_RATE_LIMIT = {
  name: 'photo-presign',
  windowMs: 15 * MINUTES,
  max: 120,
};

export const MEMBER_INVITE_RATE_LIMIT = {
  name: 'member-invite',
  windowMs: 60 * MINUTES,
  max: 20,
};

// Adding people, per signed-in user (keyed by user id, not IP): each one sends an
// email from our domain, and Resend's free plan allows 100 a day in all
export const MEMBER_INVITE_DAILY_USER_LIMIT = {
  name: 'member-invite-user-day',
  windowMs: DAY,
  max: 25,
};

// New maps per signed-in user a day. Someone sets up a solo, a couple's and a
// family map, maybe a few more; 20 leaves plenty of room while stopping a script
// filling the database
export const MAP_CREATE_DAILY_USER_LIMIT = {
  name: 'map-create-user-day',
  windowMs: DAY,
  max: 20,
};

// Requests to copy your travels from a family map, per user per day: each emails the map's
// owner (docs/API.md "Travel copies")
export const TRAVEL_COPY_DAILY_USER_LIMIT = {
  name: 'travel-copy-user-day',
  windowMs: DAY,
  max: 20,
};

// Friends challenges started per user per day (keyed by user, as new maps)
export const CHALLENGE_CREATE_DAILY_USER_LIMIT = {
  name: 'challenge-create-user-day',
  windowMs: DAY,
  max: 10,
};

// Opening or joining a challenge by its link, per IP: codes would be guessed here
export const CHALLENGE_LOOKUP_RATE_LIMIT = {
  name: 'challenge-lookup',
  windowMs: 15 * MINUTES,
  max: 30,
};

// Billing writes per signed-in user (checkout, plan and extra-map changes, the portal):
// each one calls Stripe
export const BILLING_RATE_LIMIT = {
  name: 'billing-user',
  windowMs: 15 * MINUTES,
  max: 20,
};

// "Download my data" per signed-in user: the account, each map, and each page of 500
// photos (with their signed links) is a request, so a big account makes a hundred or so
export const DATA_EXPORT_RATE_LIMIT = {
  name: 'data-export',
  windowMs: 60 * MINUTES,
  max: 600,
};

// better-auth's limiter (window in seconds, not ms), on the database (auth.js).
// For sign-in, sign-up, change-password and change-email its own stricter rule
// replaces this one: 3 per 10 s.
export const BETTER_AUTH_RATE_LIMIT = {
  windowSeconds: 60,
  max: 100,
};

// better-auth routes that send email (password reset, verification, sign-up, change-email):
// 5 per 15 minutes per IP
export const AUTH_EMAIL_RATE_LIMIT = {
  windowSeconds: 15 * 60,
  max: 5,
};
