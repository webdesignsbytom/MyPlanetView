// @vitest-environment node
// The first visit a status change brings (src/utils/map/firstVisit.js; 24 Nov 2026, the user's
// wish): a place newly marked visited or lived in is dated the day it's marked.
import { describe, expect, it } from 'vitest';
import { firstVisitFor } from '@/utils/map/firstVisit';

const TODAY = '2026-11-24';

describe('firstVisitFor', () => {
  it('dates a place newly visited or lived in today', () => {
    expect(firstVisitFor(null, 'VISITED', TODAY)).toBe(TODAY);
    expect(firstVisitFor(null, 'LIVED', TODAY)).toBe(TODAY);
    expect(firstVisitFor({ status: 'WANT_TO_GO', firstVisitedOn: null }, 'VISITED', TODAY)).toBe(TODAY);
  });

  it('keeps a date the place has', () => {
    expect(firstVisitFor({ status: 'WANT_TO_GO', firstVisitedOn: '2010-04-01' }, 'VISITED', TODAY)).toBe('2010-04-01');
    expect(firstVisitFor({ status: 'VISITED', firstVisitedOn: '2019-04-12' }, 'LIVED', TODAY)).toBe('2019-04-12');
  });

  it('dates nothing else: a wish, or a change between visited and lived in with no date', () => {
    expect(firstVisitFor(null, 'WANT_TO_GO', TODAY)).toBeUndefined();
    expect(firstVisitFor({ status: 'VISITED', firstVisitedOn: null }, 'LIVED', TODAY)).toBeUndefined();
  });

  it('takes the viewer’s own day by default', () => {
    expect(firstVisitFor(null, 'VISITED')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
