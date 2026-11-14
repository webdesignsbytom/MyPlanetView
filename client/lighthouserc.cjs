// URLs from generate-lighthouse-urls.mjs (live preview, not staticDistDir)
const urls = require('./.lighthouse-urls.json');

// Thresholds from Project_Recap.md baseline
module.exports = {
  ci: {
    collect: {
      url: urls,
      numberOfRuns: 1,
      startServerCommand: 'npm run preview -- --port 4174',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      settings: {
        // Needed in CI containers and some Windows setups
        chromeFlags: '--no-sandbox',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
