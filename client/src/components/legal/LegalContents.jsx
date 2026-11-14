import React from 'react';
// Components
import AppAnchor from '@/components/common/AppAnchor';
import PaperCard from '@/components/common/PaperCard';
import LegalContentsGroup from './LegalContentsGroup';

// The legal page's contents card: jump links to the two documents and every clause.
// Beside the text (sticky) on wide screens, above it otherwise.
function LegalContents({ termsGroups, privacyGroups, groupLabels, onJump, isCurrent, className = '' }) {
  return (
    <PaperCard as='nav' title='Contents' titleId='legal-contents-title' headingLevel={2} className={className}>
      <ul className='grid gap-y-5' role='list'>
        <li className='grid gap-y-1'>
          <AppAnchor
            href='#terms-and-conditions'
            onClick={(e) => onJump(e, 'terms-and-conditions')}
            className='text-sm font-semibold text-colour6 hover:underline'
            ariaCurrent={isCurrent('terms-and-conditions') ? 'true' : undefined}
          >
            Terms &amp; Conditions
          </AppAnchor>
          <AppAnchor
            href='#privacy-policy'
            onClick={(e) => onJump(e, 'privacy-policy')}
            className='text-sm font-semibold text-colour6 hover:underline'
            ariaCurrent={isCurrent('privacy-policy') ? 'true' : undefined}
          >
            Privacy &amp; Data
          </AppAnchor>
        </li>
        <LegalContentsGroup title='Terms & Conditions' groups={termsGroups} groupLabels={groupLabels} onJump={onJump} isCurrent={isCurrent} />
        <LegalContentsGroup title='Privacy & Data' groups={privacyGroups} groupLabels={groupLabels} onJump={onJump} isCurrent={isCurrent} />
      </ul>
    </PaperCard>
  );
}

export default LegalContents;
