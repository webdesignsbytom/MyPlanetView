import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AccountGiftsSection from '@/components/account/AccountGiftsSection';

function Where() {
  const location = useLocation();
  return <p data-where>{location.pathname}</p>;
}

const open = () =>
  render(
    <MemoryRouter initialEntries={['/account']}>
      <Routes>
        <Route path='/account' element={<AccountGiftsSection />} />
        <Route path='*' element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );

describe('AccountGiftsSection', () => {
  it('can’t open an empty code', () => {
    open();
    const button = screen.getByText('Open it');
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Have a gift code?'), { target: { value: '   ' } });
    expect(button.disabled).toBe(true);
  });

  it('opens the gift’s page with the code cleaned and in capitals', () => {
    const { container } = open();
    fireEvent.change(screen.getByLabelText('Have a gift code?'), { target: { value: 'abcd-efgh jkmn' } });
    fireEvent.click(screen.getByText('Open it'));
    expect(container.querySelector('[data-where]').textContent).toBe('/gift/ABCDEFGHJKMN');
  });

  it('stays put when what was typed holds no letters or digits', () => {
    const { container } = open();
    fireEvent.change(screen.getByLabelText('Have a gift code?'), { target: { value: '--' } });
    fireEvent.click(screen.getByText('Open it'));
    expect(container.querySelector('[data-where]')).toBeNull();
    expect(screen.getByLabelText('Have a gift code?')).toBeTruthy();
  });

  it('links to the page for giving a gift', () => {
    open();
    const link = screen.getByText('gifts of Business or First Class');
    expect(link.getAttribute('href')).toBe('/gifts');
  });
});
