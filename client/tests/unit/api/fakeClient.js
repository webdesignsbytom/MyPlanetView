import { vi } from 'vitest';

// A stand-in for src/api/client.js's default export, for the API wrappers' tests: every
// method answers `{ data: { data: payload } }` as the real client does (the whole response),
// with `payload` set by `answerWith`. Each test file makes one with vi.hoisted and mocks
// '@/api/client' with it.
export function makeFakeClient() {
  const state = { payload: { ok: true } };
  const answer = () => Promise.resolve({ data: { data: state.payload } });
  const fake = {
    get: vi.fn(answer),
    post: vi.fn(answer),
    patch: vi.fn(answer),
    put: vi.fn(answer),
    delete: vi.fn(answer),
    answerWith(payload) {
      state.payload = payload;
    },
    reset() {
      state.payload = { ok: true };
      for (const method of ['get', 'post', 'patch', 'put', 'delete']) {
        fake[method].mockReset();
        fake[method].mockImplementation(answer);
      }
    },
  };
  return fake;
}
