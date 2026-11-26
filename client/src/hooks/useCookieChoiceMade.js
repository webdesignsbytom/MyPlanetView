import { useSyncExternalStore } from 'react';
import { cookieChoiceMade, onCookieChoice } from '@/utils/analytics/consent';

// Whether the visitor has answered the cookie pop-up yet, kept up to date as they do. False
// on the server and while hydrating (nothing in a first render reads storage).
export default function useCookieChoiceMade() {
  return useSyncExternalStore(onCookieChoice, cookieChoiceMade, () => false);
}
