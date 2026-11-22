import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@/auth/AuthContext';
import CountryStartMap from '@/components/countries/CountryStartMap';

const show = ({ user = null, named } = {}) =>
  render(
    <AuthContext.Provider value={{ user, loading: false, isAuthenticated: Boolean(user) }}>
      <MemoryRouter>
        <CountryStartMap named={named} />
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe('CountryStartMap', () => {
  it('asks a visitor to sign up, naming the country', () => {
    const { container } = show({ named: 'the United States' });
    expect(container.querySelector('#country-start-heading').textContent).toBe('Start your map');
    expect(container.querySelector('p').textContent).toContain('Colour in the United States and every other country');
    const link = container.querySelector('a');
    expect(link.textContent).toBe('Start your map');
    expect(link.getAttribute('href')).toBe('/sign-up');
  });

  it('speaks of every country on the index, where no country is named', () => {
    const { container } = show();
    expect(container.querySelector('p').textContent).toMatch(/^Colour in every country you've been to/);
  });

  it('sends someone signed in to their map, to add the country', () => {
    const { container } = show({ user: { id: 'u1' }, named: 'France' });
    expect(container.querySelector('#country-start-heading').textContent).toBe('Add it to your map');
    const link = container.querySelector('a');
    expect(link.textContent).toBe('Open your map');
    expect(link.getAttribute('href')).toBe('/map');
  });

  it('says "Back to your map" to someone signed in on the index', () => {
    const { container } = show({ user: { id: 'u1' } });
    expect(container.querySelector('#country-start-heading').textContent).toBe('Back to your map');
  });
});
