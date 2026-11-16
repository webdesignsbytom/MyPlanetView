// The seed's own database connection (17 Nov 2026), set before src/prisma.js reads it (seed.js
// imports this straight after dotenv/config). The app's settings are unchanged.
// - DIRECT_DATABASE_URL, never a transaction pooler: the live test's DATABASE_URL goes
//   through PgBouncer, which the seed can't run through. Locally the two URLs are the same.
// - Transactions get 60 s instead of Prisma's 5: run from here, every query to the live
//   database is a ~140 ms round trip, and the wipe alone is some forty statements.
if (process.env.DIRECT_DATABASE_URL) process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL;
process.env.DB_TRANSACTION_TIMEOUT_MS ||= '60000';
