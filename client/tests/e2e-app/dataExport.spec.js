import { readFile } from 'node:fs/promises';
import { test, expect, HOME_MAP } from './fixtures.js';

// "Download my data" (docs/API.md, "Your data"): the account page gathers the account, each
// map the test user owns with its photos, and their photos on other people's maps into one
// JSON file. The seeded test user owns "Charlie & Alex's travels" (src/dev/mock/seed.js).

test.describe('Your data', () => {
  test('the account page downloads everything as one JSON file', async ({ page }) => {
    await page.goto('/account');
    const card = page.getByRole('region', { name: 'Your data' });
    await expect(card.getByText(/free on every plan/)).toBeVisible();

    const [download] = await Promise.all([page.waitForEvent('download'), card.getByRole('button', { name: 'Download my data' }).click()]);
    expect(download.suggestedFilename()).toMatch(/^my-planet-view-data-\d{4}-\d{2}-\d{2}\.json$/);
    await expect(card.getByRole('alert')).toHaveText('Your data is downloading. The photo links in it work for 7 days.');

    const file = JSON.parse(await readFile(await download.path(), 'utf8'));
    expect(file).toMatchObject({
      format: 'my-planet-view-data',
      version: 1,
      account: { email: 'test@myplanetview.local', name: 'Charlie Reid' },
      plan: { inForce: { name: 'Business' } },
      mapsSharedWithYou: expect.arrayContaining([expect.objectContaining({ name: "Sam's gap year", role: 'VIEWER' })]),
    });
    const home = file.maps.find((m) => m.name === HOME_MAP);
    expect(home.countries.map((c) => c.countryCode)).toEqual(expect.arrayContaining(['GB', 'FR', 'JP']));
    expect(home.countries.find((c) => c.countryCode === 'US').notes).toBe('New York and Boston, then San Francisco');
    expect(home.trips.map((t) => t.title)).toEqual(expect.arrayContaining(['Italian summer', 'Japan in spring', 'A year off: around the world']));
    expect(home.moments.some((m) => m.title === 'Got engaged at the Eiffel Tower')).toBe(true);
    expect(home.sharedWith).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Alex Morgan', role: 'EDITOR' })]));
    // Every photo, with its details and a link to its best copy
    expect(home.photos).toHaveLength(home.photoCount);
    const eiffel = home.photos.find((p) => p.caption === 'Evening by the Seine');
    expect(eiffel).toMatchObject({ countryCode: 'FR', latitude: 48.8583, uploadedByYou: true, file: { copy: 'ORIGINAL' } });
    expect(eiffel.file.url).toBeTruthy();
  });
});
