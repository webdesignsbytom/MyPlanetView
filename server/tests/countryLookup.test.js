import { describe, it, expect } from 'vitest';
import { countryAtPosition } from '../src/utils/countryLookup.js';

describe('countryAtPosition (map shapes, no external service)', () => {
  it.each([
    ['London', 51.5074, -0.1278, 'GB'],
    ['Paris', 48.8566, 2.3522, 'FR'],
    ['Tokyo', 35.6762, 139.6503, 'JP'],
    ['Sydney', -33.8688, 151.2093, 'AU'],
    ['Rio de Janeiro', -22.9068, -43.1729, 'BR'],
    ['Nairobi', -1.2921, 36.8219, 'KE'],
    ['Denver', 39.7392, -104.9903, 'US'],
  ])('%s -> %s', (_name, lat, lng, code) => {
    expect(countryAtPosition(lat, lng)).toBe(code);
  });

  it('finds an enclave rather than the country around it (Maseru -> Lesotho)', () => {
    expect(countryAtPosition(-29.31, 27.48)).toBe('LS');
  });

  it('knows an island the map leaves out (Malabo, on Bioko -> Equatorial Guinea, not Cameroon)', () => {
    expect(countryAtPosition(3.7533, 8.7836)).toBe('GQ');
    // ...without taking the Cameroon coast across the water
    expect(countryAtPosition(4.0167, 9.2)).toBe('CM'); // Limbe
  });

  // Natural Earth's islands (16 Nov 2026): the old map data left most of the eastern Aegean
  // out, so its coastline fallback found Turkey there
  it.each([
    ['Rhodes', 36.4341, 28.2176],
    ['Kos', 36.8932, 27.2877],
    ['Mytilene, Lesbos', 39.1045, 26.5543],
    ['Molyvos, Lesbos', 39.368, 26.175],
    ['Vathy, Samos', 37.7548, 26.9777],
    ['Chios', 38.3681, 26.1358],
    ['Patmos (a circle)', 37.3283, 26.5444],
    ['Kalymnos', 36.9509, 26.9853],
    ['Symi', 36.6157, 27.8373],
    ['Kastellorizo (a circle)', 36.1497, 29.5935],
    ['Lemnos', 39.8761, 25.0617],
    ['Ikaria', 37.6125, 26.2954],
    ['Leros', 37.1295, 26.8505],
    ['Karpathos', 35.5071, 27.2131],
    ['Corfu town', 39.6243, 19.9217],
  ])('%s -> GR', (_name, lat, lng) => {
    expect(countryAtPosition(lat, lng)).toBe('GR');
  });

  it.each([
    ['Bodrum', 37.0344, 27.4305],
    ['Çeşme', 38.3236, 26.3036],
    ['Ayvalık', 39.3191, 26.6936],
    ['Kuşadası', 37.8579, 27.261],
    ['Kaş', 36.199, 29.64],
    ['Datça', 36.7286, 27.6877],
    ['Gökçeada', 40.1667, 25.85],
  ])('keeps the Turkish coast in Turkey: %s', (_name, lat, lng) => {
    expect(countryAtPosition(lat, lng)).toBe('TR');
  });

  it.each([
    ['Palma, Mallorca', 39.5696, 2.6502, 'ES'],
    ['Ibiza', 38.9067, 1.4206, 'ES'],
    ['Visby, Gotland', 57.6348, 18.2948, 'SE'],
    ['Lerwick, Shetland', 60.1546, -1.1494, 'GB'],
    ['Funchal, Madeira', 32.6669, -16.9241, 'PT'],
    ['Ponta Delgada, Azores', 37.7412, -25.6756, 'PT'],
    ['Port Blair, Andamans', 11.6234, 92.7265, 'IN'],
    ['Jeju', 33.4996, 126.5312, 'KR'],
    ['Naha, Okinawa', 26.2124, 127.6809, 'JP'],
    ['Puerto Ayora, Galápagos', -0.7393, -90.3138, 'EC'],
    ['Hanga Roa, Easter Island', -27.15, -109.43, 'CL'],
    ['Hadibu, Socotra', 12.65, 54.02, 'YE'],
    ['Rønne, Bornholm', 55.1009, 14.7066, 'DK'],
    ['Kralendijk, Bonaire', 12.15, -68.2655, 'BQ'],
    ['Pante Macassar, Oecusse', -9.2, 124.37, 'TL'],
    ['Gaza', 31.5017, 34.4668, 'PS'],
    ['Provideniya, Chukotka east of 180°', 64.4233, -173.2264, 'RU'],
    ['Dutch Harbor, Aleutians', 53.8898, -166.5422, 'US'],
    ['Waitangi, Chatham Islands', -43.9536, -176.5597, 'NZ'],
    ['St Helier, Jersey (folded into GB, as the Isle of Man is)', 49.1868, -2.1069, 'GB'],
    ['Saint-Pierre (folded into FR)', 46.7811, -56.1764, 'FR'],
  ])('finds an island the old map left out: %s -> %s', (_name, lat, lng, code) => {
    expect(countryAtPosition(lat, lng)).toBe(code);
  });

  it.each([
    ['Copenhagen', 55.6761, 12.5683, 'DK'],
    ['Helsingør', 56.036, 12.613, 'DK'],
    ['Malmö', 55.605, 13.0038, 'SE'],
    ['Luxembourg City', 49.6116, 6.1319, 'LU'],
    ['Fujairah', 25.13, 56.33, 'AE'],
    ['Khor Fakkan', 25.34, 56.35, 'AE'],
    ['Świnoujście', 53.91, 14.25, 'PL'],
    ['Heringsdorf, Usedom', 53.954, 14.165, 'DE'],
  ])('finds a town the old map drew in the sea or a neighbour: %s -> %s', (_name, lat, lng, code) => {
    expect(countryAtPosition(lat, lng)).toBe(code);
  });

  it('finds Andorra and Gibraltar (circles: no shape at this scale), and not their neighbours', () => {
    expect(countryAtPosition(42.5063, 1.5218)).toBe('AD'); // Andorra la Vella
    expect(countryAtPosition(42.5427, 1.7336)).toBe('AD'); // Pas de la Casa
    expect(countryAtPosition(42.358, 1.456)).toBe('ES'); // La Seu d'Urgell
    expect(countryAtPosition(42.72, 1.84)).toBe('FR'); // Ax-les-Thermes
    expect(countryAtPosition(36.1408, -5.3536)).toBe('GI'); // Gibraltar town
    expect(countryAtPosition(36.1102, -5.3456)).toBe('GI'); // Europa Point
    expect(countryAtPosition(36.168, -5.3475)).toBe('ES'); // La Línea
  });

  it('finds Kiribati on both sides of the antimeridian', () => {
    expect(countryAtPosition(1.329, 172.979)).toBe('KI'); // Bairiki, South Tarawa
    expect(countryAtPosition(1.985, -157.475)).toBe('KI'); // London, Kiritimati
    expect(countryAtPosition(-2.81, -171.67)).toBe('KI'); // Kanton, Phoenix Islands
  });

  it('finds Antarctica from its shape, and the geographic poles by latitude', () => {
    expect(countryAtPosition(-77.846, 166.676)).toBe('AQ'); // McMurdo Station
    expect(countryAtPosition(-64.774, -64.053)).toBe('AQ'); // Palmer Station, Antarctic Peninsula
    expect(countryAtPosition(-81.5, -175)).toBe('AQ'); // on the Ross Ice Shelf
    expect(countryAtPosition(-90, 0)).toBe('XS');
    expect(countryAtPosition(-89.95, 120)).toBe('XS');
    expect(countryAtPosition(89.95, -30)).toBe('XN');
    expect(countryAtPosition(90, 0)).toBe('XN');
  });

  it('never places a photo at a magnetic pole (they drift), and stops short of the North Pole', () => {
    const atMagneticNorth = countryAtPosition(85.762, 139.298);
    expect(atMagneticNorth).not.toBe('QN');
    expect(countryAtPosition(-63.851, 135.078)).not.toBe('QS');
    expect(countryAtPosition(89.8, 0)).toBe(null);
  });

  it('returns null in open sea', () => {
    expect(countryAtPosition(30, -40)).toBeNull();
    expect(countryAtPosition(-40, -120)).toBeNull();
  });

  it('returns null for an invalid position', () => {
    expect(countryAtPosition(200, 0)).toBeNull();
  });
});
