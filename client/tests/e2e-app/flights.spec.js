import { createRequire } from 'node:module';
import { test, expect, openMap, openTool } from './fixtures.js';

// The flight log (23 Nov 2026, the user's wish: scan a boarding pass and the trip and its countries
// fill in; flights, airports and distance flown to collect, like the passport's stamps). The seed
// logs every demo trip's flights (data/demoTravels.js): 26, from 26 airports, the Italian summer's
// two among them (LHR to Rome, Pisa to Gatwick).

const require = createRequire(import.meta.url);
const { BarcodeFormat, QRCodeWriter } = require('@zxing/library');

// A boarding pass's barcode text (IATA's format): London Heathrow to New York, BA 117, on day 152
// (1 June); and Gatwick to Reykjavik on day 200 (19 July), for the picture
const PASS_TO_NEW_YORK = 'M1DOE/JANE MRS        EABC123 LHRJFKBA 0117 152Y012A0001 100';
const PASS_TO_ICELAND = 'M1DOE/JANE MRS        EXYZ789 LGWKEFU2 8073 200Y014C0002 100';

async function openFlightLog(page) {
  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  await stats.getByRole('button', { name: 'Flight log' }).click();
  const dialog = page.getByRole('dialog', { name: 'Flight log' });
  await expect(dialog.locator('[data-flight-totals]')).toBeVisible();
  return dialog;
}

// The pass's text as a QR code picture (phone wallets' passes are Aztec or QR codes), drawn by the
// browser from ZXing's matrix
async function qrPicture(page, text) {
  const matrix = new QRCodeWriter().encode(text, BarcodeFormat.QR_CODE, 360, 360, new Map());
  const rows = Array.from({ length: matrix.getHeight() }, (_, y) => Array.from({ length: matrix.getWidth() }, (_, x) => (matrix.get(x, y) ? '1' : '0')).join(''));
  const dataUrl = await page.evaluate((lines) => {
    const canvas = document.createElement('canvas');
    canvas.width = lines[0].length + 40;
    canvas.height = lines.length + 40;
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'black';
    lines.forEach((line, y) => [...line].forEach((bit, x) => bit === '1' && context.fillRect(x + 20, y + 20, 1, 1)));
    return canvas.toDataURL('image/png');
  }, rows);
  return { name: 'boarding-pass.png', mimeType: 'image/png', buffer: Buffer.from(dataUrl.split(',')[1], 'base64') };
}

test('the flight log shows the flights, the distance and the airports collected', async ({ page }) => {
  await openMap(page);
  const dialog = await openFlightLog(page);
  await expect(dialog.locator('[data-flight-totals]')).toContainText('91,175 km (56,654 miles)');
  // What that's like (24 Nov 2026)
  await expect(dialog.locator('[data-flight-totals]')).toContainText('About two and a half times round the world');
  await expect(dialog.locator('[data-airport-stamps] li')).toHaveCount(26);
  await expect(dialog.locator('[data-flight="LHR-FCO"]')).toContainText('LHR → FCO · BA 548');
  await expect(dialog.locator('[data-flight="PSA-LGW"]')).toContainText('Pisa (PI) to London');
});

