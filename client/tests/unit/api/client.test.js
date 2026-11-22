import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import client, { apiHost, httpClient } from '@/api/client';
import { API_TIMEOUT } from '@/utils/constants/constants';

// Every request goes to this adapter instead of the network: it records the request's config
// and answers with `reply(config)` (a response, or a thrown error)
let seen = [];
let reply = () => ({ data: { data: { ok: true } }, status: 200 });
const originalAdapter = httpClient.defaults.adapter;

beforeEach(() => {
  seen = [];
  reply = () => ({ data: { data: { ok: true } }, status: 200 });
  httpClient.defaults.adapter = async (config) => {
    seen.push(config);
    const answer = await reply(config);
    return { statusText: 'OK', headers: {}, config, ...answer };
  };
});

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
});

const failWith = (status, data) => () => {
  throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', seen.at(-1), null, { status, data, headers: {}, config: seen.at(-1) });
};

describe('the API client', () => {
  it('returns the whole response, with the payload at res.data.data', async () => {
    reply = () => ({ data: { status: 'success', data: { map: { id: 'm1' } } }, status: 200 });
    const res = await client.get('/api/maps/m1');
    expect(res.status).toBe(200);
    expect(res.data.data).toEqual({ map: { id: 'm1' } });
  });

  it('sends the session cookie by default, and not when asked for no auth', async () => {
    await client.get('/api/maps');
    await client.get('/api/landmarks', false);
    expect(seen[0].withCredentials).toBe(true);
    expect(seen[1].withCredentials).toBeFalsy();
  });

  it('uses each method with its path and body', async () => {
    await client.post('/a', { one: 1 });
    await client.patch('/b', { two: 2 });
    await client.put('/c', { three: 3 });
    await client.delete('/d');
    expect(seen.map((c) => [c.method, c.url])).toEqual([
      ['post', '/a'],
      ['patch', '/b'],
      ['put', '/c'],
      ['delete', '/d'],
    ]);
    expect(JSON.parse(seen[0].data)).toEqual({ one: 1 });
    expect(JSON.parse(seen[1].data)).toEqual({ two: 2 });
    expect(JSON.parse(seen[2].data)).toEqual({ three: 3 });
    expect(seen[3].data).toBeUndefined();
  });

  it('passes a request’s own config and headers through', async () => {
    await client.get('/a', true, { headers: { 'X-Test': 'yes' }, params: { page: 2 } });
    expect(seen[0].headers.get('X-Test')).toBe('yes');
    expect(seen[0].params).toEqual({ page: 2 });
    expect(seen[0].withCredentials).toBe(true);
  });

  it('keeps withCredentials on even when a config tries to turn it off', async () => {
    await client.post('/a', {}, true, { withCredentials: false });
    expect(seen[0].withCredentials).toBe(true);
  });

  it('has the site’s timeout', async () => {
    await client.get('/a');
    expect(seen[0].timeout).toBe(API_TIMEOUT);
  });

  it('gives an error the server’s own message as friendlyMessage', async () => {
    reply = failWith(409, { status: 'error', message: 'That map is full.' });
    const err = await client.post('/a', {}).catch((e) => e);
    expect(err.friendlyMessage).toBe('That map is full.');
    expect(err.response.status).toBe(409);
  });

  it.each([
    [401, 'Unauthorized - Please check your credentials.'],
    [403, 'Forbidden - You do not have access.'],
    [404, 'Resource not found.'],
    [500, 'An unexpected server error occurred.'],
    [422, 'An unexpected server error occurred.'],
  ])('words a %i with no message from the server', async (status, words) => {
    reply = failWith(status, {});
    const err = await client.get('/a').catch((e) => e);
    expect(err.friendlyMessage).toBe(words);
  });

  it('says there was no response when the request went but nothing came back', async () => {
    reply = () => {
      throw Object.assign(new Error('Network Error'), { request: {} });
    };
    const err = await client.get('/a').catch((e) => e);
    expect(err.friendlyMessage).toBe('No response from the server. Please try again.');
  });

  it('uses the error’s own message when the request never went', async () => {
    reply = () => {
      throw new Error('Bad config');
    };
    const err = await client.get('/a').catch((e) => e);
    expect(err.friendlyMessage).toBe('Bad config');
  });
});

describe('apiHost', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('is empty when the API is on this site', () => {
    expect(apiHost).toBe('');
  });

  it('is the API’s address without its trailing slashes, and the base of every request', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com//');
    vi.resetModules();
    const fresh = await import('@/api/client');
    expect(fresh.apiHost).toBe('https://api.example.com');
    expect(fresh.httpClient.defaults.baseURL).toBe('https://api.example.com//');
  });
});
