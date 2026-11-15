// The session request, started at boot (main.jsx) alongside the first page's code instead
// of after it: AuthProvider's first effect only runs once that code has arrived, which on
// /map is the map page's JavaScript. AuthProvider takes the request from here.
import client from '@/api/client';
import { GET_LOGGED_IN_USER_API } from '@/utils/constants/apiRoutes';
import { getStoredItem } from '@/utils/functions/safeStorage';

// Set while this browser has a session; without it, nobody is asked
export const IS_LOGGED_IN_KEY = 'isLoggedIn';

let pending = null;

export function startSessionRequest() {
  if (!pending && getStoredItem(IS_LOGGED_IN_KEY) === 'true') {
    pending = client.get(GET_LOGGED_IN_USER_API, true);
    // Whoever takes it handles a failure; until then it isn't an unhandled rejection
    pending.catch(() => {});
  }
  return pending;
}

// The request started at boot, once (null if none was started)
export function takeSessionRequest() {
  const request = pending;
  pending = null;
  return request;
}
