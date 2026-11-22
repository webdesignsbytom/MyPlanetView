// @vitest-environment node
// The tips the map opens with (src/utils/map/mapTips.js): which suit the screen, in order.
import { describe, expect, it } from 'vitest';
import { TIPS_SHOWN_KEY, mapTips } from '@/utils/map/mapTips';

const ids = (screen) => mapTips({ appName: 'My Planet View', ...screen }).map((tip) => tip.id);
const tip = (screen, id) => mapTips({ appName: 'My Planet View', ...screen }).find((t) => t.id === id);

describe('mapTips', () => {
  it('keeps whether they’ve shown in this visit under one key', () => {
    expect(TIPS_SHOWN_KEY).toBe('mpv:mapTipsShown');
  });

  it('tells a computer about countries and moving around, by mouse', () => {
    expect(ids({ phone: false, touch: false })).toEqual(['countries', 'moving']);
    expect(tip({ touch: false }, 'countries').text).toMatch(/^Click a country/);
    expect(tip({ touch: false }, 'moving').text).toContain('scroll or double-click');
  });

  it('tells a touch screen to tap, pinch and double-tap', () => {
    expect(tip({ touch: true }, 'countries').text).toMatch(/^Tap a country/);
    expect(tip({ touch: true }, 'moving').text).toContain('pinch or double-tap');
  });

  it('mentions the posters only while the hover postcard is on, in the screen’s words', () => {
    expect(tip({ touch: false, posters: false }, 'countries').text).not.toContain('poster');
    expect(tip({ touch: false, posters: true }, 'countries').text).toContain('Rest the pointer on one to see its poster.');
    expect(tip({ touch: true, posters: true }, 'countries').text).toContain('Press and hold one to see its poster.');
  });

  it('starts a phone with installing the app, then full screen where it can', () => {
    expect(ids({ phone: true, touch: true, fullscreen: true })).toEqual(['install', 'fullscreen', 'countries', 'moving']);
    // An iPhone's Safari can't go full screen: installing is the way
    expect(ids({ phone: true, touch: true, fullscreen: false })).toEqual(['install', 'countries', 'moving']);
  });

  it('says how this phone installs it, with a button only where the browser has offered', () => {
    const prompt = tip({ phone: true, install: 'prompt' }, 'install');
    expect(prompt.action).toBe('install');
    expect(prompt.text).toMatch(/^My Planet View works as an app on your phone/);
    expect(tip({ phone: true, install: 'ios' }, 'install').text).toContain('Tap Share, then Add to Home Screen');
    expect(tip({ phone: true, install: 'ios' }, 'install')).not.toHaveProperty('action');
    expect(tip({ phone: true }, 'install').text).toContain('Open your browser’s menu');
  });

  it('says nothing of installing or full screen in the installed app', () => {
    expect(ids({ phone: true, touch: true, fullscreen: true, standalone: true })).toEqual(['countries', 'moving']);
  });

  it('gives every tip a title and some words', () => {
    for (const t of mapTips({ phone: true, touch: true, fullscreen: true, posters: true, appName: 'X' })) {
      expect(t.title).toBeTruthy();
      expect(t.text).toBeTruthy();
    }
  });
});
