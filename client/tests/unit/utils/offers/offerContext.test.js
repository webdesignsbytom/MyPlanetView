import { describe, expect, it } from 'vitest';
import {
  choiceContext,
  countryLink,
  deskLink,
  deskShelves,
  isUpcomingPlannedTrip,
  linkForChoice,
  nextPlannedTrip,
  placeCountries,
  todayString,
  tripLink,
  tripPlace,
} from '@/utils/offers/offerContext';

describe('todayString', () => {
  it('gives the day in the viewer’s own calendar', () => {
    expect(todayString(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
    expect(todayString(new Date(2026, 10, 22))).toBe('2026-11-22');
  });
});

describe('nextPlannedTrip and isUpcomingPlannedTrip', () => {
  const trips = [
    { id: 'done', status: 'COMPLETED', startDate: '2027-01-01' },
    { id: 'later', status: 'PLANNED', startDate: '2027-06-01' },
    { id: 'past', status: 'PLANNED', startDate: '2026-01-01' },
    { id: 'undated', status: 'PLANNED', startDate: null },
    { id: 'soon', status: 'PLANNED', startDate: '2026-12-01' },
    { id: 'away', status: 'ACTIVE', startDate: '2026-11-30' },
  ];

  it('finds the soonest planned trip from today on', () => {
    expect(nextPlannedTrip(trips, '2026-11-22').id).toBe('soon');
    expect(nextPlannedTrip(trips, '2026-12-01').id).toBe('soon');
    expect(nextPlannedTrip(trips, '2026-12-02').id).toBe('later');
  });

  it('gives null when none is to come', () => {
    expect(nextPlannedTrip(trips, '2028-01-01')).toBeNull();
    expect(nextPlannedTrip(null, '2026-01-01')).toBeNull();
  });

  it('says whether one trip is planned with dates from today on', () => {
    expect(isUpcomingPlannedTrip(trips[4], '2026-11-22')).toBe(true);
    expect(isUpcomingPlannedTrip(trips[2], '2026-11-22')).toBe(false);
    expect(isUpcomingPlannedTrip(trips[3], '2026-11-22')).toBe(false);
    expect(isUpcomingPlannedTrip(trips[5], '2026-11-22')).toBe(false);
    expect(isUpcomingPlannedTrip(null, '2026-11-22')).toBe(false);
  });
});

describe('tripPlace', () => {
  it('lists a whole trip’s stops in order, each its landmark else its country, never its place name', () => {
    const place = tripPlace({
      id: 't1',
      startDate: null,
      endDate: null,
      stops: [
        { position: 2, countryCode: 'IT', placeName: 'Gran’s flat, 12 High St', arriveOn: '2027-05-10', leaveOn: '2027-05-14' },
        { position: 1, countryCode: 'FR', landmarkName: 'Eiffel Tower', placeName: 'Hotel', arriveOn: '2027-05-03', leaveOn: '2027-05-09' },
        { position: 3, countryCode: null, placeName: 'Somewhere at sea' },
      ],
    });
    expect(place).toEqual({
      tripId: 't1',
      from: '2027-05-03',
      to: '2027-05-14',
      stops: [
        { countryCode: 'FR', destination: 'Eiffel Tower' },
        { countryCode: 'IT', destination: 'Italy' },
      ],
    });
    expect(JSON.stringify(place)).not.toMatch(/High St|Hotel|at sea/);
  });

  it('takes the trip’s own dates first', () => {
    const place = tripPlace({ id: 't', startDate: '2027-01-01', endDate: '2027-01-09', stops: [{ position: 1, countryCode: 'JP', arriveOn: '2027-01-02' }] });
    expect(place.from).toBe('2027-01-01');
    expect(place.to).toBe('2027-01-09');
  });

  it('takes a group trip’s countries from its summary', () => {
    expect(tripPlace({ id: 'g', startDate: '2027-02-01', endDate: null, countryCodes: ['JP', 'KR'] })).toEqual({
      tripId: 'g',
      from: '2027-02-01',
      to: null,
      stops: [
        { countryCode: 'JP', destination: 'Japan' },
        { countryCode: 'KR', destination: 'South Korea' },
      ],
    });
  });
});

describe('placeCountries', () => {
  it('gives the countries in stop order, each once', () => {
    const place = { stops: [{ countryCode: 'FR' }, { countryCode: 'IT' }, { countryCode: 'FR' }] };
    expect(placeCountries(place)).toEqual(['FR', 'IT']);
    expect(placeCountries(null)).toEqual([]);
  });
});

describe('countryLink', () => {
  it('names the place and sends a UK nation as the UK', () => {
    expect(countryLink('JP')).toEqual({ destination: 'Japan', country: 'JP' });
    expect(countryLink('XC')).toEqual({ destination: 'Scotland', country: 'GB' });
  });

  it('sends a region as its country', () => {
    expect(countryLink('XB')).toEqual({ destination: 'Bali', country: 'ID' });
  });

  it('carries nothing for no country', () => {
    expect(countryLink(null)).toEqual({});
  });
});

const place = {
  tripId: 't',
  from: '2027-05-03',
  to: '2027-05-14',
  stops: [
    { countryCode: 'FR', destination: 'Eiffel Tower' },
    { countryCode: 'XE', destination: 'England' },
  ],
};

describe('tripLink', () => {
  it('carries the first stop in the country, with the trip’s dates', () => {
    expect(tripLink(place, 'XE')).toEqual({ destination: 'England', country: 'GB', from: '2027-05-03', to: '2027-05-14' });
  });

  it('carries the trip’s first stop for an offer with no country', () => {
    expect(tripLink(place)).toEqual({ destination: 'Eiffel Tower', country: 'FR', from: '2027-05-03', to: '2027-05-14' });
  });

  it('carries only the country when the trip doesn’t go there', () => {
    expect(tripLink(place, 'JP')).toEqual({ destination: 'Japan', country: 'JP' });
  });
});

describe('linkForChoice', () => {
  it('carries nothing without a choice', () => {
    expect(linkForChoice(null, {})).toEqual({});
  });

  it('carries the trip’s stop for a trip offer', () => {
    expect(linkForChoice({ source: 'trip', countryCode: 'FR' }, { plannedTrip: place })).toMatchObject({ destination: 'Eiffel Tower', from: '2027-05-03' });
  });

  it('carries the trip’s first stop for a general offer, else the country viewed or around', () => {
    expect(linkForChoice({ source: 'general', countryCode: null }, { plannedTrip: place })).toMatchObject({ country: 'FR', to: '2027-05-14' });
    expect(linkForChoice({ source: 'general', countryCode: null }, { country: 'JP' })).toEqual({ destination: 'Japan', country: 'JP' });
    expect(linkForChoice({ source: 'general', countryCode: null }, { aroundCountry: 'IT' })).toEqual({ destination: 'Italy', country: 'IT' });
    expect(linkForChoice({ source: 'general', countryCode: null }, {})).toEqual({});
  });

  it('carries the trip’s dates for a country the planned trip goes to', () => {
    expect(linkForChoice({ source: 'country', countryCode: 'FR' }, { plannedTrip: place, country: 'FR' })).toEqual({
      destination: 'Eiffel Tower',
      country: 'FR',
      from: '2027-05-03',
      to: '2027-05-14',
    });
  });

  it('carries only the country for one the trip doesn’t go to', () => {
    expect(linkForChoice({ source: 'around', countryCode: 'ES' }, { plannedTrip: place })).toEqual({ destination: 'Spain', country: 'ES' });
  });
});

describe('deskLink', () => {
  it('carries the UK offer’s stop in one of its nations', () => {
    expect(deskLink({ countryCode: 'GB' }, { countryCodes: ['XE'], trip: place })).toEqual({
      destination: 'England',
      country: 'GB',
      from: '2027-05-03',
      to: '2027-05-14',
    });
  });

  it('carries a country offer’s country when the trip doesn’t go there', () => {
    expect(deskLink({ countryCode: 'JP' }, { countryCodes: ['JP'], trip: place })).toEqual({ destination: 'Japan', country: 'JP' });
    expect(deskLink({ countryCode: 'JP' }, { countryCodes: ['JP'] })).toEqual({ destination: 'Japan', country: 'JP' });
  });

  it('carries a general offer’s first desk country on the trip, else the desk’s first country', () => {
    expect(deskLink({ countryCode: null }, { countryCodes: ['JP', 'FR'], trip: place })).toMatchObject({ destination: 'Eiffel Tower', from: '2027-05-03' });
    expect(deskLink({ countryCode: null }, { countryCodes: ['JP', 'KR'], trip: place })).toEqual({ destination: 'Japan', country: 'JP' });
    expect(deskLink({ countryCode: null }, { countryCodes: [] })).toEqual({});
  });
});

describe('choiceContext', () => {
  it('turns a slot’s context into chooseOffer’s', () => {
    expect(choiceContext('GALLERY', { plannedTrip: place, country: 'IT', aroundCountry: 'ES' })).toEqual({
      placement: 'GALLERY',
      tripCountry: 'FR',
      country: 'IT',
      aroundCountry: 'ES',
    });
    expect(choiceContext('SLIDESHOW', {})).toEqual({ placement: 'SLIDESHOW', tripCountry: null, country: null, aroundCountry: null });
  });
});

describe('deskShelves', () => {
  const desk = (id, extra) => ({ id, placements: ['TRAVEL_DESK'], weight: 1, countryCode: null, kind: 'HOTEL', title: id, ...extra });
  const offers = [
    desk('general-hotel'),
    desk('jp-hotel', { countryCode: 'JP' }),
    desk('fr-hotel-heavy', { countryCode: 'FR', weight: 5 }),
    desk('fr-hotel-b', { countryCode: 'FR', title: 'B' }),
    desk('fr-hotel-a', { countryCode: 'FR', title: 'A' }),
    desk('it-hotel', { countryCode: 'IT' }),
    desk('esim', { kind: 'ESIM' }),
    desk('other', { kind: 'OTHER' }),
    desk('spa', { kind: 'SPA' }),
    desk('gallery-only', { placements: ['GALLERY'] }),
    desk('gb-tour', { countryCode: 'GB', kind: 'TOUR' }),
  ];

  it('lists the desk’s countries’ offers and the general ones, by kind in booking order, an unknown kind last', () => {
    const shelves = deskShelves(offers, ['FR', 'JP']);
    expect(shelves.map((s) => s.kind)).toEqual(['HOTEL', 'ESIM', 'OTHER', 'SPA']);
    expect(shelves[0].offers.map((o) => o.id)).toEqual(['fr-hotel-heavy', 'fr-hotel-a', 'fr-hotel-b', 'jp-hotel', 'general-hotel']);
    expect(shelves.flatMap((s) => s.offers.map((o) => o.id))).not.toContain('it-hotel');
    expect(shelves.flatMap((s) => s.offers.map((o) => o.id))).not.toContain('gallery-only');
  });

  it('puts an offer with no kind on the last travel shelf', () => {
    const shelves = deskShelves([desk('other', { kind: 'OTHER' }), desk('kindless', { kind: undefined })], []);
    // Same rank and weight, so by title
    expect(shelves.find((s) => s.kind === 'OTHER').offers.map((o) => o.id)).toEqual(['kindless', 'other']);
  });

  it('lists an offer with no kind only once, on the Other shelf', () => {
    const shelves = deskShelves([desk('kindless', { kind: undefined })], []);
    expect(shelves).toEqual([{ kind: 'OTHER', offers: [expect.objectContaining({ id: 'kindless' })] }]);
  });

  it('gives a UK nation the UK’s offers', () => {
    expect(deskShelves(offers, ['XW']).find((s) => s.kind === 'TOUR').offers.map((o) => o.id)).toEqual(['gb-tour']);
  });

  it('gives no shelves for no offers', () => {
    expect(deskShelves([], ['FR'])).toEqual([]);
    expect(deskShelves(undefined, undefined)).toEqual([]);
  });
});
