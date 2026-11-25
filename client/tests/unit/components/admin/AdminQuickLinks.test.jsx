import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminQuickLinks from '@/components/admin/AdminQuickLinks';
import { AuthContext } from '@/auth/AuthContext';

const links = (role) => {
  const { container } = render(
    <AuthContext.Provider value={{ user: { id: 'me', role } }}>
      <MemoryRouter>
        <AdminQuickLinks />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return { container, hrefs: [...container.querySelectorAll('a')].map((a) => a.getAttribute('href')) };
};

describe('AdminQuickLinks', () => {
  it('is the Manage card, with a ticket per admin page', () => {
    const { container, hrefs } = links('ADMIN');
    expect(container.querySelector('section').getAttribute('aria-labelledby')).toBe('admin-quick-links-heading');
    expect(container.querySelector('#admin-quick-links-heading').textContent).toBe('Manage');
    expect(hrefs).toEqual(['/admin/contact-forms', '/admin/users', '/admin/promo-codes', '/admin/offers', '/admin/themes', '/admin/feedback']);
    expect(container.textContent).toContain('Roles, account status, memberships and moving maps');
  });

  it('keeps the audit log for developers', () => {
    expect(links('ADMIN').hrefs).not.toContain('/admin/events');
    const { hrefs, container } = links('DEVELOPER');
    expect(hrefs[hrefs.length - 1]).toBe('/admin/events');
    expect(container.textContent).toContain('Audit Log');
  });
});
