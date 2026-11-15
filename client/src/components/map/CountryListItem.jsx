import React, { memo } from 'react';
// Components
import CountryStatusControl from './CountryStatusControl';
// Utils
import { VISIT_STATUS_LABELS } from '@/utils/map/visitStatus';

// One row of the country list: the name opens the country, the control sets its status.
// Memoised, with stable callbacks from the panel, so a change re-renders only its own row.
function CountryListItem({ country, status, canEdit, onChangeStatus, onShow }) {
  return (
    <li className='grid grid-cols-rev items-center gap-3 py-1.5'>
      <button
        type='button'
        onClick={() => onShow(country.code)}
        className='justify-self-start text-left text-sm font-medium underline-offset-2 hover:underline'
      >
        {country.name}
      </button>
      {canEdit ? (
        <div className='w-36'>
          <CountryStatusControl code={country.code} countryName={country.name} status={status} onChange={onChangeStatus} />
        </div>
      ) : (
        <span className='text-sm opacity-80'>{status ? VISIT_STATUS_LABELS[status] : 'Not yet'}</span>
      )}
    </li>
  );
}

export default memo(CountryListItem);
