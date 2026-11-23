import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { FaPlane } from 'react-icons/fa';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import GroupedOptionSelect from '@/components/ui/GroupedOptionSelect';
import RichOptionSelect from '@/components/ui/RichOptionSelect';

// React warns in development about a <button> inside a <select> (the customizable select's
// closed box); the browser draws it rightly, so the warning is quietened here
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const LONG = 'The Historic Centre of the City of Salzburg and its Gardens';
const PLAIN = ['France', { value: 'IT', label: 'Italy' }, { value: 'AT', label: LONG }, { value: 'XX', label: 'Closed', disabled: true }];
const GROUPS = [
  { label: 'Europe', options: ['France', { value: 'IT', label: 'Italy' }] },
  { label: 'Special places', options: [{ value: 'AQ', label: 'Antarctica', disabled: true }] },
];
const RICH = [
  { value: 'animated', label: 'World map', description: 'The standard map', icon: FaPlane },
  { value: 'mono', label: 'Black and white' },
];

describe('PlainOptionSelect', () => {
  it('lists strings and objects as options, a disabled one too', () => {
    render(<PlainOptionSelect id='s' value='IT' onChange={() => {}} options={PLAIN} ariaLabel='Country' />);
    const select = screen.getByLabelText('Country');
    const options = [...select.querySelectorAll('option')];
    expect(options.map((o) => [o.value, o.textContent])).toEqual([
      ['France', 'France'],
      ['IT', 'Italy'],
      ['AT', LONG],
      ['XX', 'Closed'],
    ]);
    expect(options[3].disabled).toBe(true);
    expect(select.value).toBe('IT');
    expect(select.className).toContain('app-select');
  });

  it('puts the chosen option’s full name in the closed box’s title', () => {
    const { rerender } = render(<PlainOptionSelect value='AT' onChange={() => {}} options={PLAIN} ariaLabel='Country' />);
    expect(screen.getByLabelText('Country').getAttribute('title')).toBe(LONG);
    rerender(<PlainOptionSelect value='France' onChange={() => {}} options={PLAIN} ariaLabel='Country' />);
    expect(screen.getByLabelText('Country').getAttribute('title')).toBe('France');
    rerender(<PlainOptionSelect value='' onChange={() => {}} options={PLAIN} ariaLabel='Country' placeholder='Choose…' />);
    const select = screen.getByLabelText('Country');
    expect(select.getAttribute('title')).toBeNull();
    const placeholder = select.querySelector('option[value=""]');
    expect(placeholder.textContent).toBe('Choose…');
    expect(placeholder.disabled).toBe(true);
    expect(placeholder.hidden).toBe(true);
  });

  it('draws the one-line closed box once hydrated, and never in the pre-rendered HTML', () => {
    render(<PlainOptionSelect value='IT' onChange={() => {}} options={PLAIN} ariaLabel='Country' />);
    const select = screen.getByLabelText('Country');
    expect(select.querySelector('button selectedcontent')).toBeTruthy();
    const html = renderToString(<PlainOptionSelect value='IT' onChange={() => {}} options={PLAIN} ariaLabel='Country' />);
    expect(html).not.toContain('selectedcontent');
    expect(html).not.toContain('<button');
  });

  it('passes on its state and its changes', () => {
    const onChange = vi.fn();
    render(
      <PlainOptionSelect value='IT' onChange={onChange} options={PLAIN} ariaLabel='Country' required disabled ariaInvalid ariaDescribedBy='help' name='c' />,
    );
    const select = screen.getByLabelText('Country');
    expect(select.required).toBe(true);
    expect(select.disabled).toBe(true);
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(select.getAttribute('aria-describedby')).toBe('help');
    expect(select.name).toBe('c');
  });

  it('calls onChange with the choice', () => {
    const onChange = vi.fn((e) => e.target.value);
    render(<PlainOptionSelect value='IT' onChange={onChange} options={PLAIN} ariaLabel='Country' />);
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'France' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.results[0].value).toBe('France');
    expect(screen.getByLabelText('Country').getAttribute('aria-invalid')).toBe('false');
  });
});

describe('GroupedOptionSelect', () => {
  it('lists the options under their group headings', () => {
    render(<GroupedOptionSelect value='IT' onChange={() => {}} groups={GROUPS} ariaLabel='Place' />);
    const select = screen.getByLabelText('Place');
    const groups = [...select.querySelectorAll('optgroup')];
    expect(groups.map((g) => g.label)).toEqual(['Europe', 'Special places']);
    expect([...groups[0].querySelectorAll('option')].map((o) => o.textContent)).toEqual(['France', 'Italy']);
    expect(groups[1].querySelector('option').disabled).toBe(true);
  });

  it('names the choice in its title, from any group', () => {
    const { rerender } = render(<GroupedOptionSelect value='AQ' onChange={() => {}} groups={GROUPS} ariaLabel='Place' />);
    expect(screen.getByLabelText('Place').getAttribute('title')).toBe('Antarctica');
    rerender(<GroupedOptionSelect value='nothing' onChange={() => {}} groups={GROUPS} ariaLabel='Place' />);
    expect(screen.getByLabelText('Place').getAttribute('title')).toBeNull();
  });

  it('draws the closed box only after hydration', () => {
    render(<GroupedOptionSelect value='IT' onChange={() => {}} groups={GROUPS} ariaLabel='Place' placeholder='Pick' />);
    expect(screen.getByLabelText('Place').querySelector('button selectedcontent')).toBeTruthy();
    const html = renderToString(<GroupedOptionSelect value='IT' onChange={() => {}} groups={GROUPS} ariaLabel='Place' />);
    expect(html).not.toContain('selectedcontent');
  });
});

describe('RichOptionSelect', () => {
  it('gives each option its icon, title and description', () => {
    render(<RichOptionSelect value='animated' onChange={() => {}} options={RICH} ariaLabel='Map style' />);
    const select = screen.getByLabelText('Map style');
    const [first, second] = select.querySelectorAll('option');
    expect(first.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(first.querySelector('.app-select-option-description').textContent).toBe('The standard map');
    // a plain browser reads "Title – description"
    expect(first.textContent).toBe('World map – The standard map');
    expect(second.querySelector('svg')).toBeNull();
    expect(second.textContent).toBe('Black and white');
  });

  it('draws the closed box only after hydration', () => {
    render(<RichOptionSelect value='mono' onChange={() => {}} options={RICH} ariaLabel='Map style' />);
    expect(screen.getByLabelText('Map style').querySelector('button selectedcontent')).toBeTruthy();
    const html = renderToString(<RichOptionSelect value='mono' onChange={() => {}} options={RICH} ariaLabel='Map style' />);
    expect(html).not.toContain('selectedcontent');
  });
});