test('a pasted boarding pass makes the trip, logs the flight and marks the country', async ({ page }) => {
  await openMap(page);
  const dialog = await openFlightLog(page);
  await dialog.getByRole('button', { name: 'Scan a boarding pass' }).click();
  await dialog.getByRole('textbox', { name: /The barcode’s text/ }).fill(PASS_TO_NEW_YORK);
  await dialog.getByRole('button', { name: 'Read it' }).click();

  const confirm = dialog.locator('[data-flight-confirm]');
  await expect(confirm.locator('[data-flight-leg]')).toContainText('London (LHR) → New York (JFK) · BA 117');
  await expect(confirm.getByRole('checkbox', { name: /United States/ })).toBeChecked();
  await expect(confirm.getByRole('combobox', { name: 'The trip it was part of' })).toHaveValue('new');
  await expect(confirm.getByRole('textbox', { name: 'Its title' })).toHaveValue('Trip to New York');
  await confirm.getByRole('button', { name: 'Save to my flight log' }).click();

  await expect(dialog.getByRole('status').filter({ hasText: '1 flight added' })).toBeVisible();
  await expect(dialog.locator('[data-flight="LHR-JFK"]')).toBeVisible();
  // Heathrow and JFK were collected already (Rome in 2025, New York in 2014)
  await expect(dialog.locator('[data-airport-stamps] li')).toHaveCount(26);
  await page.keyboard.press('Escape');

  // The trip is there, done, with New York as its stop; the US is on the map
  const trips = await openTool(page, 'Trips', 'Trips');
  await expect(trips.getByRole('link', { name: /Trip to New York/ })).toBeVisible();
  await trips.getByRole('button', { name: /^Close/ }).first().click();
  const list = await openTool(page, 'Country list', 'Countries');
  await expect(list.getByRole('button', { name: 'Status for United States: Visited' })).toBeVisible();

  // The same pass again adds nothing
  const again = await openFlightLog(page);
  await again.getByRole('button', { name: 'Scan a boarding pass' }).click();
  await again.getByRole('textbox', { name: /The barcode’s text/ }).fill(PASS_TO_NEW_YORK);
  await again.getByRole('button', { name: 'Read it' }).click();
  await again.getByRole('combobox', { name: 'The trip it was part of' }).selectOption({ label: 'Not part of a trip' });
  await again.getByRole('button', { name: 'Save to my flight log' }).click();
  await expect(again.getByRole('status').filter({ hasText: 'Those flights were already in your log' })).toBeVisible();
});

test('a picture of a boarding pass’s barcode is read in the browser', async ({ page }) => {
  await openMap(page);
  const dialog = await openFlightLog(page);
  await dialog.getByRole('button', { name: 'Scan a boarding pass' }).click();
  await dialog.locator('[data-boarding-pass-file]').setInputFiles(await qrPicture(page, PASS_TO_ICELAND));
  const confirm = dialog.locator('[data-flight-confirm]');
  await expect(confirm.locator('[data-flight-leg]')).toContainText('London (LGW) → Reykjavík (KEF) · U2 8073', { timeout: 20_000 });
  await expect(confirm.getByRole('checkbox', { name: /Iceland/ })).toBeChecked();
});

test('a typed flight needs real airports and a day', async ({ page }) => {
  await openMap(page);
  const dialog = await openFlightLog(page);
  await dialog.getByRole('button', { name: 'Scan a boarding pass' }).click();
  await dialog.getByRole('textbox', { name: 'From (airport code)' }).fill('LHR');
  await dialog.getByRole('textbox', { name: 'To (airport code)' }).fill('ZZZ');
  await dialog.getByRole('button', { name: 'Add this flight' }).click();
  await expect(dialog.getByText('Give two different airports by their three-letter codes, such as LHR and JFK.')).toBeVisible();
  await dialog.getByRole('textbox', { name: 'To (airport code)' }).fill('CDG');
  await dialog.getByLabel('Day', { exact: true }).fill('2024-05-04');
  await dialog.getByRole('button', { name: 'Add this flight' }).click();
  await expect(dialog.locator('[data-flight-leg]')).toContainText('London (LHR) → Paris');
});

// 24 Nov 2026, the user's wish: the trips panel's two buttons half the panel's gap apart
test('the trips panel keeps its two buttons close together', async ({ page }) => {
  await openMap(page);
  const trips = await openTool(page, 'Trips', 'Trips');
  const plan = await trips.getByRole('button', { name: 'Plan a new trip' }).boundingBox();
  const scan = await trips.getByRole('button', { name: 'Scan a boarding pass' }).boundingBox();
  const firstTrip = await trips.getByRole('listitem').first().boundingBox();
  const between = scan.y - (plan.y + plan.height);
  const below = firstTrip.y - (scan.y + scan.height);
  expect(between).toBeCloseTo(8, 0);
  expect(below).toBeCloseTo(16, 0);
});
