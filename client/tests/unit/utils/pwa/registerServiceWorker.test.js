import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from '@/utils/pwa/registerServiceWorker';

let worker;
let register;
const define = (target, name, value) => Object.defineProperty(target, name, { value, configurable: true });

beforeEach(() => {
  vi.stubEnv('PROD', true);
  worker = { postMessage: vi.fn() };
  register = vi.fn().mockResolvedValue({});
  define(navigator, 'serviceWorker', { register, ready: Promise.resolve({ active: worker }) });
  define(window, 'matchMedia', (query) => ({ matches: query === '(display-mode: standalone)' && installed, addEventListener() {}, removeEventListener() {} }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  for (const name of ['serviceWorker', 'webdriver', 'standalone', 'connection']) delete navigator[name];
  delete window.matchMedia;
  delete window.__PRERENDER__;
  delete document.readyState;
  installed = false;
});

let installed = false;
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('registerServiceWorker', () => {
  it('registers /sw.js on a production build once the page has loaded', async () => {
    registerServiceWorker();
    await settle();
    expect(register).toHaveBeenCalledWith('/sw.js');
    expect(worker.postMessage).not.toHaveBeenCalled();
  });

  it('waits for the page to load first', async () => {
    define(document, 'readyState', 'loading');
    registerServiceWorker();
    expect(register).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('load'));
    await settle();
    expect(register).toHaveBeenCalledTimes(1);
  });

  it('asks the installed app’s worker to keep the whole site', async () => {
    installed = true;
    registerServiceWorker();
    await settle();
    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'keep-site' });
  });

  it('counts an iPhone’s home-screen app as installed', async () => {
    define(navigator, 'standalone', true);
    registerServiceWorker();
    await settle();
    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'keep-site' });
  });

  it('keeps nothing extra when the device is saving data', async () => {
    installed = true;
    define(navigator, 'connection', { saveData: true });
    registerServiceWorker();
    await settle();
    expect(register).toHaveBeenCalled();
    expect(worker.postMessage).not.toHaveBeenCalled();
  });

  it('never registers in development, the pre-render, or a browser driven by tests', async () => {
    vi.stubEnv('PROD', false);
    registerServiceWorker();
    vi.stubEnv('PROD', true);
    window.__PRERENDER__ = true;
    registerServiceWorker();
    delete window.__PRERENDER__;
    define(navigator, 'webdriver', true);
    registerServiceWorker();
    await settle();
    expect(register).not.toHaveBeenCalled();
  });

  it('does nothing in a browser without service workers', () => {
    delete navigator.serviceWorker;
    expect(() => registerServiceWorker()).not.toThrow();
  });

  it('warns when the worker can’t be registered', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    register.mockRejectedValue(new Error('SecurityError'));
    registerServiceWorker();
    await settle();
    expect(warn).toHaveBeenCalledWith('[pwa] service worker not registered:', 'SecurityError');
  });
});
