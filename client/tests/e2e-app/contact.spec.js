import { test, expect, goInApp, signOut } from './fixtures.js';

// The contact form (components/forms/ContactForm.jsx): checked as the server checks it, sent
// with no account needed, and listed on the admin's contact forms page (mock mode keeps it in
// its store: handlers/admin.js).

async function fillContact(page, { name = 'Robin Hart', email = 'robin@example.test', message = 'Could the map show the Faroe Islands apart?' } = {}) {
  await page.getByRole('textbox', { name: /^Your name/ }).fill(name);
  await page.getByRole('textbox', { name: /^Email/ }).fill(email);
  await page.getByRole('textbox', { name: /^Your message/ }).fill(message);
}

test.describe('The contact form', () => {
  test('a message is checked, sent, and reaches the admin’s list', { tag: '@phone' }, async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('heading', { level: 1, name: 'Contact us' })).toBeVisible();
    const send = page.getByRole('button', { name: 'Send message' });

    // Spaces alone are no name or message, as the server cleans them away
    await fillContact(page, { name: '   ', email: 'robin@example', message: '  ' });
    await send.click();
    await expect(page.getByText('Please tell us your name')).toBeVisible();
    await expect(page.getByText('Please enter a full email address, like name@example.com')).toBeVisible();
    await expect(page.getByText('Please write a message')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^Your name/ })).toBeFocused();

    await fillContact(page);
    await send.click();
    await expect(page.getByRole('alert').filter({ hasText: 'Thanks, your message is on its way. We will reply by email.' })).toBeFocused();
    await expect(page.getByRole('textbox', { name: /^Your message/ })).toHaveValue('');

    await page.goto('/admin/contact-forms?mockRole=ADMIN');
    const sent = page.getByRole('article', { name: 'Contact form submission from Robin Hart' });
    await expect(sent).toContainText('Could the map show the Faroe Islands apart?');
    await expect(sent.getByRole('link', { name: 'Email Robin Hart' })).toHaveAttribute('href', 'mailto:robin@example.test');
  });

  test('someone signed out can send one too', async ({ page }) => {
    await signOut(page);
    await goInApp(page, '/contact');
    await expect(page.getByRole('heading', { level: 1, name: 'Contact us' })).toBeVisible();
    await fillContact(page, { name: 'Sky Doe', email: 'sky@example.test', message: 'Is there an app for tablets?' });
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Thanks, your message is on its way.' })).toBeVisible();
  });
});
