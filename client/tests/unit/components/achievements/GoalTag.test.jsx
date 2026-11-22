import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import GoalTag from '@/components/achievements/GoalTag';

const goal = (id, have, need, extra = {}) => ({ id, kind: 'COUNTRY_COUNT', target: need, progress: { have, need }, createdAt: `2026-01-0${id}`, ...extra });
const BADGES = [{ key: 'a', earnedAt: '2026-01-01' }, { key: 'b' }, { key: 'c', earnedAt: '2026-02-01' }, { key: 'd' }];

const show = (props) => {
  const onOpen = vi.fn();
  const onIntent = vi.fn();
  const view = render(<GoalTag goals={[]} badges={BADGES} onOpen={onOpen} onIntent={onIntent} {...props} />);
  const tag = view.container.querySelector('.paper-aged');
  return { ...view, onOpen, onIntent, tag };
};

describe('GoalTag', () => {
  it('shows nothing until the goals and badges are in', () => {
    expect(render(<GoalTag goals={null} badges={BADGES} onOpen={vi.fn()} />).container.innerHTML).toBe('');
    expect(render(<GoalTag goals={[]} badges={null} onOpen={vi.fn()} />).container.innerHTML).toBe('');
  });

  it('shows the unmet goal nearest done, skipping reached and missed ones', () => {
    const { tag } = show({
      goals: [
        goal(1, 2, 10),
        goal(2, 8, 10),
        goal(3, 9, 10, { achievedAt: '2026-03-01' }),
        goal(4, 9, 10, { progress: { have: 9, need: 10, missed: true } }),
      ],
    });
    expect(tag.textContent).toContain('Next goal');
    expect(tag.textContent).toContain('10 countries');
    expect(tag.textContent).toContain('8 of 10 countries');
    expect(tag.getAttribute('aria-label')).toBe('Next goal: 10 countries, 8 of 10 countries. Open badges and goals');
    expect(tag.querySelector('span[style]').style.width).toBe('80%');
  });

  it('on a tie, shows the one with the earlier deadline', () => {
    const { tag } = show({
      goals: [goal(1, 5, 10, { title: 'No date' }), goal(2, 5, 10, { title: 'Late', deadline: '2027-12-31' }), goal(3, 5, 10, { title: 'Soon', deadline: '2027-01-31' })],
    });
    expect(tag.textContent).toContain('Soon');
  });

  it('with no goal open, counts the badges earned', () => {
    const { tag, container } = show({ goals: [goal(1, 10, 10, { achievedAt: '2026-03-01' })] });
    expect(tag.textContent).toContain('Badges');
    expect(tag.textContent).toContain('2 of 4 earned');
    expect(tag.getAttribute('aria-label')).toBe('Badges: 2 of 4 earned. Open badges and goals');
    // Phones show nothing then, and there's no flag
    expect(tag.className).toContain('phone:hidden');
    expect(container.querySelector('[aria-label="Next goal"]')).toBeNull();
  });

  it('opens the panel, fetching its code first', () => {
    const { tag, onOpen, onIntent } = show({ goals: [goal(1, 1, 3)] });
    fireEvent.pointerEnter(tag);
    fireEvent.focus(tag);
    expect(onIntent).toHaveBeenCalledTimes(2);
    fireEvent.click(tag);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('on phones folds a goal behind a flag that shows and hides it', () => {
    const { tag, container } = show({ goals: [goal(1, 1, 3)] });
    const flag = container.querySelector('[aria-label="Next goal"]');
    expect(flag.getAttribute('aria-pressed')).toBe('false');
    expect(flag.parentElement.className).toContain('nophone:hidden');
    expect(tag.className).toContain('phone:hidden');
    fireEvent.click(flag);
    expect(flag.getAttribute('aria-pressed')).toBe('true');
    expect(tag.className).not.toContain('phone:hidden');
    fireEvent.click(flag);
    expect(tag.className).toContain('phone:hidden');
  });
});
