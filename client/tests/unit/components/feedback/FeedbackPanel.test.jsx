import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import FeedbackPanel from '@/components/feedback/FeedbackPanel';
import { sendFeedback } from '@/api/feedbackApi';
import { uploadScreenshot } from '@/utils/feedback/uploadScreenshot';
import { withProviders } from '../map/helpers';

vi.mock('@/api/feedbackApi', () => ({ sendFeedback: vi.fn() }));
vi.mock('@/utils/feedback/uploadScreenshot', () => ({ uploadScreenshot: vi.fn() }));

const open = (props = {}) => {
  const onClose = vi.fn();
  const result = render(withProviders(<FeedbackPanel mapId='map-1' styleId='starry' phone={false} onClose={onClose} {...props} />, { route: '/maps/map-1' }));
  const q = (selector) => result.container.querySelector(selector);
  const choose = (label) => fireEvent.click(screen.getByLabelText(label, { exact: false }));
  const type = (label, value) => fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value } });
  const send = async () => {
    await act(async () => {
      fireEvent.submit(q('[data-feedback-form]'));
    });
  };
  return { ...result, q, choose, type, send, onClose };
};

beforeEach(() => {
  vi.clearAllMocks();
  sendFeedback.mockResolvedValue({ feedback: { id: 'f1', reference: 'FB-1A2B3C4D' } });
  uploadScreenshot.mockResolvedValue('myplanetview/feedback/u/shot-1.webp');
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
});

// Feedback from the map (25 Nov 2026, the user's wish: simple for someone who isn't technical)
describe('FeedbackPanel', () => {
  it('starts with what it’s about, and asks its questions once one is chosen', () => {
    const { q, choose } = open();
    expect(screen.getByText('What’s this about?')).toBeTruthy();
    expect(q('textarea')).toBeNull();
    expect(q('button[type="submit"]').disabled).toBe(true);
    choose('Something’s not working');
    expect(screen.getByLabelText('What happened?', { exact: false })).toBeTruthy();
    expect(screen.getByLabelText('What did you expect to happen?')).toBeTruthy();
    expect(screen.getByLabelText('Why is it a problem for you?')).toBeTruthy();
    expect(screen.getByText('How much does it get in your way?')).toBeTruthy();
    expect(q('[data-feedback-also]').textContent).toContain('the page you’re on, your browser and the size of your screen');
    choose('A question');
    expect(screen.getByLabelText('What would you like to know?', { exact: false })).toBeTruthy();
    expect(screen.queryByLabelText('What did you expect to happen?')).toBeNull();
    expect(screen.queryByText('How much does it get in your way?')).toBeNull();
  });

  it('says what’s missing instead of sending', async () => {
    const { choose, send } = open();
    choose('An idea');
    await send();
    expect(screen.getByRole('alert').textContent).toBe('Please answer “What would you like?”');
    expect(sendFeedback).not.toHaveBeenCalled();
  });

  it('sends a problem with its answers, the page, the map and the details, then thanks them with its reference', async () => {
    const { choose, type, send, q } = open();
    choose('Something’s not working');
    type('What happened?', 'Save did nothing');
    type('What did you expect to happen?', 'It saves');
    type('Why is it a problem for you?', 'Lost my notes');
    choose('It stops me doing something');
    await send();
    expect(uploadScreenshot).not.toHaveBeenCalled();
    expect(sendFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'PROBLEM',
        details: 'Save did nothing',
        expected: 'It saves',
        why: 'Lost my notes',
        impact: 'BLOCKING',
        page: '/',
        mapId: 'map-1',
        screenshotKey: null,
        context: expect.objectContaining({ style: 'starry', phone: false }),
      }),
    );
    expect(q('[data-feedback-sent]').textContent).toContain('Thank you!');
    expect(q('[data-feedback-reference]').textContent).toBe('FB-1A2B3C4D');
    fireEvent.click(screen.getByText('Send another'));
    expect(q('[data-feedback-form]')).toBeTruthy();
    expect(q('textarea')).toBeNull();
  });

  it('takes a screenshot, shows it, and sends it to the bucket first', async () => {
    const { choose, type, send, q } = open();
    choose('An idea');
    type('What would you like?', 'Dark mode');
    const picture = new File(['x'], 'shot.png', { type: 'image/png' });
    fireEvent.change(q('[data-feedback-screenshot-input]'), { target: { files: [picture] } });
    expect(q('[data-feedback-preview]').getAttribute('src')).toBe('blob:preview');
    await send();
    expect(uploadScreenshot).toHaveBeenCalledWith(picture, expect.any(Function));
    expect(sendFeedback).toHaveBeenCalledWith(expect.objectContaining({ kind: 'IDEA', screenshotKey: 'myplanetview/feedback/u/shot-1.webp' }));
  });

  it('can take the screenshot off again', () => {
    const { choose, q } = open();
    choose('Something else');
    fireEvent.change(q('[data-feedback-screenshot-input]'), { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
    fireEvent.click(screen.getByText('Take the picture off'));
    expect(q('[data-feedback-preview]')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('says why it couldn’t be sent, keeping their words', async () => {
    sendFeedback.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Too many messages. Please try again later.' }));
    const { choose, type, send } = open();
    choose('Something else');
    type('Your message', 'Hello');
    await send();
    expect(screen.getByRole('alert').textContent).toBe('Too many messages. Please try again later.');
    expect(screen.getByLabelText('Your message', { exact: false }).value).toBe('Hello');
  });

  it('closes from its stamp and from the thank-you', async () => {
    const { onClose, choose, type, send } = open();
    fireEvent.click(screen.getByLabelText('Close Feedback'));
    expect(onClose).toHaveBeenCalledTimes(1);
    choose('Something else');
    type('Your message', 'Hi');
    await send();
    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
