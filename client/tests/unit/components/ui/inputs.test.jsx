import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CheckboxInput from '@/components/ui/CheckboxInput';
import RadioInput from '@/components/ui/RadioInput';
import RadioGroup from '@/components/ui/RadioGroup';
import SwitchInput from '@/components/ui/SwitchInput';
import TextInput, { INPUT_SURFACE_CLASS } from '@/components/ui/TextInput';
import TextAreaInput from '@/components/ui/TextAreaInput';
import PasswordInput from '@/components/ui/PasswordInput';
import StarRatingInput from '@/components/ui/StarRatingInput';
import UploadFileInput from '@/components/ui/UploadFileInput';

describe('CheckboxInput', () => {
  it('is a labelled checkbox in the paperwork colours, never the forms plugin’s blue', () => {
    const onChange = vi.fn();
    render(<CheckboxInput id='c' checked={false} onChange={onChange} label='Leave my photos' ariaDescribedBy='h' />);
    const box = screen.getByLabelText('Leave my photos');
    expect(box.type).toBe('checkbox');
    expect(box.checked).toBe(false);
    expect(box.className).toContain('border-poster-brown');
    expect(box.className).toContain('checked:bg-poster-red-deep');
    // the red ring is for the keyboard only
    expect(box.className).toContain('focus-visible:outline-colour6');
    expect(box.className).not.toMatch(/blue/);
    expect(box.getAttribute('aria-invalid')).toBe('false');
    expect(box.getAttribute('aria-required')).toBeNull();
    expect(box.getAttribute('aria-describedby')).toBe('h');
    fireEvent.click(box);
    expect(onChange).toHaveBeenCalled();
  });

  it('shows required, invalid and disabled', () => {
    render(<CheckboxInput id='c' checked onChange={() => {}} label='Agree' required ariaInvalid disabled />);
    const box = screen.getByLabelText('Agree');
    expect(box.checked).toBe(true);
    expect(box.getAttribute('aria-required')).toBe('true');
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(box.disabled).toBe(true);
    expect(box.parentElement.className).toContain('opacity-50');
    expect(screen.getByText('Agree').className).toContain('cursor-not-allowed');
  });

  it('takes its own accessible name', () => {
    render(<CheckboxInput id='c' checked={false} onChange={() => {}} label='Paris' ariaLabel='Been to Paris' />);
    expect(screen.getByLabelText('Been to Paris').type).toBe('checkbox');
  });
});

describe('RadioInput and RadioGroup', () => {
  it('is a round box in the same colours', () => {
    render(<RadioInput id='r' name='plan' value='YEAR' checked onChange={() => {}} label='Yearly' />);
    const radio = screen.getByLabelText('Yearly');
    expect(radio.type).toBe('radio');
    expect(radio.value).toBe('YEAR');
    expect(radio.className).toContain('rounded-full');
    expect(radio.className).toContain('checked:bg-poster-red-deep');
  });

  it('groups options in a fieldset with its legend, a required star and the choice', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RadioGroup
        legend='How often'
        name='every'
        value='month'
        onChange={onChange}
        required
        ariaDescribedBy='hint'
        options={[
          { value: 'month', label: 'Monthly' },
          { value: 'year', label: 'Yearly', disabled: true },
        ]}
      />,
    );
    const fieldset = container.querySelector('fieldset');
    expect(fieldset.getAttribute('aria-describedby')).toBe('hint');
    expect(fieldset.querySelector('legend').textContent).toBe('How often *');
    expect(screen.getByLabelText('Monthly').checked).toBe(true);
    expect(screen.getByLabelText('Monthly').id).toBe('every-month');
    expect(screen.getByLabelText('Yearly').disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Monthly'));
    expect(screen.getByLabelText('Monthly').getAttribute('aria-required')).toBe('true');
  });
});

