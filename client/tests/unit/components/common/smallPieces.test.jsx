import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import SavedStamp from '@/components/common/SavedStamp';
import RubberStamp from '@/components/common/RubberStamp';
import SvgIcon from '@/components/common/SvgIcon';
import { CARET_DOWN_ICON, X_ICON } from '@/utils/data/svgIcons';

describe('Button', () => {
  it('is a poster-red button by default, calling onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByText('Save');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.className).toContain('btn-poster');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is the parchment one when quiet, and a delete red (btn-danger) when danger', () => {
    render(
      <>
        <Button quiet>Cancel</Button>
        <Button danger quiet>
          Delete
        </Button>
      </>,
    );
    expect(screen.getByText('Cancel').className).toContain('btn-paper');
    const del = screen.getByText('Delete');
    expect(del.className).toContain('btn-danger');
    expect(del.className).not.toContain('btn-poster');
    expect(del.className).not.toContain('btn-paper');
  });

  it('is disabled and aria-busy while busy, and does nothing when pressed', () => {
    const onClick = vi.fn();
    render(
      <Button busy onClick={onClick}>
        Saving…
      </Button>,
    );
    const button = screen.getByText('Saving…');
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('carries its type, label, expanded state and the small size', () => {
    const ref = React.createRef();
    render(
      <Button type='submit' ariaLabel='Edit Paris' ariaExpanded={false} small ref={ref}>
        Edit
      </Button>,
    );
    const button = screen.getByLabelText('Edit Paris');
    expect(button.getAttribute('type')).toBe('submit');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-busy')).toBeNull();
    expect(button.className).toContain('[--btn-pad-x:0.75rem]');
    expect(ref.current).toBe(button);
  });

  it('is disabled when told', () => {
    render(<Button disabled>Go</Button>);
    expect(screen.getByText('Go').disabled).toBe(true);
  });
});

describe('InlineAlert', () => {
  it('shows nothing without words', () => {
    const { container } = render(<InlineAlert />);
    expect(container.innerHTML).toBe('');
  });

  it('announces an error as an alert, and good news or information as a status', () => {
    render(
      <>
        <InlineAlert>It broke.</InlineAlert>
        <InlineAlert tone='good'>Done.</InlineAlert>
        <InlineAlert tone='info'>Note.</InlineAlert>
      </>,
    );
    const error = screen.getByText('It broke.');
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.className).toContain('tone-danger');
    expect(screen.getByText('Done.').getAttribute('role')).toBe('status');
    expect(screen.getByText('Done.').className).toContain('tone-good');
    expect(screen.getByText('Note.').className).toContain('tone-info');
  });
});

describe('SavedStamp', () => {
  it('says "Saved" as a polite status by default', () => {
    render(<SavedStamp />);
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Saved');
    // a green stamp that lands with a thump, still for reduced motion
    const stamp = status.querySelector('p');
    expect(stamp.className).toContain('text-status-good');
    expect(stamp.className).toContain('animate-stamp-in');
    expect(stamp.className).toContain('motion-reduce:animate-none');
    expect(status.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  });

  it('takes its own word', () => {
    render(<SavedStamp>Sent</SavedStamp>);
    expect(screen.getByRole('status').textContent).toBe('Sent');
  });
});

describe('RubberStamp', () => {
  it('prints each line, hidden from screen readers', () => {
    const { container } = render(<RubberStamp lines={['Admit', 'one']} className='extra' />);
    const stamp = container.firstChild;
    expect(stamp.getAttribute('aria-hidden')).toBe('true');
    expect([...stamp.children].map((line) => line.textContent)).toEqual(['Admit', 'one']);
    expect(stamp.className).toContain('extra');
  });
});

describe('SvgIcon', () => {
  it('draws the icon’s paths at 1em in the text colour, hidden when decorative', () => {
    const { container } = render(<SvgIcon icon={CARET_DOWN_ICON} className='caret' />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('viewBox')).toBe(CARET_DOWN_ICON.viewBox);
    expect(svg.getAttribute('width')).toBe('1em');
    expect(svg.getAttribute('fill')).toBe('currentColor');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('class')).toBe('caret');
    expect(svg.querySelectorAll('path').length).toBe(CARET_DOWN_ICON.paths.length);
    expect(svg.querySelector('title')).toBeNull();
  });

  it('is named by its title when given one', () => {
    const { container } = render(<SvgIcon icon={X_ICON} title='X' />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBeNull();
    expect(svg.querySelector('title').textContent).toBe('X');
  });
});
