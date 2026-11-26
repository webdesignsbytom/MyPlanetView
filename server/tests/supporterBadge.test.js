import { describe, expect, it } from 'vitest';
import { supporterBadge } from '../src/utils/supporterBadge.js';

// The supporter badge (docs/API.md "The supporter badge"; 24 Nov 2026, the user's wish): the
// owner's paid plan on the banner of their maps, on unless they turn it off.
describe('supporterBadge', () => {
  it('is the owner’s paid plan, with its name, shown to everyone by default', () => {
    expect(supporterBadge({ accountPlan: 'PREMIUM', ownerSettings: null, role: 'VIEWER' })).toEqual({ plan: 'PREMIUM', name: 'First Class', shown: true });
    expect(supporterBadge({ accountPlan: 'REGULAR', ownerSettings: { showGrid: false }, role: 'EDITOR' })).toEqual({ plan: 'REGULAR', name: 'Business', shown: true });
  });

  it('is nothing for an owner on Economy, or a map with no plan found', () => {
    expect(supporterBadge({ accountPlan: 'FREE', ownerSettings: null, role: 'OWNER' })).toBeNull();
    expect(supporterBadge({ accountPlan: undefined, ownerSettings: null, role: 'VIEWER' })).toBeNull();
  });

  it('turned off, is hidden from everyone but the owner, who sees it as not shown', () => {
    const off = { showSupporterBadge: false };
    expect(supporterBadge({ accountPlan: 'PREMIUM', ownerSettings: off, role: 'VIEWER' })).toBeNull();
    expect(supporterBadge({ accountPlan: 'PREMIUM', ownerSettings: off, role: 'CO_OWNER' })).toBeNull();
    expect(supporterBadge({ accountPlan: 'PREMIUM', ownerSettings: off, role: 'OWNER' })).toEqual({ plan: 'PREMIUM', name: 'First Class', shown: false });
  });

  it('reads settings that aren’t an object as none, so on', () => {
    expect(supporterBadge({ accountPlan: 'REGULAR', ownerSettings: 'off', role: 'VIEWER' })?.shown).toBe(true);
    expect(supporterBadge({ accountPlan: 'REGULAR', ownerSettings: { showSupporterBadge: 'no' }, role: 'VIEWER' })?.shown).toBe(true);
  });
});
