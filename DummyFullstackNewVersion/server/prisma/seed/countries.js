// Database
import { prisma } from '../../src/prisma.js';
// Seed helpers
import { verifySeeded } from './utils.js';
import { COUNTRIES } from './data/countries.js';

export async function seedCountries() {
  await prisma.country.createMany({ data: COUNTRIES });
  await verifySeeded('country', prisma.country, COUNTRIES.length);
}
