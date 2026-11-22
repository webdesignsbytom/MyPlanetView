import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import UserFilters from '@/components/admin/users/UserFilters';

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'ADMIN', label: 'Admin' },
];
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'inactive', label: 'Deactivated' },
];

const filters = (props = {}) => {
  const handlers = { onSearchChange: vi.fn(), onRoleChange: vi.fn(), onStatusChange: vi.fn() };
  const view = render(
    <UserFilters
      search='sam'
      role='ADMIN'
      status=''
      roleOptions={ROLE_OPTIONS}
      statusOptions={STATUS_OPTIONS}
      {...handlers}
      {...props}
    />,
  );
  return { ...view, ...handlers };
};

describe('UserFilters', () => {
  it('is a search form named for what it filters', () => {
    const { container } = filters();
    const form = container.querySelector('form');
    expect(form.getAttribute('role')).toBe('search');
    expect(form.getAttribute('aria-label')).toBe('Filter users');
  });

  it('shows the filters as they are', () => {
    filters();
    expect(screen.getByLabelText('Search name or email').value).toBe('sam');
    expect(screen.getByLabelText('Role').value).toBe('ADMIN');
    expect(screen.getByLabelText('Status').value).toBe('');
  });

  it('passes each change on', () => {
    const { onSearchChange, onRoleChange, onStatusChange } = filters();
    fireEvent.change(screen.getByLabelText('Search name or email'), { target: { value: 'jo' } });
    expect(onSearchChange).toHaveBeenCalledWith('jo');
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: '' } });
    expect(onRoleChange).toHaveBeenCalledWith('');
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'inactive' } });
    expect(onStatusChange).toHaveBeenCalledWith('inactive');
  });

  it('never submits the page away', () => {
    const { container } = filters();
    const submit = new Event('submit', { bubbles: true, cancelable: true });
    container.querySelector('form').dispatchEvent(submit);
    expect(submit.defaultPrevented).toBe(true);
  });
});
