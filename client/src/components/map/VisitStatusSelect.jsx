import React from 'react';
// Components
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
// Utils
import { VISIT_STATUS_OPTIONS } from '@/utils/map/visitStatus';

// Visited / Lived there / Want to go / Not yet, for one country. `onChange` gets the
// status, or null for "Not yet". With `labelled`, a visible <label> names it (the country
// panel's "Been there?", inside a dialog named by the country); otherwise it's
// "Status for <country>" (the country list, where no label shows).
function VisitStatusSelect({ id, countryName, status, onChange, onBlur, refProp, disabled = false, labelled = false }) {
  return (
    <PlainOptionSelect
      refProp={refProp}
      id={id}
      name={id}
      value={status || ''}
      options={VISIT_STATUS_OPTIONS}
      disabled={disabled}
      ariaLabel={labelled ? undefined : `Status for ${countryName}`}
      onChange={(e) => onChange(e.target.value || null)}
      onBlur={onBlur}
    />
  );
}

export default VisitStatusSelect;
