import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import LegalArticle from '@/components/legal/LegalArticle';
import LegalContents from '@/components/legal/LegalContents';
import LegalContentsGroup from '@/components/legal/LegalContentsGroup';

const TERMS = { using: [{ id: 'accounts', title: 'Your account' }, { id: 'plans', title: 'Plans and prices' }] };
const PRIVACY = { data: [{ id: 'what-we-keep', title: 'What we keep' }], mystery: [{ id: 'other', title: 'Other' }] };
const LABELS = { using: 'Using the site', data: 'Your data' };

describe('LegalArticle', () => {
  it('is an article with its anchor id, named by its h3, a paragraph per line', () => {
    const { container } = render(<LegalArticle id='plans' title='Plans and prices' content={['First.', 'Second.']} />);
    const article = container.querySelector('article');
    expect(article.id).toBe('plans');
    expect(article.getAttribute('aria-labelledby')).toBe('plans-title');
    expect(container.querySelector('h3#plans-title').textContent).toBe('Plans and prices');
    expect([...container.querySelectorAll('p')].map((p) => p.textContent)).toEqual(['First.', 'Second.']);
  });
});

describe('LegalContentsGroup', () => {
  it('lists each group under its label (or its key), each section a jump link', () => {
    const onJump = vi.fn();
    const { container } = render(
      <ul>
        <LegalContentsGroup title='Privacy & Data' groups={PRIVACY} groupLabels={LABELS} onJump={onJump} isCurrent={(id) => id === 'other'} />
      </ul>,
    );
    expect(container.querySelector('h3').textContent).toBe('Privacy & Data');
    expect([...container.querySelectorAll('h4')].map((h) => h.textContent)).toEqual(['Your data', 'mystery']);
    const links = [...container.querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#what-we-keep', '#other']);
    expect(links[0].getAttribute('aria-current')).toBeNull();
    expect(links[1].getAttribute('aria-current')).toBe('true');
    fireEvent.click(links[0]);
    expect(onJump).toHaveBeenCalledWith(expect.anything(), 'what-we-keep');
  });
});

describe('LegalContents', () => {
  it('is a nav titled Contents, with both documents and every section', () => {
    const onJump = vi.fn();
    const { container } = render(
      <LegalContents termsGroups={TERMS} privacyGroups={PRIVACY} groupLabels={LABELS} onJump={onJump} isCurrent={(id) => id === 'privacy-policy'} />,
    );
    const nav = container.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(container.querySelector('#legal-contents-title').textContent).toBe('Contents');
    const top = [...nav.querySelectorAll('a')].slice(0, 2);
    expect(top.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Terms & Conditions', '#terms-and-conditions'],
      ['Privacy & Data', '#privacy-policy'],
    ]);
    expect(top[0].getAttribute('aria-current')).toBeNull();
    expect(top[1].getAttribute('aria-current')).toBe('true');
    expect(nav.querySelectorAll('a').length).toBe(2 + 2 + 2);
    fireEvent.click(top[0]);
    expect(onJump).toHaveBeenCalledWith(expect.anything(), 'terms-and-conditions');
  });
});
