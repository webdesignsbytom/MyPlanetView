import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import UserAdminItem from '@/components/admin/users/UserAdminItem';

const ROLE_OPTIONS = [
  { value: 'USER', label: 'User' },
  { value: 'ADMIN', label: 'Admin' },
];
const SAM = { id: 'u1', name: 'Sam Carter', email: 'sam@example.com', role: 'user', isActive: true, emailVerified: true, createdAt: '2026-11-01T12:00:00Z' };

const item = (props = {}) => {
  const handlers = { onSaveRole: vi.fn(), onDeactivate: vi.fn(), onReactivate: vi.fn(), onDelete: vi.fn(), onPlans: vi.fn() };
  const view = render(<UserAdminItem user={SAM} roleOptions={ROLE_OPTIONS} lockedReason={null} busy={false} {...handlers} {...props} />);
  return { ...view, ...handlers, button: (label) => view.container.querySelector(`[aria-label="${label}"]`) };
};

describe('UserAdminItem', () => {
  it('shows who they are, when they joined and where they stand', () => {
    const { container } = item();
    const article = container.querySelector('article');
    expect(article.getAttribute('aria-labelledby')).toBe('user-heading-u1');
    expect(article.getAttribute('aria-busy')).toBe('false');
    expect(container.querySelector('#user-heading-u1').textContent).toBe('Sam Carter');
    expect(article.textContent).toContain('sam@example.com');
    expect(article.textContent).toContain(new Date(SAM.createdAt).toLocaleDateString());
    // The role in capitals, whatever case it came in
    expect(screen.getByText('USER')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('Email verified')).toBeTruthy();
  });

  it('marks a deactivated, unverified account with no name', () => {
    const { container } = item({ user: { ...SAM, name: '', isActive: false, emailVerified: false, createdAt: null } });
    expect(container.querySelector('#user-heading-u1').textContent).toBe('—');
    expect(screen.getByText('Deactivated')).toBeTruthy();
    expect(screen.getByText('Email not verified')).toBeTruthy();
    expect(container.textContent).toContain('Joined: —');
  });

  it('saves a role only once it has changed', () => {
    const { button, onSaveRole } = item();
    const save = button('Save role for Sam Carter');
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'ADMIN' } });
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    expect(onSaveRole).toHaveBeenCalledWith(SAM, 'ADMIN');
  });

  it('offers Deactivate for an active account, as a delete button', () => {
    const { button, onDeactivate } = item();
    expect(button('Deactivate Sam Carter').className).toContain('btn-danger');
    expect(button('Reactivate Sam Carter')).toBeNull();
    fireEvent.click(button('Deactivate Sam Carter'));
    expect(onDeactivate).toHaveBeenCalledWith(SAM);
  });

  it('offers Reactivate for a deactivated one', () => {
    const user = { ...SAM, isActive: false };
    const { button, onReactivate } = item({ user });
    expect(button('Deactivate Sam Carter')).toBeNull();
    fireEvent.click(button('Reactivate Sam Carter'));
    expect(onReactivate).toHaveBeenCalledWith(user);
  });

  it('opens their memberships when it can, and names buttons by address without a name', () => {
    const user = { ...SAM, name: null };
    const { button, onPlans } = item({ user });
    fireEvent.click(button('Membership for sam@example.com'));
    expect(onPlans).toHaveBeenCalledWith(user);
  });

  it('has no Membership button without onPlans', () => {
    const { button } = item({ onPlans: undefined });
    expect(button('Membership for Sam Carter')).toBeNull();
  });

  it('deletes with its close stamp', () => {
    const { button, onDelete } = item();
    const stamp = button('Delete user Sam Carter');
    expect(stamp.getAttribute('title')).toBe('Delete Sam Carter');
    fireEvent.click(stamp);
    expect(onDelete).toHaveBeenCalledWith(SAM);
  });

  it('locks every control and says why when the row can’t be changed', () => {
    const { button, container } = item({ lockedReason: 'Only a developer can manage developer accounts.' });
    expect(screen.getByLabelText('Role').disabled).toBe(true);
    ['Save role for Sam Carter', 'Deactivate Sam Carter', 'Membership for Sam Carter', 'Delete user Sam Carter'].forEach((label) =>
      expect(button(label).disabled).toBe(true),
    );
    expect(container.querySelector('#user-note-u1').textContent).toBe('Only a developer can manage developer accounts.');
  });

  it('links the locked note to the role select', () => {
    item({ lockedReason: 'This is your account — manage it from your account page.' });
    expect(screen.getByLabelText('Role').getAttribute('aria-describedby')).toBe('user-note-u1');
  });

  it('locks its controls while busy', () => {
    const { button, container } = item({ busy: true });
    expect(container.querySelector('article').getAttribute('aria-busy')).toBe('true');
    expect(screen.getByLabelText('Role').disabled).toBe(true);
    expect(button('Deactivate Sam Carter').disabled).toBe(true);
    expect(button('Delete user Sam Carter').disabled).toBe(true);
    expect(container.querySelector('#user-note-u1')).toBeNull();
  });
});
