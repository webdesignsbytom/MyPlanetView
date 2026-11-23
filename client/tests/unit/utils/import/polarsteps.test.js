// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { dayOf, readPolarstepsExport, stopsOf, storyPayload, tripPayload } from '@/utils/import/polarsteps';

// 2024-12-31T16:00:00Z: already New Year's Day in Tokyo
const NEW_YEAR_TOKYO = 1735660800;
const DAY = 24 * 60 * 60;
const NOW = new Date('2026-11-23T12:00:00Z');

const file = (path, contents = 'x') => ({ path, size: contents.length, read: async () => new Blob([contents]) });
const tripFile = (folder, json) => file(`${folder}/trip.json`, JSON.stringify(json));

const japan = {
  id: 123,
  name: '  Japan and Korea  ',
  start_date: NEW_YEAR_TOKYO,
  end_date: NEW_YEAR_TOKYO + 10 * DAY,
  timezone_id: 'Asia/Tokyo',
  all_steps: [
    // Out of order on purpose: steps are sorted by time
    { id: 13, name: 'Seoul', start_time: NEW_YEAR_TOKYO + 5 * DAY, timezone_id: 'Asia/Seoul', location: { name: 'Seoul', country_code: 'KR', lat: 37.56, lon: 126.97 } },
    { id: 11, name: 'Tokyo', description: '  Arrived late.  ', start_time: NEW_YEAR_TOKYO, location: { name: 'Tokyo', country_code: 'jp', lat: 35.68, lon: 139.76 } },
    { id: 12, display_name: 'Shinjuku at night', start_time: NEW_YEAR_TOKYO + 2 * DAY, location: { name: 'Tokyo', country_code: 'JP' } },
    { id: 14, name: 'Deleted', is_deleted: true, start_time: NEW_YEAR_TOKYO + DAY, location: { country_code: 'JP' } },
    { id: 15, name: 'At sea', description: 'Somewhere.', start_time: NEW_YEAR_TOKYO + 6 * DAY, location: { name: 'Pacific', country_code: 'ZZ', lat: 'x' } },
  ],
};
const folder = 'polarsteps/trip/japan-and-korea_123';
const japanFiles = [
  tripFile(folder, japan),
  file(`${folder}/locations.json`, '{}'),
  file(`${folder}/tokyo_11/photos/2.jpg`),
  file(`${folder}/tokyo_11/photos/10.jpg`),
  file(`${folder}/tokyo_11/photos/1.JPEG`),
  file(`${folder}/tokyo_11/photos/.DS_Store`),
  file(`${folder}/tokyo_11/photos/Thumbs.db`),
  file(`${folder}/tokyo_11/videos/clip.mov`),
  file(`${folder}/seoul_13/photos/night.heic`),
  file(`${folder}/seoul_13/photos/palace.webp`),
  file(`${folder}/photos/loose one.png`),
  file(`${folder}/tokyo_11/notes.txt`),
];

describe('dayOf', () => {
  it('gives the day in the step’s time zone', () => {
    expect(dayOf(NEW_YEAR_TOKYO, 'Asia/Tokyo')).toBe('2025-01-01');
    expect(dayOf(NEW_YEAR_TOKYO, 'Europe/London')).toBe('2024-12-31');
  });

  it('uses UTC without a zone, or with one the browser doesn’t know', () => {
    expect(dayOf(NEW_YEAR_TOKYO)).toBe('2024-12-31');
    expect(dayOf(NEW_YEAR_TOKYO, 'Mars/Olympus_Mons')).toBe('2024-12-31');
  });

  it('is null without a time', () => {
    expect(dayOf(NaN, 'UTC')).toBeNull();
    expect(dayOf(undefined)).toBeNull();
  });
});

