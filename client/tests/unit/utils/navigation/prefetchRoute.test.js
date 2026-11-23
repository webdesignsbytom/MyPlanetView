import { describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/navigation/lazyPages', () => ({ preloadPage: vi.fn() }));

import { preloadPage } from '@/utils/navigation/lazyPages';
import { prefetchRoute } from '@/utils/navigation/prefetchRoute';

describe('prefetchRoute', () => {
  it('preloads a page’s code once, however often it’s hovered', () => {
    prefetchRoute('/pricing');
    prefetchRoute('/pricing');
    prefetchRoute('/about');
    expect(preloadPage.mock.calls).toEqual([['/pricing'], ['/about']]);
  });

  it('does nothing without a path', () => {
    preloadPage.mockClear();
    prefetchRoute('');
    prefetchRoute(undefined);
    expect(preloadPage).not.toHaveBeenCalled();
  });
});
