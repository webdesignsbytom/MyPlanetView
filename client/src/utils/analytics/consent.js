import { COOKIE_POLICY_NAME } from '@/utils/constants/constants';

const CONSENT_VERSION = '1.1.0';

// Analytics consent: 'granted' | 'denied' | null (not asked yet)
export function readConsent() {
  let raw;
  try {
    raw = localStorage.getItem(COOKIE_POLICY_NAME);
  } catch {
    // Storage blocked: a choice can't be kept, so never assume a yes
    return 'denied';
  }
  if (!raw) return null;

  try {
    const saved = JSON.parse(raw);
    if (saved?.analytics === 'granted' || saved?.analytics === 'denied') return saved.analytics;
    // Records saved by the modal before 1.1.0
    return saved?.agreed ? 'granted' : null;
  } catch {
    return null;
  }
}

// The footer's "Cookie settings" asks App to show the choice again (and so to let a yes
// be withdrawn)
const SETTINGS_EVENT = 'mpv:cookie-settings';

export function openCookieSettings() {
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}

// Returns the unsubscribe function, for an effect's clean-up
export function onCookieSettings(listener) {
  window.addEventListener(SETTINGS_EVENT, listener);
  return () => window.removeEventListener(SETTINGS_EVENT, listener);
}

// A choice made (or changed) with the pop-up, for what waits on it: the map's tips, which
// the pop-up would otherwise cover on a phone (26 Nov 2026, the audit)
const CHOICE_EVENT = 'mpv:cookie-choice';

// Returns the unsubscribe function, for an effect's clean-up
export function onCookieChoice(listener) {
  window.addEventListener(CHOICE_EVENT, listener);
  return () => window.removeEventListener(CHOICE_EVENT, listener);
}

// Whether the visitor has answered the cookie pop-up: on record, or this visit when the
// record couldn't be written (reading blocked storage counts as a no, so as answered)
let choiceThisVisit = false;
export const cookieChoiceMade = () => choiceThisVisit || readConsent() !== null;

export function saveConsent(analytics, details = {}) {
  try {
    localStorage.setItem(
      COOKIE_POLICY_NAME,
      JSON.stringify({ analytics, version: CONSENT_VERSION, timestamp: new Date().toISOString(), ...details }),
    );
  } catch {
    // Storage blocked: the choice lasts this visit only
  }
  choiceThisVisit = true;
  window.dispatchEvent(new Event(CHOICE_EVENT));
}
