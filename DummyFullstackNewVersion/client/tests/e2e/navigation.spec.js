import { test, expect } from '@playwright/test';

test.describe('Navbar', () => {
  test('skip-to-content link is the first focusable element and moves focus to main', async ({
    page,
  }) => {
    await page.goto('/');
    // Wait for client render (main may be zero-height)
    await page.locator('#main-content').waitFor({ state: 'attached' });
    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeFocused();

    await skipLink.click();
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('mobile menu toggle reflects open/closed state via aria-expanded', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/');

    const toggle = page.getByRole('button', { name: /toggle navigation menu/i });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('desktop dropdown (if any nav item has one) opens on click and closes on Escape', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    const dropdownTrigger = page.locator('button[aria-haspopup="true"]').first();
    const count = await dropdownTrigger.count();
    test.skip(count === 0, 'No nav items with subpages configured.');

    await expect(dropdownTrigger).toHaveAttribute('aria-expanded', 'false');
    await dropdownTrigger.click();
    await expect(dropdownTrigger).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(dropdownTrigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('current page link is marked aria-current (regression test for the broken NavLink aria-current prop)', async ({
    page,
  }) => {
    await page.goto('/faq');
    // Desktop + mobile nav both in DOM; check first match
    await expect(
      page.locator('nav a[href="/faq"][aria-current="page"]').first()
    ).toBeVisible();
  });
});
