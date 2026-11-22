import { afterAll, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { httpClient } from '@/api/client';
import { installMock } from '@/dev/mock/installMock';
import { mockAdapter } from '@/dev/mock/mockAdapter';
import { getMockRole } from '@/dev/mock/store';

// The badge mounts with React; nothing to see here
vi.mock('@/dev/mock/MockBadge', () => ({ default: () => null }));

const RealXHR = window.XMLHttpRequest;
afterAll(() => {
  window.XMLHttpRequest = RealXHR;
});

describe('installMock', () => {
  it('answers every request in the browser, signs the test user in and shows the badge', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    window.history.replaceState(null, '', '/?mockRole=admin');
    installMock();
    expect(httpClient.defaults.adapter).toBe(mockAdapter);
    expect(axios.defaults.adapter).toBe(mockAdapter);
    expect(window.XMLHttpRequest).not.toBe(RealXHR);
    expect(localStorage.getItem('isLoggedIn')).toBe('true');
    expect(getMockRole()).toBe('ADMIN');
    expect(document.getElementById('mock-mode-badge')).not.toBeNull();
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('MPV_MOCK_MODE_ACTIVE'));

    // The API client's requests come back from the mock's routes
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    try {
      const reply = httpClient.get('/api/maps');
      await vi.advanceTimersByTimeAsync(200);
      const { data } = await reply;
      expect(data.data.maps.length).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
      window.history.replaceState(null, '', '/');
    }
  });
});
