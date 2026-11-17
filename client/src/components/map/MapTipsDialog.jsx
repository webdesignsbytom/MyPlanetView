import React, { useId, useState } from 'react';
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

// The tips the map page opens with, once a visit (MapExperience; which tips suit this screen
// is utils/map/mapTips.js: on a phone, full screen first). Ticking the box turns the
// viewer's `showTips` setting off at once (Settings, Help, turns it back on); the dialog
// stays until it's closed.
function MapTipsDialog({ hideTips, onHideTips, posters, onClose }) {
  const boxId = useId();
  const noteId = useId();
  const phone = useMediaQuery(PHONE_QUERY);
  const touch = !useMediaQuery('(hover: hover)');
  const standalone = useMediaQuery('(display-mode: standalone)');
  // Read once (the dialog opens after the map has drawn, never at build): the test the
  // phone menu's Full screen makes (hooks/useFullscreen.js)
  const [fullscreen] = useState(() => Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen));
  const tips = mapTips({ phone, touch, fullscreen, standalone, posters, appName: CompanyShortName });

  return (
    <Modal title='Tips' onClose={onClose}>
      <ul className='grid gap-3'>
        {tips.map((tip) => (
          <li key={tip.id} className='grid gap-0.5'>
            <h3 className='font-semibold'>{tip.title}</h3>
            <p>{tip.text}</p>
          </li>
        ))}
      </ul>
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
          Settings can turn them back on.
        </p>
      </div>
      <div className='grid justify-end'>
        <Button onClick={onClose}>Got it</Button>
      </div>
    </Modal>
  );
}

export default MapTipsDialog;
