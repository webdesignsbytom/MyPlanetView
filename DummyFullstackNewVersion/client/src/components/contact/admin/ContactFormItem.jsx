import React, { useEffect, useState } from 'react';
import { IoIosCloseCircleOutline } from 'react-icons/io';
// Utils
import { getSignedViewUrl } from '@/utils/media/getSignedViewUrl';
// Components
import AppAnchor from '@/components/common/AppAnchor';

// One contact form submission in the admin list (name, email, message, screenshot)
function ContactFormItem({ form, handleDelete }) {
  const submittedAt = form.createdAt
    ? new Date(form.createdAt).toLocaleString()
    : '';
  const name = form.name || 'Unnamed';

  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!form.imageKey) return;

    let cancelled = false;
    setImageError(false);

    getSignedViewUrl({ key: form.imageKey }).then(({ url }) => {
      if (cancelled) return;
      if (url) {
        setImageUrl(url);
      } else {
        setImageError(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [form.imageKey]);

  return (
    <article
      className='grid grid-cols-rev gap-4 bg-colour1 border-2 border-colour6 p-4 h-fit rounded-md shadow-lift-sm'
      aria-label={`Contact form submission from ${name}`}
    >
      {/* Content */}
      <section aria-labelledby={`contact-heading-${form.id}`} className='grid gap-y-2'>
        <h2 id={`contact-heading-${form.id}`} className='sr-only'>
          Contact form submission details
        </h2>

        <p>
          <strong className='text-colour6'>Name:</strong> {name}
        </p>

        <p>
          <strong className='text-colour6'>Email:</strong>{' '}
          {form.email ? (
            <AppAnchor
              href={`mailto:${form.email}`}
              titleAttr={`Email ${name}`}
              ariaLabel={`Email ${name}`}
            >
              {form.email}
            </AppAnchor>
          ) : (
            '—'
          )}
        </p>

        <p className='whitespace-pre-line'>
          <strong className='text-colour6'>Message:</strong> {form.message}
        </p>

        {form.imageKey && (
          <div className='grid gap-y-2'>
            <strong className='text-colour6'>Screenshot:</strong>
            {imageUrl ? (
              <AppAnchor href={imageUrl} target='_blank'>
                <img
                  src={imageUrl}
                  alt={`Screenshot sent by ${name}`}
                  loading='lazy'
                  className='max-h-48 rounded border border-colour3'
                />
              </AppAnchor>
            ) : imageError ? (
              <span className='text-sm text-status-critical'>
                Unable to load the screenshot.
              </span>
            ) : (
              <span className='text-sm text-colour5'>Loading screenshot…</span>
            )}
          </div>
        )}

        {submittedAt && (
          <p className='text-sm'>
            <strong className='text-colour6'>Submitted:</strong> {submittedAt}
          </p>
        )}
      </section>

      {/* Delete */}
      <section className='grid content-start'>
        <button
          type='button'
          onClick={() => handleDelete(form.id)}
          className='text-status-critical hover:opacity-75'
          title={`Delete the message from ${name}`}
          aria-label={`Delete the contact form from ${name}`}
        >
          <IoIosCloseCircleOutline size={35} />
        </button>
      </section>
    </article>
  );
}

export default ContactFormItem;
