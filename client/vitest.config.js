import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
// The country guides and month pages as virtual modules, as the site has them
import { countryPagesPlugin } from './scripts/country-pages.mjs';
import { monthPagesPlugin } from './scripts/month-pages.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

// The client's unit tests (npm run test:unit): tests/unit/**, mirroring src/. jsdom by
// default (storage, the DOM, React hooks and components); a test that wants plain Node says
// so in a `@vitest-environment node` comment. `envDir` is a folder with no env file in it, so
// running the tests never reads one (CLAUDE.md, the env-file rule).
export default defineConfig({
  plugins: [react(), countryPagesPlugin(), monthPagesPlugin()],
  envDir: path.resolve(here, 'tests/unit/no-env'),
  define: { __BUILD_YEAR__: JSON.stringify(2026) },
  resolve: { alias: { '@': path.resolve(here, './src') } },
  test: {
    include: ['tests/unit/**/*.test.{js,jsx}'],
    environment: 'jsdom',
    setupFiles: ['tests/unit/setup.js'],
    restoreMocks: true,
    unstubGlobals: true,
    // Room for the 5 s waits in setup.js on a busy machine
    testTimeout: 15000,
  },
});
