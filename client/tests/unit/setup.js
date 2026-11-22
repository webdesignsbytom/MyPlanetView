import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// React Testing Library: act() warnings on, and each test starts with an empty page and storage
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // a `@vitest-environment node` test has no storage
  }
});
