// The browser's offer to install the site as an app (18 Nov 2026, the user's wish: a tip
// saying the site can be an app on your phone). Chrome, Edge and Samsung Internet fire
// `beforeinstallprompt` once the site is installable (a production build, with its service
// worker); it's kept from page load, so the map's tips (MapTipsDialog) can offer an
// "Install the app" button later, and its own banner is held back for that. Safari never
// fires it: an iPhone adds the site with Share, Add to Home Screen.
let offer = null;
const listeners = new Set();
const changed = () => listeners.forEach((listener) => listener());

/** Start listening (main.jsx, at boot, before the browser makes its offer). */
export function listenForInstallOffer() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    offer = event;
    changed();
  });
  window.addEventListener('appinstalled', () => {
    offer = null;
    changed();
  });
}

// For useSyncExternalStore: whether the browser has an offer to show
export const subscribeInstallOffer = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const hasInstallOffer = () => Boolean(offer);

/** Show the browser's own install prompt (an offer can be used once). True once accepted. */
export async function installApp() {
  const event = offer;
  if (!event) return false;
  offer = null;
  changed();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === 'accepted';
}
