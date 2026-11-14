import React from 'react';
// Icons
import { IoGlobeOutline, IoLockClosed } from 'react-icons/io5';
// Components
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
// Utils
import { LINK_ACCESS_OPTIONS } from '@/utils/sharing/shareRoles';

// "General access", as in Google Docs: only the people added, or anyone with the link
// (who can only ever view).
function ShareGeneralAccess({ value, busy, onChange }) {
  const current = LINK_ACCESS_OPTIONS.find((o) => o.value === value) || LINK_ACCESS_OPTIONS[0];
  return (
    <div className='grid grid-cols-reg items-center gap-3'>
      <span className='grid h-10 w-10 -rotate-6 place-items-center rounded-full border-4 border-double border-poster-red bg-poster-paper text-lg text-poster-red' aria-hidden='true'>
        {value === 'ANYONE_WITH_LINK' ? <IoGlobeOutline /> : <IoLockClosed />}
      </span>
      <div className='grid gap-1'>
        <PlainOptionSelect
          id='general-access'
          value={value}
          disabled={busy}
          options={LINK_ACCESS_OPTIONS.map(({ value: v, label }) => ({ value: v, label }))}
          ariaLabel='General access'
          onChange={(e) => onChange(e.target.value)}
        />
        <p className='text-xs opacity-80'>{current.hint}</p>
      </div>
    </div>
  );
}

export default ShareGeneralAccess;
