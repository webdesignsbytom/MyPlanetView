import { describe, expect, it } from 'vitest';
import { dueReminders, reminderAction } from '../src/utils/reminders.js';
import { MAGNETIC_POLES_YEAR } from '../src/utils/specialPlaces.js';

// The yearly chores the admins are reminded of (26 Nov 2026, the user's wish)
describe('dueReminders', () => {
  it('asks for the magnetic poles to be moved from the January after the year their pins are for', () => {
    expect(dueReminders(new Date('2025-12-31T23:59:59Z'), { polesYear: 2025 })).toEqual([]);
    const [reminder, ...rest] = dueReminders(new Date('2026-01-01T00:00:00Z'), { polesYear: 2025 });
    expect(rest).toEqual([]);
    expect(reminder).toMatchObject({ key: 'magneticPoles', title: 'Move the magnetic poles' });
    expect(reminder.text).toContain("still at 2025's positions");
    expect(reminder.text).toContain("Move them to 2026's");
    expect(reminder.text).toContain('MAGNETIC_POLES_YEAR to 2026');
    expect(reminder.text).toContain('npm run db:reference');
  });

  it('names the year it is, however many have gone by', () => {
    expect(dueReminders(new Date('2028-06-01T12:00:00Z'), { polesYear: 2025 })[0].text).toContain("Move them to 2028's");
  });

  it('goes by the year the pins are for in the code', () => {
    expect(dueReminders(new Date(Date.UTC(MAGNETIC_POLES_YEAR, 6, 1)))).toEqual([]);
    expect(dueReminders(new Date(Date.UTC(MAGNETIC_POLES_YEAR + 1, 0, 1)))).toHaveLength(1);
  });

  it('records each one under its own action', () => {
    expect(reminderAction('magneticPoles')).toBe('reminder:magneticPoles');
  });
});
