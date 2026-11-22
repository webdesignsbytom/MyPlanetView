import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminPagination from '@/components/admin/users/AdminPagination';

const pager = (props = {}) => {
  const onPageChange = vi.fn();
  const view = render(<AdminPagination page={2} totalPages={3} total={45} onPageChange={onPageChange} label='Users pages' {...props} />);
  return { ...view, onPageChange };
};

describe('AdminPagination', () => {
  it('draws nothing while there is nothing to page through', () => {
    const { container } = pager({ total: 0 });
    expect(container.innerHTML).toBe('');
  });

  it('is a named nav saying where the list is', () => {
    const { container } = pager();
    const nav = container.querySelector('nav');
    expect(nav.getAttribute('aria-label')).toBe('Users pages');
    expect(screen.getByText('Page 2 of 3 (45 total)')).toBeTruthy();
  });

  it('asks for the page before and after', () => {
    const { onPageChange } = pager();
    fireEvent.click(screen.getByText('Previous'));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByText('Next'));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
  });

  it('turns off Previous on the first page and Next on the last', () => {
    pager({ page: 1, totalPages: 1, total: 5 });
    expect(screen.getByText('Previous').disabled).toBe(true);
    expect(screen.getByText('Next').disabled).toBe(true);
  });

  it('turns both off while the list loads', () => {
    pager({ disabled: true });
    expect(screen.getByText('Previous').disabled).toBe(true);
    expect(screen.getByText('Next').disabled).toBe(true);
  });
});
