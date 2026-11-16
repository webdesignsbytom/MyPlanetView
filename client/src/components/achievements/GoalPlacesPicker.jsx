import React from 'react';
// Icons
import { IoClose } from 'react-icons/io5';
// Components
import FormField from '@/components/ui/FormField';
import GroupedOptionSelect from '@/components/ui/GroupedOptionSelect';
import Button from '@/components/common/Button';
// Utils
import { COUNTRY_OPTION_GROUPS, countryName } from '@/utils/map/countries';
import { GOAL_LIST_MAX } from '@/utils/achievements/goals';

/**
 * A bucket list's places (a COUNTRY_LIST goal): picked one at a time from the countries
 * and special places, each on a small paper tag with a button to take it off. It can
 * start from the map's "want to go" countries (`wantToGo`), adding those not on it yet.
 */
function GoalPlacesPicker({ idPrefix, codes, onChange, wantToGo = [] }) {
  const chosen = new Set(codes);
  const room = GOAL_LIST_MAX - codes.length;
  const missingWants = wantToGo.filter((code) => !chosen.has(code));
  const groups = COUNTRY_OPTION_GROUPS.map((group) => ({
    ...group,
    options: group.options.map((option) => ({ ...option, disabled: chosen.has(option.value) })),
  }));

  const add = (code) => {
    if (code && !chosen.has(code) && room > 0) onChange([...codes, code]);
  };

  return (
    <fieldset className='grid gap-3'>
      <legend className='pb-2 font-travel text-base uppercase tracking-wide text-poster-brown'>Places on the list</legend>
      {missingWants.length ? (
        <div className='grid justify-items-start'>
          <Button small quiet onClick={() => onChange([...codes, ...missingWants.slice(0, room)])}>
            Add your “want to go” countries ({missingWants.length})
          </Button>
        </div>
      ) : null}
      <FormField id={`${idPrefix}-add`} label='Add a place'>
        <GroupedOptionSelect value='' onChange={(e) => add(e.target.value)} groups={groups} placeholder='Choose a place' disabled={room <= 0} />
      </FormField>
      {codes.length ? (
        <ul className='grid grid-row-wrap gap-2' aria-label='Places on the list'>
          {codes.map((code) => (
            <li key={code} className='paper-aged grid grid-cols-reg items-center gap-1 border-2 border-poster-brown py-0.5 pl-2 pr-0.5 text-sm text-poster-ink'>
              <span>{countryName(code)}</span>
              <button
                type='button'
                onClick={() => onChange(codes.filter((c) => c !== code))}
                aria-label={`Take ${countryName(code)} off the list`}
                className='grid h-7 w-7 place-items-center rounded-full text-poster-red-deep hover:bg-poster-cream pointer-coarse:h-9 pointer-coarse:w-9'
              >
                <IoClose aria-hidden='true' />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-sm'>No places on the list yet.</p>
      )}
      <p className='text-xs'>
        {codes.length} of up to {GOAL_LIST_MAX} places.
      </p>
    </fieldset>
  );
}

export default GoalPlacesPicker;
