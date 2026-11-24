import React, { useId } from 'react';
// Components
import SwitchInput from '@/components/ui/SwitchInput';
import SupporterBadge from '@/components/plans/SupporterBadge';
// Utils
import { planOf } from '@/utils/constants/plans';

/**
 * Settings' supporter badge (docs/API.md "The supporter badge"; 24 Nov 2026, the user's wish):
 * for the owner of a Business or First Class account, the badge as it looks and the switch for
 * it (the map setting `showSupporterBadge`, on unless turned off). It's theirs, so it's on
 * every map they own; the banner follows the switch at once.
 */
function SupporterBadgeSection({ supporter, checked, onChange }) {
  const noteId = useId();
  const name = planOf(supporter.plan).name;

  return (
    <fieldset data-supporter-settings className='grid gap-3'>
      {/* A legend sits outside the fieldset's grid: its bottom padding gives the gap */}
      <legend className='pb-3 font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>Your supporter badge</legend>
      <div className='grid justify-items-start'>
        <SupporterBadge supporter={supporter} asLink={false} />
      </div>
      <p id={noteId} className='text-sm'>
        Thank you for being a {name} member. Your badge hangs under the banner of every map you own, for everyone who opens them, people you
        share them with too.
      </p>
      <SwitchInput
        id='setting-showSupporterBadge'
        name='showSupporterBadge'
        label={`Show my ${name} badge`}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        ariaDescribedBy={noteId}
      />
    </fieldset>
  );
}

export default SupporterBadgeSection;
