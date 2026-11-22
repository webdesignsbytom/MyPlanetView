// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/importsApi', () => ({ getImports: vi.fn(), importTrips: vi.fn() }));
vi.mock('@/api/travelApi', () => ({ createMoment: vi.fn() }));
vi.mock('@/utils/photos/uploadPhoto', () => ({ uploadPhoto: vi.fn() }));

import { getImports, importTrips } from '@/api/importsApi';
import { createMoment } from '@/api/travelApi';
import { uploadPhoto } from '@/utils/photos/uploadPhoto';
import { runPolarstepsImport } from '@/utils/import/runImport';

const photo = (key, name = `${key}.jpg`) => ({ entry: { read: async () => new Blob(['JPEG']) }, name, type: 'image/jpeg', key });
const failure = (status, { message, headers } = {}) =>
  Object.assign(new Error(message || `HTTP ${status}`), { response: { status, headers: headers || {} }, friendlyMessage: message });

// A trip as readPolarstepsExport gives it: one step in Tokyo with a story and two photos, and a loose photo
function makeTrip(n = 1) {
  const step = {
    id: `${n}1`,
    title: 'Tokyo',
    text: 'Arrived late.',
    countryCode: 'JP',
    date: '2025-01-01',
    placeName: 'Tokyo',
    takenAt: '2025-01-01T09:00:00.000Z',
    photos: [photo(`s${n}a`), photo(`s${n}b`)],
  };
  return {
    key: `polarsteps:trip:${n}`,
    title: `Trip ${n}`,
    status: 'COMPLETED',
    startDate: '2025-01-01',
    endDate: '2025-01-10',
    stops: [],
    steps: [step],
    loose: { id: null, countryCode: null, takenAt: null, photos: [photo(`loose${n}`)] },
    photos: 3,
    stories: 1,
  };
}

