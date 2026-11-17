import { useCallback, useEffect, useState } from 'react';

/**
 * The whole page full screen (17 Nov 2026, the user's wish: a phone on its side lost a third
 * of its height to the browser's bars). `supported` is false until an effect has checked the
 * browser (so the first render is the same everywhere), and stays false where pages can't go
 * full screen: an iPhone's Safari can't (an iPad's can). `active` follows the browser, so
 * leaving with the phone's back gesture shows too.
 */
function useFullscreen() {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) return undefined;
    setSupported(true);
    const onChange = () => setActive(document.fullscreenElement === document.documentElement);
    onChange();
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
  }, []);

  return { supported, active, toggle };
}

export default useFullscreen;
