import React, { memo } from 'react';
// Components
import VisitStatusSelect from './VisitStatusSelect';
// Utils
import { VISIT_STATUS_LABELS } from '@/utils/map/visitStatus';

// One row of the country list: the name opens the country, the select sets its status.
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
          <VisitStatusSelect
            id={`status-${country.code}`}
            countryName={country.name}
            status={status}
            onChange={(next) => onChangeStatus(country.code, next)}
          />
        </div>
      ) : (
        <span className='text-sm opacity-80'>{status ? VISIT_STATUS_LABELS[status] : 'Not yet'}</span>
      )}
    </li>
  );
}

export default memo(CountryListItem);
