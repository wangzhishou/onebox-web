import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FieldShellProps {
  label?: string;
  error?: string;
  children: (id: string) => React.ReactNode;
}

function FieldShell({ label, error, children }: FieldShellProps) {
  const id = useId();
  return (
    <div className="ob-field">
      {label ? (
        <label className="ob-field__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      {children(id)}
      {error ? <span className="ob-field__error">{error}</span> : null}
    </div>
  );
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, className, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} error={error}>
      {(id) => <input ref={ref} id={id} className={`ob-input ${className ?? ''}`} {...rest} />}
    </FieldShell>
  );
});

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, className, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} error={error}>
      {(id) => <textarea ref={ref} id={id} className={`ob-textarea ${className ?? ''}`} {...rest} />}
    </FieldShell>
  );
});
