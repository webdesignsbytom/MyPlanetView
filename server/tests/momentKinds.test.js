import { describe, it, expect } from 'vitest';
import { MOMENT_KINDS, MOMENT_KIND_LABELS, isMomentKind } from '../src/utils/constants/momentKinds.js';

describe('moment kinds', () => {
  it('has the starter list and the general kind, then the kinds added since, at the end', () => {
    expect(MOMENT_KINDS).toEqual([
      'BORN',
      'MOVED_HERE',
      'WEDDING',
      'ENGAGEMENT',
      'GRADUATED',
      'NEW_JOB',
      'MET_SOMEONE',
      'CELEBRATION',
      'SAW_OR_DID',
      // 21 Nov 2026
      'FIRST_TRIP',
      'ANNIVERSARY',
    ]);
    expect(Object.isFrozen(MOMENT_KINDS)).toBe(true);
  });

  it('labels every kind, and nothing else', () => {
    expect(Object.keys(MOMENT_KIND_LABELS).sort()).toEqual([...MOMENT_KINDS].sort());
    expect(MOMENT_KIND_LABELS.SAW_OR_DID).toBe('Something we saw or did');
  });

  it('accepts only the listed kinds, exactly as written', () => {
    for (const kind of MOMENT_KINDS) expect(isMomentKind(kind)).toBe(true);
    expect(isMomentKind('born')).toBe(false);
    expect(isMomentKind('DIVORCE')).toBe(false);
    expect(isMomentKind('')).toBe(false);
    expect(isMomentKind(null)).toBe(false);
    expect(isMomentKind(['BORN'])).toBe(false);
  });
});
