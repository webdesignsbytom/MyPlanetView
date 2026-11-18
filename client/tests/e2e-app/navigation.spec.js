import { test, expect } from './fixtures.js';

// Back and forward return to where a page was scrolled (hooks/FocusMainOnRouteChange.js,
// 17 Nov 2026, the audit: they always landed at the top); a link still opens the next page
// at its top.
test.describe('Back and forward', () => {
  test('return to where the page was scrolled, once it has drawn', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // The page as it settles (fonts, pictures): scrolled before then, it could only go part of the way
    await page.evaluate(() => document.fonts.ready);
    let height = 0;
    await expect
      .poll(async () => {
        const now = await page.evaluate(() => document.documentElement.scrollHeight);
        const settled = now === height;
        height = now;
        return settled;
      })
      .toBe(true);

    // Well down the page (or as far as it goes)
    const scrolled = await page.evaluate(() => {
      window.scrollTo(0, Math.min(1200, document.documentElement.scrollHeight - window.innerHeight));
      return window.scrollY;
    });
    expect(scrolled).toBeGreaterThan(300);

    // Followed from inside the page, as a person's click would be: Playwright's own click
    // scrolls the link into view first
    await page
      .getByRole('navigation')
      .getByRole('link', { name: 'About', exact: true })
      .first()
      .evaluate((link) => link.click());
    await expect(page).toHaveURL(/\/about$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

    await page.goBack();
    await expect(page).toHaveURL(/\/faq$/);
    // Where it was, give or take the browser's scroll anchoring keeping the same words in view
    await expect.poll(() => page.evaluate((y) => Math.abs(window.scrollY - y), scrolled)).toBeLessThanOrEqual(40);

    await page.goForward();
    await expect(page).toHaveURL(/\/about$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });
});
