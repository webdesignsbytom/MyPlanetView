import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppAnchor from '@/components/common/AppAnchor';
import AppLink from '@/components/common/AppLink';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { FULL_BUSINESS_URL } from '@/utils/constants/constants';

describe('AppAnchor', () => {
  it('is a plain link with only the attributes given', () => {
    render(<AppAnchor href='/about'>About</AppAnchor>);
    const link = screen.getByText('About');
    expect(link.getAttribute('href')).toBe('/about');
    for (const attr of ['aria-label', 'title', 'target', 'rel', 'referrerpolicy', 'itemprop']) {
      expect(link.getAttribute(attr)).toBeNull();
    }
  });

  it('gives a new-tab link noopener noreferrer unless told otherwise', () => {
    render(
      <>
        <AppAnchor href='https://a.example' target='_blank'>
          A
        </AppAnchor>
        <AppAnchor href='https://b.example' target='_blank' rel='sponsored noopener'>
          B
        </AppAnchor>
      </>,
    );
    expect(screen.getByText('A').getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getByText('B').getAttribute('rel')).toBe('sponsored noopener');
  });

  it('carries its label, current page, title, referrer policy and click', () => {
    const onClick = vi.fn((e) => e.preventDefault());
    render(
      <AppAnchor href='/x' ariaLabel='Go home' ariaCurrent='page' titleAttr='Home' referrerPolicy='no-referrer' itemProp='url' onClick={onClick}>
        X
      </AppAnchor>,
    );
    const link = screen.getByLabelText('Go home');
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.getAttribute('title')).toBe('Home');
    expect(link.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(link.getAttribute('itemprop')).toBe('url');
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalled();
  });
});

describe('AppLink', () => {
  it('names a link by its description', () => {
    render(
      <MemoryRouter>
        <AppLink to='/faq' label='FAQ' description='the questions page' />
      </MemoryRouter>,
    );
    const link = screen.getByText('FAQ');
    expect(link.getAttribute('href')).toBe('/faq');
    expect(link.getAttribute('aria-label')).toBe('Go to the questions page');
    expect(link.getAttribute('title')).toBe('the questions page');
    expect(link.className).toContain('text-colour6');
  });

  it('prefers its own label and title, and has neither without', () => {
    render(
      <MemoryRouter>
        <AppLink to='/a' label='A' ariaLabel='Alpha' titleAttr='First' className='mine' />
        <AppLink to='/b' label='B' />
      </MemoryRouter>,
    );
    const a = screen.getByText('A');
    expect(a.getAttribute('aria-label')).toBe('Alpha');
    expect(a.getAttribute('title')).toBe('First');
    expect(a.className).toBe('mine');
    expect(screen.getByText('B').getAttribute('aria-label')).toBeNull();
    expect(screen.getByText('B').getAttribute('title')).toBeNull();
  });
});

describe('Breadcrumbs', () => {
  const items = [
    { name: 'Home', href: '/' },
    { name: 'Countries', href: '/countries' },
    { name: 'France', href: '/countries/france' },
  ];

  it('draws nothing for fewer than two usable crumbs', () => {
    const { container } = render(
      <MemoryRouter>
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: '', href: '/x' }]} />
      </MemoryRouter>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('links every crumb but the current page, and gives the same trail as structured data', () => {
    const { container } = render(
      <MemoryRouter>
        <Breadcrumbs items={items} />
      </MemoryRouter>,
    );
    const nav = screen.getByLabelText('Breadcrumb');
    expect(nav.querySelectorAll('li').length).toBe(3);
    expect(screen.getByText('Countries').getAttribute('href')).toBe('/countries');
    const current = screen.getByText('France');
    expect(current.tagName).toBe('SPAN');
    expect(current.getAttribute('aria-current')).toBe('page');
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]').textContent);
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement.map((item) => [item.position, item.name, item.item])).toEqual([
      [1, 'Home', `${FULL_BUSINESS_URL}/`],
      [2, 'Countries', `${FULL_BUSINESS_URL}/countries`],
      [3, 'France', `${FULL_BUSINESS_URL}/countries/france`],
    ]);
  });
});
