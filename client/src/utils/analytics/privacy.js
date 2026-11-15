// What Google Analytics may see of an address. Share links, invites, password resets and
// email verification carry a secret in the path, and map and trip pages an id. GA is
// paused on the secret pages (initGA.js), and every address it is given goes through
// redactUrl first, so it only ever gets the route pattern ('/shared/:code').
import { ANALYTICS_EXCLUDED_PREFIXES, ANALYTICS_REDACTED_ROUTES } from '@/utils/constants/routes';

const ROUTES = ANALYTICS_REDACTED_ROUTES.map((pattern) => ({ pattern, prefix: `${pattern.split('/:')[0]}/` }));

// Campaign tags are the only query parameters kept; any other one could be a token
const KEPT_PARAM = /^utm_[a-z]+$/;

// A page whose address carries a secret: no analytics while it shows
export const isAnalyticsExcluded = (pathname) =>
  ANALYTICS_EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

// '/shared/K7QX-M2PA-9RTW' -> '/shared/:code' (anything below the prefix, however deep)
function redactPath(pathname) {
  const route = ROUTES.find(({ prefix }) => pathname.startsWith(prefix));
  return route ? route.pattern : pathname;
}

// An address as GA may see it. This site's: origin + route pattern + campaign tags, no
// hash. Another site's (a referrer): its origin only. Unreadable: nothing.
export function redactUrl(href, origin = window.location.origin) {
  if (!href) return '';
  let url;
  try {
    url = new URL(href, origin);
  } catch {
    return '';
  }
  if (url.origin !== origin) return url.origin === 'null' ? '' : `${url.origin}/`;

  const kept = new URLSearchParams();
  for (const [key, value] of url.searchParams) if (KEPT_PARAM.test(key)) kept.append(key, value);
  const search = kept.toString();
  return `${url.origin}${redactPath(url.pathname)}${search ? `?${search}` : ''}`;
}
