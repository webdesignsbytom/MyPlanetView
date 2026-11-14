import React from 'react';
// Data
import { COMMON_COUNTRIES, COUNTRIES } from '@/utils/data/countryData';
// Components
import GroupedOptionSelect from '@/components/ui/GroupedOptionSelect';

const COUNTRY_GROUPS = [
  { label: 'Most chosen', options: COMMON_COUNTRIES },
  { label: 'All countries', options: COUNTRIES },
];

function CountrySelect({
  id = 'country',
  name = 'country',
  value,
  onChange,
  required = false,
  disabled = false,
  ariaInvalid = false,
  ariaDescribedBy,
}) {
  return (
    <GroupedOptionSelect
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      ariaInvalid={ariaInvalid}
      ariaDescribedBy={ariaDescribedBy}
      ariaLabel='Select your country'
      groups={COUNTRY_GROUPS}
    />
  );
}

export default CountrySelect;
