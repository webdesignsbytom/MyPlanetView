import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CLICK_DAYS,
  NO_COUNTRY,
  OFFER_KIND_LABELS,
  OFFER_KIND_OPTIONS,
  OFFER_PLACEMENT_LABELS,
  clicksByPlacement,
  clicksWord,
  dailyClicks,
  downloadJson,
  emptyOfferFilters,
  kindLabel,
  offerCountryOptions,
  offerCountryWords,
  offerDatesWords,
  offerExportFile,
  offerExportFileName,
  offerMatches,
  offerState,
  placementLabel,
  shortDay,
  sortOffers,
} from '@/utils/offers/offerAdmin';
import { OFFER_KINDS, OFFER_PLACEMENTS } from '@/utils/offers/offerRules';

afterEach(() => vi.useRealTimers());

const now = Date.parse('2027-07-01T12:00:00Z');
// jsdom's Blob has no text(): read it as the page would
const readText = (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(blob);
  });

describe('labels', () => {
  it('names every kind and placement', () => {
    expect(Object.keys(OFFER_KIND_LABELS).sort()).toEqual([...OFFER_KINDS].sort());
    expect(Object.keys(OFFER_PLACEMENT_LABELS).sort()).toEqual([...OFFER_PLACEMENTS].sort());
    expect(OFFER_KIND_OPTIONS.map((o) => o.value)).toEqual([...OFFER_KINDS]);
    expect(OFFER_KIND_OPTIONS[0]).toEqual({ value: 'HOTEL', label: 'Hotels' });
  });

  it('keeps an unknown kind or placement as it is', () => {
    expect(kindLabel('ESIM')).toBe('eSIMs');
    expect(kindLabel('SPA')).toBe('SPA');
    expect(placementLabel('PRINT')).toBe('Print or download');
    expect(placementLabel('BILLBOARD')).toBe('BILLBOARD');
  });

  it('names an offer’s country, or anywhere', () => {
    expect(offerCountryWords('JP')).toBe('Japan');
    expect(offerCountryWords(null)).toBe('Anywhere');
  });
});

describe('offerState', () => {
  it('says whether an offer is off, scheduled, ended or on', () => {
    expect(offerState({ active: false }, now)).toEqual({ key: 'off', label: 'Off' });
    expect(offerState({ active: true, startsAt: '2027-08-01T00:00:00Z' }, now)).toEqual({ key: 'scheduled', label: 'Scheduled' });
    expect(offerState({ active: true, endsAt: '2027-07-01T12:00:00Z' }, now)).toEqual({ key: 'ended', label: 'Ended' });
    expect(offerState({ active: true, startsAt: '2027-07-01T12:00:00Z', endsAt: '2027-07-02T00:00:00Z' }, now)).toEqual({ key: 'on', label: 'On' });
  });
});

describe('offerDatesWords', () => {
  it('words the dates in UTC days', () => {
    expect(offerDatesWords({})).toBe('Always');
    expect(offerDatesWords({ startsAt: '2027-06-01T00:00:00Z' })).toBe('From 1 Jun 2027');
    expect(offerDatesWords({ endsAt: '2027-08-31T23:59:59Z' })).toBe('Until 31 Aug 2027');
    expect(offerDatesWords({ startsAt: '2027-06-01T00:00:00Z', endsAt: '2027-08-31T23:59:59Z' })).toBe('1 Jun 2027 – 31 Aug 2027');
  });
});

describe('offerMatches', () => {
  const offer = { key: 'example-stays-jp', title: 'Hotels in Kyoto', partner: 'Example Stays', blurb: 'Near temples', kind: 'HOTEL', countryCode: 'JP', active: true };
  const general = { key: 'esim', title: 'Data abroad', partner: 'Example SIM', kind: 'ESIM', countryCode: null, active: false };
  const filters = (extra) => ({ ...emptyOfferFilters(), ...extra });

  it('matches everything with no filters', () => {
    expect(offerMatches(offer, emptyOfferFilters(), now)).toBe(true);
  });

  it('filters by kind, country, general offers and state', () => {
    expect(offerMatches(offer, filters({ kind: 'TOUR' }), now)).toBe(false);
    expect(offerMatches(offer, filters({ country: 'JP' }), now)).toBe(true);
    expect(offerMatches(offer, filters({ country: 'FR' }), now)).toBe(false);
    expect(offerMatches(offer, filters({ country: NO_COUNTRY }), now)).toBe(false);
    expect(offerMatches(general, filters({ country: NO_COUNTRY }), now)).toBe(true);
    expect(offerMatches(general, filters({ state: 'off' }), now)).toBe(true);
    expect(offerMatches(offer, filters({ state: 'off' }), now)).toBe(false);
  });

  it('searches every word in the title, partner, key, blurb and country', () => {
    expect(offerMatches(offer, filters({ search: '  kyoto   EXAMPLE ' }), now)).toBe(true);
    expect(offerMatches(offer, filters({ search: 'japan temples' }), now)).toBe(true);
    expect(offerMatches(offer, filters({ search: 'kyoto osaka' }), now)).toBe(false);
    expect(offerMatches(general, filters({ search: 'anywhere' }), now)).toBe(true);
  });
});

