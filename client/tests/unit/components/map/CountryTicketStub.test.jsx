import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CountryTicketStub from '@/components/map/CountryTicketStub';
import PosterViewer from '@/components/map/PosterViewer';
import { withProviders } from './helpers';

const stub = (props) => render(withProviders(<CountryTicketStub code='FR' countryName='France' {...props} />));

describe('CountryTicketStub', () => {
  it('shows the poster, which opens full screen, and asks "Somewhere to go next?" before a visit', () => {
    const { container } = stub({ status: null });
    const button = screen.getByLabelText('Show the travel poster for France full screen');
    expect(button.querySelector('img').getAttribute('src')).toMatch(/fr-.+-800\.webp$/);
    expect(screen.getByText('Somewhere to go next?')).toBeTruthy();
    // The stamp says how the map stands with it, hidden from screen readers
    const stamp = [...container.querySelectorAll('span[aria-hidden="true"]')].find((s) => s.textContent === 'Not been yet');
    expect(stamp).toBeTruthy();
    fireEvent.click(button);
    expect(document.querySelector('[role="dialog"][aria-label="Travel poster for France"]')).not.toBeNull();
  });

  it('stamps a visit in red, with when they first went', () => {
    const { container } = stub({ status: 'VISITED', firstVisitedOn: '2019-04-02' });
    expect(screen.queryByText('Somewhere to go next?')).toBeNull();
    expect(screen.getByText('Visited').getAttribute('class')).toContain('border-poster-red');
    expect(container.textContent).toContain('First went');
  });

  it('puts an editor’s controls in place of the stamp', () => {
    const { container } = stub({ status: 'VISITED', firstVisitedOn: '2019-04-02', controls: <div data-controls='' /> });
    expect(container.querySelector('[data-controls]')).not.toBeNull();
    expect(container.textContent).not.toContain('First went');
  });

  it('links to the country’s guide, a UK nation to the UK’s', () => {
    const { container } = stub();
    expect(container.querySelector('a').getAttribute('href')).toBe('/countries/france');
    const { container: nation } = render(withProviders(<CountryTicketStub code='XC' countryName='Scotland' />));
    expect(nation.querySelector('a').getAttribute('href')).toBe('/countries/united-kingdom');
  });

  it('shows the placeholder card for a place with no poster, and no guide link for an unknown place', () => {
    const { container } = render(withProviders(<CountryTicketStub code='ZZ' countryName='Nowhere' />));
    expect(container.querySelector('[role="img"]').getAttribute('aria-label')).toBe('Nowhere: travel poster coming soon');
    expect(container.querySelector('a')).toBeNull();
  });
});

describe('PosterViewer', () => {
  it('shows the poster alone in a modal dialog, closed by its stamp, Escape or a press beside it', () => {
    const onClose = vi.fn();
    render(<PosterViewer poster={{ name: 'fr-paris', ratio: '1024/1536' }} countryName='France' onClose={onClose} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.style.getPropertyValue('--poster-ratio')).toBe('1024/1536');
    expect(dialog.querySelector('img').getAttribute('alt')).toBe('Travel poster for France');
    fireEvent.click(screen.getAllByLabelText('Close the poster')[0]);
    fireEvent.click(dialog);
    fireEvent.click(dialog.querySelector('img'));
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
