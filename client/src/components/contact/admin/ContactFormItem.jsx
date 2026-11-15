import React, { useEffect, useState } from 'react';
// Utils
import { getSignedViewUrl } from '@/utils/media/getSignedViewUrl';
// Components
import AppAnchor from '@/components/common/AppAnchor';
import CloseStamp from '@/components/common/CloseStamp';

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
      // A slip of paper in the card (dashed brown edge, like a trip's traveller fieldset)
      className='grid grid-cols-[minmax(0,1fr)_auto] content-start gap-4 border-2 border-dashed border-poster-brown/60 bg-paper-cream p-4'
      aria-label={`Contact form submission from ${name}`}
    >
      {/* Content */}
      <section aria-labelledby={`contact-heading-${form.id}`} className='grid min-w-0 gap-y-2'>
        <h2 id={`contact-heading-${form.id}`} className='sr-only'>
          Contact form submission details
        </h2>

        <p>
          <strong className='text-colour9'>Name:</strong> {name}
        </p>

        <p>
          <strong className='text-colour9'>Email:</strong>{' '}
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
          <strong className='text-colour9'>Message:</strong> {form.message}
        </p>

        {form.imageKey && (
          <div className='grid gap-y-2'>
            <strong className='text-colour9'>Screenshot:</strong>
            {imageUrl ? (
              <AppAnchor href={imageUrl} target='_blank'>
                <img
                  src={imageUrl}
                  alt={`Screenshot sent by ${name}`}
                  loading='lazy'
                  className='max-h-48 border-2 border-poster-brown'
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
            <strong className='text-colour9'>Submitted:</strong> {submittedAt}
          </p>
        )}
      </section>

      {/* Delete */}
      <section className='grid content-start'>
        <CloseStamp
          onClick={() => handleDelete(form.id)}
          hint={`Delete the message from ${name}`}
          label={`Delete the contact form from ${name}`}
        />
      </section>
    </article>
  );
}

export default ContactFormItem;
