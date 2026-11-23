// A boarding pass's barcode text read into its flights (utils/flights/boardingPass.js).
import { describe, expect, it } from 'vitest';
import { dayOfYear, flightDate, parseBoardingPass } from '@/utils/flights/boardingPass';

const pad = (text, n) => text.padEnd(n, ' ').slice(0, n);
const hex = (n) => n.toString(16).toUpperCase().padStart(2, '0');
// One flight's part of a pass, as IATA's Resolution 792 lays it out
const leg = ({ from, to, carrier = 'BA', number = '0117', day, conditional = '' }) =>
  `${pad('ABC123', 7)}${from}${to}${pad(carrier, 3)}${number.padEnd(5, ' ')}${String(day).padStart(3, '0')}Y012A0001 1${hex(conditional.length)}${conditional}`;
const pass = (legs) => `M${legs.length}${pad('DOE/JANE MRS', 20)}E${legs.map(leg).join('')}`;
// The first flight's conditional part with the day the pass was issued
const issued = (yearDigit, day) => {
  const unique = `0WW${yearDigit}${String(day).padStart(3, '0')}BBA `;
  return `>5${hex(unique.length)}${unique}`;
};
const NOW = new Date('2026-11-23T10:00:00Z');

describe('parseBoardingPass', () => {
  it('reads IATA’s own example pass', () => {
    expect(parseBoardingPass('M1DESMARAIS/LUC       EABC123 YULFRAAC 0834 326J001A0025 100', NOW)).toEqual({
      flights: [{ from: 'YUL', to: 'FRA', carrier: 'AC', flightNumber: '834', flownOn: '2026-11-22' }],
    });
  });

  it('reads every flight on a pass with a change of planes', () => {
    const text = pass([
      { from: 'LHR', to: 'DXB', carrier: 'EK', number: '0002', day: 320 },
      { from: 'DXB', to: 'SYD', carrier: 'EK', number: '0414', day: 321 },
    ]);
    expect(parseBoardingPass(text, NOW).flights).toEqual([
      { from: 'LHR', to: 'DXB', carrier: 'EK', flightNumber: '2', flownOn: '2026-11-16' },
      { from: 'DXB', to: 'SYD', carrier: 'EK', flightNumber: '414', flownOn: '2026-11-17' },
    ]);
  });

  it('keeps a flight number’s letter, and never the name or booking reference', () => {
    const [flight] = parseBoardingPass(pass([{ from: 'CDG', to: 'NCE', carrier: 'AF', number: '0012A', day: 300 }]), NOW).flights;
    expect(flight.flightNumber).toBe('12A');
    expect(JSON.stringify(flight)).not.toMatch(/DOE|ABC123/);
  });

  it('dates the flight by the year the pass was issued in', () => {
    // Issued on day 300 of a year ending in 5; flown on day 10: January 2026
    const text = pass([{ from: 'LHR', to: 'JFK', day: 10, conditional: issued(5, 300) }]);
    expect(parseBoardingPass(text, new Date('2026-03-01T00:00:00Z')).flights[0].flownOn).toBe('2026-01-10');
    // The same day issued: that year
    const same = pass([{ from: 'LHR', to: 'JFK', day: 301, conditional: issued(5, 300) }]);
    expect(parseBoardingPass(same, new Date('2026-03-01T00:00:00Z')).flights[0].flownOn).toBe('2025-10-28');
  });

  it('leaves out a flight it can’t read, and is null for what isn’t a pass', () => {
    const text = pass([
      { from: 'LHR', to: 'LHR', day: 10 },
      { from: 'LHR', to: 'JFK', day: 10 },
    ]);
    expect(parseBoardingPass(text, NOW).flights).toHaveLength(1);
    expect(parseBoardingPass(pass([{ from: 'lh1', to: 'JFK', day: 10 }]), NOW)).toBeNull();
    expect(parseBoardingPass(pass([{ from: 'LHR', to: 'JFK', day: 'ABC' }]), NOW)).toBeNull();
    expect(parseBoardingPass('https://example.com', NOW)).toBeNull();
    expect(parseBoardingPass('M1SHORT', NOW)).toBeNull();
    expect(parseBoardingPass(null, NOW)).toBeNull();
  });

  it('ignores line breaks a scanner adds', () => {
    expect(parseBoardingPass('M1DESMARAIS/LUC       EABC123 YULFRA\nAC 0834 326J001A0025 100', NOW).flights).toHaveLength(1);
  });
});

describe('the flight’s date', () => {
  it('counts the days of the year, leap years too', () => {
    expect(dayOfYear(2026, 1)).toBe('2026-01-01');
    expect(dayOfYear(2028, 366)).toBe('2028-12-31');
    expect(dayOfYear(2026, 366)).toBeNull();
    expect(dayOfYear(2026, 0)).toBeNull();
  });
  it('without an issue date, puts a day more than a month ahead in last year', () => {
    expect(flightDate(326, null, new Date('2026-11-23T00:00:00Z'))).toBe('2026-11-22');
    expect(flightDate(340, null, new Date('2026-11-23T00:00:00Z'))).toBe('2026-12-06');
    expect(flightDate(326, null, new Date('2026-01-10T00:00:00Z'))).toBe('2025-11-22');
  });
});
