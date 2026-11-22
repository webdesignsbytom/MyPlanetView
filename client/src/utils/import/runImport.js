// Running an import from Polarsteps onto a map (docs/API.md "Importing from Polarsteps"), in
// the browser: what the map has imported already, then the chosen trips (20 a request), then
// each photo through the usual upload (utils/photos/uploadPhoto.js, the map's plan deciding
// the copies), then each step's story as a moment with its photos. Everything carries its
// key, so a second run adds only what's missing. A photo over the plan's photos per country
// is left out and counted; a "slow down" (429) waits as long as the server says and goes on.
import { getImports, importTrips } from '@/api/importsApi';
import { createMoment } from '@/api/travelApi';
import { uploadPhoto } from '@/utils/photos/uploadPhoto';
import { storyPayload, tripPayload } from './polarsteps';

const TRIPS_PER_REQUEST = 20;
const FIRST_FAILURES_KEPT = 5;
// The server's words for an item imported before (responses.js photoAlreadyImported, momentAlreadyImported)
const ALREADY = /imported already/i;

const statusOf = (err) => err?.response?.status ?? null;

/** How long the server asked us to wait (Retry-After, else RateLimit-Reset), in ms; a minute if it didn't say. */
function waitAsked(err) {
  const headers = err?.response?.headers ?? {};
  const seconds = Number(headers['retry-after'] ?? headers['ratelimit-reset']);
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 15 * 60) * 1000 : 60 * 1000;
}

const stopped = () => Object.assign(new Error('The import was stopped.'), { name: 'AbortError' });

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(stopped());
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(stopped());
    }, { once: true });
  });
}

/**
 * Run the import. `trips` from readPolarstepsExport (the chosen ones); `uploadRules` the map's
 * (its reply's). `onProgress(progress)` after each step. Resolves the final progress:
 * `{ stage: 'done', trips, tripsNew, photos, photosTotal, already, full, failed, stories,
 * storiesTotal, failures }`; rejects with an AbortError when `signal` stops it.
 */
export async function runPolarstepsImport({ mapId, trips, withPhotos = true, withStories = true, uploadRules = null, onProgress, signal }) {
  const holders = (trip) => [...trip.steps, trip.loose];
  const progress = {
    stage: 'trips',
    trips: 0,
    tripsTotal: trips.length,
    tripsNew: 0,
    photos: 0,
    photosTotal: withPhotos ? trips.reduce((n, trip) => n + trip.photos, 0) : 0,
    already: 0,
    full: 0,
    failed: 0,
    stories: 0,
    storiesTotal: withStories ? trips.reduce((n, trip) => n + trip.stories, 0) : 0,
    waitingUntil: null,
    failures: [],
  };
  const report = () => onProgress?.({ ...progress, failures: [...progress.failures] });
  const fail = (err) => {
    progress.failed += 1;
    if (progress.failures.length < FIRST_FAILURES_KEPT) progress.failures.push(err?.friendlyMessage || err?.message || 'Something went wrong.');
  };
  // Waits out a 429, as often as it takes
  const patiently = async (job) => {
    for (;;) {
      if (signal?.aborted) throw stopped();
      try {
        return await job();
      } catch (err) {
        if (statusOf(err) !== 429) throw err;
        const ms = waitAsked(err);
        progress.waitingUntil = Date.now() + ms;
        report();
        await sleep(ms, signal);
        progress.waitingUntil = null;
        report();
      }
    }
  };

  report();
  const done = await patiently(() => getImports(mapId));
  const donePhotos = new Set(done.photos ?? []);
  const doneStories = new Set(done.moments ?? []);

  // The trips, with their stops
  const tripIds = new Map((done.trips ?? []).map((trip) => [trip.key, trip.tripId]));
  for (let i = 0; i < trips.length; i += TRIPS_PER_REQUEST) {
    const batch = trips.slice(i, i + TRIPS_PER_REQUEST);
    const answer = await patiently(() => importTrips(mapId, batch.map(tripPayload)));
    for (const row of answer.trips ?? []) {
      tripIds.set(row.key, row.tripId);
      if (row.created) progress.tripsNew += 1;
    }
    progress.trips += batch.length;
    report();
  }

  // The photos, a step at a time, remembering each step's for its story
  const savedByStep = new Map();
  if (withPhotos) {
    progress.stage = 'photos';
    report();
    outer: for (const trip of trips) {
      const tripId = tripIds.get(trip.key);
      for (const holder of holders(trip)) {
        for (const photo of holder.photos) {
          if (signal?.aborted) throw stopped();
          if (donePhotos.has(photo.key)) {
            progress.already += 1;
            report();
            continue;
          }
          try {
            const blob = await photo.entry.read();
            const file = new File([blob], photo.name, { type: photo.type });
            const { photo: saved } = await patiently(() =>
              uploadPhoto({
                mapId,
                tripId,
                file,
                countryCode: holder.countryCode ?? undefined,
                uploadRules,
                importedFrom: photo.key,
                fallbackTakenAt: holder.takenAt ?? undefined,
              }),
            );
            progress.photos += 1;
            donePhotos.add(photo.key);
            if (holder.id) savedByStep.set(holder.id, [...(savedByStep.get(holder.id) ?? []), saved.id]);
          } catch (err) {
            if (err?.name === 'AbortError') throw err;
            const status = statusOf(err);
            if (status === 409 && ALREADY.test(err.friendlyMessage ?? '')) progress.already += 1;
            // The plan's photos for this country (or its storage) are used up
            else if (status === 409) progress.full += 1;
            // The map is locked: no photo will go, so stop trying
            else if (status === 403) {
              fail(err);
              break outer;
            } else fail(err);
          }
          report();
        }
      }
    }
  }

  // Each step's story, as a moment with its photos
  if (withStories) {
    progress.stage = 'stories';
    report();
    for (const trip of trips) {
      const tripId = tripIds.get(trip.key);
      for (const step of trip.steps) {
        if (!step.text || !step.countryCode) continue;
        const body = storyPayload(step, { tripId, photoIds: savedByStep.get(step.id) ?? [] });
        if (doneStories.has(body.importedFrom)) {
          progress.stories += 1;
          continue;
        }
        try {
          await patiently(() => createMoment(mapId, body));
          progress.stories += 1;
        } catch (err) {
          if (err?.name === 'AbortError') throw err;
          if (statusOf(err) === 409) progress.stories += 1;
          else fail(err);
        }
        report();
      }
    }
  }

  progress.stage = 'done';
  report();
  return { ...progress };
}
