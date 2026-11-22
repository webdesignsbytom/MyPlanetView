import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';

const field = (props = {}, inputProps = {}) =>
  render(
    <FormField id='name' label='Your name' {...props}>
      <TextInput value='' onChange={() => {}} {...inputProps} />
    </FormField>,
  );

describe('FormField', () => {
  it('labels its input and gives it the id', () => {
    field();
    expect(screen.getByLabelText('Your name').id).toBe('name');
  });

  it('marks a required field with a star hidden from screen readers', () => {
    const { container } = field({ required: true });
    expect(container.querySelector('label span[aria-hidden="true"]').textContent.trim()).toBe('*');
  });

  it('describes the input by its hint and its error', () => {
    field({ hint: 'As on your passport', error: 'Please give your name' });
    const input = screen.getByLabelText('Your name');
    expect(input.getAttribute('aria-describedby')).toBe('name-hint name-error');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById('name-error').getAttribute('role')).toBe('alert');
  });

  it('marks the input invalid without a message when the error is just true', () => {
    field({ error: true });
    const input = screen.getByLabelText('Your name');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.hasAttribute('aria-describedby')).toBe(false);
  });

  it('keeps a description the input was given itself, before its own hint', () => {
    render(<p id='locked-note'>Locked</p>);
    field({ hint: 'As on your passport' }, { ariaDescribedBy: 'locked-note' });
    expect(screen.getByLabelText('Your name').getAttribute('aria-describedby')).toBe('locked-note name-hint');
  });

  it('keeps an invalid mark the input was given itself', () => {
    field({}, { ariaInvalid: true });
    expect(screen.getByLabelText('Your name').getAttribute('aria-invalid')).toBe('true');
  });

  it('lines the label up on the left for side-by-side forms', () => {
    const { container } = field({ align: 'start' });
    expect(container.querySelector('label').className).toContain('text-left');
  });
});
