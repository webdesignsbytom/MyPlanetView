// @vitest-environment node
// The supporter badge (src/utils/plans/supporterBadge.js; 24 Nov 2026, the user's wish): a
// paying member's plan on the banner of their maps, on unless they turn it off.
import { describe, expect, it } from 'vitest';
import * as server from '../../../../../server/src/utils/supporterBadge.js';
import { shownSupporter, supporterBadge, supporterClass, supporterCover, supporterLinkLabel, supporterWords } from '@/utils/plans/supporterBadge';

const FIRST = { plan: 'PREMIUM', name: 'First Class', shown: true };

describe('supporterBadge (the server’s rule, for the mock)', () => {
  it('answers as the server does', () => {
    const cases = [
      { accountPlan: 'PREMIUM', ownerSettings: null, role: 'VIEWER' },
      { accountPlan: 'REGULAR', ownerSettings: {}, role: 'EDITOR' },
      { accountPlan: 'FREE', ownerSettings: null, role: 'OWNER' },
      { accountPlan: undefined, ownerSettings: null, role: 'VIEWER' },
      { accountPlan: 'PREMIUM', ownerSettings: { showSupporterBadge: false }, role: 'VIEWER' },
      { accountPlan: 'PREMIUM', ownerSettings: { showSupporterBadge: false }, role: 'OWNER' },
      { accountPlan: 'REGULAR', ownerSettings: 'off', role: 'CO_OWNER' },
    ];
    for (const input of cases) expect(supporterBadge(input)).toEqual(server.supporterBadge(input));
  });
});

describe('shownSupporter', () => {
  it('is nothing for a map whose owner doesn’t pay', () => {
    expect(shownSupporter({ role: 'VIEWER', supporter: null }, {})).toBeNull();
    expect(shownSupporter(null, {})).toBeNull();
    expect(shownSupporter({ role: 'VIEWER', supporter: { plan: 'FREE', shown: true } }, {})).toBeNull();
  });

  it('on the owner’s own map, follows their switch as it is now', () => {
    const map = { role: 'OWNER', supporter: { ...FIRST, shown: false } };
    expect(shownSupporter(map, { showSupporterBadge: true })).toBe(map.supporter);
    expect(shownSupporter(map, { showSupporterBadge: false })).toBeNull();
    // On unless turned off
    expect(shownSupporter(map, {})).toBe(map.supporter);
    // The page's role, when it gives one, over the reply's
    expect(shownSupporter({ supporter: map.supporter }, { showSupporterBadge: false }, { role: 'OWNER' })).toBeNull();
    expect(shownSupporter(map, { showSupporterBadge: true }, { role: 'VIEWER' })).toBeNull();
  });

  it('for anyone else, and through a share link, is what the server says', () => {
    expect(shownSupporter({ role: 'VIEWER', supporter: FIRST }, { showSupporterBadge: false })).toEqual(FIRST);
    expect(shownSupporter({ role: 'EDITOR', supporter: { ...FIRST, shown: false } }, {})).toBeNull();
    // The owner opening their own share link sees it as everyone does
    expect(shownSupporter({ role: 'OWNER', supporter: { ...FIRST, shown: false } }, { showSupporterBadge: true }, { shareCode: 'ABCD' })).toBeNull();
  });
});

describe('its words and look', () => {
  it('says the plan as a class of travel, and where its link goes', () => {
    expect(supporterWords(FIRST)).toBe('First Class member');
    // "Business Class", never "Business member" (25 Nov 2026, the user's wish)
    expect(supporterWords({ plan: 'REGULAR' })).toBe('Business Class member');
    expect(supporterClass({ plan: 'REGULAR' })).toBe('Business Class');
    expect(supporterClass(FIRST)).toBe('First Class');
    expect(supporterLinkLabel(FIRST)).toBe('First Class member. About our plans (opens in a new tab)');
  });

  it('is cut from the plan’s passport cover', () => {
    expect(supporterCover(FIRST)).toBe('passport-first');
    expect(supporterCover({ plan: 'REGULAR' })).toBe('passport-business');
  });
});
