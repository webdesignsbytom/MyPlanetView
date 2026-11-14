import React from 'react';

// The floating labels on the map (its title, the stats line, the key) as compact luggage
// tags: aged parchment with a thin brown edge and the warm paper shadow. `as` picks the
// element (a button when the tag opens something); `children` is one node, laid out by
// the caller.
function LuggageTag({ as = 'div', className = '', children, ...rest }) {
  const Tag = as;
  return (
    <Tag
      {...rest}
      className={`paper-aged pointer-events-auto grid items-center border-2 border-poster-brown px-3 py-1.5 text-left text-poster-ink shadow-paper ${className}`}
    >
      {children}
    </Tag>
  );
}

export default LuggageTag;
