// How the database limiter keys a visitor (middleware/dbRateLimit.js), and when the
// limiters are off. The counting itself is in tests/integration/rateLimits.test.js.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { clientIpKey, keyByUserId } from '../src/middleware/dbRateLimit.js';
import { rateLimitsOff } from '../src/middleware/rateLimit.js';

describe('clientIpKey', () => {
  it('keeps IPv4 as it is, and turns an IPv4-mapped address into IPv4', () => {
    expect(clientIpKey('203.0.113.7')).toBe('203.0.113.7');
    expect(clientIpKey('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });

  it('counts an IPv6 address by its /64', () => {
    const key = clientIpKey('2001:db8:1:2::1');
    expect(key).toBe('2001:db8:1:2::/64');
    expect(clientIpKey('2001:db8:1:2:ffff:ffff:ffff:ffff')).toBe(key);
    expect(clientIpKey('2001:DB8:1:2:0:0:0:9')).toBe(key);
    expect(clientIpKey('2001:db8:1:3::1')).not.toBe(key);
  });

  it('has a key without an address', () => {
    expect(clientIpKey(undefined)).toBe('unknown');
    expect(clientIpKey('')).toBe('unknown');
  });
});

describe('keyByUserId', () => {
  it('uses the user, else the IP (by /64)', () => {
    expect(keyByUserId({ user: { id: 'u1' }, ip: '203.0.113.7' })).toBe('user:u1');
    expect(keyByUserId({ ip: '2001:db8:1:2::5' })).toBe('ip:2001:db8:1:2::/64');
  });
});

describe('rateLimitsOff', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is true under test, unless a test turns the limits on', () => {
    vi.stubEnv('NODE_ENV', 'test');
    expect(rateLimitsOff()).toBe(true);
    vi.stubEnv('RATE_LIMITS_IN_TESTS', 'true');
    expect(rateLimitsOff()).toBe(false);
  });

  it('is false anywhere else', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(rateLimitsOff()).toBe(false);
  });
});
