import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import DesignColourField from '@/components/map/design/DesignColourField';
import DesignCountryRow from '@/components/map/design/DesignCountryRow';
import DesignCountryColours from '@/components/map/design/DesignCountryColours';
import DesignPictureField from '@/components/map/design/DesignPictureField';
import { SplitUkProvider } from '@/hooks/useSplitUk';
import { colourablePlaces } from '@/utils/map/mapDesign';

describe('DesignColourField', () => {
  it('shows the usual colour until one is chosen, and goes back to it', () => {
    const onChange = vi.fn();
    const { rerender } = render(<DesignColourField id='names' label='Country names' value={null} usual='#334455' onChange={onChange} />);
    const input = screen.getByLabelText('Country names');
    expect(input.getAttribute('type')).toBe('color');
    expect(input.value).toBe('#334455');
    expect(screen.getByLabelText('Country names: back to the usual colour').disabled).toBe(true);
    fireEvent.input(input, { target: { value: '#aa0000' } });
    expect(onChange).toHaveBeenCalledWith('#aa0000');
    rerender(<DesignColourField id='names' label='Country names' value='#aa0000' usual='#334455' onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Country names: back to the usual colour'));
    expect(onChange).toHaveBeenLastCalledWith(null);
    // No opacity but the strings'
    expect(screen.queryByLabelText('Country names opacity')).toBeNull();
  });

  // See-through strings (25 Nov 2026, the user's wish): an opacity slider under the picker
  it('with `alpha`, sets the opacity on a slider and keeps it when the colour changes', () => {
    const onChange = vi.fn();
    const field = (value) => <DesignColourField id='string' label='String colour' value={value} usual='#c8102e' onChange={onChange} alpha />;
    const { rerender } = render(field(null));
    const slider = screen.getByLabelText('String colour opacity');
    expect(slider.getAttribute('type')).toBe('range');
    expect(slider.value).toBe('100');
    expect(slider.getAttribute('aria-valuetext')).toBe('100%');
    expect(screen.getByText('100%').tagName).toBe('OUTPUT');
    // From the usual colour: the usual red, half see-through
    fireEvent.change(slider, { target: { value: '50' } });
    expect(onChange).toHaveBeenLastCalledWith('#c8102e80');

    rerender(field('#1d4ed866'));
    expect(screen.getByLabelText('String colour').value).toBe('#1d4ed8');
    expect(slider.value).toBe('40');
    expect(screen.getByText('40%')).toBeTruthy();
    // A new colour keeps the opacity; fully opaque again drops its digits
    fireEvent.input(screen.getByLabelText('String colour'), { target: { value: '#00aa00' } });
    expect(onChange).toHaveBeenLastCalledWith('#00aa0066');
    fireEvent.change(slider, { target: { value: '100' } });
    expect(onChange).toHaveBeenLastCalledWith('#1d4ed8');
    expect(slider.getAttribute('min')).toBe('10');
  });
});

describe('DesignCountryRow', () => {
  it('colours one place and puts it back', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ul>
        <DesignCountryRow code='FR' name='France' colour='#123456' usual='#ffffff' onChange={onChange} />
      </ul>,
    );
    expect(container.querySelector('li').getAttribute('data-design-place')).toBe('FR');
    const input = screen.getByLabelText('Colour of France');
    expect(input.value).toBe('#123456');
    fireEvent.input(input, { target: { value: '#654321' } });
    expect(onChange).toHaveBeenCalledWith('FR', '#654321');
    fireEvent.click(screen.getByLabelText('France: back to the usual colour'));
    expect(onChange).toHaveBeenLastCalledWith('FR', null);
  });

  it('starts from the usual colour, with nothing to put back', () => {
    render(
      <ul>
        <DesignCountryRow code='FR' name='France' colour={null} usual='#ffffff' onChange={() => {}} />
      </ul>,
    );
    expect(screen.getByLabelText('Colour of France').value).toBe('#ffffff');
    expect(screen.getByLabelText('France: back to the usual colour').disabled).toBe(true);
  });
});

