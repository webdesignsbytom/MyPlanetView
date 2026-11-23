import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ShareEmbedBox from '@/components/sharing/ShareEmbedBox';

describe('ShareEmbedBox', () => {
  afterEach(() => vi.restoreAllMocks());

  it('says to turn the link on first while the map isn’t shared by link', () => {
    render(<ShareEmbedBox shareCode='K7QX-M2PA-9RTW' name='Our map' linkOn={false} />);
    expect(screen.getByText(/Choose “Anyone with the link” above/)).toBeTruthy();
    expect(document.querySelector('[data-embed-code]')).toBeNull();
  });

  it('gives the code for this site and copies it', async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<ShareEmbedBox shareCode='K7QX-M2PA-9RTW' name='Our map' linkOn />);
    const box = screen.getByLabelText('Code for your website');
    expect(box.value).toContain(`src="${window.location.origin}/embed/K7QX-M2PA-9RTW"`);
    expect(box.value).toContain('Made with My Planet View');
    fireEvent.click(screen.getByText('Copy the code'));
    expect(writeText).toHaveBeenCalledWith(box.value);
    expect(await screen.findByText('Copied')).toBeTruthy();
  });

  it('stays as it was when the clipboard refuses', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('no')) }, configurable: true });
    render(<ShareEmbedBox shareCode='K7QX-M2PA-9RTW' name='Our map' linkOn />);
    fireEvent.click(screen.getByText('Copy the code'));
    await Promise.resolve();
    expect(screen.getByText('Copy the code')).toBeTruthy();
  });
});
