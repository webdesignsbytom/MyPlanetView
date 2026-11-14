// Pages
import { preloadPage } from './lazyPages';

// Cache to avoid duplicate imports
const prefetched = new Set();

// Prefetch a lazy route chunk on hover (eager or param routes do nothing)
export function prefetchRoute(path) {
  if (!path || prefetched.has(path)) return;
  prefetched.add(path);
  preloadPage(path);
}
