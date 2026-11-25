import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import * as travelApi from '@/api/travelApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

const body = { some: 'body' };

// [export, call, method, the exact arguments the client gets]. Exact, so a query string
// passed as a second argument (where `withAuth` goes) would fail: it belongs in the path.
const CASES = [
  ['getLandmarks', () => travelApi.getLandmarks('JP'), 'get', ['/api/landmarks?country=JP', false]],
  ['getLandmarks', () => travelApi.getLandmarks(), 'get', ['/api/landmarks', false]],
  ['getMapSettings', () => travelApi.getMapSettings(), 'get', ['/api/users/map-settings']],
  ['putMapSettings', () => travelApi.putMapSettings({ style: 'starry' }), 'put', ['/api/users/map-settings', { mapSettings: { style: 'starry' } }]],
  ['getMyMaps', () => travelApi.getMyMaps(), 'get', ['/api/maps']],
  ['createMap', () => travelApi.createMap(body), 'post', ['/api/maps', body]],
  ['getMap', () => travelApi.getMap('m 1/x'), 'get', ['/api/maps/m%201%2Fx']],
  ['updateMap', () => travelApi.updateMap('m1', body), 'patch', ['/api/maps/m1', body]],
  ['deleteMap', () => travelApi.deleteMap('m1'), 'delete', ['/api/maps/m1']],
  ['getMapStats', () => travelApi.getMapStats('m1'), 'get', ['/api/maps/m1/stats']],
  ['tickLandmark', () => travelApi.tickLandmark('m1', 'l1'), 'put', ['/api/maps/m1/landmarks/l1/been', {}]],
  ['untickLandmark', () => travelApi.untickLandmark('m1', 'l1'), 'delete', ['/api/maps/m1/landmarks/l1/been']],
  // Each of a kind (25 Nov 2026): VISITED unless asked
  ['tieMapString', () => travelApi.tieMapString('m1', 'FR', 'JP'), 'post', ['/api/maps/m1/strings', { from: 'FR', to: 'JP', kind: 'VISITED' }]],
  ['tieMapString', () => travelApi.tieMapString('m1', 'FR', 'JP', 'PLANNED'), 'post', ['/api/maps/m1/strings', { from: 'FR', to: 'JP', kind: 'PLANNED' }]],
  ['tieAutoMapStrings', () => travelApi.tieAutoMapStrings('m1', 'PLANNED'), 'post', ['/api/maps/m1/strings/auto', { kind: 'PLANNED' }]],
  ['untieMapString', () => travelApi.untieMapString('m1', 's 1'), 'delete', ['/api/maps/m1/strings/s%201']],
  ['untieAllMapStrings', () => travelApi.untieAllMapStrings('m1', 'PLANNED'), 'delete', ['/api/maps/m1/strings', { params: { kind: 'PLANNED' } }]],
  ['getYearRecap', () => travelApi.getYearRecap('m1', 2025), 'get', ['/api/maps/m1/recap/2025']],
  ['updateMapDesign', () => travelApi.updateMapDesign('m1', body), 'patch', ['/api/maps/m1/design', body]],
  ['presignDesignPicture', () => travelApi.presignDesignPicture('m1', body), 'post', ['/api/maps/m1/design/picture/presign', body]],
  ['saveDesignPicture', () => travelApi.saveDesignPicture('m1', 'starry', 'k1'), 'put', ['/api/maps/m1/design/picture', { key: 'k1', style: 'starry' }]],
  ['removeDesignPicture', () => travelApi.removeDesignPicture('m1', 'starry'), 'delete', ['/api/maps/m1/design/picture?style=starry']],
  ['removeDesignPicture', () => travelApi.removeDesignPicture('m1'), 'delete', ['/api/maps/m1/design/picture']],
  ['makeMainMap', () => travelApi.makeMainMap('m1'), 'post', ['/api/maps/m1/main', {}]],
  ['upgradeMap', () => travelApi.upgradeMap('m1'), 'post', ['/api/maps/m1/upgrade', {}]],
  ['cancelMapUpgrade', () => travelApi.cancelMapUpgrade('m1'), 'delete', ['/api/maps/m1/upgrade']],
  ['transferMap', () => travelApi.transferMap('m1', { userId: 'u1' }), 'post', ['/api/maps/m1/transfer', { userId: 'u1', stayAsEditor: true }]],
  ['transferMap', () => travelApi.transferMap('m1', { userId: 'u1', stayAsEditor: false }), 'post', ['/api/maps/m1/transfer', { userId: 'u1', stayAsEditor: false }]],
  ['createTraveller', () => travelApi.createTraveller('m1', body), 'post', ['/api/maps/m1/travellers', body]],
  ['updateTraveller', () => travelApi.updateTraveller('m1', 't1', body), 'patch', ['/api/maps/m1/travellers/t1', body]],
  ['deleteTraveller', () => travelApi.deleteTraveller('m1', 't1'), 'delete', ['/api/maps/m1/travellers/t1']],
  ['putVisit', () => travelApi.putVisit('m1', 'FR', body), 'put', ['/api/maps/m1/visits/FR', body]],
  ['deleteVisit', () => travelApi.deleteVisit('m1', 'FR'), 'delete', ['/api/maps/m1/visits/FR']],
  ['getMapTrips', () => travelApi.getMapTrips('m1'), 'get', ['/api/maps/m1/trips']],
  ['createTrip', () => travelApi.createTrip('m1', body), 'post', ['/api/maps/m1/trips', body]],
  ['getTripsSharedWithMe', () => travelApi.getTripsSharedWithMe(), 'get', ['/api/trips/shared-with-me']],
  ['getTrip', () => travelApi.getTrip('t1'), 'get', ['/api/trips/t1']],
  ['updateTrip', () => travelApi.updateTrip('t1', body), 'patch', ['/api/trips/t1', body]],
  ['deleteTrip', () => travelApi.deleteTrip('t1'), 'delete', ['/api/trips/t1']],
  ['putTripTravellers', () => travelApi.putTripTravellers('t1', ['a', 'b']), 'put', ['/api/trips/t1/travellers', { travellerIds: ['a', 'b'] }]],
  ['createStop', () => travelApi.createStop('t1', body), 'post', ['/api/trips/t1/stops', body]],
  ['updateStop', () => travelApi.updateStop('t1', 's1', body), 'patch', ['/api/trips/t1/stops/s1', body]],
  ['deleteStop', () => travelApi.deleteStop('t1', 's1'), 'delete', ['/api/trips/t1/stops/s1']],
  ['reorderStops', () => travelApi.reorderStops('t1', ['s2', 's1']), 'put', ['/api/trips/t1/stops/order', { stopIds: ['s2', 's1'] }]],
  ['addTripToMap', () => travelApi.addTripToMap('t1', 'm1'), 'post', ['/api/trips/t1/maps', { mapId: 'm1' }]],
  ['removeTripFromMap', () => travelApi.removeTripFromMap('t1', 'm1'), 'delete', ['/api/trips/t1/maps/m1']],
  [
    'getMomentPage',
    () => travelApi.getMomentPage({ mapId: 'm1', country: 'FR', cursor: 'c1', limit: 30, tripId: 't1' }),
    'get',
    ['/api/maps/m1/moments?country=FR&cursor=c1&limit=30&tripId=t1'],
  ],
  ['getMomentPage', () => travelApi.getMomentPage({ shareCode: 'ABC', anniversary: '2026-11-22' }), 'get', ['/api/shared/ABC/moments?anniversary=2026-11-22']],
  // A trip's own moments: the trip is in the path, never in the query
  ['getMomentPage', () => travelApi.getMomentPage({ tripId: 't1', country: 'FR' }), 'get', ['/api/trips/t1/moments?country=FR']],
  ['createMoment', () => travelApi.createMoment('m1', body), 'post', ['/api/maps/m1/moments', body]],
  ['updateMoment', () => travelApi.updateMoment('mo1', body), 'patch', ['/api/moments/mo1', body]],
  ['deleteMoment', () => travelApi.deleteMoment('mo1'), 'delete', ['/api/moments/mo1']],
  [
    'getCountryLists',
    () => travelApi.getCountryLists({ mapId: 'm1' }, { photos: ['FR', 'JP'], moments: ['IT'], limit: 30, display: true, momentLimit: 20 }),
    'get',
    ['/api/maps/m1/country-lists?photos=FR%2CJP&moments=IT&limit=30&display=1&momentLimit=20'],
  ],
  ['getCountryLists', () => travelApi.getCountryLists({ shareCode: 'ABC' }, {}), 'get', ['/api/shared/ABC/country-lists']],
  ['getSubdivisions', () => travelApi.getSubdivisions({ mapId: 'm1' }, 'US'), 'get', ['/api/maps/m1/subdivisions?country=US']],
  ['getSubdivisions', () => travelApi.getSubdivisions({ shareCode: 'ABC' }, 'US'), 'get', ['/api/shared/ABC/subdivisions?country=US']],
  ['setSubdivision', () => travelApi.setSubdivision('m1', 'US-NY', 'VISITED'), 'put', ['/api/maps/m1/subdivisions/US-NY', { status: 'VISITED' }]],
  ['clearSubdivision', () => travelApi.clearSubdivision('m1', 'US-NY'), 'delete', ['/api/maps/m1/subdivisions/US-NY']],
  ['getPins', () => travelApi.getPins({ mapId: 'm1' }, 'FR'), 'get', ['/api/maps/m1/pins?country=FR']],
  ['getPins', () => travelApi.getPins({ shareCode: 'ABC' }, 'FR'), 'get', ['/api/shared/ABC/pins?country=FR']],
  ['getPin', () => travelApi.getPin({ mapId: 'm1' }, 'p1'), 'get', ['/api/pins/p1']],
  ['getPin', () => travelApi.getPin({ shareCode: 'ABC' }, 'p1'), 'get', ['/api/shared/ABC/pins/p1']],
  ['createPin', () => travelApi.createPin('m1', body), 'post', ['/api/maps/m1/pins', body]],
  ['updatePin', () => travelApi.updatePin('p1', body), 'patch', ['/api/pins/p1', body]],
  ['deletePin', () => travelApi.deletePin('p1'), 'delete', ['/api/pins/p1']],
  ['addPinVisit', () => travelApi.addPinVisit('p1', body), 'post', ['/api/pins/p1/visits', body]],
  ['updatePinVisit', () => travelApi.updatePinVisit('p1', 'v1', body), 'patch', ['/api/pins/p1/visits/v1', body]],
  ['deletePinVisit', () => travelApi.deletePinVisit('p1', 'v1'), 'delete', ['/api/pins/p1/visits/v1']],
  [
    'getPhotoPage',
    () =>
      travelApi.getPhotoPage({
        mapId: 'm1',
        country: 'FR',
        unplaced: true,
        landmark: 'l1',
        cursor: 'c1',
        limit: 30,
        tripId: 't1',
        order: 'shuffle',
        seed: '7',
        display: true,
        best: true,
      }),
    'get',
    ['/api/maps/m1/photos?country=FR&unplaced=1&landmark=l1&cursor=c1&limit=30&tripId=t1&order=shuffle&seed=7&display=1&best=1'],
  ],
  // A seed only goes with a shuffle; flags that are off are left out
  ['getPhotoPage', () => travelApi.getPhotoPage({ mapId: 'm1', order: 'taken', seed: '7', display: false, best: false }), 'get', ['/api/maps/m1/photos?order=taken']],
  ['getPhotoPage', () => travelApi.getPhotoPage({ tripId: 't1', unplaced: false }), 'get', ['/api/trips/t1/photos']],
  ['getPhotoPage', () => travelApi.getPhotoPage({ shareCode: 'ABC', display: true }), 'get', ['/api/shared/ABC/photos?display=1']],
  ['getPhoto', () => travelApi.getPhoto('p1'), 'get', ['/api/photos/p1']],
  ['getPhoto', () => travelApi.getPhoto('p1', { shareCode: 'ABC' }), 'get', ['/api/shared/ABC/photos/p1']],
  ['presignPhoto', () => travelApi.presignPhoto('m1', body), 'post', ['/api/maps/m1/photos/presign', body]],
  ['createPhoto', () => travelApi.createPhoto('m1', body), 'post', ['/api/maps/m1/photos', body]],
  ['startVideoUpload', () => travelApi.startVideoUpload('m1', body), 'post', ['/api/maps/m1/videos/upload', body]],
  ['saveVideo', () => travelApi.saveVideo('m1', body), 'post', ['/api/maps/m1/videos', body]],
  ['updatePhoto', () => travelApi.updatePhoto('p1', body), 'patch', ['/api/photos/p1', body]],
  ['deletePhoto', () => travelApi.deletePhoto('p1'), 'delete', ['/api/photos/p1']],
  ['movePhoto', () => travelApi.movePhoto('p1', { gallery: 'country' }), 'post', ['/api/photos/p1/move', { gallery: 'country', afterId: null }]],
  ['movePhoto', () => travelApi.movePhoto('p1', { gallery: 'trip', afterId: 'p0' }), 'post', ['/api/photos/p1/move', { gallery: 'trip', afterId: 'p0' }]],
  ['addPhotoLandmark', () => travelApi.addPhotoLandmark('p1', 'l1'), 'post', ['/api/photos/p1/landmarks', { landmarkId: 'l1' }]],
  ['confirmPhotoLandmark', () => travelApi.confirmPhotoLandmark('p1', 'l1'), 'patch', ['/api/photos/p1/landmarks/l1', { confirmed: true }]],
  ['removePhotoLandmark', () => travelApi.removePhotoLandmark('p1', 'l1'), 'delete', ['/api/photos/p1/landmarks/l1']],
  ['getSharing', () => travelApi.getSharing('maps', 'm1'), 'get', ['/api/maps/m1/sharing']],
  ['getSharing', () => travelApi.getSharing('trips', 't1'), 'get', ['/api/trips/t1/sharing']],
  ['updateSharing', () => travelApi.updateSharing('maps', 'm1', 'ANYONE_WITH_LINK'), 'patch', ['/api/maps/m1/sharing', { linkAccess: 'ANYONE_WITH_LINK' }]],
  ['resetShareLink', () => travelApi.resetShareLink('trips', 't1'), 'post', ['/api/trips/t1/sharing/reset-link', {}]],
  ['addMember', () => travelApi.addMember('maps', 'm1', body), 'post', ['/api/maps/m1/members', body]],
  ['updateMember', () => travelApi.updateMember('maps', 'm1', 'u1', 'EDITOR'), 'patch', ['/api/maps/m1/members/u1', { role: 'EDITOR' }]],
  ['removeMember', () => travelApi.removeMember('trips', 't1', 'u1'), 'delete', ['/api/trips/t1/members/u1']],
  ['cancelInvite', () => travelApi.cancelInvite('trips', 't1', 'i1'), 'delete', ['/api/trips/t1/invites/i1']],
  ['acceptInvite', () => travelApi.acceptInvite('tok'), 'post', ['/api/invites/accept', { token: 'tok' }]],
  ['getInvite', () => travelApi.getInvite('a/b'), 'get', ['/api/invites/a%2Fb']],
  ['openShareCode', () => travelApi.openShareCode('ABCD-EFGH'), 'get', ['/api/shared/ABCD-EFGH']],
  ['quickFillVisits', () => travelApi.quickFillVisits('m1', ['FR', 'PE']), 'post', ['/api/maps/m1/visits/quick-fill', { countryCodes: ['FR', 'PE'] }]],
  ['getPassport', () => travelApi.getPassport({ mapId: 'm1' }), 'get', ['/api/maps/m1/passport']],
  ['getPassport', () => travelApi.getPassport({ shareCode: 'ABC' }, { travellerId: 't1' }), 'get', ['/api/shared/ABC/passport?traveller=t1']],
  ['getBadges', () => travelApi.getBadges({ mapId: 'm1' }), 'get', ['/api/maps/m1/badges']],
  ['getBadges', () => travelApi.getBadges({ shareCode: 'ABC' }), 'get', ['/api/shared/ABC/badges']],
  // Life's One Shots (24 Nov 2026)
  ['getOneShots', () => travelApi.getOneShots({ mapId: 'm1' }), 'get', ['/api/maps/m1/one-shots']],
  ['getOneShots', () => travelApi.getOneShots({ shareCode: 'ABC' }), 'get', ['/api/shared/ABC/one-shots']],
  ['saveOneShot', () => travelApi.saveOneShot('m1', 'lion', { countryCode: 'KE' }), 'put', ['/api/maps/m1/one-shots/lion', { countryCode: 'KE' }]],
  ['deleteOneShot', () => travelApi.deleteOneShot('m1', 'lion'), 'delete', ['/api/maps/m1/one-shots/lion']],
  ['getGoals', () => travelApi.getGoals({ mapId: 'm1' }), 'get', ['/api/maps/m1/goals']],
  ['getGoals', () => travelApi.getGoals({ shareCode: 'ABC' }), 'get', ['/api/shared/ABC/goals']],
  ['createGoal', () => travelApi.createGoal('m1', body), 'post', ['/api/maps/m1/goals', body]],
  ['updateGoal', () => travelApi.updateGoal('g1', body), 'patch', ['/api/goals/g1', body]],
  ['deleteGoal', () => travelApi.deleteGoal('g1'), 'delete', ['/api/goals/g1']],
];

