import { test, expect } from './fixtures.js';

// "Where to go in <month>" (FEATURE-PLAN.md, "Country pages": "Where to go in <month>"), filled
// from the country guides. Every month is checked since 26 Nov 2026 (the audit), so each is
// indexed, and the guides and the country index link to them.

test.describe('Where to go, month by month', () => {
  test('a month lists the guides’ countries at their best, and the other months', async ({ page }) => {
    await page.goto('/where-to-go/january');
    await expect(page.getByRole('heading', { level: 1, name: 'Where to go in January' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index/);
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

  test('a guide links to its best months, and the country index to every month', async ({ page }) => {
    await page.goto('/countries/japan');
    await expect(page.getByRole('heading', { level: 1, name: 'Japan' })).toBeVisible();
    const months = page.getByRole('navigation', { name: 'Where to go, month by month' });
    await expect(months.getByRole('link')).toHaveText(['March', 'April', 'May', 'October', 'November']);
    await months.getByRole('link', { name: 'October' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Where to go in October' })).toBeVisible();

    await page.goto('/countries');
    await expect(page.getByRole('navigation', { name: 'Where to go, month by month' }).getByRole('link')).toHaveCount(12);
  });
});
