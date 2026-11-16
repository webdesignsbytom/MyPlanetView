// The example travel offers (prisma/seed/data/offers.example.json): fictional partners and
// example.com links, imported exactly as a real offers file is (services/offers.js), so
// the ad cards and the Travel Desk have something to show in development.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importOffers } from '../../src/services/offers.js';

export const EXAMPLE_OFFERS_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'data/offers.example.json');

export async function seedExampleOffers() {
  const result = await importOffers(JSON.parse(await fs.readFile(EXAMPLE_OFFERS_FILE, 'utf8')));
  if (!result.ok) throw new Error(`Example offers are invalid: ${JSON.stringify(result.problems)}`);
  console.log(`✅ Seeded ${result.created + result.updated} example travel offers`);
}
