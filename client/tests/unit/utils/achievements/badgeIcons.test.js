// The icon on a badge's sticker and its share card (utils/achievements/badgeIcons.js)
import { describe, expect, it } from 'vitest';
import { FaBinoculars, FaGlobe, FaGlobeAsia, FaLandmark, FaPaw, FaSnowflake, FaUniversity } from 'react-icons/fa';
import { badgeIcon } from '@/utils/achievements/badgeIcons';

describe('badgeIcon', () => {
  it('gives a continent its globe, Antarctica a snowflake, World Heritage a temple and wildlife a paw', () => {
    expect(badgeIcon({ key: 'continent-asia', group: 'continents' })).toBe(FaGlobeAsia);
    expect(badgeIcon({ key: 'antarctica', group: 'special' })).toBe(FaSnowflake);
    expect(badgeIcon({ key: 'unesco-25', group: 'landmarks' })).toBe(FaUniversity);
    expect(badgeIcon({ key: 'big-five', group: 'oneShots' })).toBe(FaPaw);
    expect(badgeIcon({ key: 'oneshots-wildlife-10', group: 'oneShots' })).toBe(FaPaw);
  });

  it('else its group’s, and the globe for a key alone or a group it doesn’t know', () => {
    expect(badgeIcon({ key: 'landmarks-1', group: 'landmarks' })).toBe(FaLandmark);
    expect(badgeIcon({ key: 'oneshots-wonders-1', group: 'oneShots' })).toBe(FaBinoculars);
    expect(badgeIcon({ key: 'countries-10' })).toBe(FaGlobe);
    expect(badgeIcon({ key: 'something-new', group: 'new-group' })).toBe(FaGlobe);
  });
});
