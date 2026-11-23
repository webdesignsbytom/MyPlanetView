// @vitest-environment node
// Life's One Shots' catalogue: the client's copy is the server's, item for item.
import { describe, expect, it } from 'vitest';
import * as client from '@/utils/oneShots/oneShotItems';
import * as server from '../../../../../server/src/utils/constants/oneShots.js';

describe('the catalogue', () => {
  it('is the server’s, item for item', () => {
    expect(client.ONE_SHOTS).toEqual(server.ONE_SHOTS);
    expect(client.ONE_SHOT_LISTS).toEqual(server.ONE_SHOT_LISTS);
    expect(client.ONE_SHOT_GROUPS).toEqual(server.ONE_SHOT_GROUPS);
    expect(client.ONE_SHOT_AUTO).toEqual(server.ONE_SHOT_AUTO);
    expect(client.BIG_FIVE).toEqual(server.BIG_FIVE);
  });

  it('finds an item by its key', () => {
    expect(client.ONE_SHOT_BY_KEY.get('northern-lights').list).toBe('WONDERS');
    expect(client.isOneShotKey('erupting-volcano')).toBe(true);
    expect(client.isOneShotKey('earthquake')).toBe(false);
  });
});
