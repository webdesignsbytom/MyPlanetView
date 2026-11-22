import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/travelApi', () => ({ getSharing: vi.fn() }));

import { getSharing } from '@/api/travelApi';
import { clearPanelCache, recall } from '@/utils/data/panelCache';
import { preloadSharing, sharingKey } from '@/utils/sharing/sharingCache';
import {
  LINK_ACCESS_OPTIONS,
  MAP_SHARE_ROLE_OPTIONS,
  ROLE_LABELS,
  ROLE_WITH_ARTICLE,
  SHARE_ROLE_OPTIONS,
  canEditRole,
  canManageRole,
  coOwnerChoices,
} from '@/utils/sharing/shareRoles';

describe('shareRoles', () => {
  it('offers viewer and editor on trips, and co-owner on maps too', () => {
    expect(SHARE_ROLE_OPTIONS.map((o) => o.value)).toEqual(['VIEWER', 'EDITOR']);
    expect(MAP_SHARE_ROLE_OPTIONS.map((o) => o.value)).toEqual(['VIEWER', 'EDITOR', 'CO_OWNER']);
    expect(ROLE_LABELS.CO_OWNER).toBe('Co-owner');
    expect(ROLE_WITH_ARTICLE.EDITOR).toBe('an editor');
    expect(LINK_ACCESS_OPTIONS.map((o) => o.value)).toEqual(['RESTRICTED', 'ANYONE_WITH_LINK']);
  });

  it('lets the owner, co-owners and editors edit, and only the owner and co-owners manage', () => {
    expect(['OWNER', 'CO_OWNER', 'EDITOR', 'VIEWER', null].map(canEditRole)).toEqual([true, true, true, false, false]);
    expect(['OWNER', 'CO_OWNER', 'EDITOR', 'VIEWER', null].map(canManageRole)).toEqual([true, true, false, false, false]);
  });
});

describe('coOwnerChoices', () => {
  const travellers = [
    { id: 't1', name: 'Charlie', userId: 'u-owner' },
    { id: 't2', name: 'Alex', userId: null },
    { id: 't3', name: 'Sam', userId: null },
    { id: 't4', name: 'Jo', userId: null },
  ];

  it('offers the travellers with no login and no invite waiting, with room for one fewer than the travellers', () => {
    const sharing = {
      members: [{ role: 'CO_OWNER' }, { role: 'EDITOR' }],
      invites: [{ role: 'CO_OWNER', travellerId: 't3' }, { role: 'VIEWER', travellerId: null }],
    };
    expect(coOwnerChoices(travellers, sharing)).toEqual({
      options: [
        { value: 't2', label: 'Alex' },
        { value: 't4', label: 'Jo' },
      ],
      room: 1,
    });
  });

  it('has no room on a map for one, and copes with nothing loaded yet', () => {
    expect(coOwnerChoices([travellers[0]], null)).toEqual({ options: [], room: 0 });
    expect(coOwnerChoices()).toEqual({ options: [], room: 0 });
    expect(coOwnerChoices(travellers, { members: [{ role: 'CO_OWNER' }, { role: 'CO_OWNER' }, { role: 'CO_OWNER' }, { role: 'CO_OWNER' }] }).room).toBe(0);
  });
});

describe('sharingCache', () => {
  beforeEach(() => {
    clearPanelCache();
    getSharing.mockReset();
  });

  it('keys a map’s or trip’s sharing apart', () => {
    expect(sharingKey('maps', 'm1')).toBe('sharing:maps:m1');
    expect(sharingKey('trips', 'm1')).not.toBe(sharingKey('maps', 'm1'));
  });

  it('fetches the sharing settings once and keeps them for the dialog', async () => {
    const reply = { linkAccess: 'RESTRICTED', members: [] };
    getSharing.mockResolvedValue(reply);
    await preloadSharing('maps', 'm1');
    await preloadSharing('maps', 'm1');
    expect(getSharing).toHaveBeenCalledTimes(1);
    expect(getSharing).toHaveBeenCalledWith('maps', 'm1');
    expect(recall('sharing:maps:m1')).toEqual(reply);
  });

  it('settles without throwing when the fetch fails, keeping nothing', async () => {
    getSharing.mockRejectedValue(new Error('403'));
    await expect(preloadSharing('trips', 't1')).resolves.not.toThrow();
    expect(recall('sharing:trips:t1')).toBeNull();
  });
});
