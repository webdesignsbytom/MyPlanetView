import { mergeConfig } from 'vite';
import baseConfig from './vite.config.js';

// The dev server the travel-page tests run against (playwright.app.config.js, mock mode):
// the site's own config, with
// - a pre-bundled dependency cache of its own, so another dev server started from client/
//   at the same time can't rewrite the files this one is serving;
// - every source file transformed at start-up, so a panel or page fetched for the first
//   time mid-test doesn't wait on the transform; but not the generated map data (the
//   countries' own maps and the detailed outlines, 460 files, 10 MB), fetched one country
//   at a time and only by the tests that open one or zoom in;
// - no browser tab opened.
export default mergeConfig(baseConfig, {
  cacheDir: 'node_modules/.vite-e2e-app',
  server: {
    open: false,
    warmup: { clientFiles: ['./src/**/*.{js,jsx}', '!./src/utils/map/countryMaps/**', '!./src/utils/map/detailShapes/**'] },
  },
});
