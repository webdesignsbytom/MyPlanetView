import React, { useState } from 'react';
// Components
import Button from '@/components/common/Button';
// Utils
import { embedCode } from '@/utils/sharing/embedCode';

// "On your website" in a map's share dialog (23 Nov 2026, the user's wish): the code that puts
// the map on a blog or website, framed, with a "Made with My Planet View" link under it. Only
// with link access on (`linkOn`), as the frame opens the map by its share link; otherwise it
// says how to turn that on.
function ShareEmbedBox({ shareCode, name, linkOn }) {
  const [copied, setCopied] = useState(false);
  if (!linkOn || !shareCode) {
    return <p className='text-sm'>Choose “Anyone with the link” above to put this map on your website or blog.</p>;
  }
  const code = embedCode({ origin: window.location.origin, code: shareCode, name });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className='grid gap-2'>
      <p className='text-sm'>Paste this into your website or blog: your map, kept up to date as you travel. Resetting the link above stops it working.</p>
      <textarea
        readOnly
        value={code}
        rows={4}
        aria-label='Code for your website'
        onFocus={(e) => e.target.select()}
        className='w-full resize-none border border-field-edge bg-field px-2 py-2 font-mono text-xs'
        data-embed-code
      />
      <div className='grid justify-start'>
        <Button quiet onClick={copy}>
          {copied ? 'Copied' : 'Copy the code'}
        </Button>
      </div>
    </div>
  );
}

export default ShareEmbedBox;
