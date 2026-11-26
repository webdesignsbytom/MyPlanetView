import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MapPanel from '@/components/map/MapPanel';
import MapPanelFallback from '@/components/map/MapPanelFallback';
import MapOverlayBoundary from '@/components/map/MapOverlayBoundary';

describe('MapPanel', () => {
  it('is a non-modal dialog named by its heading, which takes focus', async () => {
    render(
      <MapPanel title='Travel statistics' onClose={() => {}}>
        <p>Body</p>
      </MapPanel>,
    );
    const panel = document.querySelector('[data-map-panel]');
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('false');
    const heading = document.getElementById(panel.getAttribute('aria-labelledby'));
    expect(heading.textContent).toBe('Travel statistics');
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(screen.getByText('Body')).toBeTruthy();
  });

  it('closes with its stamp and with Escape', () => {
    const onClose = vi.fn();
    render(<MapPanel title='Trips' onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close Trips'));
    fireEvent.keyDown(document.querySelector('[data-map-panel]'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('is 28.5rem wide, Settings 37.5rem and the photo album 76% of a large screen', () => {
    const width = (props) => {
      const { unmount } = render(<MapPanel title='X' onClose={() => {}} {...props} />);
      const cls = document.querySelector('[data-map-panel]').getAttribute('class');
      unmount();
      return cls;
    };
    expect(width({})).toContain('nophone:w-[28.5rem]');
    expect(width({ roomy: true })).toContain('nophone:w-[37.5rem]');
    expect(width({ wide: true })).toContain('lg:w-[76vw]');
  });

  it('puts a footer under a perforation, and stretches one child with `fill`', () => {
    const { container } = render(
      <MapPanel title='X' onClose={() => {}} fill footer={<span>Foot</span>}>
        <p>Body</p>
      </MapPanel>,
    );
    expect(container.querySelector('footer').textContent).toBe('Foot');
    expect(screen.getByText('Body').parentElement.getAttribute('class')).toContain('content-stretch');
  });
});

describe('MapPanelFallback', () => {
  it('shows a spinner that takes no focus while the code is on its way', () => {
    const { container } = render(<MapPanelFallback />);
    expect(container.firstChild.getAttribute('role')).toBe('status');
    expect(container.querySelector('[data-map-panel]')).toBeNull();
  });

  it('says it couldn’t open, in a panel that closes', () => {
    const onClose = vi.fn();
    render(<MapPanelFallback failed onClose={onClose} />);
    expect(screen.getByRole('alert').textContent).toContain('couldn’t be opened');
    fireEvent.click(screen.getByLabelText('Close Not opened'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('MapOverlayBoundary', () => {
  it('shows its dialog', () => {
    render(
      <MapOverlayBoundary onClose={() => {}}>
        <p>Dialog</p>
      </MapOverlayBoundary>,
    );
    expect(screen.getByText('Dialog')).toBeTruthy();
  });

  it('says "Not opened" when the dialog fails, instead of taking the page down', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const Broken = () => {
      throw new Error('chunk failed');
    };
    const onClose = vi.fn();
    render(
      <MapOverlayBoundary onClose={onClose}>
        <Broken />
      </MapOverlayBoundary>,
    );
    expect(screen.getByText('Not opened')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Close Not opened'));
    expect(onClose).toHaveBeenCalled();
  });
});
