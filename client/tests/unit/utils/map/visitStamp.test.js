// @vitest-environment node
// The country list's statuses as rubber stamps (src/utils/map/visitStamp.js).
import { describe, expect, it } from 'vitest';
import { visitStampClass } from '@/utils/map/visitStamp';

const classes = (status) => visitStampClass(status).split(' ');

describe('visitStampClass', () => {
  it('makes every stamp 44 px tall, the height of the dropdown that replaces it', () => {
    for (const status of ['VISITED', 'LIVED', 'WANT_TO_GO', undefined]) expect(classes(status)).toContain('min-h-11');
  });

  it('inks visited in poster red, lived there in saddle brown, both struck at a slant', () => {
    expect(classes('VISITED')).toEqual(expect.arrayContaining(['-rotate-1', 'border-colour6', 'text-colour6']));
    expect(classes('LIVED')).toEqual(expect.arrayContaining(['-rotate-1', 'border-colour9', 'text-colour9']));
  });

  it('dashes “want to go” in ocean blue', () => {
    expect(classes('WANT_TO_GO')).toEqual(expect.arrayContaining(['-rotate-1', 'border-dashed', 'border-colour7', 'text-colour7']));
  });

  it('leaves “not yet” a faint dashed brown, straight', () => {
    const notYet = classes(undefined);
    expect(notYet).toEqual(expect.arrayContaining(['border-dashed', 'border-colour9/40', 'text-colour9']));
    expect(notYet).not.toContain('-rotate-1');
    expect(visitStampClass('SOMETHING_ELSE')).toBe(visitStampClass(undefined));
  });
});