describe('DesignCountryColours', { timeout: 20000 }, () => {
  const open = (props = {}, splitUk = false) => {
    const onChange = vi.fn();
    const onResetAll = vi.fn();
    const result = render(
      <SplitUkProvider value={splitUk}>
        <DesignCountryColours countries={{}} usual={{ '--map-visit-1': '#111111', '--map-ice': '#eeeeee' }} onChange={onChange} onResetAll={onResetAll} {...props} />
      </SplitUkProvider>,
    );
    return { ...result, onChange, onResetAll };
  };
  const rows = (container) => container.querySelectorAll('[data-design-place]');

  it('keeps the countries behind a button, saying how many are coloured', () => {
    const { container } = open();
    expect(screen.getByText('Every country in its usual colour')).toBeTruthy();
    const button = screen.getByText('Choose colours');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(rows(container).length).toBe(0);
    fireEvent.click(button);
    expect(rows(container).length).toBe(colourablePlaces(false).length);
    expect(screen.getByText('Hide the countries').getAttribute('aria-expanded')).toBe('true');
    // Antarctica, never a pole
    expect(container.querySelector('[data-design-place="AQ"]')).not.toBeNull();
    expect(container.querySelector('[data-design-place="XN"]')).toBeNull();
  });

  it('lists the UK’s nations on a map that splits it', () => {
    const { container } = open({}, true);
    fireEvent.click(screen.getByText('Choose colours'));
    expect(container.querySelector('[data-design-place="XC"]')).not.toBeNull();
    expect(container.querySelector('[data-design-place="GB"]')).toBeNull();
  });

  it('finds a place by name, accents and case aside', () => {
    const { container } = open();
    fireEvent.click(screen.getByText('Choose colours'));
    fireEvent.change(screen.getByLabelText('Find a country'), { target: { value: 'SAO TOME' } });
    expect([...rows(container)].map((r) => r.getAttribute('data-design-place'))).toEqual(['ST']);
    fireEvent.change(screen.getByLabelText('Find a country'), { target: { value: 'zzz' } });
    expect(screen.getByText('No country is called that.')).toBeTruthy();
  });

  it('counts the places coloured, and puts them all back', () => {
    const { container, onResetAll, onChange } = open({ countries: { FR: '#ff0000', JP: '#00ff00' } });
    expect(screen.getByText(`2 of ${colourablePlaces(false).length} coloured your way`)).toBeTruthy();
    fireEvent.click(screen.getByText('Choose colours'));
    expect(container.querySelector('[data-design-place="FR"] input').value).toBe('#ff0000');
    fireEvent.input(container.querySelector('[data-design-place="PE"] input'), { target: { value: '#0000ff' } });
    expect(onChange).toHaveBeenCalledWith('PE', '#0000ff');
    fireEvent.click(screen.getByText('Every country in its usual colour', { selector: 'button' }));
    expect(onResetAll).toHaveBeenCalled();
  });
});

describe('DesignPictureField', () => {
  const field = (props = {}) => {
    const onChoose = vi.fn();
    const onRemove = vi.fn();
    const result = render(<DesignPictureField picture={null} busy={false} progress={0} locked={false} onChoose={onChoose} onRemove={onRemove} {...props} />);
    return { ...result, onChoose, onRemove, input: result.container.querySelector('[data-design-picture-input]') };
  };

  it('offers to choose a picture for the usual sea', () => {
    const { input } = field();
    expect(screen.getByText(/The usual sea/)).toBeTruthy();
    expect(input.getAttribute('accept')).toBe('image/*');
    expect(input.getAttribute('aria-label')).toBe('Choose a picture for the sea');
    const click = vi.spyOn(input, 'click');
    fireEvent.click(screen.getByText('Choose a picture'));
    expect(click).toHaveBeenCalled();
    expect(screen.queryByText('Remove the picture')).toBeNull();
  });

  it('hands over the file chosen', () => {
    const { input, onChoose } = field();
    const file = new File(['x'], 'sea.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onChoose).toHaveBeenCalledWith(file);
  });

  it('shows the picture there now, to change or remove', () => {
    const { container, onRemove } = field({ picture: { url: 'https://x/sea.webp' } });
    expect(container.querySelector('img').getAttribute('src')).toBe('https://x/sea.webp');
    expect(screen.getByText('Change the picture')).toBeTruthy();
    fireEvent.click(screen.getByText('Remove the picture'));
    expect(onRemove).toHaveBeenCalled();
  });

  it('says how the upload is going', () => {
    field({ busy: true, progress: 0 });
    expect(screen.getByText('Getting the picture ready…')).toBeTruthy();
    field({ busy: true, progress: 0.42 });
    expect(screen.getByText('Uploading the picture: 42%')).toBeTruthy();
  });

  it('locks uploading, not removing, until the address is verified', () => {
    field({ locked: true, picture: { url: 'u' } });
    expect(screen.getByText(/to add a picture/)).toBeTruthy();
    expect(screen.getByText('Change the picture').disabled).toBe(true);
    expect(screen.getByText('Remove the picture').disabled).toBe(false);
  });
});
