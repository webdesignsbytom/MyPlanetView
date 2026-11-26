import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import { deleteFeedbackReport, getAdminFeedback, getFeedbackReport, presignFeedbackScreenshot, sendFeedback, updateFeedbackReport } from '@/api/feedbackApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

// Feedback (docs/API.md "Feedback")
describe('feedbackApi', () => {
  it('presigns a screenshot and sends a report', async () => {
    client.answerWith({ key: 'k', upload: { url: 'u' } });
    await expect(presignFeedbackScreenshot({ contentType: 'image/webp', bytes: 5 })).resolves.toEqual({ key: 'k', upload: { url: 'u' } });
    expect(client.post).toHaveBeenCalledWith('/api/feedback/screenshot/presign', { contentType: 'image/webp', bytes: 5 });
    client.answerWith({ feedback: { id: 'f1', reference: 'FB-1' } });
    await expect(sendFeedback({ kind: 'IDEA', details: 'x' })).resolves.toEqual({ feedback: { id: 'f1', reference: 'FB-1' } });
    expect(client.post).toHaveBeenLastCalledWith('/api/feedback', { kind: 'IDEA', details: 'x' });
  });

  it('lists the admin’s reports with only the filters given', async () => {
    await getAdminFeedback();
    expect(client.get).toHaveBeenLastCalledWith('/api/users/admin/feedback');
    await getAdminFeedback({ status: 'NEW', kind: 'IDEA', cursor: 'abc' });
    expect(client.get).toHaveBeenLastCalledWith('/api/users/admin/feedback?status=NEW&kind=IDEA&cursor=abc');
  });

  it('reads, changes and deletes one report', async () => {
    await getFeedbackReport('a/b');
    expect(client.get).toHaveBeenLastCalledWith('/api/users/admin/feedback/a%2Fb');
    await updateFeedbackReport('f1', { status: 'DONE' });
    expect(client.patch).toHaveBeenCalledWith('/api/users/admin/feedback/f1', { status: 'DONE' });
    await deleteFeedbackReport('f1');
    expect(client.delete).toHaveBeenCalledWith('/api/users/admin/feedback/f1');
  });
});
