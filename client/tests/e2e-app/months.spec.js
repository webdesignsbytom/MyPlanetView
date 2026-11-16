import { test, expect } from './fixtures.js';

// "Where to go in <month>" (FEATURE-PLAN.md, "Country pages": "Where to go in <month>").
// On the dev server every month file is a draft page (with a banner, never indexed), filled
// from the country guides; links into the section wait for a checked month.

test.describe('Where to go, month by month', () => {
  test('a draft month lists the guides’ countries at their best, and the other months', async ({ page }) => {
    await page.goto('/where-to-go/january');
    await expect(page.getByRole('heading', { level: 1, name: 'Where to go in January' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('region', { name: 'January around the world' })).toContainText('height of summer');

    // From the guides: Egypt is at its best in January, with its season and a festival
    const best = page.getByRole('region', { name: 'At their best in January', exact: true });
    await expect(best.getByRole('link', { name: 'Egypt' })).toHaveAttribute('href', '/countries/egypt');
    await expect(best).toContainText('Coptic Christmas');
    await expect(page.getByRole('region', { name: 'Also good in January' }).getByRole('link').first()).toBeVisible();

    // The other months link each other (no index page); this one is named, not linked
    const months = page.getByRole('list', { name: 'Where to go, month by month' });
    await expect(months.getByText('January', { exact: true })).toHaveAttribute('aria-current', 'page');
    await months.getByRole('link', { name: 'May' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Where to go in May' })).toBeVisible();
    await expect(page).toHaveURL(/\/where-to-go\/may$/);
  });

  test('guides link only to checked months, so none yet', async ({ page }) => {
    await page.goto('/countries/japan');
    await expect(page.getByRole('heading', { level: 1, name: 'Japan' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Where to go, month by month' })).toHaveCount(0);
  });
});
