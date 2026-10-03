import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, children, className, ...rest },
  ref,
) {
  const id = useId();
  return (
    <div className="ob-field">
      {label ? (
        <label className="ob-field__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <select ref={ref} id={id} className={`ob-select ${className ?? ''}`} {...rest}>
        {children}
      </select>
    </div>
  );
});
