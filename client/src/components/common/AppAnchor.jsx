export default function AppAnchor({
  href,
  children,
  className,
  ariaLabel,
  ariaCurrent,
  titleAttr,
  target,
  rel,
  onClick,
  itemProp,
  referrerPolicy,
}) {
  const defaultClass = '';

  // Default rel for new-tab links
  const computedRel =
    target === '_blank'
      ? rel || 'noopener noreferrer'
      : rel || undefined;

  return (
    <a
      href={href}
      className={className || defaultClass}
      // only include aria-label if provided
      {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
      {...(ariaCurrent ? { 'aria-current': ariaCurrent } : {})}
      // only include title if provided
      {...(titleAttr ? { title: titleAttr } : {})}
      {...(target ? { target } : {})}
      {...(computedRel ? { rel: computedRel } : {})}
      {...(onClick ? { onClick } : {})}
      {...(itemProp ? { itemProp } : {})}
      {...(referrerPolicy ? { referrerPolicy } : {})}
    >
      {children}
    </a>
  );
}
