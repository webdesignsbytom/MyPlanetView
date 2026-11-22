import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PassportStamp from '@/components/passport/PassportStamp';

const stampOf = (over = {}) => ({
  landmarkId: 'lm-1',
  name: 'Colosseum',
  stampedOn: '2019-06-02',
  isUnesco: true,
  photoCount: 3,
  photoChosen: false,
  photo: { id: 'photo-9', thumbUrl: 'https://photos.test/colosseum.jpg' },
  ...over,
});

const show = (props = {}) => {
  const onOpenPhoto = vi.fn();
  const onPickPhoto = vi.fn();
  const stamp = props.stamp || stampOf();
  const view = render(
    <ul>
      <PassportStamp stamp={stamp} onOpenPhoto={onOpenPhoto} onPickPhoto={onPickPhoto} {...props} />
    </ul>,
  );
  return { ...view, stamp, onOpenPhoto, onPickPhoto };
};

describe('PassportStamp', () => {
  it('opens the stamp’s photo when the stamp is pressed', () => {
    const { onOpenPhoto } = show();
    const button = screen.getByText('Open the photo of Colosseum').closest('button');
    expect(button.getAttribute('title')).toBe('Colosseum');
    fireEvent.click(button);
    expect(onOpenPhoto).toHaveBeenCalledWith('photo-9');
  });

  it('describes the stamp in words for screen readers', () => {
    show();
    const button = screen.getByText('Open the photo of Colosseum').closest('button');
    const description = document.getElementById(button.getAttribute('aria-describedby'));
    expect(description.textContent).toBe('Colosseum, stamped 2 Jun 2019, UNESCO World Heritage Site, 3 photos.');
  });

  it('says when its photo was chosen by hand', () => {
    show({ stamp: stampOf({ photoChosen: true, isUnesco: false, photoCount: 1, stampedOn: null }) });
    const button = screen.getByText('Open the photo of Colosseum').closest('button');
    expect(document.getElementById(button.getAttribute('aria-describedby')).textContent).toBe('Colosseum, stamped, 1 photo, its photo chosen.');
  });

  it('offers editors “Choose photo” when the landmark has more than one photo', () => {
    const { stamp, onPickPhoto } = show({ canPick: true });
    const choose = screen.getByLabelText('Choose the photo for Colosseum');
    expect(choose.textContent).toBe('Choose photo');
    fireEvent.click(choose);
    expect(onPickPhoto).toHaveBeenCalledWith(stamp);
  });

  it('offers it with one photo only when a photo was picked (to go back to the first)', () => {
    show({ canPick: true, stamp: stampOf({ photoCount: 1 }) });
    expect(screen.queryByLabelText('Choose the photo for Colosseum')).toBeNull();
    show({ canPick: true, stamp: stampOf({ photoCount: 1, photoChosen: true, name: 'Pantheon' }) });
    expect(screen.getByLabelText('Choose the photo for Pantheon')).toBeTruthy();
  });

  it('never offers it to viewers', () => {
    show({ canPick: false });
    expect(screen.queryByText('Choose photo')).toBeNull();
  });

  it('locks it for an editor who must verify their email first', () => {
    const { onPickPhoto } = show({ canPick: true, locked: true });
    const choose = screen.getByLabelText('Choose the photo for Colosseum');
    expect(choose.disabled).toBe(true);
    fireEvent.click(choose);
    expect(onPickPhoto).not.toHaveBeenCalled();
  });
});
