// Addresses as they go into logs: AppEvent.path and the request log (requestLog.js).
// Share codes, invite and reset tokens, and most query values are secrets or personal
// (a verify link's token, a search for someone's email), so they're replaced. Pure
// and tested (tests/redactUrl.test.js).

// Path segments that are secrets, with what replaces them
const SECRET_PATHS = [
  // A share link: /api/shared/<code>, /api/shared/<code>/photos/...
  [/^(\/api\/shared\/)[^/?#]+/i, '$1:code'],
  // A friends challenge's join link: /api/challenges/join/<code>
  [/^(\/api\/challenges\/join\/)[^/?#]+/i, '$1:code'],
  // A promo code checked at sign-up: /api/promo-codes/<code> (a code for life gives a plan)
  [/^(\/api\/promo-codes\/)[^/?#]+/i, '$1:code'],
  // Invites: accepting takes the token in the body; any other segment could be one
  [/^(\/api\/invites\/)(?!accept(?:[/?#]|$))[^/?#]+/i, '$1:token'],
  // better-auth's links: /api/auth/reset-password/<token>, /api/auth/verify-email/<token>
  [/^(\/api\/auth\/(?:reset-password|verify-email)\/)[^/?#]+/i, '$1:token'],
];

// Query values kept as they are: filters and paging, never a secret
const PLAIN_QUERY_KEYS = new Set([
  'country',
  'unplaced',
  'best',
  'tripId',
  'landmark',
  'cursor',
  'limit',
  'page',
  'pageSize',
  'level',
  'domain',
  'status',
  'role',
  'isActive',
  'ttl',
]);

const MAX_LENGTH = 500;

const decode = (text) => {
  try {
    return decodeURIComponent(text.replace(/\+/g, ' '));
  } catch {
    return text;
  }
};

/**
 * `url` (a path with an optional query, like req.originalUrl) safe to log: secret path
 * segments become `:code` or `:token`, query values other than plain filters become
 * `:redacted` (their names stay), and the fragment goes. Repeating it changes nothing.
 */
export function redactUrl(url) {
  if (typeof url !== 'string' || !url) return url ?? null;
  const noHash = url.split('#', 1)[0];
  const queryAt = noHash.indexOf('?');
  let path = queryAt === -1 ? noHash : noHash.slice(0, queryAt);
  const query = queryAt === -1 ? '' : noHash.slice(queryAt + 1);

  for (const [pattern, replacement] of SECRET_PATHS) path = path.replace(pattern, replacement);

  let out = path;
  if (query) {
    const pairs = query
      .split('&')
      .filter(Boolean)
      .map((pair) => {
        const eq = pair.indexOf('=');
        if (eq === -1) return PLAIN_QUERY_KEYS.has(decode(pair)) ? pair : ':redacted';
        const name = pair.slice(0, eq);
        return PLAIN_QUERY_KEYS.has(decode(name)) ? pair : `${name}=:redacted`;
      });
    if (pairs.length) out = `${path}?${pairs.join('&')}`;
  }
  return out.length > MAX_LENGTH ? `${out.slice(0, MAX_LENGTH)}…` : out;
}
