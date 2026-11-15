// A value kept outside React that a few components follow with useSyncExternalStore (the
// country under the pointer), so changing it re-renders only them, not the whole map page.
export function createValueStore(initial = null) {
  let value = initial;
  const listeners = new Set();
  return {
    get: () => value,
    set: (next) => {
      if (Object.is(next, value)) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
