import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ContactFormDataSection from '@/components/contact/admin/ContactFormDataSection';
import ContactFormItem from '@/components/contact/admin/ContactFormItem';
import client from '@/api/client';
import { getSignedViewUrl } from '@/utils/media/getSignedViewUrl';
import { DELETE_ALL_CONTACT_FORM_API, DELETE_CONTACT_FORM_API, GET_ALL_CONTACT_FROMS_API } from '@/utils/constants/apiRoutes';

vi.mock('@/api/client', () => ({ default: { get: vi.fn(), delete: vi.fn() } }));
vi.mock('@/utils/media/getSignedViewUrl', () => ({ getSignedViewUrl: vi.fn() }));

const FORMS = [
  { id: 'f1', name: 'Jo Bloggs', email: 'jo@example.com', message: 'The map is lovely.\nThanks', createdAt: '2026-11-20T10:00:00Z' },
  { id: 'f2', name: '', email: '', message: 'Anonymous note', imageKey: 'contact/shot.png' },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ContactFormItem', () => {
  it('shows the sender, a mailto link, the message and when it came', () => {
    const handleDelete = vi.fn();
    const { container } = render(<ContactFormItem form={FORMS[0]} handleDelete={handleDelete} />);
    const article = container.querySelector('article');
    expect(article.getAttribute('aria-label')).toBe('Contact form submission from Jo Bloggs');
    expect(container.querySelector('a[href="mailto:jo@example.com"]').getAttribute('aria-label')).toBe('Email Jo Bloggs');
    expect(article.textContent).toContain('The map is lovely.');
    expect(article.textContent).toContain('Submitted:');
    expect(getSignedViewUrl).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('button[aria-label="Delete the contact form from Jo Bloggs"]'));
    expect(handleDelete).toHaveBeenCalledWith('f1');
  });

  it('names an unnamed sender, a dash for no email, and loads the screenshot by a signed link', async () => {
    getSignedViewUrl.mockResolvedValue({ url: 'https://files.example/shot.png?sig=1' });
    const { container } = render(<ContactFormItem form={FORMS[1]} handleDelete={() => {}} />);
    expect(container.querySelector('article').getAttribute('aria-label')).toBe('Contact form submission from Unnamed');
    expect(container.textContent).toContain('Email: —');
    expect(container.textContent).toContain('Loading screenshot…');
    const img = await screen.findByAltText('Screenshot sent by Unnamed');
    expect(img.getAttribute('src')).toBe('https://files.example/shot.png?sig=1');
    expect(getSignedViewUrl).toHaveBeenCalledWith({ key: 'contact/shot.png' });
    expect(container.textContent).not.toContain('Submitted:');
  });

  it('says so when the screenshot can’t be loaded', async () => {
    getSignedViewUrl.mockResolvedValue({ url: null });
    render(<ContactFormItem form={FORMS[1]} handleDelete={() => {}} />);
    expect(await screen.findByText('Unable to load the screenshot.')).toBeTruthy();
  });
});

describe('ContactFormDataSection', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    getSignedViewUrl.mockResolvedValue({ url: null });
  });

  it('loads the forms and lists them, with Delete All', async () => {
    client.get.mockResolvedValue({ data: { data: { contactForms: FORMS } } });
    const { container } = render(<ContactFormDataSection />);
    await waitFor(() => expect(container.querySelectorAll('li article').length).toBe(2));
    expect(client.get).toHaveBeenCalledWith(GET_ALL_CONTACT_FROMS_API, true);
    expect(screen.getByText('Delete All')).toBeTruthy();
  });

  it('says when there are none, with no Delete All', async () => {
    client.get.mockResolvedValue({ data: { data: { contactForms: [] } } });
    const { container } = render(<ContactFormDataSection />);
    await waitFor(() => expect(container.querySelector('[role="status"]')?.textContent).toBe('No contact forms found.'));
    expect(screen.queryByText('Delete All')).toBeNull();
  });

  it('a failed load shows the empty state, not an error page', async () => {
    client.get.mockRejectedValue(new Error('down'));
    render(<ContactFormDataSection />);
    expect(await screen.findByText('No contact forms found.')).toBeTruthy();
    expect(console.error).toHaveBeenCalled();
  });

  it('deletes one form only after confirming', async () => {
    client.get.mockResolvedValue({ data: { data: { contactForms: FORMS } } });
    client.delete.mockResolvedValue({});
    const { container } = render(<ContactFormDataSection />);
    await waitFor(() => expect(container.querySelectorAll('li article').length).toBe(2));
    fireEvent.click(container.querySelector('button[aria-label="Delete the contact form from Jo Bloggs"]'));
    expect(screen.getByText('Are you sure you want to delete this contact form?')).toBeTruthy();
    expect(client.delete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => expect(container.querySelectorAll('li article').length).toBe(1));
    expect(client.delete).toHaveBeenCalledWith(`${DELETE_CONTACT_FORM_API}/f1`, true);
  });

  it('cancelling keeps every form', async () => {
    client.get.mockResolvedValue({ data: { data: { contactForms: FORMS } } });
    const { container } = render(<ContactFormDataSection />);
    await waitFor(() => expect(container.querySelectorAll('li article').length).toBe(2));
    fireEvent.click(screen.getByText('Delete All'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(client.delete).not.toHaveBeenCalled();
    expect(container.querySelectorAll('li article').length).toBe(2);
  });

  it('deletes them all after confirming', async () => {
    client.get.mockResolvedValue({ data: { data: { contactForms: FORMS } } });
    client.delete.mockResolvedValue({});
    render(<ContactFormDataSection />);
    fireEvent.click(await screen.findByText('Delete All'));
    expect(screen.getByText(/delete all contact forms\? This cannot be undone/)).toBeTruthy();
    fireEvent.click(screen.getByText('Confirm'));
    expect(await screen.findByText('No contact forms found.')).toBeTruthy();
    expect(client.delete).toHaveBeenCalledWith(DELETE_ALL_CONTACT_FORM_API, true);
  });
});
