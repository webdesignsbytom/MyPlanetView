// Imports travel offers from a JSON file (docs/API.md, "Travel offers"): `{ offers: [...] }`
// or a bare list. Each offer is created or updated by its `key`; offers not in the file are
// left alone (turn one off with "active": false). Every offer is checked first, and if any
// is wrong nothing is written. Safe on production. The user runs it:
//   npm run db:offers -- path/to/offers.json
// Env
import 'dotenv/config';
import fs from 'node:fs/promises';
// Database
import { prisma } from '../src/prisma.js';
import { importOffers } from '../src/services/offers.js';

const file = process.argv[2];
try {
  if (!file) throw new Error('Name the offers file: npm run db:offers -- path/to/offers.json');
  const result = await importOffers(JSON.parse(await fs.readFile(file, 'utf8')));
  if (!result.ok) {
    console.error('Nothing imported. Fix these offers (index counts from 0):');
    for (const p of result.problems) console.error(`  #${p.index ?? '-'} ${p.key ?? '(no key)'}: ${p.field}`);
    process.exitCode = 1;
  } else {
    console.log(`Offers: ${result.created} created, ${result.updated} updated`);
  }
} catch (err) {
  console.error('Importing offers failed:', err.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