describe('travelApi', () => {
  it.each(CASES.map(([name, call, method, args], i) => [`${name} #${i}`, call, method, args]))(
    '%s calls the right method and path',
    async (_name, call, method, args) => {
      client.answerWith({ answer: 42 });
      await expect(call()).resolves.toEqual({ answer: 42 });
      expect(client[method]).toHaveBeenCalledTimes(1);
      expect(client[method]).toHaveBeenCalledWith(...args);
      for (const other of ['get', 'post', 'patch', 'put', 'delete'].filter((m) => m !== method)) {
        expect(client[other]).not.toHaveBeenCalled();
      }
    },
  );

  it('covers every export', () => {
    const tested = new Set(CASES.map(([name]) => name));
    expect(Object.keys(travelApi).filter((name) => !tested.has(name))).toEqual([]);
  });

  it('answers an empty object when the reply has no payload', async () => {
    client.get.mockResolvedValueOnce({ data: {} });
    await expect(travelApi.getMap('m1')).resolves.toEqual({});
  });

  it('passes a failure on with its friendly message', async () => {
    client.get.mockRejectedValueOnce(Object.assign(new Error('x'), { friendlyMessage: 'Resource not found.' }));
    await expect(travelApi.getMap('m1')).rejects.toMatchObject({ friendlyMessage: 'Resource not found.' });
  });
});
