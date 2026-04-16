import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = '',
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size !== 'md' && `btn-${size}`,
    loading && 'btn-loading',
    icon && !children && 'btn-icon',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <span className="btn-spinner" />}
      {icon && <span className="btn-icon-el">{icon}</span>}
      {children && <span className="btn-text">{children}</span>}
    </button>
  );
}
