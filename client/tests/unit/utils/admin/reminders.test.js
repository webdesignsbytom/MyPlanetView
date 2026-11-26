import { describe, expect, it } from 'vitest';
import { dueReminders } from '@/utils/admin/reminders';
import { MAGNETIC_POLES_YEAR } from '@/utils/map/specialPlaces';
import * as server from '../../../../../server/src/utils/reminders.js';
import { MAGNETIC_POLES_YEAR as SERVER_POLES_YEAR } from '../../../../../server/src/utils/specialPlaces.js';

// Mock mode's copy of the server's yearly reminders (26 Nov 2026, the user's wish)
describe('dueReminders', () => {
  it('is the server’s rule, word for word, at any date', () => {
    for (const at of ['2025-06-01', '2026-01-01', '2026-11-26', '2031-03-15']) {
      const now = new Date(`${at}T12:00:00Z`);
      expect(dueReminders(now)).toEqual(server.dueReminders(now));
      expect(dueReminders(now, { polesYear: 2030 })).toEqual(server.dueReminders(now, { polesYear: 2030 }));
    }
  });

  it('keeps the pins’ year the server keeps', () => {
    expect(MAGNETIC_POLES_YEAR).toBe(SERVER_POLES_YEAR);
  });

  it('asks for the magnetic poles to be moved from the January after their year', () => {
    expect(dueReminders(new Date('2025-12-31T23:00:00Z'), { polesYear: 2025 })).toEqual([]);
    expect(dueReminders(new Date('2026-01-01T00:00:00Z'), { polesYear: 2025 }).map((r) => r.key)).toEqual(['magneticPoles']);
  });
});
