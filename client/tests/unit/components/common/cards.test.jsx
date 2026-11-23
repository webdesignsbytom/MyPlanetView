import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PaperCard from '@/components/common/PaperCard';
import PageTitleCard from '@/components/common/PageTitleCard';
import PaperStripHeader from '@/components/common/PaperStripHeader';
import { CompanyName } from '@/utils/constants/constants';

describe('PaperCard', () => {
  it('is a section named by its title strip, with an h2 by default', () => {
    const { container } = render(
      <PaperCard title='Your plan' titleId='plan-title' kicker='Account'>
        <p>Body</p>
      </PaperCard>,
    );
    const card = container.firstChild;
    expect(card.tagName).toBe('SECTION');
    expect(card.getAttribute('aria-labelledby')).toBe('plan-title');
    const heading = document.getElementById('plan-title');
    expect(heading.tagName).toBe('H2');
    expect(heading.textContent).toBe('Your plan');
    expect(screen.getByText('Account')).toBeTruthy();
    expect(screen.getByText('Body').parentElement.className).toContain('gap-4');
  });

  it('puts its action at the end of the title strip', () => {
    render(
      <PaperCard title='Contact forms' titleId='t' action={<button type='button'>Delete all</button>}>
        <p>List</p>
      </PaperCard>,
    );
    const header = screen.getByText('Contact forms').closest('header');
    expect(header.contains(screen.getByText('Delete all'))).toBe(true);
    expect(header.className).toContain('grid-cols-[minmax(0,1fr)_auto]');
  });

  it('takes h1 when it is all the page shows, and other levels', () => {
    render(
      <>
        <PaperCard title='Not found' titleId='a' headingLevel={1} />
        <PaperCard title='Small' titleId='b' headingLevel={3} />
      </>,
    );
    expect(document.getElementById('a').tagName).toBe('H1');
    expect(document.getElementById('b').tagName).toBe('H3');
  });

  it('has no strip or name without a title, and takes its own element, header and gap', () => {
    const { container } = render(
      <PaperCard as='article' header={<div data-own-header>Mine</div>} bodyClassName='gap-8' data-extra='yes'>
        <p>Body</p>
      </PaperCard>,
    );
    const card = container.firstChild;
    expect(card.tagName).toBe('ARTICLE');
    expect(card.getAttribute('aria-labelledby')).toBeNull();
    expect(card.getAttribute('data-extra')).toBe('yes');
    expect(card.querySelector('[data-own-header]')).toBeTruthy();
    expect(card.querySelector('header')).toBeNull();
    expect(screen.getByText('Body').parentElement.className).toContain('gap-8');
  });
});

describe('PageTitleCard', () => {
  it('shows the kicker, the page’s one h1 and its subtitle', () => {
    const ref = React.createRef();
    render(
      <PageTitleCard
        page='Account'
        title='Your account'
        headingId='h'
        headingRef={ref}
        headingProps={{ tabIndex: -1 }}
        subtitle='Everything about you.'
        subtitleId='s'
      />,
    );
    expect(screen.getByText(`${CompanyName} · Account`)).toBeTruthy();
    const heading = document.getElementById('h');
    expect(heading.tagName).toBe('H1');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(ref.current).toBe(heading);
    expect(document.getElementById('s').textContent).toBe('Everything about you.');
    expect(document.querySelectorAll('h1').length).toBe(1);
  });

  it('is a whole card alone and a strip when embedded, with an optional stamp', () => {
    const { container, rerender } = render(<PageTitleCard page='Admin' title='Users' stamp={['Admit', 'one']} />);
    const header = container.querySelector('header');
    expect(header.className).toContain('ticket-edge');
    expect(container.querySelector('[aria-hidden="true"]').textContent).toBe('Admitone');
    rerender(<PageTitleCard page='Admin' title='Users' embedded />);
    expect(container.querySelector('header').className).toContain('border-dashed');
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});

describe('PaperStripHeader', () => {
  it('shows the title as a heading and closes with its stamp', () => {
    const onClose = vi.fn();
    const ref = React.createRef();
    render(<PaperStripHeader titleId='t' title='Settings' headingRef={ref} onClose={onClose} closeLabel='Close settings' headingLevel={3} />);
    const heading = document.getElementById('t');
    expect(heading.tagName).toBe('H3');
    // focusable from code only, when the panel opens
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(ref.current).toBe(heading);
    fireEvent.click(screen.getByLabelText('Close settings'));
    expect(onClose).toHaveBeenCalled();
  });

  it('isn’t focusable without a heading ref', () => {
    render(<PaperStripHeader titleId='t' title='Box' onClose={() => {}} closeLabel='Close' />);
    expect(document.getElementById('t').getAttribute('tabindex')).toBeNull();
    expect(document.getElementById('t').tagName).toBe('H2');
  });
});
