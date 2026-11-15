import React from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';

function EventFilters({ filters, search, options, onFilterChange, onSearchChange }) {
  return (
    <form
      role='search'
      aria-label='Filter audit log'
      className='grid gap-4 border-2 border-dashed border-poster-brown/60 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4'
      onSubmit={(e) => e.preventDefault()}
    >
      <FormField id='event-search' label='Search message or action'>
        <TextInput
          type='search'
          name='search'
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete='off'
          maxLength={100}
        />
      </FormField>

      <FormField id='event-level-filter' label='Level'>
        <PlainOptionSelect
          name='level'
          value={filters.level}
          onChange={(e) => onFilterChange('level', e.target.value)}
          options={options.level}
        />
      </FormField>

      <FormField id='event-domain-filter' label='Domain'>
        <PlainOptionSelect
          name='domain'
          value={filters.domain}
          onChange={(e) => onFilterChange('domain', e.target.value)}
          options={options.domain}
        />
      </FormField>

      <FormField id='event-status-filter' label='Status'>
        <PlainOptionSelect
          name='status'
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          options={options.status}
        />
      </FormField>
    </form>
  );
}

export default EventFilters;
