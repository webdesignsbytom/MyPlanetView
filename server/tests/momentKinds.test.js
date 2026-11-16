import { describe, it, expect } from 'vitest';
import { MOMENT_KINDS, MOMENT_KIND_LABELS, isMomentKind } from '../src/utils/constants/momentKinds.js';

describe('moment kinds', () => {
  it('has the starter list, ending on the general kind', () => {
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