describe('readPolarstepsExport', () => {
  it('reads a trip: its title, dates, status and countries', async () => {
    const [trip] = await readPolarstepsExport(japanFiles, { now: NOW });
    expect(trip).toMatchObject({
      id: '123',
      key: 'polarsteps:trip:123',
      title: 'Japan and Korea',
      status: 'COMPLETED',
      startDate: '2025-01-01',
      endDate: '2025-01-11',
      countries: ['JP', 'KR'],
    });
  });

  it('reads the steps in time order, deleted ones left out, only the map’s places kept', async () => {
    const [trip] = await readPolarstepsExport(japanFiles, { now: NOW });
    expect(trip.steps.map((step) => [step.id, step.title, step.countryCode, step.date])).toEqual([
      ['11', 'Tokyo', 'JP', '2025-01-01'],
      ['12', 'Shinjuku at night', 'JP', '2025-01-03'],
      ['13', 'Seoul', 'KR', '2025-01-06'],
      ['15', 'At sea', null, '2025-01-07'],
    ]);
    const tokyo = trip.steps[0];
    expect(tokyo).toMatchObject({ text: 'Arrived late.', placeName: 'Tokyo', latitude: 35.68, longitude: 139.76, takenAt: '2024-12-31T16:00:00.000Z' });
    expect(trip.steps[3]).toMatchObject({ latitude: null, longitude: null });
  });

  it('gives each photo to the step whose folder it is in, else to the trip, in name order', async () => {
    const [trip] = await readPolarstepsExport(japanFiles, { now: NOW });
    const tokyo = trip.steps[0];
    expect(tokyo.photos.map((photo) => [photo.name, photo.type, photo.key])).toEqual([
      ['1.JPEG', 'image/jpeg', `polarsteps:photo:11/tokyo_11_photos_1.JPEG`],
      ['2.jpg', 'image/jpeg', `polarsteps:photo:11/tokyo_11_photos_2.jpg`],
      ['10.jpg', 'image/jpeg', `polarsteps:photo:11/tokyo_11_photos_10.jpg`],
    ]);
    expect(tokyo.videos).toBe(1);
    expect(trip.steps[2].photos.map((photo) => photo.type)).toEqual(['image/webp']);
    expect(trip.steps[2].unreadable).toBe(1);
    expect(trip.loose.photos.map((photo) => photo.key)).toEqual(['polarsteps:photo:trip-123/photos_loose_one.png']);
    expect(trip.loose.photos[0].entry.path).toBe(`${folder}/photos/loose one.png`);
    expect([trip.photos, trip.videos, trip.unreadable]).toEqual([5, 1, 1]);
  });

  it('makes a stop of steps one after another in the same place, and counts the stories', async () => {
    const [trip] = await readPolarstepsExport(japanFiles, { now: NOW });
    expect(trip.stops).toEqual([
      { countryCode: 'JP', placeName: 'Tokyo', arriveOn: '2025-01-01', leaveOn: '2025-01-03', latitude: 35.68, longitude: 139.76 },
      { countryCode: 'KR', placeName: 'Seoul', arriveOn: '2025-01-06', leaveOn: null, latitude: 37.56, longitude: 126.97 },
    ]);
    // Tokyo's story only: the one at sea has no place on the map
    expect(trip.stories).toBe(1);
  });

  it('tells a planned trip and one still going from a finished one', async () => {
    const future = { id: 1, name: 'Peru', start_date: NOW.getTime() / 1000 + DAY, all_steps: [] };
    const running = { id: 2, name: 'Iceland', start_date: NOW.getTime() / 1000 - DAY, all_steps: [] };
    const trips = await readPolarstepsExport([tripFile('a/peru_1', future), tripFile('a/iceland_2', running)], { now: NOW });
    expect(trips.map((trip) => [trip.title, trip.status, trip.endDate])).toEqual([
      ['Iceland', 'ACTIVE', null],
      ['Peru', 'PLANNED', null],
    ]);
  });

  it('cuts long titles and stories to what a moment takes', async () => {
    const json = { id: 9, name: 'T'.repeat(200), all_steps: [{ id: 1, name: 'S'.repeat(130), description: 'd'.repeat(2500), start_time: NEW_YEAR_TOKYO, location: { country_code: 'FR' } }] };
    const [trip] = await readPolarstepsExport([tripFile('x_9', json)], { now: NOW });
    expect(trip.title).toHaveLength(120);
    expect(trip.title.endsWith('…')).toBe(true);
    expect(trip.steps[0].title).toHaveLength(120);
    expect(trip.steps[0].text).toHaveLength(2000);
    expect(trip.startDate).toBe('2024-12-31');
  });

  it('names a step with nothing to go on, and a trip with no name', async () => {
    const json = { id: 7, all_steps: [{ id: 1, start_time: 'soon', location: 'nowhere' }] };
    const [trip] = await readPolarstepsExport([tripFile('t_7', json)], { now: NOW });
    expect(trip.title).toBe('A trip');
    expect(trip.steps[0]).toMatchObject({ title: 'A step of the trip', date: null, takenAt: null, countryCode: null, placeName: null });
    expect(trip.startDate).toBeNull();
  });

  it('skips a broken or deleted trip.json, and sorts the trips oldest first', async () => {
    const files = [
      file('b/broken_1/trip.json', '{not json'),
      tripFile('b/deleted_2', { id: 2, is_deleted: true }),
      tripFile('b/no-id_3', { name: 'No id' }),
      tripFile('b/later_4', { id: 4, name: 'Later', start_date: NEW_YEAR_TOKYO + 100 * DAY, all_steps: [] }),
      tripFile('b/sooner_5', { id: 5, name: 'Sooner', start_date: NEW_YEAR_TOKYO, all_steps: [] }),
    ];
    const trips = await readPolarstepsExport(files, { now: NOW });
    expect(trips.map((trip) => trip.title)).toEqual(['Sooner', 'Later']);
  });

  it('says what to choose when there’s no trip in it', async () => {
    await expect(readPolarstepsExport([file('photos/1.jpg')])).rejects.toThrow(
      'No Polarsteps trips were found in that. Choose the zip Polarsteps emailed you, or the folder you unzipped it to.',
    );
  });
});

