import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, children, className, ...rest },
  ref,
) {
  const classes = ['ob-card', interactive ? 'ob-card--interactive' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});

export function Badge(props: { tone?: 'default' | 'primary'; children: ReactNode }) {
  return (
    <span className={`ob-badge${props.tone === 'primary' ? ' ob-badge--primary' : ''}`}>
      {props.children}
    </span>
  );
}

export function Spinner(props: { light?: boolean }) {
  return <span className={`ob-spinner${props.light ? ' ob-spinner--light' : ''}`} />;
}
