// The mock's copy of the strings' rules (src/dev/mock/mapStrings.js) gives the server's answers
import { describe, expect, it } from 'vitest';
import * as mock from '@/dev/mock/mapStrings';
import * as server from '../../../../../server/src/utils/mapStrings.js';

describe('the mock’s strings rules, against the server’s', () => {
  it('holds as many a map', () => {
    expect(mock.MAP_STRINGS_MAX).toBe(server.MAP_STRINGS_MAX);
  });

  it('pairs and places alike', () => {
    for (const [a, b] of [
      ['JP', 'FR'],
      ['FR', 'FR'],
      ['FR', null],
    ]) {
      expect(mock.stringPair(a, b)).toEqual(server.stringPair(a, b));
    }
    for (const code of ['XC', 'GB', 'XH', 'XN', 'FR']) {
      for (const splitUk of [true, false]) expect(mock.stringPlace(code, splitUk)).toBe(server.stringPlace(code, splitUk));
    }
  });

  it('reads a tie alike, with the server’s words for a refusal', () => {
    const words = { stringInvalid: mock.STRING_MESSAGES.stringInvalid, stringSamePlace: mock.STRING_MESSAGES.stringSamePlace };
    for (const body of [{ from: 'jp', to: 'FR' }, { from: 'XE', to: 'XC' }, { from: 'FR', to: 'FR' }, { from: 'FRA', to: 'JP' }, null]) {
      for (const splitUk of [true, false]) {
        const theirs = server.parseStringInput(body, { splitUk });
        const ours = mock.parseStringInput(body, { splitUk });
        expect(ours).toEqual(theirs.ok ? theirs : { ok: false, message: words[theirs.message] });
      }
    }
  });

  it('suggests the same strings from the same travels', () => {
    const input = {
      trips: [
        { status: 'COMPLETED', startDate: '2024-05-01', countryCodes: ['ES', 'PT'] },
        { status: 'COMPLETED', startDate: '2019-06-01', countryCodes: ['FR', 'IT', 'IT', 'GR'] },
        { status: 'PLANNED', startDate: '2027-01-01', countryCodes: ['JP', 'KR'] },
        { status: 'ACTIVE', startDate: '2026-11-01', countryCodes: ['XE', 'XC'] },
      ],
      visits: [
        { countryCode: 'BR', status: 'VISITED', firstVisitedOn: null, createdAt: '2026-01-01' },
        { countryCode: 'JP', status: 'LIVED', firstVisitedOn: '2010-03-01', createdAt: '2026-01-01' },
        { countryCode: 'AU', status: 'VISITED', firstVisitedOn: '2015-01-01', createdAt: '2026-01-01' },
        { countryCode: 'PE', status: 'WANT_TO_GO', firstVisitedOn: null, createdAt: '2026-01-01' },
      ],
    };
    for (const splitUk of [true, false]) {
      expect(mock.autoStringPairs({ ...input, splitUk })).toEqual(server.autoStringPairs({ ...input, splitUk }));
    }
  });

  it('shows a string as the reply does', () => {
    expect(mock.stringView({ id: 's1', mapId: 'm', from: 'FR', to: 'JP', createdAt: 'x' })).toEqual({ id: 's1', from: 'FR', to: 'JP' });
  });
});
