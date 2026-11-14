import React from 'react';
// Components
import AppLink from '@/components/common/AppLink';

// One titled column of footer links (groups in utils/data/footerData.js)
function FooterNavSection({ id, title, links }) {
  return (
    <nav className='grid content-start gap-y-3' aria-labelledby={id}>
      <h2 id={id} className='font-travel text-xl tracking-wide'>
        {title}
      </h2>

      <ul className='grid gap-y-2' role='list'>
        {links.map(({ name, route }) => (
          <li key={route}>
            <AppLink
              to={route}
              label={name}
              className='text-sm hover:text-poster-red-deep hover:underline'
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default FooterNavSection;
