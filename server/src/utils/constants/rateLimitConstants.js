// Rate limit windows/caps
const MINUTES = 60 * 1000;

// The whole API. An app session (map, stats, trips, photo pages, edits) makes far
// more calls than the marketing site this template started as, so 300 was too low.
export const GLOBAL_RATE_LIMIT = {
  windowMs: 15 * MINUTES,
  max: 1000, // requests per IP per window
};

// Presign-url limit
export const PRESIGN_RATE_LIMIT = {
  windowMs: 15 * MINUTES,
  max: 20,
};

// Strict limit (forms and email-sending routes)
export const STRICT_RATE_LIMIT = {
  windowMs: 15 * MINUTES,
  max: 5,
};

// Database-backed limits for the travel routes (middleware/dbRateLimit.js), per IP

// Opening a share link (GET /api/shared/:code): where codes would be guessed
export const SHARE_LOOKUP_RATE_LIMIT = {
  name: 'share-lookup',
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

// better-auth limit (window in seconds, not ms)
export const BETTER_AUTH_RATE_LIMIT = {
  windowSeconds: 60,
  max: 100,
};
