import { describe, expect, it } from 'vitest';
import { newsText } from '@/utils/achievements/news';

describe('newsText', () => {
  it('says nothing with no news', () => {
    expect(newsText([])).toBe('');
  });

  it('names one new badge', () => {
    expect(newsText([{ type: 'badge', key: 'continent-asia' }])).toBe('New badge: Asia.');
  });

  it('names several new badges in a list', () => {
    const news = [
      { type: 'badge', key: 'continent-asia' },
      { type: 'badge', key: 'countries-10' },
      { type: 'badge', key: 'north-pole' },
    ];
    expect(newsText(news)).toBe('New badges: Asia, Ten countries and North Pole.');
  });

  it('names goals reached, by their title or what they ask', () => {
    expect(newsText([{ type: 'goal', goal: { title: 'Our bucket list' } }])).toBe('Goal reached: Our bucket list.');
    const two = [
      { type: 'goal', goal: { title: 'Our bucket list' } },
      { type: 'goal', goal: { kind: 'COUNTRY_COUNT', target: 20 } },
    ];
    expect(newsText(two)).toBe('Goals reached: Our bucket list and 20 countries.');
  });

  it('puts the badges first, then the goals', () => {
    const news = [
      { type: 'goal', goal: { title: 'Japan' } },
      { type: 'badge', key: 'countries-1' },
    ];
    expect(newsText(news)).toBe('New badge: First country. Goal reached: Japan.');
  });

  it('ignores news of a kind it doesn’t know', () => {
    expect(newsText([{ type: 'confetti' }, { type: 'badge', key: 'photos-100' }])).toBe('New badge: 100 photos.');
  });
});
