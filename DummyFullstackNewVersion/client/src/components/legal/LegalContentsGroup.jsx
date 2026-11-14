import React from 'react';
// Components
import AppAnchor from '@/components/common/AppAnchor';

// One part of the legal contents (Terms, or Privacy): its sub-groups and their links
function LegalContentsGroup({ title, groups, groupLabels, onJump, isCurrent }) {
  return (
    <li className='grid gap-y-2'>
      <h3 className='font-travel text-base uppercase tracking-wide text-colour9'>{title}</h3>
      {Object.keys(groups).map((group) => (
        <div key={group} className='grid gap-y-1 pl-1'>
          <h4 className='text-xs font-semibold uppercase tracking-wide opacity-80'>{groupLabels[group] || group}</h4>
          <ul className='grid gap-y-1 pl-3' role='list'>
            {groups[group].map((section) => (
              <li key={section.id}>
                <AppAnchor
                  href={`#${section.id}`}
                  onClick={(e) => onJump(e, section.id)}
                  className='text-sm text-colour6 hover:underline'
                  ariaCurrent={isCurrent(section.id) ? 'true' : undefined}
                >
                  {section.title}
                </AppAnchor>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </li>
  );
}

export default LegalContentsGroup;
