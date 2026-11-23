import { describe, expect, it } from 'vitest';
import { DELETE_MAP, defaultChoiceFor, leavingPlanFrom } from '@/utils/plans/leaving';

const member = (userId, role, isActive = true) => ({ userId, role, isActive });

describe('defaultChoiceFor', () => {
  it('hands a map to its longest-standing active co-owner first', () => {
    const map = { members: [member('ed', 'EDITOR'), member('co1', 'CO_OWNER', false), member('co2', 'CO_OWNER')] };
    expect(defaultChoiceFor(map)).toBe('co2');
  });

  it('else to the first active editor, never a viewer', () => {
    expect(defaultChoiceFor({ members: [member('v', 'VIEWER'), member('ed1', 'EDITOR', false), member('ed2', 'EDITOR')] })).toBe('ed2');
  });

  it('else to a deactivated co-owner or editor, before deleting', () => {
    expect(defaultChoiceFor({ members: [member('ed', 'EDITOR', false), member('co', 'CO_OWNER', false)] })).toBe('co');
    expect(defaultChoiceFor({ members: [member('v', 'VIEWER')] })).toBe(DELETE_MAP);
    expect(defaultChoiceFor({ members: [] })).toBe('DELETE');
  });
});

describe('leavingPlanFrom', () => {
  it('turns the choices into the leaving plan', () => {
    const maps = [
      { id: 'm1', members: [member('a', 'EDITOR')] },
      { id: 'm2', members: [member('b', 'EDITOR')] },
      { id: 'm3', members: [] },
      { id: 'm4', members: [member('c', 'VIEWER')] },
    ];
    const choices = { m1: 'a', m2: DELETE_MAP, m3: 'someone' };
    expect(leavingPlanFrom(maps, choices, false)).toEqual({
      maps: [
        { mapId: 'm1', action: 'TRANSFER', toUserId: 'a' },
        { mapId: 'm2', action: 'DELETE' },
        { mapId: 'm3', action: 'DELETE' },
        { mapId: 'm4', action: 'DELETE' },
      ],
      leavePhotos: false,
    });
  });
});
