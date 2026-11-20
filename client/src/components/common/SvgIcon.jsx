import React from 'react';

/**
 * One of the icons in utils/data/svgIcons.js, drawn as react-icons draws its own: 1em square,
 * in the text's colour, decorative unless given a title. Other props (className, style,
 * aria-*) go on the <svg>.
 */
function SvgIcon({ icon, title, ...props }) {
  return (
    <svg
      viewBox={icon.viewBox}
      fill='currentColor'
      stroke='currentColor'
      strokeWidth='0'
      height='1em'
      width='1em'
      aria-hidden={title ? undefined : 'true'}
      focusable='false'
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {icon.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export default SvgIcon;
