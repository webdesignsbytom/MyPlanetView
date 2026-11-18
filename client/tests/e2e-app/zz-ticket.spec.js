import { test, openMap, openTool } from './fixtures.js';
test('ticket header', async ({ page }) => {
  await openMap(page);
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('button', { name: 'Mongolia', exact: true }).click();
  await page.waitForTimeout(900);
  await page.locator('header').filter({ hasText: 'Mongolia' }).screenshot({ path: 'C:/Users/User/AppData/Local/Temp/claude/a3821dffc12f0b31/347389ed-7562-481d-914e-97ee344c8191/scratchpad/shots/ticket-header.png' });
});
