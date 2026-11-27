import React, { useRef, useState } from 'react';
import useHomeDraftGlobe from '@/hooks/useHomeDraftGlobe';
import HomeDraftHeader from './HomeDraftHeader';
import HomeDraftIntro from './HomeDraftIntro';
import HomeDraftGlobe from './HomeDraftGlobe';
import HomeDraftDialog from './HomeDraftDialog';
// The draft's own look, scoped to [data-home-draft]
import '@/styles/homeDraft.css';

// A modal dialog where the browser has them; jsdom (the unit tests) just shows it open
function showDialog(node) {
  if (!node || node.open) return;
  if (typeof node.showModal === 'function') node.showModal();
  else node.setAttribute('open', '');
}
function shutDialog(node) {
  if (!node?.hasAttribute('open')) return;
  if (typeof node.close === 'function') node.close();
  else node.removeAttribute('open');
}

/**
 * A draft of a new home page (dev only, /dev/home), from the user's design in the repo's
 * main-home/: the title and features on the left over the explorer's desk artwork, the Earth
 * turning on the right with three destination cards, each opening its photo. The bar has the
 * site's real links, and the button signs up (or opens your map).
 */
export default function HomeDraft() {
  const dialogRef = useRef(null);
  const globe = useHomeDraftGlobe({ dialogRef });
  const [place, setPlace] = useState(null);

  const openPlace = (chosen) => {
    setPlace(chosen);
    showDialog(dialogRef.current);
  };

  return (
    <div data-home-draft=''>
      <HomeDraftHeader />
      <main id='main-content' tabIndex={-1} aria-labelledby='home-draft-heading' className='hero'>
        <HomeDraftIntro />
        <HomeDraftGlobe globe={globe} onOpenPlace={openPlace} />
      </main>
      <HomeDraftDialog dialogRef={dialogRef} place={place} onClose={() => shutDialog(dialogRef.current)} />
    </div>
  );
}
