// The seed's wipe (prisma/seed/utils.js wipeDatabase): every table emptied in one transaction,
// each before the rows it points at, so a foreign key never stops it (a postcard points at a
// country and a landmark, and its sender goes last; 26 Nov 2026)
import { describe, expect, it, vi } from 'vitest';

const wiped = [];
vi.mock('../src/prisma.js', () => ({
  prisma: new Proxy(
    {},
    {
      get: (_, model) =>
        model === '$transaction'
          ? async (steps) => {
              wiped.push(...steps);
            }
          : { deleteMany: () => model },
    },
  ),
}));
vi.mock('../src/services/s3/mediaService.js', () => ({ deleteStoredFilesOnly: vi.fn() }));

const { wipeDatabase } = await import('../prisma/seed/utils.js');

describe('wipeDatabase', () => {
  it('empties the postcards before the countries and landmarks they point at', async () => {
    await wipeDatabase();
    const at = (model) => wiped.indexOf(model);
    expect(at('postcard')).toBeGreaterThanOrEqual(0);
    expect(at('postcard')).toBeLessThan(at('landmark'));
    expect(at('postcard')).toBeLessThan(at('country'));
    // Moments and maps before the countries too, the users last
    expect(at('moment')).toBeLessThan(at('country'));
    expect(at('travelMap')).toBeLessThan(at('country'));
    expect(at('user')).toBe(wiped.length - 1);
  });
});
