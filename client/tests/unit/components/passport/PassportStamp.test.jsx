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
  const stamp = props.stamp || stampOf();
  const view = render(
    <ul>
      <PassportStamp stamp={stamp} onOpenPhoto={onOpenPhoto} {...props} />
    </ul>,
  );
  return { ...view, stamp, onOpenPhoto };
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

  // 23 Nov 2026: a landmark ticked "been here" with no photo is a stamp with nothing to open
  it('shows a ticked stamp with no photo as a picture, nothing to press or choose', () => {
    const { container, onOpenPhoto } = show({ stamp: stampOf({ photo: null, ticked: true, photoCount: 0, photoChosen: false }) });
    expect(container.querySelector('button')).toBeNull();
    const stamp = container.querySelector('[role="img"]');
    expect(stamp.getAttribute('aria-label')).toBe('Stamp: Colosseum');
    expect(document.getElementById(stamp.getAttribute('aria-describedby')).textContent).toBe(
      'Colosseum, stamped 2 Jun 2019, UNESCO World Heritage Site, ticked as been here, no photo yet.',
    );
    expect(container.querySelector('li').hasAttribute('data-stamp-ticked')).toBe(true);
    expect(onOpenPhoto).not.toHaveBeenCalled();
  });

  // 24 Nov 2026, the user's wish: nobody picks a stamp's photo in the passport
  it('has no “Choose photo”, whatever the stamp, and doesn’t mention a photo picked before', () => {
    const { container } = show({ stamp: stampOf({ photoChosen: true, isUnesco: false, photoCount: 4, stampedOn: null }) });
    expect(screen.queryByText('Choose photo')).toBeNull();
    expect(container.querySelectorAll('button')).toHaveLength(1);
    const button = screen.getByText('Open the photo of Colosseum').closest('button');
    expect(document.getElementById(button.getAttribute('aria-describedby')).textContent).toBe('Colosseum, stamped, 4 photos.');
  });
});
