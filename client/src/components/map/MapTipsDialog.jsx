import React, { useEffect, useId, useState, useSyncExternalStore } from 'react';
// Icons
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
// Hooks
import useMediaQuery from '@/hooks/useMediaQuery';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import CheckboxInput from '@/components/ui/CheckboxInput';
// Utils
import { CompanyShortName } from '@/utils/constants/constants';
import { PHONE_QUERY } from '@/utils/layout/phone';
import { mapTips } from '@/utils/map/mapTips';
import { hasInstallOffer, installApp, subscribeInstallOffer } from '@/utils/pwa/installPrompt';

// An iPhone or iPad (an iPad says it's a Mac, with a touch screen)
const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// The tips the map page opens with, once a visit (MapExperience; which tips suit this screen
// is utils/map/mapTips.js: on a phone, installing first), and whenever the toolbar's "Tips"
// is pressed. One tip at a time (23 Nov 2026, the user's wish): Previous and Next, a round
// stamp per tip to jump to it, and the arrow keys; the last tip's Next is "Got it". Ticking
// the box turns the viewer's `showTips` setting off at once (Settings, Help, turns it back
// on); the dialog stays until it's closed. `share`: the viewer can share the map (its last
// tip says a link needs no app or account). `design`: the viewer can change the map's design (its
// owner or a co-owner): a tip says the places been to can show as a colour (25 Nov 2026).
function MapTipsDialog({ hideTips, onHideTips, posters, share = false, design = false, onClose }) {
  const boxId = useId();
  const noteId = useId();
  const tipId = useId();
  const phone = useMediaQuery(PHONE_QUERY);
  const touch = !useMediaQuery('(hover: hover)');
  const standalone = useMediaQuery('(display-mode: standalone)');
  // Read once (the dialog opens after the map has drawn, never at build): the test the
  // phone menu's Full screen makes (hooks/useFullscreen.js)
  const [fullscreen] = useState(() => Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen));
  // How this phone installs the site as an app: the browser's own offer, an iPhone's Share
  // menu, or the browser's menu (utils/pwa/installPrompt.js)
  const offered = useSyncExternalStore(subscribeInstallOffer, hasInstallOffer, () => false);
  const [ios] = useState(isIos);
  const [installed, setInstalled] = useState(false);
  const install = offered ? 'prompt' : ios ? 'ios' : 'menu';
  const tips = mapTips({ phone, touch, fullscreen, standalone, posters, appName: CompanyShortName, install, share, design });
  const [index, setIndex] = useState(0);
  // The list can shorten while open (the app installed, the screen turned): stay inside it
  const at = Math.min(index, tips.length - 1);
  const tip = tips[at];
  const last = at === tips.length - 1;
  const count = tips.length;
  const go = (to) => setIndex(Math.max(0, Math.min(count - 1, to)));

  // The arrow keys turn the tips wherever focus is in the dialog (it opens on its close
  // stamp), but never in the box; the dialog is modal, so the page behind hears nothing
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target instanceof HTMLInputElement || e.altKey || e.ctrlKey || e.metaKey) return;
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      setIndex((i) => Math.max(0, Math.min(count - 1, Math.min(i, count - 1) + step)));
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [count]);

  return (
    <Modal title='Tips' onClose={onClose}>
      <div className='grid gap-4'>
        {/* The live region stays; the tip inside is new each time, so it slides in */}
        <div id={tipId} aria-live='polite' aria-atomic='true' className='grid'>
          <section
            key={tip.id}
            data-tip={tip.id}
            className='paper-aged grid min-h-36 content-start gap-1.5 rounded-sm border-2 border-dashed border-poster-brown px-4 py-3.5 motion-safe:animate-tip-in'
          >
            <p className='text-2xs font-semibold uppercase tracking-xl text-poster-red-deep'>
              Tip {at + 1} of {tips.length}
            </p>
            <h3 className='font-travel text-xl leading-tight text-poster-red-deep'>{tip.title}</h3>
            <p>{tip.text}</p>
            {tip.action === 'install' ? (
              <div className='grid justify-start pt-1'>
                <Button quiet onClick={async () => setInstalled(await installApp())}>
                  Install the app
                </Button>
              </div>
            ) : null}
            {tip.id === 'install' && installed ? <p className='text-sm font-medium'>Installed: it’s on your home screen.</p> : null}
          </section>
        </div>

        <div className='grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2'>
          <Button quiet disabled={at === 0} onClick={() => go(at - 1)} ariaLabel='Previous tip'>
            <IoChevronBack aria-hidden='true' />
            <span className='phone:sr-only'>Previous</span>
          </Button>
          {/* A round stamp per tip: the one showing is inked in */}
          <ol aria-label='Choose a tip' className='grid grid-flow-col justify-center gap-0.5'>
            {tips.map((t, i) => (
              <li key={t.id} className='grid'>
                <button
                  type='button'
                  onClick={() => go(i)}
                  aria-label={`Tip ${i + 1}: ${t.title}`}
                  aria-current={i === at ? 'step' : undefined}
                  aria-controls={tipId}
                  className='group grid h-7 w-7 place-items-center rounded-full'
                >
                  <span
                    aria-hidden='true'
                    className={`block rounded-full border-2 transition ${
                      i === at ? 'h-3.5 w-3.5 border-poster-red-deep bg-poster-red' : 'h-2.5 w-2.5 border-poster-brown bg-transparent group-hover:bg-poster-brown/40'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ol>
          {last ? (
            <Button onClick={onClose}>Got it</Button>
          ) : (
            <Button onClick={() => go(at + 1)} ariaLabel='Next tip'>
              <span className='phone:sr-only'>Next</span>
              <IoChevronForward aria-hidden='true' />
            </Button>
          )}
        </div>
      </div>

      <div className='grid gap-1'>
        <CheckboxInput
          id={boxId}
          name='hideTips'
          checked={hideTips}
          onChange={(e) => onHideTips(e.target.checked)}
          label='Don’t show these tips again'
          ariaDescribedBy={noteId}
        />
        <p id={noteId} className='text-sm opacity-80'>
          They won’t open with the map. Tips, among the map’s tools, still opens them, and Settings can turn them back on.
        </p>
      </div>
    </Modal>
  );
}

export default MapTipsDialog;