describe('SwitchInput', () => {
  it('is a checkbox with the switch role, named by its label', () => {
    const onChange = vi.fn();
    render(<SwitchInput id='s' checked={false} onChange={onChange} label='Show tips' />);
    const toggle = screen.getByRole('switch');
    expect(toggle.getAttribute('aria-label')).toBe('Show tips');
    expect(toggle.type).toBe('checkbox');
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByText('Show tips').tagName).toBe('LABEL');
  });

  it('takes an accessible name with no visible label, and shows disabled', () => {
    render(<SwitchInput id='s' checked onChange={() => {}} ariaLabel='Animated sea' disabled ariaInvalid />);
    const toggle = screen.getByLabelText('Animated sea');
    expect(toggle.checked).toBe(true);
    expect(toggle.disabled).toBe(true);
    expect(toggle.getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelectorAll('label').length).toBe(1);
  });
});

describe('TextInput and TextAreaInput', () => {
  it('draws a text box with the shared surface and passes its attributes on', () => {
    const ref = React.createRef();
    const onChange = vi.fn();
    render(
      <TextInput
        refProp={ref}
        id='t'
        type='email'
        value='a@b.c'
        onChange={onChange}
        autoComplete='email'
        maxLength={80}
        ariaInvalid
        ariaDescribedBy='err'
        placeholder='you@example.com'
        required
      />,
    );
    const input = document.getElementById('t');
    expect(ref.current).toBe(input);
    expect(input.type).toBe('email');
    expect(input.getAttribute('autocomplete')).toBe('email');
    expect(input.maxLength).toBe(80);
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('err');
    expect(input.className).toContain(INPUT_SURFACE_CLASS);
    fireEvent.change(input, { target: { value: 'x@y.z' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('is a text box by default, and not invalid', () => {
    render(<TextInput id='t' value='' onChange={() => {}} />);
    const input = document.getElementById('t');
    expect(input.type).toBe('text');
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('draws a text area of four rows that resizes up and down', () => {
    render(<TextAreaInput id='a' value='Hi' onChange={() => {}} maxLength={500} />);
    const area = document.getElementById('a');
    expect(area.tagName).toBe('TEXTAREA');
    expect(area.rows).toBe(4);
    expect(area.maxLength).toBe(500);
    expect(area.className).toContain('resize-y');
    expect(area.className).toContain(INPUT_SURFACE_CLASS);
  });
});

describe('PasswordInput', () => {
  it('hides the password until shown, and hides it again', () => {
    render(<PasswordInput id='p' value='secret12' onChange={() => {}} />);
    const input = document.getElementById('p');
    expect(input.type).toBe('password');
    expect(input.getAttribute('autocomplete')).toBe('current-password');
    // no dots that look like a password already typed in
    expect(input.getAttribute('placeholder')).toBe('');
    fireEvent.click(screen.getByLabelText('Show password'));
    expect(input.type).toBe('text');
    fireEvent.click(screen.getByLabelText('Hide password'));
    expect(input.type).toBe('password');
  });

  it('takes a new password’s autocomplete and its rule, and locks the eye when disabled', () => {
    render(<PasswordInput id='p' value='' onChange={() => {}} autoComplete='new-password' pattern='.{8,}' title='8 or more' disabled ariaInvalid />);
    const input = document.getElementById('p');
    expect(input.getAttribute('autocomplete')).toBe('new-password');
    expect(input.getAttribute('pattern')).toBe('.{8,}');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Show password').disabled).toBe(true);
  });
});

describe('StarRatingInput', () => {
  it('is a radio group of five stars with the value chosen', () => {
    render(<StarRatingInput id='r' value={3} onChange={() => {}} />);
    const group = screen.getByLabelText('Rating out of 5 stars');
    expect(group.getAttribute('role')).toBe('radiogroup');
    const stars = group.querySelectorAll('[role="radio"]');
    expect(stars.length).toBe(5);
    expect(stars[2].getAttribute('aria-checked')).toBe('true');
    expect(stars[2].getAttribute('tabindex')).toBe('0');
    expect(stars[0].getAttribute('tabindex')).toBe('-1');
    expect(screen.getByLabelText('1 star')).toBeTruthy();
    expect(screen.getByLabelText('5 stars')).toBeTruthy();
  });

  it('chooses by press and by the arrow keys, within 1 to 5', () => {
    const onChange = vi.fn();
    const { rerender } = render(<StarRatingInput value={5} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('2 stars'));
    expect(onChange).toHaveBeenLastCalledWith(2);
    const group = screen.getByLabelText('Rating out of 5 stars');
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(5);
    fireEvent.keyDown(group, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith(4);
    rerender(<StarRatingInput value={1} onChange={onChange} />);
    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(group, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it('does nothing while disabled', () => {
    const onChange = vi.fn();
    render(<StarRatingInput value={3} onChange={onChange} disabled ariaInvalid />);
    fireEvent.keyDown(screen.getByLabelText('Rating out of 5 stars'), { key: 'ArrowRight' });
    fireEvent.click(screen.getByLabelText('4 stars'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Rating out of 5 stars').getAttribute('aria-invalid')).toBe('true');
  });
});

describe('UploadFileInput', () => {
  const setup = (props = {}) => {
    const fileInputRef = React.createRef();
    const onFileSelect = vi.fn();
    const onRemoveFile = vi.fn();
    const view = render(
      <UploadFileInput fileInputRef={fileInputRef} onFileSelect={onFileSelect} onRemoveFile={onRemoveFile} accept='image/*' maxSizeMb={5} {...props} />,
    );
    return { fileInputRef, onFileSelect, onRemoveFile, ...view };
  };

  it('offers a drop zone with the size limit, opening the file picker on a press or Enter', () => {
    const { fileInputRef } = setup();
    const zone = screen.getByLabelText('Click or drop a file to upload');
    expect(zone.textContent).toContain('Click or drop a file (max 5MB)');
    const click = vi.spyOn(fileInputRef.current, 'click').mockImplementation(() => {});
    fireEvent.click(zone);
    fireEvent.keyDown(zone, { key: 'Enter' });
    fireEvent.keyDown(zone, { key: ' ' });
    expect(click).toHaveBeenCalledTimes(3);
    expect(fileInputRef.current.getAttribute('accept')).toBe('image/*');
    expect(screen.getByText('Optional. Images show a preview before you send.').id).toBe(fileInputRef.current.getAttribute('aria-describedby'));
  });

  it('takes a picked or dropped file', () => {
    const { fileInputRef, onFileSelect } = setup();
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    fireEvent.change(fileInputRef.current, { target: { files: [file] } });
    expect(onFileSelect).toHaveBeenCalledWith(file);
    fireEvent.drop(screen.getByLabelText('Click or drop a file to upload'), { dataTransfer: { files: [file] } });
    expect(onFileSelect).toHaveBeenCalledTimes(2);
  });

  it('does nothing while disabled', () => {
    const { fileInputRef, onFileSelect } = setup({ disabled: true });
    const zone = screen.getByLabelText('Click or drop a file to upload');
    expect(zone.getAttribute('aria-disabled')).toBe('true');
    expect(zone.getAttribute('tabindex')).toBe('-1');
    const click = vi.spyOn(fileInputRef.current, 'click').mockImplementation(() => {});
    fireEvent.click(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [new File(['x'], 'a.png')] } });
    expect(click).not.toHaveBeenCalled();
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('previews a chosen image, names any other file, and can change or remove it', () => {
    const image = new File(['x'], 'a.png', { type: 'image/png' });
    const { fileInputRef, onRemoveFile, rerender, onFileSelect } = setup({ attachment: { file: image, previewUrl: 'blob:preview' } });
    expect(screen.queryByLabelText('Click or drop a file to upload')).toBeNull();
    expect(screen.getByAltText('Selected attachment preview').getAttribute('src')).toBe('blob:preview');
    const click = vi.spyOn(fileInputRef.current, 'click').mockImplementation(() => {});
    fireEvent.click(screen.getByLabelText('Change uploaded file'));
    expect(click).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('Remove uploaded file'));
    expect(onRemoveFile).toHaveBeenCalled();
    rerender(
      <UploadFileInput
        fileInputRef={fileInputRef}
        onFileSelect={onFileSelect}
        onRemoveFile={onRemoveFile}
        attachment={{ file: new File(['x'], 'notes.pdf', { type: 'application/pdf' }) }}
        error='Too big.'
      />,
    );
    expect(screen.getByText('notes.pdf').tagName).toBe('STRONG');
    expect(screen.getByText('Too big.')).toBeTruthy();
  });
});
