import React, { memo } from 'react';
// Components
import CountryStatusControl from './CountryStatusControl';
// Utils
import { VISIT_STATUS_LABELS } from '@/utils/map/visitStatus';
import { visitStampClass } from '@/utils/map/visitStamp';

// One row of the country list: the name opens the country, the stamp sets its status
// (only a stamp, in words, for someone who can't change it). Memoised, with stable
// callbacks from the panel, so a change re-renders only its own row.
function CountryListItem({ country, status, canEdit, onChangeStatus, onShow }) {
  return (
    <li className='grid grid-cols-rev items-center gap-3 border-b border-dashed border-poster-brown/40 py-2'>
      <button
        type='button'
        onClick={() => onShow(country.code)}
        className='justify-self-start text-left text-sm font-medium underline-offset-2 hover:text-colour6 hover:underline'
      >
        {country.name}
      </button>
      <div className='w-36'>
        {canEdit ? (
          <CountryStatusControl code={country.code} countryName={country.name} status={status} onChange={onChangeStatus} />
        ) : (
          <span className={visitStampClass(status)}>{status ? VISIT_STATUS_LABELS[status] : 'Not yet'}</span>
        )}
      </div>
    </li>
  );
}

export default memo(CountryListItem);
