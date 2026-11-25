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

  it('tells a computer about countries, their own maps, moving around and the tools, by mouse', () => {
    expect(ids({ phone: false, touch: false })).toEqual(['countries', 'countryMap', 'moving', 'tools']);
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
    expect(ids({ phone: true, touch: true, fullscreen: true })).toEqual(['install', 'fullscreen', 'countries', 'countryMap', 'moving', 'tools']);
    // An iPhone's Safari can't go full screen: installing is the way
    expect(ids({ phone: true, touch: true, fullscreen: false })).toEqual(['install', 'countries', 'countryMap', 'moving', 'tools']);
  });

  it('points to the Menu on a phone and the stamps elsewhere, and says Settings opens these again', () => {
    expect(tip({ phone: true }, 'tools').text).toMatch(/^Every tool is in the Menu at the top right/);
    expect(tip({ phone: false }, 'tools').text).toMatch(/^The stamps at the top right are the map’s tools/);
    // The tips' own stamp went on 24 Nov 2026 (the user's wish): Settings has them
    expect(tip({ phone: true }, 'tools').text).toContain('Settings, in there too, brings these tips back any time');
    expect(tip({ phone: false }, 'tools').text).toContain('Settings, near the bottom, brings these tips back any time');
  });

  it('ends with sharing, no app or account needed, only for those who can share the map', () => {
    expect(ids({ share: true }).at(-1)).toBe('share');
    expect(tip({ share: true }, 'share').text).toContain('no app to install and no account needed');
    expect(ids({ share: false })).not.toContain('share');
    expect(ids({})).not.toContain('share');
  });

  // 25 Nov 2026, the user's wish: a page on how the places been to can show, for those who choose it
  it('says the places been to can show as a colour, after the countries, only for the owner and co-owners', () => {
    expect(ids({ design: true }).slice(0, 2)).toEqual(['countries', 'visitedLook']);
    const words = tip({ design: true }, 'visitedLook');
    expect(words.title).toBe('Where you’ve been');
    expect(words.text).toContain('fill them all with one colour of your choosing instead, or have both');
    expect(words.text).toContain('In Settings, under This map’s design');
    expect(ids({ design: false })).not.toContain('visitedLook');
    expect(ids({})).not.toContain('visitedLook');
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
    expect(ids({ phone: true, touch: true, fullscreen: true, standalone: true })).toEqual(['countries', 'countryMap', 'moving', 'tools']);
  });

  it('gives every tip a title and some words', () => {
    for (const t of mapTips({ phone: true, touch: true, fullscreen: true, posters: true, share: true, design: true, appName: 'X' })) {
      expect(t.title).toBeTruthy();
      expect(t.text).toBeTruthy();
    }
  });
});
