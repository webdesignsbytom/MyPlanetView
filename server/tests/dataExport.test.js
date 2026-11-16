// "Download my data": the file's shape (src/utils/dataExport.js), pure.
import { describe, expect, it } from 'vitest';
import {
  encodeExportCursor,
  exportAccountView,
  exportFileName,
  exportFileOf,
  exportMapView,
  exportPhotoView,
  pageOf,
  parseExportCursor,
} from '../src/utils/dataExport.js';

const ID = '3f6c1a2b-0000-4000-8000-000000000001';
const variant = (size, contentType = 'image/jpeg') => ({ size, width: 100, height: 80, media: { key: `k-${size}`, contentType, bytes: 1234 } });

describe('cursors and pages', () => {
  it('round-trips a cursor, and refuses one that can’t be one', () => {
    const createdAt = new Date('2026-06-01T12:00:00.000Z');
    const cursor = encodeExportCursor({ id: ID, createdAt });
    expect(parseExportCursor(cursor)).toEqual({ ok: true, value: { createdAt, id: ID } });
    expect(parseExportCursor(undefined)).toEqual({ ok: true, value: null });
    for (const bad of ['x', `abc.${ID}`, '123.not-a-uuid', `.${ID}`, ['1']]) expect(parseExportCursor(bad).ok).toBe(false);
  });

  it('pages: one extra row means there’s another page, cursored at the last row kept', () => {
    const rows = [1, 2, 3].map((n) => ({ id: ID.replace(/1$/, String(n)), createdAt: new Date(n * 1000) }));
    expect(pageOf(rows, 3)).toEqual({ rows, nextCursor: null });
    expect(pageOf(rows, 2)).toEqual({ rows: rows.slice(0, 2), nextCursor: encodeExportCursor(rows[1]) });
  });
});

describe('photos', () => {
  const photo = {
    id: ID,
    kind: 'PHOTO',
    caption: 'Tram',
    takenAt: new Date('2026-05-01T10:00:00Z'),
    createdAt: new Date('2026-05-02T10:00:00Z'),
    countryCode: 'PT',
    latitude: 38.7,
    longitude: -9.1,
    hidden: false,
    width: 4000,
    height: 3000,
    uploaderId: 'me',
    uploader: { name: 'Me' },
    variants: [variant('THUMB', 'image/webp'), variant('DISPLAY', 'image/webp'), variant('PRINT')],
    landmarks: [{ landmarkId: 'lm', source: 'GPS', confirmed: true, confirmedAt: new Date('2026-05-03T00:00:00Z'), distanceM: 40, landmark: { name: 'Belém Tower' } }],
  };

  it('links the best copy kept: the original, else the print copy; a video has none', () => {
    expect(exportFileOf({ ...photo, variants: [...photo.variants, variant('ORIGINAL', 'image/png')] }).size).toBe('ORIGINAL');
    expect(exportFileOf(photo).size).toBe('PRINT');
    expect(exportFileOf({ ...photo, kind: 'VIDEO', variants: [] })).toBeNull();
    expect(exportFileName(photo, exportFileOf(photo))).toBe('photo-2026-05-01-3f6c1a2b.jpg');
  });

  it('keeps the position, the landmarks and who uploaded it', () => {
    const view = exportPhotoView(photo, { userId: 'me', fileUrl: 'https://signed' });
    expect(view).toMatchObject({
      latitude: 38.7,
      uploadedByYou: true,
      uploadedBy: 'Me',
      landmarks: [{ landmarkId: 'lm', name: 'Belém Tower', confirmed: true, confirmedAt: '2026-05-03T00:00:00.000Z' }],
      file: { copy: 'PRINT', contentType: 'image/jpeg', url: 'https://signed' },
    });
    const video = exportPhotoView({ ...photo, kind: 'VIDEO', durationS: 42, videoState: 'READY', variants: [] }, { userId: 'you' });
    expect(video).toMatchObject({ file: null, lengthSeconds: 42, uploadedByYou: false });
    expect(video.fileNote).toMatch(/Cloudflare Stream/);
  });
});

describe('the account and a map', () => {
  it('says which plan is in force, and lists the maps and trips', () => {
    const now = new Date('2026-11-16T00:00:00Z');
    const view = exportAccountView({
      user: { id: 'u', name: 'Ann', email: 'ann@example.com', emailVerified: true, createdAt: now },
      profile: { username: null, homeCountryCode: 'GB', mapSettings: { style: 'animated' }, promoCode: { code: 'SAMTRAVELS' }, promoTrialUsedAt: null },
      subscription: null,
      grants: [{ plan: 'PREMIUM', startsAt: new Date('2026-01-01Z'), endsAt: new Date('2027-01-01Z'), reason: 'Creator' }],
      ownedMaps: [{ id: 'm', name: 'Mine', isDefault: true, createdAt: now }],
      mapMemberships: [{ role: 'VIEWER', createdAt: now, map: { id: 'o', name: 'Theirs', owner: { name: 'Bo' } } }],
      tripMemberships: [],
      photosOnOtherMaps: 0,
      now,
    });
    expect(view.plan.inForce).toEqual({ id: 'PREMIUM', name: 'First Class', from: 'COMPLIMENTARY' });
    expect(view.account).toMatchObject({ homeCountryCode: 'GB', signedUpWithPromoCode: 'SAMTRAVELS', mapSettings: { style: 'animated' } });
    expect(view.mapsSharedWithYou).toEqual([{ id: 'o', name: 'Theirs', owner: 'Bo', role: 'VIEWER', since: now.toISOString() }]);
    expect(view.linksWorkUntil).toBe('2026-11-23T00:00:00.000Z');
  });

  it('puts each trip’s stops, travellers and people with the trip, and dates as days', () => {
    const empty = { members: [], invites: [], tripMembers: [], tripInvites: [], tripLinks: [], moments: [], momentTravellers: [], momentPhotos: [], goals: [], badges: [], stampPhotos: [] };
    const view = exportMapView(
      {
        ...empty,
        map: { id: 'm', name: 'Mine', createdAt: new Date(0), updatedAt: new Date(0) },
        travellers: [{ id: 't', name: 'Ann', userId: 'u', createdAt: new Date(0) }],
        visits: [{ countryCode: 'PT', status: 'VISITED', source: 'MANUAL', firstVisitedOn: new Date('2019-04-02T00:00:00Z'), createdAt: new Date(0), updatedAt: new Date(0) }],
        trips: [{ id: 'trip', title: 'Lisbon', status: 'COMPLETED', startDate: new Date('2019-04-01T00:00:00Z'), endDate: null, createdAt: new Date(0), updatedAt: new Date(0) }],
        stops: [{ id: 's', tripId: 'trip', position: 0, countryCode: 'PT', landmarkId: 'lm', landmark: { name: 'Belém Tower' } }],
        tripTravellers: [{ tripId: 'trip', travellerId: 't' }],
        photoCount: 0,
      },
      { userId: 'u' }
    );
    expect(view.travellers[0]).toMatchObject({ isYou: true, linkedToAnAccount: true });
    expect(view.countries[0].firstVisitedOn).toBe('2019-04-02');
    expect(view.trips[0]).toMatchObject({ startDate: '2019-04-01', endDate: null, travellerIds: ['t'], stops: [{ landmarkName: 'Belém Tower', placeName: null }] });
  });
});
