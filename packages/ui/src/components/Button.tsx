import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon, children, disabled, className, ...rest },
  ref,
) {
  const classes = [
    'ob-button',
    `ob-button--${variant}`,
    size === 'sm' ? 'ob-button--sm' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button ref={ref} className={classes} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span className={`ob-spinner${variant === 'primary' ? ' ob-spinner--light' : ''}`} />
      ) : (
        icon
      )}
      {children}
    </button>
  );
});
