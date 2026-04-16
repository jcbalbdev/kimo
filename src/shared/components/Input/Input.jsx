import { useState } from 'react';
import './Input.css';

export default function Input({
  label,
  error,
  hint,
  type = 'text',
  textarea = false,
  select = false,
  children,
  className = '',
  id,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${label?.replace(/\s+/g, '-').toLowerCase()}`;
  const isPassword = type === 'password';

  const fieldClasses = [
    'input-field',
    error && 'input-field-error',
    textarea && 'input-textarea',
    select && 'input-select',
    isPassword && 'input-field-password',
  ].filter(Boolean).join(' ');

  const renderField = () => {
    if (textarea) {
      return <textarea id={inputId} className={fieldClasses} {...props} />;
    }
    if (select) {
      return (
        <select id={inputId} className={fieldClasses} {...props}>
          {children}
        </select>
      );
    }
    return (
      <input
        id={inputId}
        type={isPassword && showPassword ? 'text' : type}
        className={fieldClasses}
        {...props}
      />
    );
  };

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {renderField()}
        {isPassword && (
          <button
            type="button"
            className="input-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <span className="input-error">{error}</span>}
      {hint && !error && <span className="input-hint">{hint}</span>}
    </div>
  );
}
