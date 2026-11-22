import React from 'react';

// `align`: 'center' (the default: the sign-in tickets and single-column forms) or 'start',
// the label, hint and error on the field's left edge, for forms with fields side by side
function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  children,
  className = 'grid gap-y-2',
  align = 'center',
}) {
  const textAlign = align === 'start' ? 'text-left' : 'text-center';
  // error: string shows a message, true only marks invalid
  const isInvalid = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : '';

  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = errorMessage ? `${id}-error` : undefined;
  const ownProps = React.isValidElement(children) ? children.props : {};

  // Inject id + aria props into the child input, keeping any description and invalid mark the
  // input was given itself (a note elsewhere on the page: the admin users page's locked role)
  const describedBy = [ownProps.ariaDescribedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;
  const child = React.isValidElement(children)
    ? React.cloneElement(children, {
        id,
        ariaInvalid: isInvalid || Boolean(ownProps.ariaInvalid),
        ariaDescribedBy: describedBy,
      })
    : children;

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} className={`block ${textAlign} text-sm font-medium`}>
          {label}
          {required ? (
            <span className='text-status-critical' aria-hidden='true'>
              {' '}
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {child}

      {hint ? (
        <span id={hintId} className={`block text-xs ${textAlign} opacity-70`}>
          {hint}
        </span>
      ) : null}
      {errorMessage ? (
        <span
          id={errorId}
          role='alert'
          className={`block text-xs ${textAlign} text-status-critical`}
        >
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}

export default FormField;
