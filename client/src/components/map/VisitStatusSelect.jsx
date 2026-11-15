import React from 'react';
// Components
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
// Utils
import { VISIT_STATUS_OPTIONS } from '@/utils/map/visitStatus';

// Visited / Lived there / Want to go / Not yet, for one country. `onChange` gets the
// status, or null for "Not yet".
function VisitStatusSelect({ id, countryName, status, onChange, onBlur, refProp, disabled = false }) {
  return (
    <PlainOptionSelect
      refProp={refProp}
      id={id}
      name={id}
      value={status || ''}
      options={VISIT_STATUS_OPTIONS}
      disabled={disabled}
      ariaLabel={`Status for ${countryName}`}
      onChange={(e) => onChange(e.target.value || null)}
      onBlur={onBlur}
    />
  );
}

export default VisitStatusSelect;
