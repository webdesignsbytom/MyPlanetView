import React from 'react';

// One titled block of About page copy, on the story card (split by dashed perforations):
// stacked below lg, the heading beside its paragraphs from lg up
function AboutSection({ id, title, paragraphs }) {
  return (
    <section className='grid gap-y-3 py-6 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]' aria-labelledby={id}>
      <h2 id={id} className='font-travel text-2xl uppercase tracking-wide text-colour6 sm:text-3xl'>
        {title}
      </h2>
      <div className='grid gap-y-3'>
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className='max-w-prose leading-relaxed'>
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}

export default AboutSection;
