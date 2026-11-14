// End-to-end tests of the API against a real Postgres test database.
// Run: DATABASE_URL=<a migrated database whose name ends in _test> npm run test:integration
// Only S3 calls and email sending are mocked (tests/integration/setup.js).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Deliberately empty folder: Vite loads no env file for these tests
  envDir: path.join(here, 'tests/integration/no-env'),
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.js'],
    globalSetup: ['tests/integration/globalSetup.js'],
    setupFiles: ['tests/integration/setup.js'],
    // Limiters off, listen() skipped (server.js); also set when the shell says otherwise
    env: { NODE_ENV: 'test' },
    // One database: files run one after another
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
