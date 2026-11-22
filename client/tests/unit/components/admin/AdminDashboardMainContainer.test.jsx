import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboardMainContainer from '@/components/admin/AdminDashboardMainContainer';
import { AuthContext } from '@/auth/AuthContext';

// The contact forms' card has its own tests; here only that the dashboard shows it
vi.mock('@/components/contact/admin/ContactFormDataSection', () => ({ default: () => <section data-contact-forms='' /> }));

describe('AdminDashboardMainContainer', () => {
  it('shows the quick links, then the contact forms', () => {
    const { container } = render(
      <AuthContext.Provider value={{ user: { id: 'me', role: 'ADMIN' } }}>
        <MemoryRouter>
          <AdminDashboardMainContainer />
        </MemoryRouter>
      </AuthContext.Provider>,
    );
    const sections = container.querySelectorAll('section');
    expect(sections[0].getAttribute('aria-labelledby')).toBe('admin-quick-links-heading');
    expect(sections[1].hasAttribute('data-contact-forms')).toBe(true);
    // Fragments only: the page's <main> is AppPageShell's
    expect(container.querySelector('main')).toBeNull();
  });
});
