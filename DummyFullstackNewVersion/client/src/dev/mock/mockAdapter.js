// Mock mode only. An Axios adapter that answers every API call in the browser, from
// the routes the handler modules register. Nothing it handles ever reaches the network.
import { AxiosError } from 'axios';
import { saveStore, session } from './store';

export const MOCK_MARKER = 'MPV_MOCK_MODE_ACTIVE';
// Presigned upload URLs in mock mode point here; the adapter and the XHR patch keep the files
export const MOCK_UPLOAD_ORIGIN = 'https://mock-uploads.myplanetview.local';
const LATENCY_MS = 120;

// Responses
export const ok = (data, status = 200) => ({ status, body: { status: 'success', data } });
export const raw = (body, status = 200) => ({ status, body });
export const fail = (status, message) => ({ status, body: { status: status >= 500 ? 'error' : 'fail', message } });

// No role at all is a 404 (nothing to probe); a role that isn't enough is a 403
export const RANK = { VIEWER: 1, EDITOR: 2, OWNER: 3 };
export function deny(role, needed, notFoundMessage = 'Not found.') {
  if (!role) return fail(404, notFoundMessage);
  if (RANK[role] < RANK[needed]) return fail(403, 'You do not have permission to do that.');
  return null;
}

// Routes
const routes = [];
export function route(method, pattern, handler) {
  const keys = [];
  const regex = new RegExp(
    `^${pattern.replace(/\//g, '\\/').replace(/:([A-Za-z]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    })}$`,
  );
  routes.push({ method, regex, keys, handler });
}

// Upload storage: a file PUT to a presigned mock URL becomes a blob URL for the session
export function storeUpload(url, body) {
  const key = decodeURIComponent(new URL(url).pathname.slice(1));
  if (body instanceof Blob) {
    session.blobs.set(key, URL.createObjectURL(body));
    session.blobSizes = session.blobSizes || new Map();
    session.blobSizes.set(key, body.size);
  }
  return key;
}

const parseBody = (data) => {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockAdapter(config) {
  const method = String(config.method || 'get').toUpperCase();
  const url = new URL(config.url, config.baseURL || window.location.origin);
  let result;

  if (url.origin === MOCK_UPLOAD_ORIGIN) {
    storeUpload(url.href, config.data);
    result = raw({});
  } else {
    const found = routes.find((r) => r.method === method && r.regex.test(url.pathname));
    if (!found) {
      console.warn(`[${MOCK_MARKER}] No mock handler for ${method} ${url.pathname}`);
      result = fail(404, `Mock mode has no handler for ${method} ${url.pathname}.`);
    } else {
      const match = url.pathname.match(found.regex);
      const params = Object.fromEntries(found.keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]));
      const query = Object.fromEntries(url.searchParams.entries());
      try {
        result = await found.handler({ params, query, body: parseBody(config.data) });
      } catch (err) {
        console.error(`[${MOCK_MARKER}] Handler failed for ${method} ${url.pathname}`, err);
        result = fail(500, 'Internal Server Error.');
      }
      if (method !== 'GET') saveStore();
    }
  }

  await wait(LATENCY_MS);
  const response = { data: result.body, status: result.status, statusText: String(result.status), headers: {}, config, request: {} };
  if (result.status >= 200 && result.status < 300) return response;
  throw new AxiosError(
    result.body?.message || `Request failed with status code ${result.status}`,
    result.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    config,
    {},
    response,
  );
}