describe('stopsOf', () => {
  it('leaves out steps with no place, and never sets a leaving day the same as arriving', () => {
    const step = (countryCode, placeName, date) => ({ countryCode, placeName, date, latitude: null, longitude: null });
    expect(stopsOf([step('FR', 'Paris', '2026-01-01'), step(null, 'Sea', '2026-01-02'), step('FR', 'Paris', '2026-01-01'), step('FR', 'Lyon', '2026-01-03')])).toEqual([
      { countryCode: 'FR', placeName: 'Paris', arriveOn: '2026-01-01', leaveOn: null, latitude: null, longitude: null },
      { countryCode: 'FR', placeName: 'Lyon', arriveOn: '2026-01-03', leaveOn: null, latitude: null, longitude: null },
    ]);
  });
});

describe('the payloads', () => {
  it('sends a trip as the server takes it', async () => {
    const [trip] = await readPolarstepsExport(japanFiles, { now: NOW });
    expect(tripPayload(trip)).toEqual({
      key: 'polarsteps:trip:123',
      title: 'Japan and Korea',
      status: 'COMPLETED',
      startDate: '2025-01-01',
      endDate: '2025-01-11',
      stops: trip.stops,
    });
  });

  it('sends a story as a moment with at most 20 of its photos, keyed by its step', () => {
    const step = { id: '11/a', title: 'Tokyo', text: 'Arrived.', countryCode: 'JP', date: '2025-01-01', placeName: 'Tokyo' };
    const photoIds = Array.from({ length: 25 }, (_, i) => `p${i}`);
    const body = storyPayload(step, { tripId: 't1', photoIds });
    expect(body).toEqual({
      kind: 'SAW_OR_DID',
      title: 'Tokyo',
      text: 'Arrived.',
      countryCode: 'JP',
      happenedOn: '2025-01-01',
      placeName: 'Tokyo',
      tripId: 't1',
      photoIds: photoIds.slice(0, 20),
      importedFrom: 'polarsteps:moment:11_a',
    });
    expect(storyPayload(step, { tripId: 't1' }).photoIds).toEqual([]);
  });
});
