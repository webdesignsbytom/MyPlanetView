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
// Recent enough that a background fetch isn't worth making again: as long as it's shown (a
// panel opened refreshes its own list quietly anyway). It was a minute, so coming back to
// the map after one fetched every country's lists again (19 Nov 2026, the audit)
const FRESH_MS = SHOW_FOR_MS;

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
  track(key, promise, toValue);
  return promise.then(settled, settled);
}

/**
 * Several keys fetched in one request (every country ticket's lists: getCountryLists).
 * `wanted` is `[{ key, pick, toValue }]`: `fetchAll(todo)` makes the request for those not
 * fresh or already on their way, `pick(reply)` is a key's own part of it (what its single
 * fetch would have answered; nothing there counts as a failure), kept as `toValue(part)`.
 * Each key waits on the shared request as a prefetch does (inFlight). Settles (never
 * rejects) once done: to true, or false when the shared request failed.
 */
export function prefetchMany(wanted, fetchAll) {
  const now = Date.now();
  const todo = wanted.filter(({ key }) => {
    const entry = entries.get(key);
    return !entry?.promise && !(entry && 'value' in entry && now - entry.at < FRESH_MS);
  });
  if (!todo.length) return Promise.resolve(true);
  const request = fetchAll(todo);
  for (const { key, pick, toValue = (reply) => reply } of todo) {
    const promise = request.then((reply) => {
      const part = pick(reply);
      if (!part) throw new Error('Not in the reply');
      return part;
    });
    track(key, promise, toValue);
  }
  return request.then(() => true, () => false);
}

// A fetch for `key` on its way: kept with the entry (inFlight), then its answer kept, or on
// a failure the old value left as it was
function track(key, promise, toValue) {
  entries.set(key, { ...entries.get(key), promise });
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
