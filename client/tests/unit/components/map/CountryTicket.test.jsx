import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CountryTicket from '@/components/map/CountryTicket';

const ticket = (props = {}) =>
  render(
    <CountryTicket
      title='Philippines'
      kicker='Asia'
      subtitle='0 of 118 provinces visited'
      action={<button type='button'>Open country</button>}
      onClose={() => {}}
      {...props}
    >
      <p>Been there?</p>
    </CountryTicket>,
  );

// The header's grid areas, from the arbitrary classes that set them, by screen size:
// '' (phones and tablets), 'lg' and 'sideways'
function areas(header) {
  const found = {};
  for (const name of header.className.split(' ')) {
    const match = name.match(/^(?:(lg|sideways):)?\[grid-template-areas:(.+)\]$/);
    if (match) found[match[1] || ''] = match[2].replaceAll('_', ' ');
  }
  return found;
}

describe('CountryTicket', () => {
  it('is a dialog named by its heading, with the kicker, subtitle and content', () => {
    ticket();
    const dialog = screen.getByRole('dialog');
    const heading = screen.getByText('Philippines');
    expect(heading.tagName).toBe('H2');
    expect(dialog.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(screen.getByText('Asia')).toBeTruthy();
    expect(screen.getByText('0 of 118 provinces visited')).toBeTruthy();
    expect(screen.getByText('Been there?')).toBeTruthy();
  });

  it('keeps the action and the close stamp together, the stamp last and small until lg', () => {
    const { container } = ticket();
    const actions = container.querySelector('[data-ticket-actions]');
    const buttons = actions.querySelectorAll('button');
    expect([...buttons].map((button) => button.textContent || button.getAttribute('aria-label'))).toEqual(['Open country', 'Close Philippines']);
    expect(buttons[1].className.split(' ')).toEqual(expect.arrayContaining(['h-7', 'lg:h-10']));
  });

  it('puts the buttons on the kicker’s row above the name on phones and tablets, beside it from lg and sideways', () => {
    const { container } = ticket();
    const header = container.querySelector('header');
    expect(areas(header)).toEqual({
      '': "'kicker actions' 'title title' 'subtitle subtitle'",
      lg: "'kicker actions' 'title actions' 'subtitle actions'",
      sideways: "'title actions' 'subtitle actions'",
    });
    const area = (element) => element.className.match(/\[grid-area:(\w+)\]/)?.[1];
    expect(area(screen.getByText('Asia'))).toBe('kicker');
    expect(area(screen.getByText('Philippines'))).toBe('title');
    expect(area(screen.getByText('0 of 118 provinces visited'))).toBe('subtitle');
    expect(area(container.querySelector('[data-ticket-actions]'))).toBe('actions');
  });

  it('sets the name a size smaller on phones and tablets than from lg', () => {
    ticket();
    const classes = screen.getByText('Philippines').className.split(' ');
    expect(classes).toEqual(expect.arrayContaining(['text-2xl', 'md:text-3xl', 'lg:text-4xl', 'sideways:text-xl']));
  });

  it('closes from its stamp', () => {
    const onClose = vi.fn();
    ticket({ onClose });
    fireEvent.click(screen.getByLabelText('Close Philippines'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('leaves out the kicker and subtitle when it has none', () => {
    const { container } = ticket({ kicker: null, subtitle: null });
    const header = container.querySelector('header');
    expect(header.querySelector('[class*="grid-area:kicker"]')).toBeNull();
    expect(header.querySelector('[class*="grid-area:subtitle"]')).toBeNull();
  });
});
