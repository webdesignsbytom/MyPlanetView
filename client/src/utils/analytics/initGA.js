// GA4, after consent only, loaded when the browser is idle. Every address GA gets is
// redacted (privacy.js), and GA is paused while a page with a secret in its address shows.
// Withdrawing consent (the footer's Cookie settings) stops it: stopGA.
import { isAnalyticsExcluded, redactUrl } from './privacy';

let started = false;
let gaReady = false;
// Consent withdrawn (or not given): nothing may reach GA
let stopped = false;
let queue = [];
let measurement = '';
// The page showing and the one before it, as GA may see them
let page = '';
let referrer = '';

// GA's page title: the address's route pattern ('/maps/:mapId', '/about'), never
// document.title, which on the map, trip and passport pages is the person's own map or trip
// name; without one set, gtag.js sends document.title with every hit (19 Nov 2026, the audit)
const titleOf = (address) => {
  try {
    return new URL(address).pathname;
  } catch {
    return '';
  }
};

// tiny helper: run after the browser is idle (with a fallback)
function onIdle(fn) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    // give the page a moment to paint before we touch the network
    requestIdleCallback(fn, { timeout: 3000 });
  } else {
    setTimeout(fn, 0);
  }
}

// gtag.js sends nothing for an ID while window['ga-disable-<ID>'] is true. Paused on a
// secret page, and always once consent is withdrawn.
function setPaused(paused) {
  if (!measurement) return;
  if (paused || stopped) window[`ga-disable-${measurement}`] = true;
  else delete window[`ga-disable-${measurement}`];
}

// GA's cookies (_ga, _ga_<container>, and the older _gid and _gat), on this host and on
// each parent domain GA may have set them on (it uses the highest one it can)
function clearGaCookies() {
  const names = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter((name) => /^_ga(_|$)|^_gid$|^_gat(_|$)/.test(name));
  if (!names.length) return;
  const labels = window.location.hostname.split('.');
  const domains = [''];
  for (let i = 0; i < labels.length - 1; i += 1) domains.push(`; domain=.${labels.slice(i).join('.')}`);
  for (const name of names) {
    for (const domain of domains) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
  }
}

/** GA may send: consent given and not withdrawn, loaded, and not on a secret page */
export const analyticsActive = () =>
  gaReady && !stopped && !isAnalyticsExcluded(window.location.pathname);

/**
 * Call on every address change (App does). Pauses GA on a secret page and resumes it
 * after; keeps the redacted address of this page and the last one, which every event
 * carries as page_location and page_referrer.
 */
export function trackAddress(measurementId) {
  if (measurementId) measurement = measurementId;
  setPaused(isAnalyticsExcluded(window.location.pathname));

  const next = redactUrl(window.location.href);
  if (next === page) return;
  // The first page's referrer is the document's (another site's origin, or this site's
  // address redacted, e.g. after a reload from a reset link)
  referrer = page || redactUrl(document.referrer);
  page = next;
  if (gaReady) window.gtag('set', { page_location: page, page_referrer: referrer, page_title: titleOf(page) });
}

// gtag.js can report address changes itself (GA4's "page changes based on browser history
// events", which should be off: CLAUDE.md, Analytics). It hooks history when it loads, so
// hooking it first makes ours run before its own: the pause is on before it could send.
function watchHistory() {
  for (const method of ['pushState', 'replaceState']) {
    const original = window.history[method];
    window.history[method] = function trackedHistoryChange(...args) {
      const result = original.apply(this, args);
      trackAddress();
      return result;
    };
  }
  window.addEventListener('popstate', () => trackAddress());
}

/**
 * No consent, or consent withdrawn: GA stops sending (ga-disable-<ID> stays set, its
 * consent becomes denied, queued page views are dropped) and its cookies are deleted.
 * App calls it whenever consent isn't 'granted'.
 */
export function stopGA(measurementId) {
  if (measurementId) measurement = measurementId;
  stopped = true;
  queue = [];
  setPaused(true);
  if (gaReady) window.gtag('consent', 'update', { analytics_storage: 'denied' });
  clearGaCookies();
}

// Init GA4 after consent, when idle. Consent given again after a withdrawal in the same
// visit: the GA already loaded resumes.
export function initGA(measurementId) {
  if (!measurementId) return;
  stopped = false;
  if (started) {
    trackAddress(measurementId);
    if (gaReady) window.gtag('consent', 'update', { analytics_storage: 'granted' });
    return;
  }
  started = true;
  trackAddress(measurementId);

  onIdle(async () => {
    const { default: ReactGA } = await import('react-ga4');
    // Withdrawn while its code was on its way
    if (stopped) {
      started = false;
      return;
    }

    // Before initialize adds the gtag.js script
    watchHistory();
    trackAddress();

    // Init – do NOT auto-send pageviews. initialize defines window.gtag (a dataLayer push);
    // don't replace it with one that calls ReactGA.gtag, which calls window.gtag back.
    ReactGA.initialize(measurementId, { gaOptions: {}, gtagOptions: { send_page_view: false } });
    window.gtag('set', { page_location: page, page_referrer: referrer, page_title: titleOf(page) });

    // Grant analytics consent
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      wait_for_update: 500,
    });

    gaReady = true;

    // Flush any queued events
    if (queue.length) {
      for (const fn of queue) fn();
      queue = [];
    }

    // Web vitals are only ever reported through GA, so their code loads now, not for
    // every visitor (their observers are buffered, so the page's LCP is still seen)
    import('@/utils/seo/vitals.js');
  });
}

/** Queue-safe pageview for the address trackAddress last saw; never for a secret page */
export function sendPageView() {
  if (stopped || isAnalyticsExcluded(window.location.pathname)) return;
  const params = { page_location: page, page_referrer: referrer, page_title: titleOf(page) };
  const run = () => {
    if (typeof window.gtag === 'function') window.gtag('event', 'page_view', params);
  };
  if (gaReady) run();
  else queue.push(run);
}
