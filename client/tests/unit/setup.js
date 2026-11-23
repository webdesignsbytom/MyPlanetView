import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// React Testing Library: act() warnings on, and each test starts with an empty page and storage
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// findBy… and waitFor wait up to 5 s, not 1: with all ~400 files running at once (or the e2e
// suite beside them), a lazy panel or a mocked reply could take longer than a second, and
// passing tests failed on a busy machine (22 Nov 2026)
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // a `@vitest-environment node` test has no storage
  }
});
