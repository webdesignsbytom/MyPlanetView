import React from 'react';
// Icons
import { IoClose } from 'react-icons/io5';

// The close button on travel paperwork (map panels, dialogs, the map banner): a small
// round rubber stamp in a double red ring, like the MENU stamp. It straightens when
// hovered. `label` is its accessible name, `hint` an optional longer tooltip; `small`
// for the banner's corner.
function CloseStamp({ label, hint, onClick, small = false }) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={label}
      title={hint || label}
      className={`grid -rotate-12 place-items-center rounded-full border-double border-poster-red bg-poster-paper text-poster-red shadow-paper transition hover:rotate-0 hover:brightness-105 active:scale-95 ${
        small ? 'h-7 w-7 border-[3px] text-sm' : 'h-10 w-10 border-4 text-xl'
      }`}
    >
      <IoClose aria-hidden='true' />
    </button>
  );
}

export default CloseStamp;
