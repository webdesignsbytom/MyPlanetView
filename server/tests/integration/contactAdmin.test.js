// The admin side of the contact form: listing the forms and deleting one or all, with
// the image each carries. The public bucket is the fake one from setup.js, as in
// media.test.js. "Delete all" empties the whole contact_form table: fine here, as this
// only ever runs against a throwaway *_test database, one file at a time.
import { afterAll, describe, expect, it, vi } from 'vitest';
import { anon, cleanUp, data, inBucket, prisma, signUp } from './helpers.js';

vi.mock('../../src/services/s3/s3public.js', async (importOriginal) => {
  const actual = await importOriginal();
  const send = (command) => globalThis.__fakeBucketSend(command);
  return { ...actual, default: { send } };
});

const PNG = { contentType: 'image/png', bytes: 2048 };
const LIST = '/api/contact/get-all-contact-forms';
const DELETE_ALL = '/api/contact/delete-all-contact-forms';
const deleteOne = (id) => `/api/contact/delete-contact-form/${id}`;

// Anonymous rows cleanUp() doesn't know about
const formIds = new Set();
const anonymousKeys = new Set();
afterAll(async () => {
  await prisma.contactForm.deleteMany({ where: { id: { in: [...formIds] } } });
  await prisma.mediaItem.deleteMany({ where: { key: { in: [...anonymousKeys] } } });
  await cleanUp();
});

async function withRole(label, role) {
  const person = await signUp(label);
  await prisma.user.update({ where: { id: person.user.id }, data: { role } });
  return person;
}

/** A visitor's contact form, with an uploaded image when `image` is set. */
async function sendForm(message, { image = false } = {}) {
  let imageKey;
  if (image) {
    const presign = await anon().post('/api/media-services/presign-url').send({ resource: 'contact', filename: 'shot.png', ...PNG });
    expect(presign.status).toBe(200);
    imageKey = presign.body.key;
    anonymousKeys.add(imageKey);
    globalThis.__fakeR2.set(imageKey, { ...PNG });
    expect((await anon().post('/api/media-services/confirm-upload').send({ key: imageKey })).status).toBe(200);
  }
  const res = await anon()
    .post('/api/contact/create-new-contact-form')
    .send({ name: 'Ada', email: 'ada@example.test', message, imageKey });
  expect(res.status).toBe(201);
  const form = data(res).contactForm;
  formIds.add(form.id);
  return form;
}

describe('listing contact forms', () => {
  it('shows an admin and a developer every form, newest first', async () => {
    const admin = await withRole('Contact admin', 'ADMIN');
    const developer = await withRole('Contact developer', 'DEVELOPER');
    const older = await sendForm('The first message.');
    await prisma.contactForm.update({ where: { id: older.id }, data: { createdAt: new Date(Date.now() - 60_000) } });
    const newer = await sendForm('The second message.', { image: true });

    for (const viewer of [admin, developer]) {
      const res = await viewer.agent.get(LIST);
      expect(res.status).toBe(200);
      const forms = data(res).contactForms;
      const ids = forms.map((f) => f.id);
      expect(ids.indexOf(newer.id)).toBeGreaterThanOrEqual(0);
      expect(ids.indexOf(newer.id)).toBeLessThan(ids.indexOf(older.id));
      expect(forms.find((f) => f.id === newer.id)).toMatchObject({ name: 'Ada', email: 'ada@example.test', message: 'The second message.', imageKey: newer.imageKey });
    }
  });

  it('refuses a plain user (403) and a visitor (401)', async () => {
    const user = await signUp('Contact snoop');
    const refused = await user.agent.get(LIST);
    expect(refused.status).toBe(403);
    expect(refused.body.message).toBe('This action requires an admin or developer role.');
    expect((await anon().get(LIST)).status).toBe(401);
  });
});

describe('deleting a contact form', () => {
  it('removes the form and its image file; deleting it again is a 404', async () => {
    const admin = await withRole('Contact deleter', 'ADMIN');
    const form = await sendForm('Please delete me.', { image: true });
    expect(inBucket(form.imageKey)).toBe(true);

    const res = await admin.agent.delete(deleteOne(form.id));
    expect(res.status).toBe(200);
    expect(await prisma.contactForm.findUnique({ where: { id: form.id } })).toBeNull();
    expect(inBucket(form.imageKey)).toBe(false);
    expect(await prisma.mediaItem.findUnique({ where: { key: form.imageKey } })).toBeNull();

    expect((await admin.agent.delete(deleteOne(form.id))).status).toBe(404);
    expect((await admin.agent.delete(deleteOne('no-such-form'))).status).toBe(404);
  });

  it('deletes a form with no image', async () => {
    const developer = await withRole('Contact deleter 2', 'DEVELOPER');
    const form = await sendForm('No picture here.');
    expect((await developer.agent.delete(deleteOne(form.id))).status).toBe(200);
    expect(await prisma.contactForm.findUnique({ where: { id: form.id } })).toBeNull();
  });

  it('refuses a plain user (403) and a visitor (401), leaving the form', async () => {
    const user = await signUp('Contact vandal');
    const form = await sendForm('Keep me.', { image: true });
    expect((await user.agent.delete(deleteOne(form.id))).status).toBe(403);
    expect((await anon().delete(deleteOne(form.id))).status).toBe(401);
    expect(await prisma.contactForm.findUnique({ where: { id: form.id } })).not.toBeNull();
    expect(inBucket(form.imageKey)).toBe(true);
  });
});

describe('deleting every contact form', () => {
  it('refuses a plain user (403) and a visitor (401)', async () => {
    const user = await signUp('Contact wiper');
    const form = await sendForm('Survive the wipe.');
    expect((await user.agent.delete(DELETE_ALL)).status).toBe(403);
    expect((await anon().delete(DELETE_ALL)).status).toBe(401);
    expect(await prisma.contactForm.findUnique({ where: { id: form.id } })).not.toBeNull();
  });

  it('lets an admin delete them all, with their image files', async () => {
    const admin = await withRole('Contact wiper admin', 'ADMIN');
    const plain = await sendForm('One.');
    const pictured = await sendForm('Two.', { image: true });

    const res = await admin.agent.delete(DELETE_ALL);
    expect(res.status).toBe(200);
    expect(data(res)).toEqual({ message: 'Success: All contact forms deleted' });
    expect(await prisma.contactForm.count()).toBe(0);
    expect(await prisma.contactForm.findUnique({ where: { id: plain.id } })).toBeNull();
    expect(inBucket(pictured.imageKey)).toBe(false);
    expect(data(await admin.agent.get(LIST)).contactForms).toEqual([]);
  });
});
