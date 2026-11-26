import { Link } from 'react-router-dom';

export default function AppLink({
  to,
  label,
  description,
  className,
  ariaLabel,
  titleAttr,
  onClick,
  state,
  replace,
}) {
  // Underlined, so a link inside a sentence isn't told apart by colour alone (WCAG 1.4.1;
  // 26 Nov 2026, the audit: the sign-up and forgot-password pages' links)
  const defaultClass = 'text-colour6 underline underline-offset-2 hover:brightness-75';

  // Compute fallback values
  const computedAria =
    ariaLabel || (description ? `Go to ${description}` : undefined);
  const computedTitle = titleAttr || description || undefined;

  return (
    <Link
      to={to}
      className={className || defaultClass}
      {...(computedAria ? { 'aria-label': computedAria } : {})}
      {...(computedTitle ? { title: computedTitle } : {})}
      {...(onClick ? { onClick } : {})}
      {...(state !== undefined ? { state } : {})}
      {...(replace !== undefined ? { replace } : {})}
    >
      {label}
    </Link>
  );
}
