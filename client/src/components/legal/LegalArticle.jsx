import React from 'react';

// One clause of the terms or the privacy policy: a travel-face heading and its
// paragraphs at a comfortable reading width. Its id is a jump target from the contents.
function LegalArticle({ id, title, content }) {
  return (
    <article id={id} aria-labelledby={`${id}-title`} className='grid scroll-mt-4 gap-y-3 py-6 first:pt-0 last:pb-0'>
      <h3 id={`${id}-title`} className='font-travel text-xl uppercase tracking-wide text-colour6 sm:text-2xl'>
        {title}
      </h3>
      {content.map((paragraph) => (
        <p key={paragraph} className='max-w-prose leading-relaxed'>
          {paragraph}
        </p>
      ))}
    </article>
  );
}

export default LegalArticle;