let saved;
beforeEach(() => {
  vi.mocked(getImports).mockReset().mockResolvedValue({ trips: [], photos: [], moments: [] });
  vi.mocked(importTrips).mockReset().mockImplementation(async (mapId, trips) => ({
    trips: trips.map((trip) => ({ key: trip.key, tripId: `trip-of-${trip.key}`, created: true })),
  }));
  vi.mocked(createMoment).mockReset().mockResolvedValue({ moment: { id: 'm1' } });
  saved = 0;
  vi.mocked(uploadPhoto).mockReset().mockImplementation(async () => ({ photo: { id: `p${(saved += 1)}` } }));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('runPolarstepsImport', () => {
  it('imports the trips, then every photo onto its trip, then each story with its step’s photos', async () => {
    const stages = [];
    const result = await runPolarstepsImport({
      mapId: 'map-1',
      trips: [makeTrip()],
      uploadRules: { keep: 'PRINT' },
      onProgress: (progress) => stages.push(progress.stage),
    });

    expect(importTrips).toHaveBeenCalledWith('map-1', [
      { key: 'polarsteps:trip:1', title: 'Trip 1', status: 'COMPLETED', startDate: '2025-01-01', endDate: '2025-01-10', stops: [] },
    ]);
    expect(uploadPhoto).toHaveBeenCalledTimes(3);
    const first = uploadPhoto.mock.calls[0][0];
    expect(first).toMatchObject({
      mapId: 'map-1',
      tripId: 'trip-of-polarsteps:trip:1',
      countryCode: 'JP',
      uploadRules: { keep: 'PRINT' },
      importedFrom: 's1a',
      fallbackTakenAt: '2025-01-01T09:00:00.000Z',
    });
    expect(first.file).toBeInstanceOf(File);
    expect([first.file.name, first.file.type]).toEqual(['s1a.jpg', 'image/jpeg']);
    // The loose photo has no step: no country or time to give it
    expect(uploadPhoto.mock.calls[2][0]).toMatchObject({ importedFrom: 'loose1', countryCode: undefined, fallbackTakenAt: undefined });

    expect(createMoment).toHaveBeenCalledWith('map-1', expect.objectContaining({
      title: 'Tokyo',
      tripId: 'trip-of-polarsteps:trip:1',
      photoIds: ['p1', 'p2'],
      importedFrom: 'polarsteps:moment:11',
    }));
    expect(result).toMatchObject({ stage: 'done', trips: 1, tripsTotal: 1, tripsNew: 1, photos: 3, photosTotal: 3, already: 0, full: 0, failed: 0, stories: 1, storiesTotal: 1, failures: [] });
    expect(stages[0]).toBe('trips');
    expect(stages).toContain('photos');
    expect(stages).toContain('stories');
    expect(stages.at(-1)).toBe('done');
  });

  it('sends the trips 20 to a request', async () => {
    const trips = Array.from({ length: 25 }, (_, i) => ({ ...makeTrip(i + 1), steps: [], loose: { photos: [] }, photos: 0, stories: 0 }));
    const result = await runPolarstepsImport({ mapId: 'm', trips });
    expect(importTrips.mock.calls.map(([, batch]) => batch.length)).toEqual([20, 5]);
    expect(result.trips).toBe(25);
  });

  it('adds nothing twice: what the map has already is counted, not sent', async () => {
    getImports.mockResolvedValue({
      trips: [{ key: 'polarsteps:trip:1', tripId: 'old-trip' }],
      photos: ['s1a', 'loose1'],
      moments: ['polarsteps:moment:11'],
    });
    importTrips.mockResolvedValue({ trips: [{ key: 'polarsteps:trip:1', tripId: 'old-trip', created: false }] });

    const result = await runPolarstepsImport({ mapId: 'm', trips: [makeTrip()] });

    expect(uploadPhoto).toHaveBeenCalledTimes(1);
    expect(uploadPhoto.mock.calls[0][0]).toMatchObject({ importedFrom: 's1b', tripId: 'old-trip' });
    expect(createMoment).not.toHaveBeenCalled();
    expect(result).toMatchObject({ tripsNew: 0, photos: 1, already: 2, stories: 1 });
  });

  it('counts a photo the server already has, one over the plan’s limit, and failures, keeping the first five messages', async () => {
    const trip = makeTrip();
    trip.loose.photos = Array.from({ length: 6 }, (_, i) => photo(`bad${i}`));
    uploadPhoto
      .mockRejectedValueOnce(failure(409, { message: 'That photo was imported already.' }))
      .mockRejectedValueOnce(failure(409, { message: 'This map has 30 photos of Japan.' }))
      .mockImplementation(async ({ importedFrom }) => {
        throw failure(500, { message: `Upload ${importedFrom} failed.` });
      });

    const result = await runPolarstepsImport({ mapId: 'm', trips: [trip] });

    expect(result).toMatchObject({ photos: 0, already: 1, full: 1, failed: 6 });
    expect(result.failures).toEqual(['Upload bad0 failed.', 'Upload bad1 failed.', 'Upload bad2 failed.', 'Upload bad3 failed.', 'Upload bad4 failed.']);
    // The story still goes, with none of the photos
    expect(createMoment.mock.calls[0][1].photoIds).toEqual([]);
  });

  it('stops sending photos when the map is locked, and goes on to the stories', async () => {
    uploadPhoto.mockRejectedValue(failure(403, { message: 'This map is locked.' }));
    const result = await runPolarstepsImport({ mapId: 'm', trips: [makeTrip(1), makeTrip(2)] });
    expect(uploadPhoto).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ failed: 1, failures: ['This map is locked.'], stories: 2 });
  });

  it('counts a story the server already has, and a failed one', async () => {
    createMoment.mockRejectedValueOnce(failure(409)).mockRejectedValueOnce(Object.assign(new Error('Network Error'), { response: undefined }));
    const result = await runPolarstepsImport({ mapId: 'm', trips: [makeTrip(1), makeTrip(2)], withPhotos: false });
    expect(result).toMatchObject({ stories: 1, failed: 1, failures: ['Network Error'] });
  });

  it('leaves the photos or the stories out when asked', async () => {
    const result = await runPolarstepsImport({ mapId: 'm', trips: [makeTrip()], withPhotos: false, withStories: false });
    expect(uploadPhoto).not.toHaveBeenCalled();
    expect(createMoment).not.toHaveBeenCalled();
    expect(result).toMatchObject({ photosTotal: 0, storiesTotal: 0, trips: 1 });
  });

  it('waits as long as the server asks after a "slow down", then carries on', async () => {
    vi.useFakeTimers();
    uploadPhoto.mockRejectedValueOnce(failure(429, { headers: { 'retry-after': '30' } }));
    const progress = [];
    const run = runPolarstepsImport({ mapId: 'm', trips: [makeTrip()], withStories: false, onProgress: (p) => progress.push(p) });

    await vi.advanceTimersByTimeAsync(0);
    const waiting = progress.at(-1);
    expect(waiting.waitingUntil).toBe(Date.now() + 30_000);
    expect(uploadPhoto).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(29_999);
    expect(uploadPhoto).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    const result = await run;
    expect(uploadPhoto).toHaveBeenCalledTimes(4);
    expect(result).toMatchObject({ photos: 3, failed: 0, waitingUntil: null });
  });

  it('waits a minute when the server doesn’t say, and at most 15 minutes', async () => {
    vi.useFakeTimers();
    getImports.mockRejectedValueOnce(failure(429)).mockRejectedValueOnce(failure(429, { headers: { 'ratelimit-reset': '99999' } }));
    const progress = [];
    const run = runPolarstepsImport({ mapId: 'm', trips: [], onProgress: (p) => progress.push(p) });
    await vi.advanceTimersByTimeAsync(0);
    expect(progress.at(-1).waitingUntil).toBe(Date.now() + 60_000);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(progress.at(-1).waitingUntil).toBe(Date.now() + 15 * 60_000);
    await vi.advanceTimersByTimeAsync(15 * 60_000);
    await expect(run).resolves.toMatchObject({ stage: 'done' });
    expect(getImports).toHaveBeenCalledTimes(3);
  });

  it('stops when asked, even while waiting', async () => {
    const stopped = new AbortController();
    stopped.abort();
    await expect(runPolarstepsImport({ mapId: 'm', trips: [makeTrip()], signal: stopped.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(getImports).not.toHaveBeenCalled();

    vi.useFakeTimers();
    const controller = new AbortController();
    uploadPhoto.mockRejectedValueOnce(failure(429, { headers: { 'retry-after': '60' } }));
    const run = runPolarstepsImport({ mapId: 'm', trips: [makeTrip()], signal: controller.signal });
    const outcome = run.catch((err) => err);
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    const err = await outcome;
    expect(err).toMatchObject({ name: 'AbortError', message: 'The import was stopped.' });
    expect(uploadPhoto).toHaveBeenCalledTimes(1);
  });

  it('fails when the trips can’t be sent', async () => {
    importTrips.mockRejectedValue(failure(500, { message: 'Server error' }));
    await expect(runPolarstepsImport({ mapId: 'm', trips: [makeTrip()] })).rejects.toThrow('Server error');
    expect(uploadPhoto).not.toHaveBeenCalled();
  });
});
