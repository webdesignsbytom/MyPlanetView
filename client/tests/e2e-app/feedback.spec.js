import { test, expect, SAM_MAP, SAM_SHARE_CODE, goInApp, makeJpeg, openMap, openTool, signOut, toolbar } from './fixtures.js';

// Feedback from the map (docs/API.md "Feedback"; 25 Nov 2026, the user's wish: "report a bug,
// request a feature ... simple for a non technical person ... upload a screenshot if needed ...
// the admin will need a page on the site where they can review and act on the reports"):
// the toolbar's Feedback stamp, the form, the screenshot into the (mock) private bucket, and
// the admin's page where reports are read, moved along, noted and deleted.

const kind = (panel, name) => panel.getByRole('radio', { name: new RegExp(name) });

test('someone sends a problem with a screenshot from the map, and is given its reference', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const panel = await openTool(page, 'Feedback', 'Feedback');
  await expect(panel.getByText('What’s this about?')).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Send' })).toBeDisabled();

  await kind(panel, 'Something’s not working').check();
  await panel.getByLabel('What happened?').fill('I pressed Save on my trip and nothing happened.');
  await panel.getByLabel('What did you expect to happen?').fill('The trip to be saved.');
  await panel.getByLabel('Why is it a problem for you?').fill('I had to type my notes again.');
  await panel.getByRole('radio', { name: 'It’s annoying, but I can carry on' }).check();
  await panel.locator('[data-feedback-screenshot-input]').setInputFiles(await makeJpeg(page, { name: 'screen.jpg' }));
  await expect(panel.locator('[data-feedback-preview]')).toBeVisible();
  await expect(panel.getByText('the page you’re on, your browser and the size of your screen')).toBeVisible();
  await panel.getByRole('button', { name: 'Send' }).click();

  await expect(panel.getByText('Thank you!')).toBeVisible();
  await expect(panel.locator('[data-feedback-reference]')).toHaveText(/^FB-[0-9A-F]{8}$/);
  await panel.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(panel).toBeHidden();
});

test('a question needs its words before it can be sent, and nothing more', async ({ page }) => {
  await openMap(page);
  const panel = await openTool(page, 'Feedback', 'Feedback');
  await kind(panel, 'A question').check();
  await expect(panel.getByLabel('What did you expect to happen?')).toHaveCount(0);
  await panel.getByRole('button', { name: 'Send' }).click();
  await expect(panel.getByRole('alert')).toHaveText('Please answer “What would you like to know?”');
  await panel.getByLabel('What would you like to know?').fill('How do I add my partner to my map?');
  await panel.getByRole('button', { name: 'Send' }).click();
  await expect(panel.getByText('Thank you!')).toBeVisible();
  await panel.getByRole('button', { name: 'Send another' }).click();
  await expect(kind(panel, 'An idea')).not.toBeChecked();
});

test('a share link’s visitor who isn’t signed in has no Feedback stamp', async ({ page }) => {
  // Signed out for this visit only (mock mode signs the test user in again on a reload)
  await signOut(page);
  await goInApp(page, `/shared/${SAM_SHARE_CODE}`);
  await expect(page.getByRole('application', { name: `${SAM_MAP}: world map` })).toBeVisible();
  await expect(toolbar(page).getByRole('button', { name: 'Travel statistics' })).toBeAttached();
  await expect(toolbar(page).getByRole('button', { name: 'Feedback' })).toHaveCount(0);
});

test('an admin reads a report with its screenshot, moves it along with a note, and deletes one', async ({ page }) => {
  // An admin from the start, so the report and its screenshot (this visit's) are on hand
  await openMap(page, '/map?mockRole=ADMIN');
  const panel = await openTool(page, 'Feedback', 'Feedback');
  await kind(panel, 'An idea').check();
  await panel.getByLabel('What would you like?').fill('A way to print my passport.');
  await panel.locator('[data-feedback-screenshot-input]').setInputFiles(await makeJpeg(page, { name: 'idea.jpg' }));
  await panel.getByRole('button', { name: 'Send' }).click();
  const reference = (await panel.locator('[data-feedback-reference]').textContent()).trim();
  await panel.getByRole('button', { name: 'Close', exact: true }).click();

  await goInApp(page, '/admin/feedback');
  await expect(page.getByRole('heading', { level: 1, name: 'Feedback' })).toBeVisible();
  // The seed's new problem and this one; the seed's idea is in progress and its question done
  await expect(page.locator('[data-feedback-filter="NEW"]')).toHaveText('New (2)');
  await expect(page.locator('[data-feedback-filter="ALL"]')).toHaveText('All (4)');
  await expect(page.locator('[data-feedback-item]')).toHaveCount(2);

  await page.getByRole('button', { name: `Open ${reference}` }).click();
  const dialog = page.getByRole('dialog', { name: `${reference}: An idea` });
  await expect(dialog.getByText('A way to print my passport.')).toBeVisible();
  await expect(dialog.locator('[data-feedback-screenshot]')).toBeVisible();
  expect(await dialog.locator('[data-feedback-screenshot]').evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(dialog.getByRole('link', { name: 'test@myplanetview.local' })).toHaveAttribute('href', /^mailto:test@myplanetview\.local/);

  await dialog.getByLabel('Status').selectOption('IN_PROGRESS');
  await dialog.getByLabel('Your notes').fill('On the list for the print partner.');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog.getByText('Saved.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('[data-feedback-item]')).toHaveCount(1);
  await expect(page.locator('[data-feedback-filter="IN_PROGRESS"]')).toHaveText('In progress (2)');

  await page.locator('[data-feedback-filter="IN_PROGRESS"]').click();
  await page.getByRole('button', { name: `Open ${reference}` }).click();
  await expect(dialog.getByLabel('Your notes')).toHaveValue('On the list for the print partner.');
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
  await dialog.getByRole('button', { name: 'Delete for good' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(`${reference} is deleted.`)).toBeVisible();
  await expect(page.locator('[data-feedback-filter="ALL"]')).toHaveText('All (3)');
});

test('the admin’s page is in the dashboard’s links', async ({ page }) => {
  await page.goto('/admin?mockRole=ADMIN');
  await expect(page.getByRole('heading', { level: 1, name: 'Admin Dashboard' })).toBeVisible();
  await page.getByRole('link', { name: /^Feedback/ }).first().click();
  await expect(page).toHaveURL(/\/admin\/feedback$/);
  await expect(page.locator('[data-feedback-item]').first()).toBeVisible();
});
