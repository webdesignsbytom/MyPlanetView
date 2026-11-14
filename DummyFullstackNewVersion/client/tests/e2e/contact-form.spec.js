import { test, expect } from '@playwright/test';

// The contact form: name, email, message and an optional screenshot
test.describe('Contact form', () => {
  test('empty submit shows validation errors and focuses the first invalid field', async ({
    page,
  }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByText('Please tell us your name')).toBeVisible();
    await expect(page.getByText('Please write a message')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /your name/i })).toBeFocused();
  });

  test('filling a field clears its own error', async ({ page }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: /send message/i }).click();
    await expect(page.getByText('Please tell us your name')).toBeVisible();

    await page.getByRole('textbox', { name: /your name/i }).fill('Test');
    await expect(page.getByText('Please tell us your name')).not.toBeVisible();
  });

  test('required fields are marked invalid for assistive tech until fixed', async ({
    page,
  }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: /send message/i }).click();

    const name = page.getByRole('textbox', { name: /your name/i });
    await expect(name).toHaveAttribute('aria-invalid', 'true');

    await name.fill('Test');
    await expect(name).toHaveAttribute('aria-invalid', 'false');
  });
});
