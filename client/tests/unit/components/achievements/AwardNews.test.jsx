import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import AwardNews from '@/components/achievements/AwardNews';

const BADGE = [{ type: 'badge', key: 'countries-10' }];

const show = (news = BADGE) => {
  const onOpen = vi.fn();
  const onDismiss = vi.fn();
  const view = render(<AwardNews news={news} onOpen={onOpen} onDismiss={onDismiss} />);
  return { ...view, onOpen, onDismiss, region: view.container.querySelector('[role="status"]') };
};

describe('AwardNews', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('keeps an empty polite status region when there is no news', () => {
    const { region, onDismiss } = show([]);
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.textContent).toBe('');
    act(() => vi.advanceTimersByTime(40000));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('says what was earned, badges and goals together', () => {
    const { region } = show([
      { type: 'badge', key: 'countries-10' },
      { type: 'badge', key: 'continent-asia' },
      { type: 'goal', goal: { kind: 'COUNTRY_COUNT', target: 5, title: 'Our bucket list' } },
    ]);
    expect(region.textContent).toContain('New badges: Ten countries and Asia.');
    expect(region.textContent).toContain('Goal reached: Our bucket list.');
  });

  it('goes by itself after twenty seconds, not before', () => {
    const { onDismiss } = show();
    act(() => vi.advanceTimersByTime(19999));
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('stays while the pointer is on it, and goes soon after it leaves', () => {
    const { container, onDismiss } = show();
    const tag = container.querySelector('.ticket-edge');
    fireEvent.pointerEnter(tag);
    act(() => vi.advanceTimersByTime(60000));
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.pointerLeave(tag);
    act(() => vi.advanceTimersByTime(1500));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('stays while one of its buttons has focus', () => {
    const { onDismiss } = show();
    const open = screen.getByText('See badges and goals');
    fireEvent.focus(open);
    act(() => vi.advanceTimersByTime(30000));
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.blur(open);
    act(() => vi.advanceTimersByTime(1500));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('opens the panel and closes with its stamp', () => {
    const { onOpen, onDismiss } = show();
    fireEvent.click(screen.getByText('See badges and goals'));
    expect(onOpen).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('takes the pointer only with its buttons', () => {
    const { region } = show();
    expect(region.className).toContain('pointer-events-none');
    expect(screen.getByText('See badges and goals').className).toContain('pointer-events-auto');
    expect(screen.getByLabelText('Dismiss').parentElement.className).toContain('pointer-events-auto');
  });

  it('starts the timer again for a new note', () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<AwardNews news={BADGE} onOpen={vi.fn()} onDismiss={onDismiss} />);
    act(() => vi.advanceTimersByTime(16000));
    rerender(<AwardNews news={[{ type: 'badge', key: 'landmarks-1' }]} onOpen={vi.fn()} onDismiss={onDismiss} />);
    act(() => vi.advanceTimersByTime(16000));
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(4000));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
