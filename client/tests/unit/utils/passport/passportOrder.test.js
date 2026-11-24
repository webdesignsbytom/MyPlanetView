// @vitest-environment node
// The passport's pages in the order visited (src/utils/passport/passportOrder.js; 24 Nov 2026, the
// user's wish): a copy of the server's, for the mock.
import { describe, expect, it } from 'vitest';
import * as server from '../../../../../server/src/utils/passportOrder.js';
import { earliestOf, passportPageOrder } from '@/utils/passport/passportOrder';

const ROWS = {
  GB: { entered: '1990-05-01', marked: '2026-01-01T10:00:00Z' },
  FR: { entered: new Date('2019-04-12T09:00:00Z'), marked: '2026-01-01T10:01:00Z' },
  DO: { marked: '2026-11-24T19:40:00Z' },
  JP: { entered: '2026-11-24', marked: '2026-11-24T19:55:00Z' },
  AS: { marked: '2026-11-24T19:50:00Z' },
  IE: {},
  BE: {},
};
const at = { enteredOn: (code) => ROWS[code]?.entered ?? null, markedAt: (code) => ROWS[code]?.marked ?? null };

describe('passportPageOrder', () => {
  it('orders the pages as the server does: visited, then marked, then A–Z', () => {
    const codes = ['JP', 'IE', 'DO', 'FR', 'BE', 'AS', 'GB'];
    expect(passportPageOrder(codes, at)).toEqual(['GB', 'FR', 'DO', 'AS', 'JP', 'BE', 'IE']);
    expect(passportPageOrder(codes, at)).toEqual(server.passportPageOrder(codes, at));
  });

  it('takes the earliest date as the server does', () => {
    for (const dates of [[new Date('2019-06-02'), '1990-05-01'], [null, '2019-04-12'], [undefined, null]]) {
      expect(earliestOf(...dates)).toEqual(server.earliestOf(...dates));
    }
  });
});
