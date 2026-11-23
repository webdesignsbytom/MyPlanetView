import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import FaqComponent from '@/components/faq/FaqComponent';
import FaqItem from '@/components/faq/FaqItem';
import FaqPageHeader from '@/components/faq/FaqPageHeader';
import { faqsArray } from '@/utils/data/faqData';
import { renderPage } from '../../pages/renderPage';

const questions = (container) => [...container.querySelectorAll('button[aria-controls]')];

describe('FaqItem', () => {
  it('is a button in a heading that controls its answer region', () => {
    const onToggle = vi.fn();
    const { container } = render(<FaqItem index={3} question='Who sees my map?' answer='Only you.' isOpen={false} onToggle={onToggle} />);
    const button = container.querySelector('h3 > button');
    expect(button.id).toBe('faq-question-3');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe('faq-answer-3');
    expect(button.textContent).toContain('+');
    const region = container.querySelector('#faq-answer-3');
    expect(region.getAttribute('role')).toBe('region');
    expect(region.getAttribute('aria-labelledby')).toBe('faq-question-3');
    // A closed answer stays in the page, for crawlers and the structured data
    expect(region.textContent).toBe('Only you.');
    expect(region.className).toContain('max-h-0');
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledWith(3);
  });

  it('shows the open state', () => {
    const { container } = render(<FaqItem index={0} question='Q' answer='A' isOpen onToggle={() => {}} />);
    expect(container.querySelector('button').getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('button').textContent).toContain('−');
    expect(container.querySelector('#faq-answer-0').className).not.toContain('max-h-0');
  });
});

describe('FaqComponent', () => {
  it('lists every question, all closed', () => {
    const { container } = render(<FaqComponent />);
    expect(container.querySelector('#faq-list-title').textContent).toBe('Frequently asked questions');
    const buttons = questions(container);
    expect(buttons.length).toBe(faqsArray.length);
    expect(buttons[0].textContent).toContain(faqsArray[0].question);
    expect(buttons.every((button) => button.getAttribute('aria-expanded') === 'false')).toBe(true);
  });

  it('opens one answer at a time, and closes it again', () => {
    const { container } = render(<FaqComponent />);
    const buttons = questions(container);
    fireEvent.click(buttons[0]);
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(buttons[1]);
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
    expect(buttons[1].getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(buttons[1]);
    expect(buttons[1].getAttribute('aria-expanded')).toBe('false');
  });
});

describe('FaqPageHeader', () => {
  it('is the page’s h1 with its subtitle', () => {
    const { container } = renderPage(<FaqPageHeader />);
    expect(container.querySelector('h1#faq-title').textContent).toContain('Frequently asked questions');
    expect(container.querySelector('#faq-subtitle').textContent).toContain('Who can see your map');
  });
});
