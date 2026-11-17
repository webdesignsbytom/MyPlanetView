// The tips the map page opens with (components/map/MapTipsDialog.jsx; 17 Nov 2026, the
// user's wish: phones can go full screen, and few would find it). They show once a visit
// while the viewer's setting `showTips` is on; the dialog's box turns it off, Settings back
// on. No imports: the e2e fixtures read the key.

// sessionStorage: the tips have shown in this visit (on any map)
export const TIPS_SHOWN_KEY = 'mpv:mapTipsShown';

/**
 * The tips for this screen, in order: [{ id, title, text }].
 * `phone`: PHONE_QUERY matches; `touch`: no pointer that hovers; `fullscreen`: the browser
 * can put the page full screen (the phone menu's "Full screen"; an iPhone's Safari can't);
 * `standalone`: the installed app, with no browser bars to hide; `posters`: the hover
 * postcard is switched on; `appName`: the name under the home-screen icon.
 */
export function mapTips({ phone, touch, fullscreen, standalone, posters, appName }) {
  const tips = [];
  if (phone && !standalone) {
    tips.push({
      id: 'fullscreen',
      title: 'Full screen',
      text: fullscreen
        ? 'Open the Menu and choose Full screen: the browser’s bars go, and the map has the whole screen.'
        : `Add ${appName} to your home screen (Share, then Add to Home Screen), and it opens without the browser’s bars.`,
    });
  }
  const press = touch ? 'Tap' : 'Click';
  const poster = touch ? 'Press and hold one to see its poster.' : 'Rest the pointer on one to see its poster.';
  tips.push({
    id: 'countries',
    title: 'Countries',
    text: `${press} a country to open its ticket: its photos, moments and landmarks.${posters ? ` ${poster}` : ''}`,
  });
  tips.push({
    id: 'moving',
    title: 'Moving around',
    text: touch ? 'Drag the map to move it, and pinch or double-tap to zoom in.' : 'Drag the map to move it, and scroll or double-click to zoom in.',
  });
  return tips;
}