describe('offerCountryOptions', () => {
  it('lists the offers’ countries once each, by name', () => {
    const offers = [{ countryCode: 'JP' }, { countryCode: null }, { countryCode: 'FR' }, { countryCode: 'JP' }];
    expect(offerCountryOptions(offers)).toEqual([
      { value: 'FR', label: 'France' },
      { value: 'JP', label: 'Japan' },
    ]);
  });
});

describe('clicks', () => {
  it('counts clicks for every placement shown on, and any clicked from before', () => {
    const offer = { placements: ['GALLERY', 'TRAVEL_DESK'], clicks: { byPlacement: { TRAVEL_DESK: 4, SLIDESHOW: 2 } } };
    expect(clicksByPlacement(offer)).toEqual([
      { placement: 'GALLERY', label: 'Photo galleries', count: 0 },
      { placement: 'SLIDESHOW', label: 'End of a slideshow', count: 2 },
      { placement: 'TRAVEL_DESK', label: 'Travel Desk', count: 4 },
    ]);
    expect(clicksByPlacement({})).toEqual([]);
  });

  it('words days and clicks', () => {
    expect(shortDay('2027-07-04')).toBe('4 Jul');
    expect(clicksWord(1)).toBe('1 click');
    expect(clicksWord(1200)).toBe('1,200 clicks');
    expect(clicksWord(undefined)).toBe('0 clicks');
  });

  it('gives every day of the window with its clicks, 0 when none', () => {
    const days = dailyClicks([{ day: '2027-02-28', count: 3 }, { day: '2027-03-02', count: 1 }], '2027-02-27', 4);
    expect(days).toEqual([
      { day: '2027-02-27', count: 0 },
      { day: '2027-02-28', count: 3 },
      { day: '2027-03-01', count: 0 },
      { day: '2027-03-02', count: 1 },
    ]);
    expect(dailyClicks(undefined, '2027-01-01')).toHaveLength(CLICK_DAYS);
  });
});

describe('sortOffers', () => {
  it('sorts by country, anywhere last, then by key, without changing the list', () => {
    const offers = [{ key: 'b', countryCode: null }, { key: 'z', countryCode: 'JP' }, { key: 'a', countryCode: null }, { key: 'c', countryCode: 'FR' }, { key: 'a', countryCode: 'JP' }];
    expect(sortOffers(offers).map((o) => `${o.countryCode}:${o.key}`)).toEqual(['FR:c', 'JP:a', 'JP:z', 'null:a', 'null:b']);
    expect(offers[0].key).toBe('b');
  });
});

describe('the export', () => {
  it('holds every field an import takes, defaults for missing ones, and nothing the server makes', () => {
    const offer = { id: 'id-1', key: 'k', partner: 'P', kind: 'HOTEL', title: 'T', placements: ['GALLERY'], url: 'https://x.example', createdAt: 'x', clicks: { total: 3 } };
    const file = offerExportFile([offer], new Date('2027-07-01T09:00:00Z'));
    expect(file._about).toMatch(/^My Planet View travel offers, exported 2027-07-01\./);
    expect(file.offers).toEqual([
      {
        key: 'k',
        partner: 'P',
        kind: 'HOTEL',
        title: 'T',
        blurb: null,
        countryCode: null,
        placements: ['GALLERY'],
        url: 'https://x.example',
        imageKey: null,
        weight: 1,
        active: true,
        startsAt: null,
        endsAt: null,
      },
    ]);
  });

  it('keeps a stored false and a stored weight', () => {
    const [exported] = offerExportFile([{ key: 'k', active: false, weight: 9 }]).offers;
    expect(exported.active).toBe(false);
    expect(exported.weight).toBe(9);
  });

  it('names the file by the day', () => {
    expect(offerExportFileName(new Date('2027-07-01T23:00:00Z'))).toBe('offers-2027-07-01.json');
  });
});

describe('downloadJson', () => {
  it('hands the browser the JSON as a file, then lets the link go', async () => {
    vi.useFakeTimers();
    let saved = null;
    const createObjectURL = vi.fn((blob) => {
      saved = blob;
      return 'blob:offers';
    });
    vi.spyOn(URL, 'createObjectURL').mockImplementation(createObjectURL);
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      expect(this.download).toBe('offers.json');
      expect(this.getAttribute('href')).toBe('blob:offers');
    });

    downloadJson({ offers: [] }, 'offers.json');
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download]')).toBeNull();
    expect(saved.type).toBe('application/json');
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:offers');
    // jsdom's FileReader needs real timers
    vi.useRealTimers();
    expect(await readText(saved)).toBe('{\n  "offers": []\n}\n');
  });
});
