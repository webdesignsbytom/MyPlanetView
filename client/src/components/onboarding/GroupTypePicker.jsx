import React from 'react';
import { FaHiking, FaUserFriends } from 'react-icons/fa';
import { MdFamilyRestroom } from 'react-icons/md';
// Utils
import { GROUP_TYPES } from '@/utils/map/saveMapSetup';

// Each choice's picture (17 Nov 2026, the user's wish): a backpacker, two friends, a family
const GROUP_ICONS = { SOLO: FaHiking, COUPLE: FaUserFriends, FAMILY: MdFamilyRestroom };

// Who the map is for: solo, a couple or a family (the old site's account types), each with
// its picture in a round stamp, inked red once chosen: beside the words on phones, above
// them where the three sit side by side.
function GroupTypePicker({ value, onChange, name = 'groupType' }) {
  return (
    <fieldset className='grid gap-2'>
      <legend className='text-sm font-medium'>Who is this map for?</legend>
      <div className='grid gap-2 sm:grid-cols-3'>
        {GROUP_TYPES.map((type) => {
          const Icon = GROUP_ICONS[type.value];
          const chosen = value === type.value;
          return (
            <label
              key={type.value}
              className={`grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 sm:grid-cols-1 sm:content-start sm:justify-items-start border-2 px-4 py-3 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-colour6 ${
                chosen ? 'paper-aged border-poster-red text-poster-ink shadow-paper' : 'border-dashed border-poster-brown/60 hover:border-solid hover:border-poster-brown'
              }`}
            >
              <input
                type='radio'
                name={name}
                value={type.value}
                checked={chosen}
                onChange={() => onChange(type.value)}
                className='sr-only'
              />
              {Icon ? (
                <span
                  aria-hidden='true'
                  className={`row-span-2 grid h-11 sm:row-span-1 w-11 place-items-center rounded-full border-2 text-xl ${
                    chosen ? 'border-poster-red bg-poster-red-deep text-poster-paper' : 'border-poster-brown/60 bg-paper-cream text-poster-brown'
                  }`}
                >
                  <Icon />
                </span>
              ) : null}
              <span className='font-travel text-lg uppercase leading-tight tracking-wide'>{type.label}</span>
              <span className='text-xs opacity-80'>{type.hint}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default GroupTypePicker;
