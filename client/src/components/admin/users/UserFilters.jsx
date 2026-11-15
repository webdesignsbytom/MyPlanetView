import React from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';

function UserFilters({ search, role, status, roleOptions, statusOptions, onSearchChange, onRoleChange, onStatusChange }) {
  return (
    <form
      role='search'
      aria-label='Filter users'
      className='grid gap-4 border-2 border-dashed border-poster-brown/60 px-4 py-4 md:grid-cols-3'
      onSubmit={(e) => e.preventDefault()}
    >
      <FormField id='user-search' label='Search name or email'>
        <TextInput
          type='search'
          name='search'
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete='off'
          maxLength={100}
        />
      </FormField>

      <FormField id='user-role-filter' label='Role'>
        <PlainOptionSelect
          name='role'
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          options={roleOptions}
        />
      </FormField>

      <FormField id='user-status-filter' label='Status'>
        <PlainOptionSelect
          name='status'
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={statusOptions}
        />
      </FormField>
    </form>
  );
}

export default UserFilters;
