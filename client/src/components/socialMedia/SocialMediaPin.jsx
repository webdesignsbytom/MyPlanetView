import React from 'react';
// Components
import AppAnchor from '@/components/common/AppAnchor';

function SocialMediaPin({
  serviceName,
  icon,
  url,
  ariaLabel,
  title,
  className = '',
}) {
  return (
    <li>
      <AppAnchor
        href={url}
        target='_blank'
        rel='noreferrer'
        ariaLabel={ariaLabel || `Open ${serviceName}`}
        titleAttr={title || serviceName}
        className={`p-2 grid items-center justify-center ${className}`}
      >
        <div className='grid items-center justify-center'>{icon}</div>
      </AppAnchor>
    </li>
  );
}

export default SocialMediaPin;
