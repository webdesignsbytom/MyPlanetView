import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 15000,
    // The database tests have their own config (vitest.integration.config.js)
    exclude: [...configDefaults.exclude, 'tests/integration/**'],
  },
});
