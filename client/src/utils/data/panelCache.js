// The data behind the map's panels, kept for this visit (17 Nov 2026, the user's wish: a
// panel should open at once, not wait for the database). A panel opened again, or opened
// after the map page fetched its data in the background, shows what's here straight away
// while a fresh copy loads behind it. In memory only, so a reload starts afresh, and
// cleared whenever someone signs in or out (AuthProvider), so one account never sees
// another's. An entry is { value, at } once it has arrived, plus { promise } while a fresh
// copy is on its way (the old value stays showable meanwhile).
const entries = new Map();

// Old enough to show while a fresh copy loads; a photo's signed links (signed at the start
// of an hour, valid for two) outlast it
const SHOW_FOR_MS = 20 * 60 * 1000;
// Recent enough that a background fetch isn't worth making again
const FRESH_MS = 60 * 1000;

/** Keep `value` under `key` (a list as it stands, a reply). */
export function remember(key, value) {
  const entry = entries.get(key);
  entries.set(key, { value, at: Date.now(), promise: entry?.promise });
}

/** What's kept under `key`, if it's recent enough to show; else null. */
export function recall(key) {
  const entry = entries.get(key);
  return entry && 'value' in entry && Date.now() - entry.at < SHOW_FOR_MS ? entry.value : null;
}

/** A fetch for `key` already on its way (a prefetch), to wait for instead of asking twice. */
export const inFlight = (key) => entries.get(key)?.promise || null;

/**
 * Fetch `key` now and keep the answer, unless a fresh copy is here or one is on its way.
 * `toValue` turns the reply into what's kept (a list's first page into its list shape).
 * Returns a promise that settles (never rejects) once that's done, so a caller can pace
 * a run of them.
 */
export function prefetch(key, fetcher, toValue = (reply) => reply) {
  const entry = entries.get(key);
  if (entry?.promise) return entry.promise.then(settled, settled);
  if (entry && 'value' in entry && Date.now() - entry.at < FRESH_MS) return Promise.resolve();
  const promise = fetcher();
  entries.set(key, { ...entry, promise });
  promise.then(
    (reply) => {
      if (entries.get(key)?.promise !== promise) return;
      entries.set(key, { value: toValue(reply), at: Date.now() });
    },
    () => {
      // A failure is reported by the panel, when it asks for itself
      const now = entries.get(key);
      if (now?.promise !== promise) return;
      if ('value' in now) entries.set(key, { value: now.value, at: now.at });
      else entries.delete(key);
    },
  );
  return promise.then(settled, settled);
}

const settled = () => undefined;

/**
 * Keep `value` under `key` unless something is kept or on its way there already: a list the
 * map's own counts say is empty (a country with no photos or moments), so its panel opens
 * at once without asking. The panel still refreshes it quietly when it opens.
 */
export function rememberIfMissing(key, value) {
  if (!recall(key) && !inFlight(key)) remember(key, value);
}

/** Everything goes (signing in or out). */
export function clearPanelCache() {
  entries.clear();
}
