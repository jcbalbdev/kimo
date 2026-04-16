import './Card.css';

export default function Card({
  children,
  dashed = false,
  interactive = false,
  className = '',
  onClick,
  ...props
}) {
  const classes = [
    'card',
    dashed && 'card-dashed',
    interactive && 'card-interactive',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );
}
