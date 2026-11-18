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
 * postcard is switched on; `appName`: the name under the home-screen icon. `install`: how
 * this phone installs the site as an app (18 Nov 2026, the user's wish: say it can): 'prompt'
 * (the browser has offered: the tip has an Install button, `action: 'install'`), 'ios'
 * (Share, Add to Home Screen) or 'menu' (the browser's own menu).
 */
export function mapTips({ phone, touch, fullscreen, standalone, posters, appName, install = 'menu' }) {
  const tips = [];
  if (phone && !standalone) {
    const how = {
      prompt: 'Install it, and it opens from its own icon on your home screen, full screen, with no browser bars.',
      ios: 'Tap Share, then Add to Home Screen, and it opens from its own icon, full screen, with no browser bars.',
      menu: 'Open your browser’s menu and choose Install app or Add to Home screen, and it opens from its own icon, full screen, with no browser bars.',
    }[install];
    tips.push({
      id: 'install',
      title: 'Install the app',
      text: `${appName} works as an app on your phone, with no app store needed. ${how}`,
      ...(install === 'prompt' ? { action: 'install' } : {}),
    });
    // An iPhone's Safari can't go full screen: installing is the way (the tip above)
    if (fullscreen) {
      tips.push({
        id: 'fullscreen',
        title: 'Full screen',
        text: 'Open the Menu and choose Full screen: the browser’s bars go, and the map has the whole screen.',
      });
    }
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
